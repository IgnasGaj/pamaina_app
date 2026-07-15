import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { scheduleRepository } from "@/modules/schedules/schedule.repository";
import { scheduleAssignmentRepository } from "@/modules/schedules/schedule-assignment.repository";
import { toAssignmentResponseDto, toScheduleResponseDto, toScheduleSummaryDto } from "@/modules/schedules/schedule.mapper";
import {
  CreateAssignmentDto,
  CreateScheduleDto,
  ListSchedulesQuery,
  ScheduleAssignmentResponseDto,
  ScheduleResponseDto,
  ScheduleSummaryDto,
  UpdateAssignmentDto,
  UpdateScheduleDto,
} from "@/modules/schedules/schedule.dto";
import { employeeRepository, EmployeeWithRelations } from "@/modules/employees/employee.repository";
import { shiftTemplateRepository } from "@/modules/shift-templates/shift-template.repository";
import { absenceTypeRepository } from "@/modules/absence-types/absence-type.repository";
import { notifyUser, notifyUsers } from "@/modules/notifications/notification.service";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Scoping applied for self-service EMPLOYEE-role callers — see schedule.controller.ts. */
export interface ScheduleAccessOptions {
  /** Employees may only ever see PUBLISHED schedules; drafts must appear as if they don't exist. */
  restrictToPublished?: boolean;
  /** Employees may only see their own assignments within an otherwise-visible schedule. */
  restrictToEmployeeId?: string;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Renaming a schedule's month/copying a whole other month into it are
 * structural operations, kept blocked once published. Editing individual
 * shifts is NOT blocked here — see createAssignment/updateAssignment/
 * deleteAssignment, which managers must be able to do on published
 * schedules too (a confirmation dialog in the UI is the safeguard instead).
 */
function assertScheduleStructurallyEditable(schedule: { status: string }): void {
  if (schedule.status === "PUBLISHED") {
    throw new ConflictError("Cannot change the month or bulk-copy into a published schedule");
  }
}

/** Only ACTIVE employees currently within their employment window may receive shifts. */
async function assertEmployeeSchedulable(
  employeeId: string,
  companyId: string,
): Promise<EmployeeWithRelations> {
  const employee = await employeeRepository.findByIdInCompany(employeeId, companyId);
  if (!employee) {
    throw new BadRequestError("The selected employee does not belong to this company");
  }
  if (employee.status !== "ACTIVE") {
    throw new BadRequestError("Only active employees may receive shifts");
  }
  return employee;
}

/** New/changed assignments may only pick a currently-active shift template (archived ones stay valid on already-existing assignments). */
async function assertActiveShiftTemplate(shiftTemplateId: string, companyId: string): Promise<void> {
  const template = await shiftTemplateRepository.findByIdInCompany(shiftTemplateId, companyId);
  if (!template) {
    throw new BadRequestError("The selected shift template does not belong to this company");
  }
  if (!template.active) {
    throw new BadRequestError("This shift template has been archived and can no longer be assigned");
  }
}

/** New/changed assignments may only pick a currently-active absence type (archived ones stay valid on already-existing assignments). */
async function assertActiveAbsenceType(absenceTypeId: string, companyId: string): Promise<void> {
  const absenceType = await absenceTypeRepository.findByIdInCompany(absenceTypeId, companyId);
  if (!absenceType) {
    throw new BadRequestError("The selected absence type does not belong to this company");
  }
  if (!absenceType.active) {
    throw new BadRequestError("This absence type has been archived and can no longer be assigned");
  }
}

function assertDateWithinEmployment(date: Date, employee: { startDate: Date; endDate: Date | null }): void {
  if (date < employee.startDate) {
    throw new BadRequestError("Cannot assign a shift before the employee's start date");
  }
  if (employee.endDate && date > employee.endDate) {
    throw new BadRequestError("Cannot assign a shift after the employee's end date");
  }
}

function assertDateWithinSchedule(date: Date, schedule: { year: number; month: number }): void {
  if (date.getUTCFullYear() !== schedule.year || date.getUTCMonth() + 1 !== schedule.month) {
    throw new BadRequestError("The shift date must fall within the schedule's month");
  }
}

export async function createSchedule(
  companyId: string,
  userId: string,
  dto: CreateScheduleDto,
): Promise<ScheduleResponseDto> {
  const existing = await scheduleRepository.findByYearMonthInCompany(dto.year, dto.month, companyId);
  if (existing) {
    throw new ConflictError("A schedule already exists for this month");
  }
  const schedule = await scheduleRepository.create({
    companyId,
    year: dto.year,
    month: dto.month,
    createdBy: userId,
    updatedBy: userId,
  });
  return toScheduleResponseDto(schedule);
}

export async function getScheduleByIdOrThrow(
  companyId: string,
  id: string,
  options: ScheduleAccessOptions = {},
): Promise<ScheduleResponseDto> {
  const schedule = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!schedule) {
    throw new NotFoundError("Schedule");
  }
  // A draft schedule must be indistinguishable from a non-existent one to an
  // employee — NotFound, not Forbidden, so its existence isn't leaked.
  if (options.restrictToPublished && schedule.status !== "PUBLISHED") {
    throw new NotFoundError("Schedule");
  }
  if (options.restrictToEmployeeId) {
    schedule.assignments = schedule.assignments.filter(
      (assignment) => assignment.employeeId === options.restrictToEmployeeId,
    );
  }
  return toScheduleResponseDto(schedule);
}

