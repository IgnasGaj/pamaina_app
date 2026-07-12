import { Prisma, PrismaClient, Role } from "@prisma/client";
import { prisma } from "@/config/prisma";

const roleWithPermissions = Prisma.validator<Prisma.RoleDefaultArgs>()({
  include: { rolePermissions: { include: { permission: true } } },
});

export type RoleWithPermissions = Prisma.RoleGetPayload<typeof roleWithPermissions>;

type Client = PrismaClient | Prisma.TransactionClient;

export class RoleRepository {
  async findByCompanyAndKey(
    companyId: string | null,
    key: string,
    client: Client = prisma,
  ): Promise<Role | null> {
    return client.role.findFirst({ where: { companyId, key } });
  }

  async findManyByCompany(companyId: string, client: Client = prisma): Promise<RoleWithPermissions[]> {
    return client.role.findMany({
      where: { companyId },
      include: roleWithPermissions.include,
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: string, client: Client = prisma): Promise<RoleWithPermissions | null> {
    return client.role.findUnique({ where: { id }, include: roleWithPermissions.include });
  }

  async findPermissionsByKeys(keys: readonly string[], client: Client = prisma) {
    return client.permission.findMany({ where: { key: { in: [...keys] } } });
  }

  async upsertRole(
    input: {
      companyId: string | null;
      key: string;
      name: string;
      description: string | null;
      isSystem: boolean;
    },
    client: Client = prisma,
  ): Promise<Role> {
    const existing = await this.findByCompanyAndKey(input.companyId, input.key, client);
    if (existing) {
      return client.role.update({
        where: { id: existing.id },
        data: { name: input.name, description: input.description, isSystem: input.isSystem },
      });
    }
    return client.role.create({
      data: {
        companyId: input.companyId,
        key: input.key,
        name: input.name,
        description: input.description,
        isSystem: input.isSystem,
      },
    });
  }

  async replacePermissions(roleId: string, permissionIds: string[], client: Client = prisma): Promise<void> {
    await client.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length === 0) {
      return;
    }
    await client.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }
}

export const roleRepository = new RoleRepository();
