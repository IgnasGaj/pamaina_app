import { Prisma } from "@prisma/client";
import { contractRepository } from "@/modules/contracts/contract.repository";
import { toContractResponseDto } from "@/modules/contracts/contract.mapper";
import {
  ContractResponseDto,
  CreateContractDto,
  EndContractDto,
  ListContractsQuery,
  UpdateContractDto,
} from "@/modules/contracts/contract.dto";
import { employeeRepository } from "@/modules/employees/employee.repository";
import { departmentRepository } from "@/modules/departments/department.repository";
import { positionRepository } from "@/modules/positions/position.repository";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

const MAX_CODE_GENERATION_ATTEMPTS = 5;

async function assertEmployeeBelongsToCompany(employeeId: string, companyId: string): Promise<void> {
  const employee = await employeeRepository.findByIdInCompany(employeeId, companyId);
  if (!employee) {
    throw new BadRequestError("The selected employee does not belong to this company");
  }
}

async function assertDepartmentBelongsToCompany(departmentId: string, companyId: string): Promise<void> {
  const department = await departmentRepository.findByIdInCompany(departmentId, companyId);
  if (!department) {
    throw new BadRequestError("The selected department does not belong to this company");
  }
}

async function assertPositionBelongsToCompany(positionId: string, companyId: string): Promise<void> {
  const position = await positionRepository.findByIdInCompany(positionId, companyId);
  if (!position) {
    throw new BadRequestError("The selected position does not belong to this company");
  }
}

/** Only one ACTIVE contract per employee is allowed at any time. */
async function assertNoOtherActiveContract(
  employeeId: string,
  companyId: string,
  excludeContractId?: string,
): Promise<void> {
  const active = await contractRepository.findActiveForEmployee(employeeId, companyId);
  if (active && active.id !== excludeContractId) {
    throw new ConflictError(
      "This employee already has an active contract. End it before activating another one.",
    );
  }
}

function assertEndAfterStart(startDate: Date, endDate: Date | null | undefined): void {
  if (endDate && endDate <= startDate) {
    throw new BadRequestError("End date must be after the start date");
  }
}

async function generateContractNumber(companyId: string): Promise<string> {
  const count = await contractRepository.countForCompany(companyId);
  return `CTR-${String(count + 1).padStart(4, "0")}`;
}

export async function createContract(companyId: string, dto: CreateContractDto): Promise<ContractResponseDto> {
  await assertEmployeeBelongsToCompany(dto.employeeId, companyId);
  if (dto.departmentId) {
    await assertDepartmentBelongsToCompany(dto.departmentId, companyId);
  }
  if (dto.positionId) {
    await assertPositionBelongsToCompany(dto.positionId, companyId);
  }
  assertEndAfterStart(dto.startDate, dto.endDate);

  if (dto.status === "ACTIVE") {
    await assertNoOtherActiveContract(dto.employeeId, companyId);
  }

  const baseData = {
    companyId,
    employeeId: dto.employeeId,
    departmentId: dto.departmentId,
    positionId: dto.positionId,
    status: dto.status,
    contractType: dto.contractType,
    startDate: dto.startDate,
    endDate: dto.endDate,
    probationEndDate: dto.probationEndDate,
    weeklyHours: dto.weeklyHours,
    dailyHours: dto.dailyHours,
    fte: dto.fte,
    workWeek: dto.workWeek,
    vacationDaysPerYear: dto.vacationDaysPerYear,
    summarizedWorkingTime: dto.summarizedWorkingTime,
    canWorkWeekends: dto.canWorkWeekends,
    canWorkHolidays: dto.canWorkHolidays,
    canWorkNights: dto.canWorkNights,
    notes: dto.notes,
  };

  if (dto.contractNumber) {
    const existing = await contractRepository.findByNumberInCompany(dto.contractNumber, companyId);
    if (existing) {
      throw new ConflictError("A contract with this number already exists");
    }
    const contract = await contractRepository.create({ ...baseData, contractNumber: dto.contractNumber });
    return toContractResponseDto(contract);
  }

  // Auto-generated numbers can race under concurrent creation; retry a few
  // times on a unique-constraint conflict before giving up.
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const contractNumber = await generateContractNumber(companyId);
    try {
      const contract = await contractRepository.create({ ...baseData, contractNumber });
      return toContractResponseDto(contract);
    } catch (err) {
      const isUniqueConflict = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isUniqueConflict || attempt === MAX_CODE_GENERATION_ATTEMPTS - 1) {
        throw err;
      }
    }
  }

  throw new ConflictError("Could not generate a unique contract number, please retry");
}

