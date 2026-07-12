import { Position, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const positionWithRelations = Prisma.validator<Prisma.PositionDefaultArgs>()({
  include: { department: { select: { name: true } }, _count: { select: { employees: true } } },
});
export type PositionWithRelations = Prisma.PositionGetPayload<typeof positionWithRelations>;

export class PositionRepository {
  async create(
    data: { companyId: string; title: string; description?: string; departmentId?: string },
    client: Client = prisma,
  ): Promise<PositionWithRelations> {
    return client.position.create({ data, include: positionWithRelations.include });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<PositionWithRelations | null> {
    return client.position.findFirst({
      where: { id, companyId, deletedAt: null },
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
    filters: { search?: string; departmentId?: string },
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: PositionWithRelations[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.PositionWhereInput = {
      companyId,
      deletedAt: null,
      ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      ...(filters.search ? { title: { contains: filters.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      client.position.findMany({
        where,
        include: positionWithRelations.include,
        skip,
        take,
        orderBy: { title: "asc" },
      }),
      client.position.count({ where }),
    ]);
    return { items, total };
  }

  async softDelete(id: string, client: Client = prisma): Promise<void> {
    await client.position.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const positionRepository = new PositionRepository();
