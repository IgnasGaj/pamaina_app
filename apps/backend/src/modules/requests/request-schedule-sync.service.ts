import { Prisma } from "@prisma/client";
import { scheduleRepository, ScheduleWithAssignments } from "@/modules/schedules/schedule.repository";
import { scheduleAssignmentRepository } from "@/modules/schedules/schedule-assignment.repository";
import { shiftTemplateRepository } from "@/modules/shift-templates/shift-template.repository";
import { requestAuditLogRepository } from "@/modules/requests/request-audit-log.repository";

/**
 * Everything here is the transactional "make the Scheduler match an approved
 * leave request" core. Kept out of request.service.ts so that file stays
 * focused on the request lifecycle itself — this module owns the sync logic
 * end to end (preview, apply, and reverse).
 */

type TxClient = Prisma.TransactionClient;

export interface ConflictPreviewEntry {
  date: string;
  shiftTemplateName: string;
}

export interface RemovedShiftRecord {
  date: string;
  previousShiftTemplateId: string;
  previousNotes: string | null;
}

export interface SyncApprovalResult {
  createdDates: string[];
  removedShiftDates: RemovedShiftRecord[];
  keptConflictDates: string[];
}

export interface RevokeApprovalResult {
  restoredDates: string[];
  deletedDates: string[];
}

type RequestForSync = {
  id: string;
  employeeId: string;
  absenceTypeId: string;
  startDate: Date;
  endDate: Date;
};

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Every calendar day in [startDate, endDate], inclusive, as UTC midnight Dates. */
function daysInRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Read-only — used to decide whether the approval dialog needs to show the conflict-resolution choice at all. */
export async function previewApprovalConflicts(
  companyId: string,
  request: Pick<RequestForSync, "employeeId" | "startDate" | "endDate">,
): Promise<ConflictPreviewEntry[]> {
  const days = daysInRange(request.startDate, request.endDate);
  const shiftTemplates = await shiftTemplateRepository.findAllForCompany(companyId);
  const shiftTemplateNamesById = new Map(shiftTemplates.map((template) => [template.id, template.name]));

  const scheduleCache = new Map<string, ScheduleWithAssignments | null>();
  const conflicts: ConflictPreviewEntry[] = [];

  for (const day of days) {
    const key = `${day.getUTCFullYear()}-${day.getUTCMonth() + 1}`;
    let schedule = scheduleCache.get(key);
    if (schedule === undefined) {
      schedule = await scheduleRepository.findByYearMonthInCompany(day.getUTCFullYear(), day.getUTCMonth() + 1, companyId);
      scheduleCache.set(key, schedule);
    }
    if (!schedule) continue;

    const existing = await scheduleAssignmentRepository.findByScheduleEmployeeDate(schedule.id, request.employeeId, day);
    if (existing?.shiftTemplateId) {
      conflicts.push({
        date: toDateOnly(day),
        shiftTemplateName: shiftTemplateNamesById.get(existing.shiftTemplateId) ?? "Shift",
      });
    }
  }

  return conflicts;
}

/**
 * The transactional core: creates an absence ScheduleAssignment for every day
 * in the request's range, auto-creating that month's Schedule if it doesn't
 * exist yet. On a shift conflict, either overwrites the row to an absence
 * (default, 'remove') or leaves that specific day untouched ('keep'). Every
 * created/overwritten/skipped date is recorded into one audit log row in the
 * same transaction, which is also what a later revocation reads from to know
 * exactly what to undo.
 */
