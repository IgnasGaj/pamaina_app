import { Prisma } from "@prisma/client";
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
import { employeeRepository } from "@/modules/employees/employee.repository";
import { contractRepository, ContractWithRelations } from "@/modules/contracts/contract.repository";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function assertScheduleEditable(schedule: { status: string }): void {
  if (schedule.status === "PUBLISHED") {
    throw new ConflictError("Cannot edit a published schedule");
  }
}

async function assertEmployeeBelongsToCompany(employeeId: string, companyId: string): Promise<void> {
  const employee = await employeeRepository.findByIdInCompany(employeeId, companyId);
  if (!employee) {
    throw new BadRequestError("The selected employee does not belong to this company");
  }
}

/** Only ACTIVE contracts may receive shifts, and only for the employee they belong to. */
async function assertActiveContractForEmployee(
  contractId: string,
  employeeId: string,
  companyId: string,
): Promise<ContractWithRelations> {
  const contract = await contractRepository.findByIdInCompany(contractId, companyId);
  if (!contract) {
    throw new BadRequestError("The selected contract does not belong to this company");
  }
  if (contract.employeeId !== employeeId) {
    throw new BadRequestError("The selected contract does not belong to this employee");
  }
  if (contract.status !== "ACTIVE") {
    throw new BadRequestError("Only active contracts may receive shifts");
  }
  return contract;
}

function assertDateWithinContract(date: Date, contract: { startDate: Date; endDate: Date | null }): void {
  if (date < contract.startDate) {
    throw new BadRequestError("Cannot assign a shift before the contract's start date");
  }
  if (contract.endDate && date > contract.endDate) {
    throw new BadRequestError("Cannot assign a shift after the contract's end date");
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
  });
  return toScheduleResponseDto(schedule);
}

export async function getScheduleByIdOrThrow(companyId: string, id: string): Promise<ScheduleResponseDto> {
  const schedule = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!schedule) {
    throw new NotFoundError("Schedule");
  }
  return toScheduleResponseDto(schedule);
}

export async function updateSchedule(
  companyId: string,
  id: string,
  dto: UpdateScheduleDto,
): Promise<ScheduleResponseDto> {
  const existing = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Schedule");
  }
  assertScheduleEditable(existing);

  const nextYear = dto.year ?? existing.year;
  const nextMonth = dto.month ?? existing.month;
  if (nextYear !== existing.year || nextMonth !== existing.month) {
    const conflict = await scheduleRepository.findByYearMonthInCompany(nextYear, nextMonth, companyId);
    if (conflict && conflict.id !== id) {
      throw new ConflictError("A schedule already exists for this month");
    }
  }

  const updated = await scheduleRepository.update(id, { year: nextYear, month: nextMonth });
  return toScheduleResponseDto(updated);
}

export async function listSchedules(
  companyId: string,
  query: ListSchedulesQuery,
): Promise<PaginatedResult<ScheduleSummaryDto>> {
  const { items, total } = await scheduleRepository.findMany(
    { companyId, year: query.year, month: query.month, status: query.status },
    query,
  );
  return buildPaginatedResult(items.map(toScheduleSummaryDto), query, total);
}

export async function publishSchedule(companyId: string, id: string): Promise<ScheduleResponseDto> {
  const existing = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Schedule");
  }
  if (existing.status === "PUBLISHED") {
    throw new ConflictError("This schedule has already been published");
  }
  const updated = await scheduleRepository.update(id, { status: "PUBLISHED", publishedAt: new Date() });
  return toScheduleResponseDto(updated);
}

/**
 * Copies the previous calendar month's assignments into this (still-draft)
 * schedule. Only employees who currently hold an ACTIVE contract are
 * copied — someone whose contract has since ended shouldn't reappear on a
 * new month's grid. Existing assignments in the target month are left
 * untouched (skip-on-conflict), so re-running this after manual edits is
 * always safe.
 */
export async function copyPreviousMonth(companyId: string, id: string): Promise<ScheduleResponseDto> {
  const target = await scheduleRepository.findByIdInCompany(id, companyId);
  if (!target) {
    throw new NotFoundError("Schedule");
  }
  assertScheduleEditable(target);

  const prevMonth = target.month === 1 ? 12 : target.month - 1;
  const prevYear = target.month === 1 ? target.year - 1 : target.year;
  const previous = await scheduleRepository.findByYearMonthInCompany(prevYear, prevMonth, companyId);
  if (!previous) {
    return toScheduleResponseDto(target);
  }

  const activeContracts = await contractRepository.findAllActiveForCompany(companyId);
  const activeContractByEmployee = new Map(activeContracts.map((contract) => [contract.employeeId, contract]));
  const targetDaysInMonth = daysInMonth(target.year, target.month);

  const toCreate: Prisma.ScheduleAssignmentCreateManyInput[] = [];
  for (const assignment of previous.assignments) {
    const contract = activeContractByEmployee.get(assignment.employeeId);
    if (!contract) continue; // no longer has an active contract

    const dayOfMonth = assignment.date.getUTCDate();
    if (dayOfMonth > targetDaysInMonth) continue; // e.g. day 31 has no equivalent in a 30-day month

    const newDate = new Date(Date.UTC(target.year, target.month - 1, dayOfMonth));
    if (newDate < contract.startDate || (contract.endDate && newDate > contract.endDate)) continue;

    toCreate.push({
      scheduleId: target.id,
      employeeId: assignment.employeeId,
      contractId: contract.id,
      date: newDate,
      shiftType: assignment.shiftType,
      notes: assignment.notes,
    });
  }

  await scheduleAssignmentRepository.createMany(toCreate);

  const updated = await scheduleRepository.findByIdInCompany(id, companyId);
  return toScheduleResponseDto(updated!);
}

export async function createAssignment(
  companyId: string,
  dto: CreateAssignmentDto,
): Promise<ScheduleAssignmentResponseDto> {
  const schedule = await scheduleRepository.findByIdInCompany(dto.scheduleId, companyId);
  if (!schedule) {
    throw new NotFoundError("Schedule");
  }
  assertScheduleEditable(schedule);

  await assertEmployeeBelongsToCompany(dto.employeeId, companyId);
  const contract = await assertActiveContractForEmployee(dto.contractId, dto.employeeId, companyId);
  assertDateWithinContract(dto.date, contract);
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
    contractId: dto.contractId,
    date: dto.date,
    shiftType: dto.shiftType,
    notes: dto.notes,
  });
  return toAssignmentResponseDto(created);
}

export async function updateAssignment(
  companyId: string,
  id: string,
  dto: UpdateAssignmentDto,
): Promise<ScheduleAssignmentResponseDto> {
  const existing = await scheduleAssignmentRepository.findById(id);
  if (!existing || existing.schedule.companyId !== companyId) {
    throw new NotFoundError("Schedule assignment");
  }
  assertScheduleEditable(existing.schedule);

  const updated = await scheduleAssignmentRepository.update(id, {
    shiftType: dto.shiftType,
    notes: dto.notes,
  });
  return toAssignmentResponseDto(updated);
}

export async function deleteAssignment(companyId: string, id: string): Promise<void> {
  const existing = await scheduleAssignmentRepository.findById(id);
  if (!existing || existing.schedule.companyId !== companyId) {
    throw new NotFoundError("Schedule assignment");
  }
  assertScheduleEditable(existing.schedule);
  await scheduleAssignmentRepository.delete(id);
}
