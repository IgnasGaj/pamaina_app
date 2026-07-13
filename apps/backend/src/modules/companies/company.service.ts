import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { companyRepository } from "@/modules/companies/company.repository";
import { toCompanyResponseDto } from "@/modules/companies/company.mapper";
import { CompanyResponseDto, CreateCompanyDto, UpdateCompanyDto } from "@/modules/companies/company.dto";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { slugify } from "@/shared/utils/slug.util";
import { PaginatedResult, PaginationQuery } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

type Client = Prisma.TransactionClient | typeof prisma;

/** Generates a unique slug for a new company, appending a numeric suffix on collision. */
async function generateUniqueSlug(name: string, client: Client): Promise<string> {
  const base = slugify(name) || "company";
  let candidate = base;
  let suffix = 1;
  // Small bounded loop: collisions are rare and this only runs once at signup.
  while (await companyRepository.findBySlug(candidate, client)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function createCompany(dto: CreateCompanyDto, client: Client = prisma): Promise<CompanyResponseDto> {
  if (dto.legalCode) {
    const existing = await companyRepository.findByLegalCode(dto.legalCode, client);
    if (existing) {
      throw new ConflictError("A company with this registration code is already registered");
    }
  }

  const slug = await generateUniqueSlug(dto.name, client);
  const company = await companyRepository.create(
    {
      name: dto.name,
      slug,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      legalCode: dto.legalCode,
      vatCode: dto.vatCode,
    },
    client,
  );
  return toCompanyResponseDto(company);
}

export async function getCompanyByIdOrThrow(id: string): Promise<CompanyResponseDto> {
  const company = await companyRepository.findById(id);
  if (!company || company.deletedAt) {
    throw new NotFoundError("Company");
  }
  return toCompanyResponseDto(company);
}

export async function updateCompany(id: string, dto: UpdateCompanyDto): Promise<CompanyResponseDto> {
  const existing = await companyRepository.findById(id);
  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Company");
  }
  const updated = await companyRepository.update(id, dto);
  return toCompanyResponseDto(updated);
}

export async function listCompanies(pagination: PaginationQuery): Promise<PaginatedResult<CompanyResponseDto>> {
  const { items, total } = await companyRepository.findMany(pagination);
  return buildPaginatedResult(items.map(toCompanyResponseDto), pagination, total);
}

export async function deactivateCompany(id: string): Promise<void> {
  const existing = await companyRepository.findById(id);
  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Company");
  }
  await companyRepository.softDelete(id);
}
