import { Prisma, PrismaClient, User } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

const userWithRole = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: { role: true },
});
export type UserWithRoleName = Prisma.UserGetPayload<typeof userWithRole>;

export interface ListUsersFilter {
  companyId: string;
  search?: string;
  roleId?: string;
}

export class UserRepository {
  async findByIdInCompany(id: string, companyId: string, client: Client = prisma): Promise<UserWithRoleName | null> {
    return client.user.findFirst({ where: { id, companyId, deletedAt: null }, include: userWithRole.include });
  }

  async findByEmail(email: string, client: Client = prisma): Promise<User | null> {
    return client.user.findUnique({ where: { email } });
  }

  async create(
    data: {
      companyId: string;
      roleId: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      phone?: string;
      mustChangePassword?: boolean;
    },
    client: Client = prisma,
  ): Promise<UserWithRoleName> {
    return client.user.create({ data, include: userWithRole.include });
  }

  async update(id: string, data: Prisma.UserUpdateInput, client: Client = prisma): Promise<UserWithRoleName> {
    return client.user.update({ where: { id }, data, include: userWithRole.include });
  }

  async findMany(
    filter: ListUsersFilter,
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: UserWithRoleName[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.UserWhereInput = {
      companyId: filter.companyId,
      deletedAt: null,
      ...(filter.roleId ? { roleId: filter.roleId } : {}),
      ...(filter.search
        ? {
            OR: [
              { firstName: { contains: filter.search, mode: "insensitive" } },
              { lastName: { contains: filter.search, mode: "insensitive" } },
              { email: { contains: filter.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      client.user.findMany({ where, include: userWithRole.include, skip, take, orderBy: { createdAt: "desc" } }),
      client.user.count({ where }),
    ]);
    return { items, total };
  }

  async softDelete(id: string, client: Client = prisma): Promise<void> {
    await client.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  /** Active manager/owner accounts in a company — used to fan out "new request submitted" notifications. */
  async findManagersForCompany(companyId: string, client: Client = prisma): Promise<User[]> {
    return client.user.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
        role: { key: { in: ["MANAGER", "COMPANY_OWNER"] } },
      },
    });
  }
}

export const userRepository = new UserRepository();
