import { Prisma } from "@prisma/client";
import { employeeRepository } from "@/modules/employees/employee.repository";
import { toEmployeeResponseDto } from "@/modules/employees/employee.mapper";
import {
  CreateEmployeeDto,
  EmployeeResponseDto,
  ListEmployeesQuery,
  UpdateEmployeeDto,
} from "@/modules/employees/employee.dto";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

const MAX_CODE_GENERATION_ATTEMPTS = 5;

async function generateEmployeeCode(companyId: string): Promise<string> {
  const count = await employeeRepository.countInCompany(companyId);
  return `EMP-${String(count + 1).padStart(4, "0")}`;
}

export async function createEmployee(companyId: string, dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
  const baseData = {
    companyId,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone,
    personalCode: dto.personalCode,
    birthDate: dto.birthDate,
  };

  if (dto.employeeCode) {
    const existing = await employeeRepository.findByCodeInCompany(dto.employeeCode, companyId);
    if (existing) {
      throw new ConflictError("An employee with this employee code already exists");
    }
    const employee = await employeeRepository.create({ ...baseData, employeeCode: dto.employeeCode });
    return toEmployeeResponseDto(employee);
  }

  // Auto-generated codes can race under concurrent creation; retry a few
  // times on a unique-constraint conflict before giving up.
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const employeeCode = await generateEmployeeCode(companyId);
    try {
      const employee = await employeeRepository.create({ ...baseData, employeeCode });
      return toEmployeeResponseDto(employee);
    } catch (err) {
      const isUniqueConflict = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isUniqueConflict || attempt === MAX_CODE_GENERATION_ATTEMPTS - 1) {
        throw err;
      }
    }
  }

  throw new ConflictError("Could not generate a unique employee code, please retry");
}

export async function getEmployeeByIdOrThrow(companyId: string, id: string): Promise<EmployeeResponseDto> {
  const employee = await employeeRepository.findByIdInCompany(id, companyId);
  if (!employee) {
    throw new NotFoundError("Employee");
  }
  return toEmployeeResponseDto(employee);
}

export async function getOwnEmployeeProfileOrThrow(companyId: string, userId: string): Promise<EmployeeResponseDto> {
  const employee = await employeeRepository.findByUserId(userId, companyId);
  if (!employee) {
    throw new NotFoundError("Employee profile for this account");
  }
  return toEmployeeResponseDto(employee);
}

export async function updateEmployee(
  companyId: string,
  id: string,
  dto: UpdateEmployeeDto,
): Promise<EmployeeResponseDto> {
  const existing = await employeeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Employee");
  }

  const updated = await employeeRepository.update(id, {
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone,
    personalCode: dto.personalCode,
    birthDate: dto.birthDate,
    status: dto.status,
  });

  return toEmployeeResponseDto(updated);
}

export async function listEmployees(
  companyId: string,
  query: ListEmployeesQuery,
  restrictToUserId?: string,
): Promise<PaginatedResult<EmployeeResponseDto>> {
  const { items, total } = await employeeRepository.findMany(
    {
      companyId,
      search: query.search,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      restrictToUserId,
    },
    query,
  );
  return buildPaginatedResult(items.map(toEmployeeResponseDto), query, total);
}

export async function archiveEmployee(companyId: string, id: string): Promise<EmployeeResponseDto> {
  const existing = await employeeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Employee");
  }
  await employeeRepository.archive(id);
  const updated = await employeeRepository.findByIdInCompany(id, companyId);
  return toEmployeeResponseDto(updated!);
}

export async function restoreEmployee(companyId: string, id: string): Promise<EmployeeResponseDto> {
  const existing = await employeeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Employee");
  }
  await employeeRepository.restore(id);
  const updated = await employeeRepository.findByIdInCompany(id, companyId);
  return toEmployeeResponseDto(updated!);
}
