import { AbsenceType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

export class AbsenceTypeRepository {
  async create(
    data: { companyId: string; code: string; name: string; color: string; isDefault: boolean },
    client: Client = prisma,
  ): Promise<AbsenceType> {
    return client.absenceType.create({ data });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<AbsenceType | null> {
    return client.absenceType.findFirst({ where: { id, companyId } });
  }

  async findByCodeInCompany(code: string, companyId: string, client: Client = prisma): Promise<AbsenceType | null> {
    return client.absenceType.findFirst({ where: { code, companyId } });
  }

  async update(id: string, data: Prisma.AbsenceTypeUpdateInput, client: Client = prisma): Promise<AbsenceType> {
    return client.absenceType.update({ where: { id }, data });
  }

  /** Every absence type in the company — including legacy, non-default ones so historical assignments/requests still resolve. */
  async findMany(
    companyId: string,
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: AbsenceType[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.AbsenceTypeWhereInput = { companyId };

    const [items, total] = await Promise.all([
      client.absenceType.findMany({ where, skip, take, orderBy: [{ createdAt: "asc" }] }),
      client.absenceType.count({ where }),
    ]);
    return { items, total };
  }
}

export const absenceTypeRepository = new AbsenceTypeRepository();
