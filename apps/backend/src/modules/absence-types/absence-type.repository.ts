import { AbsenceType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AbsenceTypeSortBy, AbsenceTypeStatusFilter } from "@/modules/absence-types/absence-type.dto";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

function buildOrderBy(
  sortBy: AbsenceTypeSortBy,
  sortOrder: "asc" | "desc",
): Prisma.AbsenceTypeOrderByWithRelationInput[] {
  switch (sortBy) {
    case "createdAt":
      return [{ createdAt: sortOrder }];
    case "name":
    default:
      return [{ name: sortOrder }];
  }
}

export class AbsenceTypeRepository {
  async create(
    data: { companyId: string; name: string; color: string; paid: boolean },
    client: Client = prisma,
  ): Promise<AbsenceType> {
    return client.absenceType.create({ data });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<AbsenceType | null> {
    return client.absenceType.findFirst({ where: { id, companyId } });
  }

  async findByNameInCompany(name: string, companyId: string, client: Client = prisma): Promise<AbsenceType | null> {
    return client.absenceType.findFirst({ where: { name, companyId } });
  }

  async update(id: string, data: Prisma.AbsenceTypeUpdateInput, client: Client = prisma): Promise<AbsenceType> {
    return client.absenceType.update({ where: { id }, data });
  }

  async findMany(
    companyId: string,
    filters: { search?: string; status?: AbsenceTypeStatusFilter },
    sort: { sortBy: AbsenceTypeSortBy; sortOrder: "asc" | "desc" },
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: AbsenceType[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.AbsenceTypeWhereInput = {
      companyId,
      ...(filters.status === "ARCHIVED" ? { active: false } : filters.status === "ACTIVE" ? { active: true } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      client.absenceType.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(sort.sortBy, sort.sortOrder),
      }),
      client.absenceType.count({ where }),
    ]);
    return { items, total };
  }

  /** No soft-delete column: archiving is just `active: false`, and archived types stay visible on past assignments. */
  async archive(id: string, client: Client = prisma): Promise<void> {
    await client.absenceType.update({ where: { id }, data: { active: false } });
  }

  async restore(id: string, client: Client = prisma): Promise<void> {
    await client.absenceType.update({ where: { id }, data: { active: true } });
  }

  /** All absence types in a company, unpaginated — used by the scheduler to resolve names/colors for a month's assignments. */
  async findAllForCompany(companyId: string, client: Client = prisma): Promise<AbsenceType[]> {
    return client.absenceType.findMany({ where: { companyId } });
  }

  async countForCompany(companyId: string, client: Client = prisma): Promise<number> {
    return client.absenceType.count({ where: { companyId } });
  }
}

export const absenceTypeRepository = new AbsenceTypeRepository();
