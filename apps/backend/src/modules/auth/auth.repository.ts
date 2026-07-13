import { Prisma, PrismaClient, RefreshToken, User } from "@prisma/client";
import { prisma } from "@/config/prisma";

type Client = PrismaClient | Prisma.TransactionClient;

const userWithRole = Prisma.validator<Prisma.UserDefaultArgs>()({
  include: {
    role: { include: { rolePermissions: { include: { permission: true } } } },
    company: { include: { settings: true } },
  },
});

export type UserWithRole = Prisma.UserGetPayload<typeof userWithRole>;

export class AuthRepository {
  async findUserByEmail(email: string, client: Client = prisma): Promise<UserWithRole | null> {
    return client.user.findUnique({ where: { email }, include: userWithRole.include });
  }

  async findUserById(id: string, client: Client = prisma): Promise<UserWithRole | null> {
    return client.user.findUnique({ where: { id }, include: userWithRole.include });
  }

  async touchLastLogin(userId: string, client: Client = prisma): Promise<void> {
    await client.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  async updatePasswordHash(userId: string, passwordHash: string, client: Client = prisma): Promise<void> {
    await client.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async createUser(
    data: {
      companyId: string | null;
      roleId: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
    },
    client: Client = prisma,
  ): Promise<User> {
    return client.user.create({ data });
  }

  async createRefreshToken(
    data: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      createdByIp?: string | null;
      userAgent?: string | null;
    },
    client: Client = prisma,
  ): Promise<RefreshToken> {
    return client.refreshToken.create({ data });
  }

  async findRefreshTokenByHash(tokenHash: string, client: Client = prisma): Promise<RefreshToken | null> {
    return client.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeRefreshToken(id: string, replacedBy: string | null, client: Client = prisma): Promise<void> {
    await client.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedBy },
    });
  }

  async revokeAllRefreshTokensForUser(userId: string, client: Client = prisma): Promise<void> {
    await client.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const authRepository = new AuthRepository();
