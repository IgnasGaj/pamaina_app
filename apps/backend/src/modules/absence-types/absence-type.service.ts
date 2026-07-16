import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { absenceTypeRepository } from "@/modules/absence-types/absence-type.repository";
import { toAbsenceTypeResponseDto } from "@/modules/absence-types/absence-type.mapper";
import {
  AbsenceTypeResponseDto,
  ListAbsenceTypesQuery,
  UpdateAbsenceTypeDto,
} from "@/modules/absence-types/absence-type.dto";
import { NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Pamaina is Lithuania-only, so absence types are a fixed, opinionated set
 * of four — not a customizable catalog. Every company gets exactly these,
 * seeded once and re-checked idempotently (see ensureDefaultAbsenceTypesForCompany).
 */
export const DEFAULT_ABSENCE_TYPES: readonly { code: string; name: string; color: string }[] = [
  { code: "P", name: "Poilsio diena", color: "#6B7280" },
  { code: "A", name: "Atostogos", color: "#F59E0B" },
  { code: "M", name: "Mamadienis / Tėvadienis", color: "#EC4899" },
  { code: "L", name: "Nedarbingumas", color: "#EF4444" },
];

/** Idempotent: skips any default whose code already exists in the company (safe to re-run at any time). */
export async function ensureDefaultAbsenceTypesForCompany(companyId: string, client: Client): Promise<void> {
  for (const defaults of DEFAULT_ABSENCE_TYPES) {
    const existing = await absenceTypeRepository.findByCodeInCompany(defaults.code, companyId, client);
    if (!existing) {
      await absenceTypeRepository.create({ companyId, ...defaults, isDefault: true }, client);
    }
  }
}

/** Backfills the four standard types for every existing company — run at seed time and once at server startup. */
export async function ensureDefaultAbsenceTypesForAllCompanies(client: Client = prisma): Promise<void> {
  const companies = await client.company.findMany({ select: { id: true } });
  for (const company of companies) {
    await ensureDefaultAbsenceTypesForCompany(company.id, client);
  }
}

export async function getAbsenceTypeByIdOrThrow(companyId: string, id: string): Promise<AbsenceTypeResponseDto> {
  const absenceType = await absenceTypeRepository.findByIdInCompany(id, companyId);
  if (!absenceType) {
    throw new NotFoundError("Absence type");
  }
  return toAbsenceTypeResponseDto(absenceType);
}

/** Only color/description/active are ever accepted here — code and name are immutable by construction (see the DTO). */
export async function updateAbsenceType(
  companyId: string,
  id: string,
  dto: UpdateAbsenceTypeDto,
): Promise<AbsenceTypeResponseDto> {
  const existing = await absenceTypeRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Absence type");
  }
  const updated = await absenceTypeRepository.update(id, dto);
  return toAbsenceTypeResponseDto(updated);
}

export async function listAbsenceTypes(
  companyId: string,
  query: ListAbsenceTypesQuery,
): Promise<PaginatedResult<AbsenceTypeResponseDto>> {
  const { items, total } = await absenceTypeRepository.findMany(companyId, query);
  return buildPaginatedResult(items.map(toAbsenceTypeResponseDto), query, total);
}