export async function updateSchedule(
  companyId: string,
  userId: string,
  id: string,
  dto: UpdateScheduleDto,
): Promise<ScheduleResponseDto> {
  const existing = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Schedule");
  }
  assertScheduleStructurallyEditable(existing);

  const nextYear = dto.year ?? existing.year;
  const nextMonth = dto.month ?? existing.month;
  if (nextYear !== existing.year || nextMonth !== existing.month) {
    const conflict = await scheduleRepository.findByYearMonthInCompany(nextYear, nextMonth, companyId);
    if (conflict && conflict.id !== id) {
      throw new ConflictError("A schedule already exists for this month");
    }
  }

  const updated = await scheduleRepository.update(id, {
    year: nextYear,
    month: nextMonth,
    updater: { connect: { id: userId } },
  });
  return toScheduleResponseDto(updated);
}

export async function listSchedules(
  companyId: string,
  query: ListSchedulesQuery,
  options: ScheduleAccessOptions = {},
): Promise<PaginatedResult<ScheduleSummaryDto>> {
  const { items, total } = await scheduleRepository.findMany(
    {
      companyId,
      year: query.year,
      month: query.month,
      // Forced regardless of the requested status — an employee can never
      // list draft schedules, even by asking for status=DRAFT explicitly.
      status: options.restrictToPublished ? "PUBLISHED" : query.status,
    },
    query,
  );
  return buildPaginatedResult(items.map(toScheduleSummaryDto), query, total);
}

export async function publishSchedule(companyId: string, userId: string, id: string): Promise<ScheduleResponseDto> {
  const existing = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Schedule");
  }
  if (existing.status === "PUBLISHED") {
    throw new ConflictError("This schedule has already been published");
  }
  const updated = await scheduleRepository.update(id, {
    status: "PUBLISHED",
    publishedAt: new Date(),
    updater: { connect: { id: userId } },
  });

  const employeeIds = [...new Set(updated.assignments.map((assignment) => assignment.employeeId))];
  if (employeeIds.length > 0) {
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { userId: true },
    });
    const recipientUserIds = employees
      .map((employee) => employee.userId)
      .filter((userIdValue): userIdValue is string => Boolean(userIdValue));

    await notifyUsers(
      recipientUserIds.map((recipientUserId) => ({
        companyId,
        userId: recipientUserId,
        type: "SCHEDULE_PUBLISHED",
        title: "Schedule published",
        message: `The schedule for ${updated.year}-${String(updated.month).padStart(2, "0")} has been published.`,
        link: "/my-schedule",
      })),
    );
  }

  return toScheduleResponseDto(updated);
}

/**
 * Copies the previous calendar month's assignments into this schedule. Only
 * employees who are currently ACTIVE are copied — someone whose employment
 * has since ended shouldn't reappear on a new month's grid.
 * Existing assignments in the target month are left untouched
 * (skip-on-conflict), so re-running this after manual edits is always safe.
 */
export async function copyPreviousMonth(
  companyId: string,
  userId: string,
  id: string,
): Promise<ScheduleResponseDto> {
  const target = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!target) {
    throw new NotFoundError("Schedule");
  }
  assertScheduleStructurallyEditable(target);

  const prevMonth = target.month === 1 ? 12 : target.month - 1;
  const prevYear = target.month === 1 ? target.year - 1 : target.year;
  const previous = await scheduleRepository.findByYearMonthInCompany(prevYear, prevMonth, companyId);
  if (!previous) {
    return toScheduleResponseDto(target);
  }

  const activeEmployees = await employeeRepository.findAllActiveForCompany(companyId);
  const activeEmployeeById = new Map(activeEmployees.map((employee) => [employee.id, employee]));
  const targetDaysInMonth = daysInMonth(target.year, target.month);

  const toCreate: Prisma.ScheduleAssignmentCreateManyInput[] = [];
  for (const assignment of previous.assignments) {
    const employee = activeEmployeeById.get(assignment.employeeId);
    if (!employee) continue; // no longer active

    const dayOfMonth = assignment.date.getUTCDate();
    if (dayOfMonth > targetDaysInMonth) continue; // e.g. day 31 has no equivalent in a 30-day month

    const newDate = new Date(Date.UTC(target.year, target.month - 1, dayOfMonth));
    if (newDate < employee.startDate || (employee.endDate && newDate > employee.endDate)) continue;

    toCreate.push({
      scheduleId: target.id,
      employeeId: assignment.employeeId,
      shiftTemplateId: assignment.shiftTemplateId,
      absenceTypeId: assignment.absenceTypeId,
      date: newDate,
      notes: assignment.notes,
      updatedBy: userId,
    });
  }

  await scheduleAssignmentRepository.createMany(toCreate);
  await scheduleRepository.touchUpdatedBy(id, userId);

  const updated = await scheduleRepository.findByIdInCompany(id, companyId);
  return toScheduleResponseDto(updated!);
}

