import { Department, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const departmentWithCount = Prisma.validator<Prisma.DepartmentDefaultArgs>()({
  include: { _count: { select: { employees: true } } },
});
export type DepartmentWithCount = Prisma.DepartmentGetPayload<typeof departmentWithCount>;

export class DepartmentRepository {
  async create(
    data: { companyId: string; name: string; description?: string },
    client: Client = prisma,
  ): Promise<DepartmentWithCount> {
    return client.department.create({ data, include: departmentWithCount.include });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<DepartmentWithCount | null> {
    return client.department.findFirst({
      where: { id, companyId, deletedAt: null },
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
    search: string | undefined,
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: DepartmentWithCount[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.DepartmentWhereInput = {
      companyId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      client.department.findMany({
        where,
        include: departmentWithCount.include,
        skip,
        take,
        orderBy: { name: "asc" },
      }),
      client.department.count({ where }),
    ]);
    return { items, total };
  }

  async softDelete(id: string, client: Client = prisma): Promise<void> {
    await client.department.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const departmentRepository = new DepartmentRepository();