export async function syncApprovedRequestToSchedule(
  tx: TxClient,
  companyId: string,
  userId: string,
  request: RequestForSync,
  conflictResolution: "remove" | "keep",
): Promise<SyncApprovalResult> {
  const days = daysInRange(request.startDate, request.endDate);
  const scheduleCache = new Map<string, ScheduleWithAssignments>();
  const result: SyncApprovalResult = { createdDates: [], removedShiftDates: [], keptConflictDates: [] };

  for (const day of days) {
    const year = day.getUTCFullYear();
    const month = day.getUTCMonth() + 1;
    const key = `${year}-${month}`;

    let schedule = scheduleCache.get(key);
    if (!schedule) {
      const found = await scheduleRepository.findByYearMonthInCompany(year, month, companyId, tx);
      schedule =
        found ?? (await scheduleRepository.create({ companyId, year, month, createdBy: userId, updatedBy: userId }, tx));
      scheduleCache.set(key, schedule);
    }

    const existing = await scheduleAssignmentRepository.findByScheduleEmployeeDate(
      schedule.id,
      request.employeeId,
      day,
      tx,
    );

    if (!existing) {
      await scheduleAssignmentRepository.create(
        {
          scheduleId: schedule.id,
          employeeId: request.employeeId,
          absenceTypeId: request.absenceTypeId,
          date: day,
          updatedBy: userId,
          sourceRequestId: request.id,
        },
        tx,
      );
      result.createdDates.push(toDateOnly(day));
      continue;
    }

    if (existing.absenceTypeId) {
      // Already an absence (e.g. a second overlapping approval) — nothing to change.
      continue;
    }

    if (conflictResolution === "keep") {
      result.keptConflictDates.push(toDateOnly(day));
      continue;
    }

    await scheduleAssignmentRepository.update(
      existing.id,
      {
        shiftTemplate: { disconnect: true },
        absenceType: { connect: { id: request.absenceTypeId } },
        sourceRequest: { connect: { id: request.id } },
        updater: { connect: { id: userId } },
      },
      tx,
    );
    result.removedShiftDates.push({
      date: toDateOnly(day),
      previousShiftTemplateId: existing.shiftTemplateId!,
      previousNotes: existing.notes,
    });
  }

  await requestAuditLogRepository.create(
    {
      companyId,
      requestId: request.id,
      action: "REQUEST_APPROVED",
      performedBy: userId,
      details: result as unknown as Prisma.InputJsonValue,
    },
    tx,
  );

  return result;
}

/**
 * Undoes exactly what `syncApprovedRequestToSchedule` did for this request:
 * restores any shift it overwrote (from the approval's own audit-log
 * snapshot) and deletes any absence row it created from scratch.
 */
export async function revokeApprovedRequestSync(
  tx: TxClient,
  companyId: string,
  userId: string,
  requestId: string,
): Promise<RevokeApprovalResult> {
  const approvalLog = await requestAuditLogRepository.findLatestForRequest(requestId, "REQUEST_APPROVED", tx);
  const removedShiftDates = (approvalLog?.details as unknown as SyncApprovalResult | null)?.removedShiftDates ?? [];
  const removedByDate = new Map(removedShiftDates.map((entry) => [entry.date, entry]));

  const assignments = await scheduleAssignmentRepository.findBySourceRequestId(requestId, tx);
  const result: RevokeApprovalResult = { restoredDates: [], deletedDates: [] };

  for (const assignment of assignments) {
    const dateKey = toDateOnly(assignment.date);
    const toRestore = removedByDate.get(dateKey);

    if (toRestore) {
      await scheduleAssignmentRepository.update(
        assignment.id,
        {
          absenceType: { disconnect: true },
          shiftTemplate: { connect: { id: toRestore.previousShiftTemplateId } },
          notes: toRestore.previousNotes,
          sourceRequest: { disconnect: true },
          updater: { connect: { id: userId } },
        },
        tx,
      );
      result.restoredDates.push(dateKey);
    } else {
      await scheduleAssignmentRepository.delete(assignment.id, tx);
      result.deletedDates.push(dateKey);
    }
  }

  await requestAuditLogRepository.create(
    {
      companyId,
      requestId,
      action: "REQUEST_APPROVAL_REVOKED",
      performedBy: userId,
      details: result as unknown as Prisma.InputJsonValue,
    },
    tx,
  );

  return result;
}
