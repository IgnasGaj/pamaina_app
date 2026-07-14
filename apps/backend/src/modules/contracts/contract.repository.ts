import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const contractWithRelations = Prisma.validator<Prisma.EmploymentContractDefaultArgs>()({
  include: {
    employee: { select: { firstName: true, lastName: true } },
    department: { select: { name: true } },
    position: { select: { title: true } },
  },
});
export type ContractWithRelations = Prisma.EmploymentContractGetPayload<typeof contractWithRelations>;

export interface ListContractsFilter {
  companyId: string;
  employeeId?: string;
  departmentId?: string;
  positionId?: string;
  status?: Prisma.EmploymentContractWhereInput["status"];
}

export class ContractRepository {
  async create(
    data: Prisma.EmploymentContractUncheckedCreateInput,
    client: Client = prisma,
  ): Promise<ContractWithRelations> {
    return client.employmentContract.create({ data, include: contractWithRelations.include });
  }

  async findByIdInCompany(
    id: string,
    companyId: string,
    client: Client = prisma,
  ): Promise<ContractWithRelations | null> {
    return client.employmentContract.findFirst({
      where: { id, companyId },
      include: contractWithRelations.include,
    });
  }

  async findByNumberInCompany(
    contractNumber: string,
    companyId: string,
    client: Client = prisma,
  ): Promise<ContractWithRelations | null> {
    return client.employmentContract.findFirst({ where: { contractNumber, companyId }, include: contractWithRelations.include });
  }

  /** Finds the employee's current ACTIVE contract, if any. Used to enforce "only one active contract". */
  async findActiveForEmployee(
    employeeId: string,
    companyId: string,
    client: Client = prisma,
  ): Promise<ContractWithRelations | null> {
    return client.employmentContract.findFirst({
      where: { employeeId, companyId, status: "ACTIVE" },
      include: contractWithRelations.include,
    });
  }

  async countForCompany(companyId: string, client: Client = prisma): Promise<number> {
    return client.employmentContract.count({ where: { companyId } });
  }

  async update(
    id: string,
    data: Prisma.EmploymentContractUpdateInput,
    client: Client = prisma,
  ): Promise<ContractWithRelations> {
    return client.employmentContract.update({ where: { id }, data, include: contractWithRelations.include });
  }

  async findMany(
    filter: ListContractsFilter,
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: ContractWithRelations[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.EmploymentContractWhereInput = {
      companyId: filter.companyId,
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
      ...(filter.departmentId ? { departmentId: filter.departmentId } : {}),
      ...(filter.positionId ? { positionId: filter.positionId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };

    const [items, total] = await Promise.all([
      client.employmentContract.findMany({
        where,
        include: contractWithRelations.include,
        skip,
        take,
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      }),
      client.employmentContract.count({ where }),
    ]);
    return { items, total };
  }

  /** All contracts for one employee, newest first — used for the Contract History timeline. */
  async findAllForEmployee(
    employeeId: string,
    companyId: string,
    client: Client = prisma,
  ): Promise<ContractWithRelations[]> {
    return client.employmentContract.findMany({
      where: { employeeId, companyId },
      include: contractWithRelations.include,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });
  }
}

export const contractRepository = new ContractRepository();