export async function getContractByIdOrThrow(companyId: string, id: string): Promise<ContractResponseDto> {
  const contract = await contractRepository.findByIdInCompany(id, companyId);
  if (!contract) {
    throw new NotFoundError("Contract");
  }
  return toContractResponseDto(contract);
}

export async function updateContract(
  companyId: string,
  id: string,
  dto: UpdateContractDto,
): Promise<ContractResponseDto> {
  const existing = await contractRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Contract");
  }

  if (dto.departmentId) {
    await assertDepartmentBelongsToCompany(dto.departmentId, companyId);
  }
  if (dto.positionId) {
    await assertPositionBelongsToCompany(dto.positionId, companyId);
  }

  const resolvedStartDate = dto.startDate ?? existing.startDate;
  const resolvedEndDate = dto.endDate !== undefined ? dto.endDate : existing.endDate;
  assertEndAfterStart(resolvedStartDate, resolvedEndDate);

  if (dto.contractNumber && dto.contractNumber !== existing.contractNumber) {
    const numberTaken = await contractRepository.findByNumberInCompany(dto.contractNumber, companyId);
    if (numberTaken) {
      throw new ConflictError("A contract with this number already exists");
    }
  }

  if (dto.status === "ACTIVE" && existing.status !== "ACTIVE") {
    await assertNoOtherActiveContract(existing.employeeId, companyId, existing.id);
  }

  const updated = await contractRepository.update(id, {
    contractNumber: dto.contractNumber,
    status: dto.status,
    contractType: dto.contractType,
    startDate: dto.startDate,
    endDate: dto.endDate,
    probationEndDate: dto.probationEndDate,
    weeklyHours: dto.weeklyHours,
    dailyHours: dto.dailyHours,
    fte: dto.fte,
    workWeek: dto.workWeek,
    vacationDaysPerYear: dto.vacationDaysPerYear,
    summarizedWorkingTime: dto.summarizedWorkingTime,
    canWorkWeekends: dto.canWorkWeekends,
    canWorkHolidays: dto.canWorkHolidays,
    canWorkNights: dto.canWorkNights,
    notes: dto.notes,
    ...(dto.departmentId !== undefined
      ? { department: dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true } }
      : {}),
    ...(dto.positionId !== undefined
      ? { position: dto.positionId ? { connect: { id: dto.positionId } } : { disconnect: true } }
      : {}),
  });

  return toContractResponseDto(updated);
}

export async function endContract(companyId: string, id: string, dto: EndContractDto): Promise<ContractResponseDto> {
  const existing = await contractRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Contract");
  }
  if (existing.status === "ENDED") {
    throw new ConflictError("This contract has already ended");
  }

  const endDate = dto.endDate ?? new Date();
  assertEndAfterStart(existing.startDate, endDate);

  const updated = await contractRepository.update(id, { status: "ENDED", endDate });
  return toContractResponseDto(updated);
}

export async function listContracts(
  companyId: string,
  query: ListContractsQuery,
): Promise<PaginatedResult<ContractResponseDto>> {
  const { items, total } = await contractRepository.findMany(
    {
      companyId,
      employeeId: query.employeeId,
      departmentId: query.departmentId,
      positionId: query.positionId,
      status: query.status,
    },
    query,
  );
  return buildPaginatedResult(items.map(toContractResponseDto), query, total);
}

export async function listContractsForEmployee(
  companyId: string,
  employeeId: string,
): Promise<ContractResponseDto[]> {
  await assertEmployeeBelongsToCompany(employeeId, companyId);
  const contracts = await contractRepository.findAllForEmployee(employeeId, companyId);
  return contracts.map(toContractResponseDto);
}
