import { Prisma, PrismaClient, ShiftTemplate } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { ShiftTemplateSortBy, ShiftTemplateStatusFilter } from "@/modules/shift-templates/shift-template.dto";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

function buildOrderBy(
  sortBy: ShiftTemplateSortBy,
  sortOrder: "asc" | "desc",
): Prisma.ShiftTemplateOrderByWithRelationInput[] {
  switch (sortBy) {
    case "startTime":
      return [{ startTime: sortOrder }];
    case "createdAt":
      return [{ createdAt: sortOrder }];
    case "name":
    default:
      return [{ name: sortOrder }];
  }
}

export class ShiftTemplateRepository {
  async create(
    data: {
      companyId: string;
      name: string;
      shortCode: string;
      color: string;
      startTime: string;
      endTime: string;
      breakMinutes: number;
    },
    client: Client = prisma,
  ): Promise<ShiftTemplate> {
    return client.shiftTemplate.create({ data });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<ShiftTemplate | null> {
    return client.shiftTemplate.findFirst({ where: { id, companyId } });
  }

  async findByNameInCompany(name: string, companyId: string, client: Client = prisma): Promise<ShiftTemplate | null> {
    return client.shiftTemplate.findFirst({ where: { name, companyId } });
  }

  async findByShortCodeInCompany(
    shortCode: string,
    companyId: string,
    client: Client = prisma,
  ): Promise<ShiftTemplate | null> {
    return client.shiftTemplate.findFirst({ where: { shortCode, companyId } });
  }

  async update(id: string, data: Prisma.ShiftTemplateUpdateInput, client: Client = prisma): Promise<ShiftTemplate> {
    return client.shiftTemplate.update({ where: { id }, data });
  }

  async findMany(
    companyId: string,
    filters: { search?: string; status?: ShiftTemplateStatusFilter },
    sort: { sortBy: ShiftTemplateSortBy; sortOrder: "asc" | "desc" },
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: ShiftTemplate[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.ShiftTemplateWhereInput = {
      companyId,
      ...(filters.status === "ARCHIVED" ? { active: false } : filters.status === "ACTIVE" ? { active: true } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      client.shiftTemplate.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(sort.sortBy, sort.sortOrder),
      }),
      client.shiftTemplate.count({ where }),
    ]);
    return { items, total };
  }

  /** No soft-delete column: archiving is just `active: false`, and archived templates stay visible on past assignments. */
  async archive(id: string, client: Client = prisma): Promise<void> {
    await client.shiftTemplate.update({ where: { id }, data: { active: false } });
  }

  async restore(id: string, client: Client = prisma): Promise<void> {
    await client.shiftTemplate.update({ where: { id }, data: { active: true } });
  }

  /** All templates in a company, unpaginated — used by the scheduler to resolve names/hours for a month's assignments. */
  async findAllForCompany(companyId: string, client: Client = prisma): Promise<ShiftTemplate[]> {
    return client.shiftTemplate.findMany({ where: { companyId } });
  }
}

export const shiftTemplateRepository = new ShiftTemplateRepository();
