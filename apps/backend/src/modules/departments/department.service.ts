import { departmentRepository } from "@/modules/departments/department.repository";
import { toDepartmentResponseDto } from "@/modules/departments/department.mapper";
import {
  CreateDepartmentDto,
  DepartmentResponseDto,
  ListDepartmentsQuery,
  UpdateDepartmentDto,
} from "@/modules/departments/department.dto";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

export async function createDepartment(companyId: string, dto: CreateDepartmentDto): Promise<DepartmentResponseDto> {
  const existing = await departmentRepository.findByNameInCompany(dto.name, companyId);
  if (existing) {
    throw new ConflictError("A department with this name already exists");
  }
  const department = await departmentRepository.create({
    companyId,
    name: dto.name,
    description: dto.description,
    color: dto.color,
  });
  return toDepartmentResponseDto(department);
}

export async function getDepartmentByIdOrThrow(companyId: string, id: string): Promise<DepartmentResponseDto> {
  const department = await departmentRepository.findByIdInCompany(id, companyId);
  if (!department) {
    throw new NotFoundError("Department");
  }
  return toDepartmentResponseDto(department);
}

export async function updateDepartment(
  companyId: string,
  id: string,
  dto: UpdateDepartmentDto,
): Promise<DepartmentResponseDto> {
  const existing = await departmentRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Department");
  }

  if (dto.name && dto.name !== existing.name) {
    const nameTaken = await departmentRepository.findByNameInCompany(dto.name, companyId);
    if (nameTaken) {
      throw new ConflictError("A department with this name already exists");
    }
  }

  const updated = await departmentRepository.update(id, dto);
  return toDepartmentResponseDto(updated);
}

export async function listDepartments(
  companyId: string,
  query: ListDepartmentsQuery,
): Promise<PaginatedResult<DepartmentResponseDto>> {
  const { items, total } = await departmentRepository.findMany(
    companyId,
    { search: query.search, status: query.status },
    { sortBy: query.sortBy, sortOrder: query.sortOrder },
    query,
  );
  return buildPaginatedResult(items.map(toDepartmentResponseDto), query, total);
}

export async function archiveDepartment(companyId: string, id: string): Promise<DepartmentResponseDto> {
  const existing = await departmentRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Department");
  }
  if (existing._count.employmentContracts > 0) {
    throw new ConflictError(
      `Cannot archive "${existing.name}" while it has active employees assigned. Reassign or archive them first.`,
    );
  }
  await departmentRepository.archive(id);
  const updated = await departmentRepository.findByIdInCompany(id, companyId);
  return toDepartmentResponseDto(updated!);
}

export async function restoreDepartment(companyId: string, id: string): Promise<DepartmentResponseDto> {
  const existing = await departmentRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Department");
  }
  await departmentRepository.restore(id);
  const updated = await departmentRepository.findByIdInCompany(id, companyId);
  return toDepartmentResponseDto(updated!);
}
