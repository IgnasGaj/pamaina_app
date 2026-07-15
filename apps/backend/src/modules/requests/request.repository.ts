import { Prisma, PrismaClient, RequestStatus } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const requestWithRelations = Prisma.validator<Prisma.EmployeeRequestDefaultArgs>()({
  include: {
    employee: { select: { firstName: true, lastName: true, userId: true } },
    absenceType: { select: { name: true, color: true } },
    reviewer: { select: { firstName: true, lastName: true } },
  },
});
export type RequestWithRelations = Prisma.EmployeeRequestGetPayload<typeof requestWithRelations>;

export interface ListRequestsFilter {
  companyId: string;
  status?: RequestStatus;
  employeeId?: string;
}

export class RequestRepository {
  async create(data: Prisma.EmployeeRequestUncheckedCreateInput, client: Client = prisma): Promise<RequestWithRelations> {
    return client.employeeRequest.create({ data, include: requestWithRelations.include });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<RequestWithRelations | null> {
    return client.employeeRequest.findFirst({ where: { id, companyId }, include: requestWithRelations.include });
  }

  async update(id: string, data: Prisma.EmployeeRequestUpdateInput, client: Client = prisma): Promise<RequestWithRelations> {
    return client.employeeRequest.update({ where: { id }, data, include: requestWithRelations.include });
  }

  async findMany(
    filter: ListRequestsFilter,
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: RequestWithRelations[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.EmployeeRequestWhereInput = {
      companyId: filter.companyId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
    };

    const [items, total] = await Promise.all([
      client.employeeRequest.findMany({
        where,
        include: requestWithRelations.include,
        skip,
        take,
        orderBy: [{ createdAt: "desc" }],
      }),
      client.employeeRequest.count({ where }),
    ]);
    return { items, total };
  }
}

export const requestRepository = new RequestRepository();
