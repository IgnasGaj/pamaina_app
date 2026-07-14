import { positionRepository } from "@/modules/positions/position.repository";
import { toPositionResponseDto } from "@/modules/positions/position.mapper";
import {
  CreatePositionDto,
  ListPositionsQuery,
  PositionResponseDto,
  UpdatePositionDto,
} from "@/modules/positions/position.dto";
import { departmentRepository } from "@/modules/departments/department.repository";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

async function assertDepartmentBelongsToCompany(departmentId: string, companyId: string): Promise<void> {
  const department = await departmentRepository.findByIdInCompany(departmentId, companyId);
  if (!department) {
    throw new BadRequestError("The selected department does not belong to this company");
  }
}

export async function createPosition(companyId: string, dto: CreatePositionDto): Promise<PositionResponseDto> {
  const existing = await positionRepository.findByTitleInCompany(dto.title, companyId);
  if (existing) {
    throw new ConflictError("A position with this title already exists");
  }
  if (dto.departmentId) {
    await assertDepartmentBelongsToCompany(dto.departmentId, companyId);
  }
  const position = await positionRepository.create({
    companyId,
    title: dto.title,
    description: dto.description,
    color: dto.color,
    departmentId: dto.departmentId,
  });
  return toPositionResponseDto(position);
}

export async function getPositionByIdOrThrow(companyId: string, id: string): Promise<PositionResponseDto> {
  const position = await positionRepository.findByIdInCompany(id, companyId);
  if (!position) {
    throw new NotFoundError("Position");
  }
  return toPositionResponseDto(position);
}

export async function updatePosition(
  companyId: string,
  id: string,
  dto: UpdatePositionDto,
): Promise<PositionResponseDto> {
  const existing = await positionRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Position");
  }

  if (dto.title && dto.title !== existing.title) {
    const titleTaken = await positionRepository.findByTitleInCompany(dto.title, companyId);
    if (titleTaken) {
      throw new ConflictError("A position with this title already exists");
    }
  }

  if (dto.departmentId) {
    await assertDepartmentBelongsToCompany(dto.departmentId, companyId);
  }

  const updated = await positionRepository.update(id, {
    title: dto.title,
    description: dto.description,
    color: dto.color,
    isActive: dto.isActive,
    ...(dto.departmentId !== undefined
      ? { department: dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true } }
      : {}),
  });

  return toPositionResponseDto(updated);
}

export async function listPositions(
  companyId: string,
  query: ListPositionsQuery,
): Promise<PaginatedResult<PositionResponseDto>> {
  const { items, total } = await positionRepository.findMany(
    companyId,
    { search: query.search, departmentId: query.departmentId, status: query.status },
    { sortBy: query.sortBy, sortOrder: query.sortOrder },
    query,
  );
  return buildPaginatedResult(items.map(toPositionResponseDto), query, total);
}

export async function archivePosition(companyId: string, id: string): Promise<PositionResponseDto> {
  const existing = await positionRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Position");
  }
  if (existing._count.employmentContracts > 0) {
    throw new ConflictError(
      `Cannot archive "${existing.title}" while it has active employees assigned. Reassign or archive them first.`,
    );
  }
  await positionRepository.archive(id);
  const updated = await positionRepository.findByIdInCompany(id, companyId);
  return toPositionResponseDto(updated!);
}

export async function restorePosition(companyId: string, id: string): Promise<PositionResponseDto> {
  const existing = await positionRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Position");
  }
  await positionRepository.restore(id);
  const updated = await positionRepository.findByIdInCompany(id, companyId);
  return toPositionResponseDto(updated!);
}
