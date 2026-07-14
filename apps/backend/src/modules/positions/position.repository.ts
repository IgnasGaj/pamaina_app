import { Position, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PositionSortBy, PositionStatusFilter } from "@/modules/positions/position.dto";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const positionWithRelations = Prisma.validator<Prisma.PositionDefaultArgs>()({
  include: {
    department: { select: { name: true } },
    _count: { select: { employees: { where: { status: "ACTIVE" } } } },
  },
});
export type PositionWithRelations = Prisma.PositionGetPayload<typeof positionWithRelations>;

function buildOrderBy(
  sortBy: PositionSortBy,
  sortOrder: "asc" | "desc",
): Prisma.PositionOrderByWithRelationInput[] {
  switch (sortBy) {
    case "createdAt":
      return [{ createdAt: sortOrder }];
    // Prisma's relation-count ordering can't apply the ACTIVE-only filter
    // used for the displayed count, so this sorts by total employees ever
    // linked to the position (including archived ones).
    case "employeeCount":
      return [{ employees: { _count: sortOrder } }];
    case "name":
    default:
      return [{ title: sortOrder }];
  }
}

export class PositionRepository {
  async create(
    data: { companyId: string; title: string; description?: string; color: string; departmentId?: string },
    client: Client = prisma,
  ): Promise<PositionWithRelations> {
    return client.position.create({ data, include: positionWithRelations.include });
  }

  /**
   * Intentionally does not exclude archived (deletedAt-set) records: the
   * details view and the restore action both need to load an archived
   * position by id. List-view visibility is controlled by findMany's
   * status scoping instead.
   */
  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<PositionWithRelations | null> {
    return client.position.findFirst({
      where: { id, companyId },
      include: positionWithRelations.include,
    });
  }

  async findByTitleInCompany(title: string, companyId: string, client: Client = prisma): Promise<Position | null> {
    return client.position.findFirst({ where: { title, companyId, deletedAt: null } });
  }

  async update(id: string, data: Prisma.PositionUpdateInput, client: Client = prisma): Promise<PositionWithRelations> {
    return client.position.update({ where: { id }, data, include: positionWithRelations.include });
  }

  async findMany(
    companyId: string,
    filters: { search?: string; departmentId?: string; status?: PositionStatusFilter },
    sort: { sortBy: PositionSortBy; sortOrder: "asc" | "desc" },
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: PositionWithRelations[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.PositionWhereInput = {
      companyId,
      ...(filters.status === "ARCHIVED"
        ? { deletedAt: { not: null } }
        : filters.status === "ACTIVE"
          ? { isActive: true, deletedAt: null }
          : { deletedAt: null }),
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.search ? { title: { contains: filters.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      client.position.findMany({
        where,
        include: positionWithRelations.include,
        skip,
        take,
        orderBy: buildOrderBy(sort.sortBy, sort.sortOrder),
      }),
      client.position.count({ where }),
    ]);
    return { items, total };
  }

  /** Soft-delete only: sets deletedAt/isActive. Never a hard delete. */
  async archive(id: string, client: Client = prisma): Promise<void> {
    await client.position.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async restore(id: string, client: Client = prisma): Promise<void> {
    await client.position.update({ where: { id }, data: { deletedAt: null, isActive: true } });
  }
}

export const positionRepository = new PositionRepository();
