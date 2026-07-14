import { ScheduleAssignment } from "@prisma/client";
import { ScheduleListItem, ScheduleWithAssignments } from "@/modules/schedules/schedule.repository";
import { ScheduleAssignmentResponseDto, ScheduleResponseDto, ScheduleSummaryDto } from "@/modules/schedules/schedule.dto";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type AssignmentLike = ScheduleAssignment & { employee?: { firstName: string; lastName: string } };

export function toAssignmentResponseDto(assignment: AssignmentLike): ScheduleAssignmentResponseDto {
  return {
    id: assignment.id,
    scheduleId: assignment.scheduleId,
    employeeId: assignment.employeeId,
    employeeName: assignment.employee ? `${assignment.employee.firstName} ${assignment.employee.lastName}` : "",
    contractId: assignment.contractId,
    date: toDateOnly(assignment.date),
    shiftType: assignment.shiftType,
    notes: assignment.notes,
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
    publishedAt: schedule.publishedAt ? schedule.publishedAt.toISOString() : null,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    assignments: schedule.assignments.map(toAssignmentResponseDto),
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
    publishedAt: schedule.publishedAt ? schedule.publishedAt.toISOString() : null,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    assignmentCount: schedule._count.assignments,
  };
}
