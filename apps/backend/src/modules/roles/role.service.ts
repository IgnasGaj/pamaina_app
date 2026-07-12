import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { roleRepository } from "@/modules/roles/role.repository";
import { toRoleResponseDto } from "@/modules/roles/role.mapper";
import { RoleResponseDto } from "@/modules/roles/role.dto";
import { SYSTEM_ROLE_DEFINITIONS, SystemRoleKey } from "@/shared/constants/roles";
import { NotFoundError } from "@/shared/errors";

type Client = Prisma.TransactionClient | typeof prisma;

/**
 * Creates (or updates, if already present) the COMPANY_OWNER / MANAGER /
 * EMPLOYEE roles scoped to a single company, wired to the permission set
 * defined in SYSTEM_ROLE_DEFINITIONS. Called once when a company is
 * registered. Idempotent so it is safe to re-run for existing companies
 * after SYSTEM_ROLE_DEFINITIONS changes (e.g. via a maintenance script).
 */
export async function ensureSystemRolesForCompany(
  companyId: string,
  client: Client = prisma,
): Promise<Record<Exclude<SystemRoleKey, "SUPER_ADMIN">, Role>> {
  const companyScopedKeys = (Object.keys(SYSTEM_ROLE_DEFINITIONS) as SystemRoleKey[]).filter(
    (key): key is Exclude<SystemRoleKey, "SUPER_ADMIN"> => key !== "SUPER_ADMIN",
  );

  const result = {} as Record<Exclude<SystemRoleKey, "SUPER_ADMIN">, Role>;

  for (const key of companyScopedKeys) {
    const definition = SYSTEM_ROLE_DEFINITIONS[key];
    const role = await roleRepository.upsertRole(
      { companyId, key, name: definition.name, description: definition.description, isSystem: true },
      client,
    );
    const permissions = await roleRepository.findPermissionsByKeys(definition.permissions, client);
    await roleRepository.replacePermissions(
      role.id,
      permissions.map((p) => p.id),
      client,
    );
    result[key] = role;
  }

  return result;
}

/** Creates (or updates) the single global SUPER_ADMIN role, used by platform administrators. */
export async function ensureGlobalSuperAdminRole(client: Client = prisma): Promise<Role> {
  const definition = SYSTEM_ROLE_DEFINITIONS.SUPER_ADMIN;
  const role = await roleRepository.upsertRole(
    { companyId: null, key: "SUPER_ADMIN", name: definition.name, description: definition.description, isSystem: true },
    client,
  );
  const permissions = await roleRepository.findPermissionsByKeys(definition.permissions, client);
  await roleRepository.replacePermissions(
    role.id,
    permissions.map((p) => p.id),
    client,
  );
  return role;
}

export async function listRolesForCompany(companyId: string): Promise<RoleResponseDto[]> {
  const roles = await roleRepository.findManyByCompany(companyId);
  return roles.map(toRoleResponseDto);
}

export async function getRoleByIdOrThrow(id: string): Promise<RoleResponseDto> {
  const role = await roleRepository.findById(id);
  if (!role) {
    throw new NotFoundError("Role");
  }
  return toRoleResponseDto(role);
}