export async function createAssignment(
  companyId: string,
  userId: string,
  dto: CreateAssignmentDto,
): Promise<ScheduleAssignmentResponseDto> {
  const schedule = await scheduleRepository.findByIdInCompany(dto.scheduleId, companyId);
  if (!schedule) {
    throw new NotFoundError("Schedule");
  }
  // Note: assignment CRUD is intentionally allowed on PUBLISHED schedules —
  // managers must never be forced to create a new schedule just to fix a
  // shift. The frontend gates this behind an explicit "Edit" confirmation.

  const employee = await assertEmployeeSchedulable(dto.employeeId, companyId);
  if (dto.shiftTemplateId) {
    await assertActiveShiftTemplate(dto.shiftTemplateId, companyId);
  }
  if (dto.absenceTypeId) {
    await assertActiveAbsenceType(dto.absenceTypeId, companyId);
  }
  assertDateWithinEmployment(dto.date, employee);
  assertDateWithinSchedule(dto.date, schedule);

  const existing = await scheduleAssignmentRepository.findByScheduleEmployeeDate(
    dto.scheduleId,
    dto.employeeId,
    dto.date,
  );
  if (existing) {
    throw new ConflictError("This employee already has a shift assigned on this day. Update it instead.");
  }

  const created = await scheduleAssignmentRepository.create({
    scheduleId: dto.scheduleId,
    employeeId: dto.employeeId,
    shiftTemplateId: dto.shiftTemplateId,
    absenceTypeId: dto.absenceTypeId,
    date: dto.date,
    notes: dto.notes,
    updatedBy: userId,
  });
  await scheduleRepository.touchUpdatedBy(dto.scheduleId, userId);

  // Only notify once the schedule is actually visible to the employee —
  // adding shifts to a still-unpublished draft must stay silent.
  if (schedule.status === "PUBLISHED" && created.employee.userId) {
    await notifyUser({
      companyId,
      userId: created.employee.userId,
      type: "SHIFT_ASSIGNED",
      title: "New shift assigned",
      message: `You have a new shift on ${toDateOnly(dto.date)}.`,
      link: "/my-schedule",
    });
  }

  return toAssignmentResponseDto(created);
}

export async function updateAssignment(
  companyId: string,
  userId: string,
  id: string,
  dto: UpdateAssignmentDto,
): Promise<ScheduleAssignmentResponseDto> {
  const existing = await scheduleAssignmentRepository.findById(id);
  if (!existing || existing.schedule.companyId !== companyId) {
    throw new NotFoundError("Schedule assignment");
  }

  if (dto.shiftTemplateId) {
    await assertActiveShiftTemplate(dto.shiftTemplateId, companyId);
  }
  if (dto.absenceTypeId) {
    await assertActiveAbsenceType(dto.absenceTypeId, companyId);
  }

  const updated = await scheduleAssignmentRepository.update(id, {
    shiftTemplate: dto.shiftTemplateId ? { connect: { id: dto.shiftTemplateId } } : { disconnect: true },
    absenceType: dto.absenceTypeId ? { connect: { id: dto.absenceTypeId } } : { disconnect: true },
    notes: dto.notes,
    updater: { connect: { id: userId } },
  });
  await scheduleRepository.touchUpdatedBy(existing.scheduleId, userId);

  if (existing.schedule.status === "PUBLISHED" && updated.employee.userId) {
    await notifyUser({
      companyId,
      userId: updated.employee.userId,
      type: "SHIFT_UPDATED",
      title: "Shift updated",
      message: `Your shift on ${toDateOnly(updated.date)} was updated.`,
      link: "/my-schedule",
    });
  }

  return toAssignmentResponseDto(updated);
}

export async function deleteAssignment(companyId: string, userId: string, id: string): Promise<void> {
  const existing = await scheduleAssignmentRepository.findById(id);
  if (!existing || existing.schedule.companyId !== companyId) {
    throw new NotFoundError("Schedule assignment");
  }
  await scheduleAssignmentRepository.delete(id);
  await scheduleRepository.touchUpdatedBy(existing.scheduleId, userId);
}
