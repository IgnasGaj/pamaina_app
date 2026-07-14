import { Prisma, PrismaClient } from "@prisma/client";
import { absenceTypeRepository } from "@/modules/absence-types/absence-type.repository";
import { toAbsenceTypeResponseDto } from "@/modules/absence-types/absence-type.mapper";
import {
  AbsenceTypeResponseDto,
  CreateAbsenceTypeDto,
  ListAbsenceTypesQuery,
  UpdateAbsenceTypeDto,
} from "@/modules/absence-types/absence-type.dto";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

/** Seeded for every new company so a manager can assign Vacation/Sick Leave on day one; each may be edited or archived afterwards. */
export const DEFAULT_ABSENCE_TYPES: readonly { name: string; color: string; paid: boolean }[] = [
  { name: "Vacation", color: "#F59E0B", paid: true },
  { name: "Sick Leave", color: "#EF4444", paid: true },
  { name: "Day Off", color: "#6B7280", paid: false },
  { name: "Business Trip", color: "#0EA5E9", paid: true },
  { name: "Training", color: "#8B5CF6", paid: true },
  { name: "Unpaid Leave", color: "#78716C", paid: false },
];

/** Idempotent: skips any default whose name already exists in the company (e.g. re-run against an existing company). */
export async function ensureDefaultAbsenceTypesForCompany(companyId: string, client: Client): Promise<void> {
  for (const defaults of DEFAULT_ABSENCE_TYPES) {
    const existing = await absenceTypeRepository.findByNameInCompany(defaults.name, companyId, client);
    if (!existing) {
      await absenceTypeRepository.create({ companyId, ...defaults }, client);
    }
  }
}

export async function createAbsenceType(
  companyId: string,
  dto: CreateAbsenceTypeDto,
): Promise<AbsenceTypeResponseDto> {
  const existing = await absenceTypeRepository.findByNameInCompany(dto.name, companyId);
  if (existing) {
    throw new ConflictError("An absence type with this name already exists");
  }
  const absenceType = await absenceTypeRepository.create({
    companyId,
    name: dto.name,
    color: dto.color,
    paid: dto.paid,
  });
  return toAbsenceTypeResponseDto(absenceType);
}

export async function getAbsenceTypeByIdOrThrow(companyId: string, id: string): Promise<AbsenceTypeResponseDto> {
  const absenceType = await absenceTypeRepository.findByIdInCompany(id, companyId);
  if (!absenceType) {
    throw new NotFoundError("Absence type");
  }
  return toAbsenceTypeResponseDto(absenceType);
}

export async function updateAbsenceType(
  companyId: string,
  id: string,
  dto: UpdateAbsenceTypeDto,
): Promise<AbsenceTypeResponseDto> {
  const existing = await absenceTypeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Absence type");
  }

  if (dto.name && dto.name !== existing.name) {
    const nameTaken = await absenceTypeRepository.findByNameInCompany(dto.name, companyId);
    if (nameTaken) {
      throw new ConflictError("An absence type with this name already exists");
    }
  }

  const updated = await absenceTypeRepository.update(id, dto);
  return toAbsenceTypeResponseDto(updated);
}

export async function listAbsenceTypes(
  companyId: string,
  query: ListAbsenceTypesQuery,
): Promise<PaginatedResult<AbsenceTypeResponseDto>> {
  const { items, total } = await absenceTypeRepository.findMany(
    companyId,
    { search: query.search, status: query.status },
    { sortBy: query.sortBy, sortOrder: query.sortOrder },
    query,
  );
  return buildPaginatedResult(items.map(toAbsenceTypeResponseDto), query, total);
}

export async function archiveAbsenceType(companyId: string, id: string): Promise<AbsenceTypeResponseDto> {
  const existing = await absenceTypeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Absence type");
  }
  await absenceTypeRepository.archive(id);
  const updated = await absenceTypeRepository.findByIdInCompany(id, companyId);
  return toAbsenceTypeResponseDto(updated!);
}

export async function restoreAbsenceType(companyId: string, id: string): Promise<AbsenceTypeResponseDto> {
  const existing = await absenceTypeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Absence type");
  }
  await absenceTypeRepository.restore(id);
  const updated = await absenceTypeRepository.findByIdInCompany(id, companyId);
  return toAbsenceTypeResponseDto(updated!);
}
