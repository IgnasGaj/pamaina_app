import { Department, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { DepartmentSortBy, DepartmentStatusFilter } from "@/modules/departments/department.dto";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

// Only ACTIVE/INACTIVE (non-archived) employees count toward the
// "active employees" figure shown on the department/position card.
const departmentWithCount = Prisma.validator<Prisma.DepartmentDefaultArgs>()({
  include: { _count: { select: { employees: { where: { status: { not: "ARCHIVED" } } } } } },
});
export type DepartmentWithCount = Prisma.DepartmentGetPayload<typeof departmentWithCount>;

function buildOrderBy(
  sortBy: DepartmentSortBy,
  sortOrder: "asc" | "desc",
): Prisma.DepartmentOrderByWithRelationInput[] {
  switch (sortBy) {
    case "createdAt":
      return [{ createdAt: sortOrder }];
    // Prisma's relation-count ordering can't apply the ACTIVE-only filter
    // used for the displayed count, so this sorts by total employees.
    // Acceptable trade-off: archived employees are rare relative to active ones.
    case "employeeCount":
      return [{ employees: { _count: sortOrder } }];
    case "name":
    default:
      return [{ name: sortOrder }];
  }
}

export class DepartmentRepository {
  async create(
    data: { companyId: string; name: string; description?: string; color: string },
    client: Client = prisma,
  ): Promise<DepartmentWithCount> {
    return client.department.create({ data, include: departmentWithCount.include });
  }

  /**
   * Intentionally does not exclude archived (deletedAt-set) records: the
   * details view and the restore action both need to load an archived
   * department by id. List-view visibility is controlled by findMany's
   * status scoping instead.
   */
  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<DepartmentWithCount | null> {
    return client.department.findFirst({
      where: { id, companyId },
      include: departmentWithCount.include,
    });
  }

  async findByNameInCompany(name: string, companyId: string, client: Client = prisma): Promise<Department | null> {
    return client.department.findFirst({ where: { name, companyId, deletedAt: null } });
  }

  async update(id: string, data: Prisma.DepartmentUpdateInput, client: Client = prisma): Promise<DepartmentWithCount> {
    return client.department.update({ where: { id }, data, include: departmentWithCount.include });
  }

  async findMany(
    companyId: string,
    filters: { search?: string; status?: DepartmentStatusFilter },
    sort: { sortBy: DepartmentSortBy; sortOrder: "asc" | "desc" },
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: DepartmentWithCount[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.DepartmentWhereInput = {
      companyId,
      ...(filters.status === "ARCHIVED"
        ? { deletedAt: { not: null } }
        : filters.status === "ACTIVE"
          ? { isActive: true, deletedAt: null }
          : { deletedAt: null }),
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      client.department.findMany({
        where,
        include: departmentWithCount.include,
        skip,
        take,
        orderBy: buildOrderBy(sort.sortBy, sort.sortOrder),
      }),
      client.department.count({ where }),
    ]);
    return { items, total };
  }

  /** Soft-delete only: sets deletedAt/isActive. Never a hard delete. */
  async archive(id: string, client: Client = prisma): Promise<void> {
    await client.department.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async restore(id: string, client: Client = prisma): Promise<void> {
    await client.department.update({ where: { id }, data: { deletedAt: null, isActive: true } });
  }
}

export const departmentRepository = new DepartmentRepository();
