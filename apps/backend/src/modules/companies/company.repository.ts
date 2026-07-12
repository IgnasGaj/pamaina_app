import { Company, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

export class CompanyRepository {
  async create(data: Prisma.CompanyCreateInput, client: Client = prisma): Promise<Company> {
    return client.company.create({ data });
  }

  async findById(id: string, client: Client = prisma): Promise<Company | null> {
    return client.company.findUnique({ where: { id } });
  }

  async findBySlug(slug: string, client: Client = prisma): Promise<Company | null> {
    return client.company.findUnique({ where: { slug } });
  }

  async update(id: string, data: Prisma.CompanyUpdateInput, client: Client = prisma): Promise<Company> {
    return client.company.update({ where: { id }, data });
  }

  async findMany(pagination: PaginationQuery, client: Client = prisma): Promise<{ items: Company[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const [items, total] = await Promise.all([
      client.company.findMany({ where: { deletedAt: null }, skip, take, orderBy: { createdAt: "desc" } }),
      client.company.count({ where: { deletedAt: null } }),
    ]);
    return { items, total };
  }

  async softDelete(id: string, client: Client = prisma): Promise<void> {
    await client.company.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const companyRepository = new CompanyRepository();
