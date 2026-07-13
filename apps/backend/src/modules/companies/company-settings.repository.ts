import { CompanySettings, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

export class CompanySettingsRepository {
  async create(data: { companyId: string }, client: Client = prisma): Promise<CompanySettings> {
    return client.companySettings.create({ data: { companyId: data.companyId } });
  }

  async findByCompanyId(companyId: string, client: Client = prisma): Promise<CompanySettings | null> {
    return client.companySettings.findUnique({ where: { companyId } });
  }

  async update(
    companyId: string,
    data: Prisma.CompanySettingsUpdateInput,
    client: Client = prisma,
  ): Promise<CompanySettings> {
    return client.companySettings.update({ where: { companyId }, data });
  }
}

export const companySettingsRepository = new CompanySettingsRepository();
