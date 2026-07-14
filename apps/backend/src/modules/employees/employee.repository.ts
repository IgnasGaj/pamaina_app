import { Employee, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { EmployeeSortBy } from "@/modules/employees/employee.dto";
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
  status?: Prisma.EmployeeWhereInput["status"];
  departmentId?: string;
  positionId?: string;
  sortBy: EmployeeSortBy;
  sortOrder: "asc" | "desc";
  /** When set, restricts results to the employee record linked to this User (self-service view). */
  restrictToUserId?: string;
}

function buildOrderBy(sortBy: EmployeeSortBy, sortOrder: "asc" | "desc"): Prisma.EmployeeOrderByWithRelationInput[] {
  switch (sortBy) {
    case "createdAt":
      return [{ createdAt: sortOrder }];
    case "name":
    default:
      return [{ lastName: sortOrder }, { firstName: sortOrder }];
  }
}

export class EmployeeRepository {
  async create(data: Prisma.EmployeeUncheckedCreateInput, client: Client = prisma): Promise<EmployeeWithRelations> {
    return client.employee.create({ data, include: employeeWithRelations.include });
  }

  /**
   * Intentionally does not exclude archived (deletedAt-set) records: the
   * details page and the restore action both need to load an archived
   * employee by id. List-view visibility is controlled by findMany's status
   * scoping instead.
   */
  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<EmployeeWithRelations | null> {
    return client.employee.findFirst({ where: { id, companyId }, include: employeeWithRelations.include });
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

  async findByCodeInCompany(employeeCode: string, companyId: string, client: Client = prisma): Promise<Employee | null> {
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
      // Default view hides archived records; an explicit status filter
      // (including ARCHIVED) always takes precedence over that default.
      ...(filter.status ? { status: filter.status } : { status: { not: "ARCHIVED" } }),
      ...(filter.restrictToUserId ? { userId: filter.restrictToUserId } : {}),
      ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
      ...(filter.positionId ? { positionId: filter.positionId } : {}),
      ...(filter.search
        ? {
            OR: [
              { firstName: { contains: filter.search, mode: "insensitive" } },
              { lastName: { contains: filter.search, mode: "insensitive" } },
              { employeeCode: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
              { phone: { contains: filter.search, mode: "insensitive" } },
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
        orderBy: buildOrderBy(filter.sortBy, filter.sortOrder),
      }),
      client.employee.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * Every currently-active employee in the company, unpaginated. Used by the
   * scheduler to determine which employees may receive shifts (e.g. when
   * copying the previous month's assignments into a new draft).
   */
  async findAllActiveForCompany(companyId: string, client: Client = prisma): Promise<EmployeeWithRelations[]> {
    return client.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      include: employeeWithRelations.include,
    });
  }

  /** Soft-deletes: sets the ARCHIVED status in lockstep with deletedAt/isActive. Never a hard delete. */
  async archive(id: string, client: Client = prisma): Promise<void> {
    await client.employee.update({
      where: { id },
      data: { status: "ARCHIVED", deletedAt: new Date(), isActive: false },
    });
  }

  async restore(id: string, client: Client = prisma): Promise<void> {
    await client.employee.update({
      where: { id },
      data: { status: "ACTIVE", deletedAt: null, isActive: true },
    });
  }
}

export const employeeRepository = new EmployeeRepository();
