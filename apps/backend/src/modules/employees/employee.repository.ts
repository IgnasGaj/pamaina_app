import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const employeeWithRelations = Prisma.validator<Prisma.EmployeeDefaultArgs>()({
  include: {
    department: { select: { name: true } },
    position: { select: { title: true } },
  },
});
export type EmployeeWithRelations = Prisma.EmployeeGetPayload<typeof employeeWithRelations>;

export interface ListEmployeesFilter {
  companyId: string;
  search?: string;
  departmentId?: string;
  positionId?: string;
  employmentStatus?: Prisma.EmployeeWhereInput["employmentStatus"];
  /** When set, restricts results to the employee record linked to this User (self-service view). */
  restrictToUserId?: string;
}

export class EmployeeRepository {
  async create(data: Prisma.EmployeeUncheckedCreateInput, client: Client = prisma): Promise<EmployeeWithRelations> {
    return client.employee.create({ data, include: employeeWithRelations.include });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<EmployeeWithRelations | null> {
    return client.employee.findFirst({
      where: { id, companyId, deletedAt: null },
      include: employeeWithRelations.include,
    });
  }

  async findByUserId(userId: string, companyId: string, client: Client = prisma): Promise<EmployeeWithRelations | null> {
    return client.employee.findFirst({
      where: { userId, companyId, deletedAt: null },
      include: employeeWithRelations.include,
    });
  }

  async countInCompany(companyId: string, client: Client = prisma): Promise<number> {
    return client.employee.count({ where: { companyId } });
  }

  async findByCodeInCompany(employeeCode: string, companyId: string, client: Client = prisma) {
    return client.employee.findFirst({ where: { employeeCode, companyId } });
  }

  async update(id: string, data: Prisma.EmployeeUpdateInput, client: Client = prisma): Promise<EmployeeWithRelations> {
    return client.employee.update({ where: { id }, data, include: employeeWithRelations.include });
  }

  async findMany(
    filter: ListEmployeesFilter,
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: EmployeeWithRelations[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.EmployeeWhereInput = {
      companyId: filter.companyId,
      deletedAt: null,
      ...(filter.restrictToUserId ? { userId: filter.restrictToUserId } : {}),
      ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
      ...(filter.positionId ? { positionId: filter.positionId } : {}),
      ...(filter.employmentStatus ? { employmentStatus: filter.employmentStatus } : {}),
      ...(filter.search
        ? {
            OR: [
              { firstName: { contains: filter.search, mode: "insensitive" } },
              { lastName: { contains: filter.search, mode: "insensitive" } },
              { employeeCode: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      client.employee.findMany({
        where,
        include: employeeWithRelations.include,
        skip,
        take,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      client.employee.count({ where }),
    ]);
    return { items, total };
  }

  async softDelete(id: string, client: Client = prisma): Promise<void> {
    await client.employee.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const employeeRepository = new EmployeeRepository();
