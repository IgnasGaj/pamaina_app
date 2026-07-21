import { ScheduleAssignment } from "@prisma/client";
import { ScheduleListItem, ScheduleWithAssignments } from "@/modules/schedules/schedule.repository";
import {
  AbsenceEntryResponseDto,
  ScheduleAssignmentResponseDto,
  ScheduleResponseDto,
  ScheduleSummaryDto,
} from "@/modules/schedules/schedule.dto";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type AssignmentLike = ScheduleAssignment & {
  employee?: { firstName: string; lastName: string };
  updater?: { firstName: string; lastName: string } | null;
};

export function toAssignmentResponseDto(assignment: AssignmentLike): ScheduleAssignmentResponseDto {
  return {
    id: assignment.id,
    scheduleId: assignment.scheduleId,
    employeeId: assignment.employeeId,
    employeeName: assignment.employee ? `${assignment.employee.firstName} ${assignment.employee.lastName}` : "",
    date: toDateOnly(assignment.date),
    shiftTemplateId: assignment.shiftTemplateId,
    absenceTypeId: assignment.absenceTypeId,
    notes: assignment.notes,
    updatedBy: assignment.updatedBy,
    updatedByName: assignment.updater ? `${assignment.updater.firstName} ${assignment.updater.lastName}` : null,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

export function toScheduleResponseDto(schedule: ScheduleWithAssignments): ScheduleResponseDto {
  return {
    id: schedule.id,
    companyId: schedule.companyId,
    year: schedule.year,
    month: schedule.month,
    status: schedule.status,
    createdBy: schedule.createdBy,
    updatedBy: schedule.updatedBy,
    updatedByName: schedule.updater ? `${schedule.updater.firstName} ${schedule.updater.lastName}` : null,
    publishedAt: schedule.publishedAt ? schedule.publishedAt.toISOString() : null,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    assignments: schedule.assignments.map(toAssignmentResponseDto),
  };
}

type AbsenceEntryLike = ScheduleAssignment & {
  employee: { firstName: string; lastName: string };
  absenceType: { code: string; name: string; color: string } | null;
};

export function toAbsenceEntryResponseDto(assignment: AbsenceEntryLike): AbsenceEntryResponseDto {
  return {
    employeeId: assignment.employeeId,
    employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
    date: toDateOnly(assignment.date),
    absenceTypeCode: assignment.absenceType?.code ?? "",
    absenceTypeName: assignment.absenceType?.name ?? "",
    absenceTypeColor: assignment.absenceType?.color ?? "#F59E0B",
  };
}

export function toScheduleSummaryDto(schedule: ScheduleListItem): ScheduleSummaryDto {
  return {
    id: schedule.id,
    companyId: schedule.companyId,
    year: schedule.year,
    month: schedule.month,
    status: schedule.status,
    createdBy: schedule.createdBy,
    updatedBy: schedule.updatedBy,
    updatedByName: schedule.updater ? `${schedule.updater.firstName} ${schedule.updater.lastName}` : null,
    publishedAt: schedule.publishedAt ? schedule.publishedAt.toISOString() : null,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    assignmentCount: schedule._count.assignments,
  };
}
