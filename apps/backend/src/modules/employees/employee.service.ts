import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { employeeRepository } from "@/modules/employees/employee.repository";
import { toEmployeeResponseDto } from "@/modules/employees/employee.mapper";
import {
  CreateEmployeeDto,
  EmployeeCreatedResponseDto,
  EmployeeResponseDto,
  ListEmployeesQuery,
  UpdateEmployeeDto,
} from "@/modules/employees/employee.dto";
import { departmentRepository } from "@/modules/departments/department.repository";
import { positionRepository } from "@/modules/positions/position.repository";
import { userRepository } from "@/modules/users/user.repository";
import { roleRepository } from "@/modules/roles/role.repository";
import { generateTemporaryPassword, hashPassword } from "@/shared/utils/password.util";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const MAX_CODE_GENERATION_ATTEMPTS = 5;

async function generateEmployeeCode(companyId: string, client: Client = prisma): Promise<string> {
  const count = await employeeRepository.countInCompany(companyId, client);
  return `EMP-${String(count + 1).padStart(4, "0")}`;
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

/**
 * Creating an Employee is the manager's only action, but it always
 * provisions a linked login account behind the scenes: a User (EMPLOYEE
 * role, system-generated temporary password, forced change on first login)
 * is created atomically alongside the Employee so neither can exist without
 * the other. The temporary password is returned exactly once — only its
 * hash is persisted.
 */
export async function createEmployee(
  companyId: string,
  dto: CreateEmployeeDto,
): Promise<EmployeeCreatedResponseDto> {
  if (dto.departmentId) {
    await assertDepartmentBelongsToCompany(dto.departmentId, companyId);
  }
  if (dto.positionId) {
    await assertPositionBelongsToCompany(dto.positionId, companyId);
  }

  const existingUser = await userRepository.findByEmail(dto.email);
  if (existingUser) {
    throw new ConflictError("An account with this email already exists");
  }

  const employeeRole = await roleRepository.findByCompanyAndKey(companyId, "EMPLOYEE");
  if (!employeeRole) {
    throw new BadRequestError("This company has no EMPLOYEE role configured");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const baseData = {
    companyId,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone,
    departmentId: dto.departmentId,
    positionId: dto.positionId,
    employmentType: dto.employmentType,
    startDate: dto.startDate,
    endDate: dto.endDate,
    notes: dto.notes,
  };

  const employee = await prisma.$transaction(async (tx) => {
    const user = await userRepository.create(
      {
        companyId,
        roleId: employeeRole.id,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        mustChangePassword: true,
      },
      tx,
    );

    if (dto.employeeCode) {
      const existing = await employeeRepository.findByCodeInCompany(dto.employeeCode, companyId, tx);
      if (existing) {
        throw new ConflictError("An employee with this employee code already exists");
      }
      return employeeRepository.create({ ...baseData, employeeCode: dto.employeeCode, userId: user.id }, tx);
    }

    // Auto-generated codes can race under concurrent creation; retry a few
    // times on a unique-constraint conflict before giving up.
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
      const employeeCode = await generateEmployeeCode(companyId, tx);
      try {
        return await employeeRepository.create({ ...baseData, employeeCode, userId: user.id }, tx);
      } catch (err) {
        const isUniqueConflict = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (!isUniqueConflict || attempt === MAX_CODE_GENERATION_ATTEMPTS - 1) {
          throw err;
        }
      }
    }

    throw new ConflictError("Could not generate a unique employee code, please retry");
  });

  return { employee: toEmployeeResponseDto(employee), temporaryPassword };
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

  if (dto.departmentId) {
    await assertDepartmentBelongsToCompany(dto.departmentId, companyId);
  }
  if (dto.positionId) {
    await assertPositionBelongsToCompany(dto.positionId, companyId);
  }

  // Keep the linked login account's email in step with the Employee record.
  // Clearing the Employee's email (dto.email === null) leaves the User's
  // login email untouched — a login account always needs some email.
  const shouldSyncUserEmail = existing.userId && dto.email && dto.email !== existing.email;
  if (shouldSyncUserEmail) {
    const emailOwner = await userRepository.findByEmail(dto.email!);
    if (emailOwner && emailOwner.id !== existing.userId) {
      throw new ConflictError("An account with this email already exists");
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (shouldSyncUserEmail) {
      await userRepository.update(existing.userId!, { email: dto.email! }, tx);
    }

    return employeeRepository.update(
      id,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        employmentType: dto.employmentType,
        startDate: dto.startDate,
        endDate: dto.endDate,
        notes: dto.notes,
        status: dto.status,
        ...(dto.departmentId !== undefined
          ? { department: dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true } }
          : {}),
        ...(dto.positionId !== undefined
          ? { position: dto.positionId ? { connect: { id: dto.positionId } } : { disconnect: true } }
          : {}),
      },
      tx,
    );
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
      departmentId: query.departmentId,
      positionId: query.positionId,
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
  // Never leave an active login account behind an archived employee.
  await prisma.$transaction(async (tx) => {
    await employeeRepository.archive(id, tx);
    if (existing.userId) {
      await userRepository.update(existing.userId, { isActive: false }, tx);
    }
  });
  const updated = await employeeRepository.findByIdInCompany(id, companyId);
  return toEmployeeResponseDto(updated!);
}

export async function restoreEmployee(companyId: string, id: string): Promise<EmployeeResponseDto> {
  const existing = await employeeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Employee");
  }
  await prisma.$transaction(async (tx) => {
    await employeeRepository.restore(id, tx);
    if (existing.userId) {
      await userRepository.update(existing.userId, { isActive: true }, tx);
    }
  });
  const updated = await employeeRepository.findByIdInCompany(id, companyId);
  return toEmployeeResponseDto(updated!);
}
