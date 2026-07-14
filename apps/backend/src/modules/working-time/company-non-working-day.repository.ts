import { CompanyNonWorkingDay, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

export class CompanyNonWorkingDayRepository {
  async create(
    data: { companyId: string; date: Date; name: string },
    client: Client = prisma,
  ): Promise<CompanyNonWorkingDay> {
    return client.companyNonWorkingDay.create({ data });
  }

  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<CompanyNonWorkingDay | null> {
    return client.companyNonWorkingDay.findFirst({ where: { id, companyId } });
  }

  async findByDateInCompany(date: Date, companyId: string, client: Client = prisma): Promise<CompanyNonWorkingDay | null> {
    return client.companyNonWorkingDay.findFirst({ where: { date, companyId } });
  }

  /** All custom non-working days for a company, unpaginated — the admin settings list is expected to stay small. */
  async findAllForCompany(companyId: string, client: Client = prisma): Promise<CompanyNonWorkingDay[]> {
    return client.companyNonWorkingDay.findMany({ where: { companyId }, orderBy: { date: "asc" } });
  }

  async delete(id: string, client: Client = prisma): Promise<void> {
    await client.companyNonWorkingDay.delete({ where: { id } });
  }
}

export const companyNonWorkingDayRepository = new CompanyNonWorkingDayRepository();
