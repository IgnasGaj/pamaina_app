import { SystemRoleKey } from "@prisma/client";
import { PERMISSIONS, PermissionKey } from "@/shared/constants/permissions";

/**
 * Default permission grants for each seeded system role. Applied by
 * prisma/seed.ts and re-applied idempotently on every deploy so role
 * capabilities can evolve by editing this file and re-running the seed,
 * without hand-editing data in production.
 */
export const SYSTEM_ROLE_DEFINITIONS: Record<
  SystemRoleKey,
  { name: string; description: string; permissions: readonly PermissionKey[] }
> = {
  SUPER_ADMIN: {
    name: "Super Admin",
    description: "Platform administrator with access across all companies.",
    permissions: Object.values(PERMISSIONS),
  },
  COMPANY_OWNER: {
    name: "Company Owner",
    description: "Full control over a single company's workspace.",
    permissions: [
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.ROLE_READ,
      PERMISSIONS.DEPARTMENT_CREATE,
      PERMISSIONS.DEPARTMENT_READ,
      PERMISSIONS.DEPARTMENT_UPDATE,
      PERMISSIONS.DEPARTMENT_DELETE,
      PERMISSIONS.POSITION_CREATE,
      PERMISSIONS.POSITION_READ,
      PERMISSIONS.POSITION_UPDATE,
      PERMISSIONS.POSITION_DELETE,
      PERMISSIONS.EMPLOYEE_CREATE,
      PERMISSIONS.EMPLOYEE_READ,
      PERMISSIONS.EMPLOYEE_UPDATE,
      PERMISSIONS.EMPLOYEE_DELETE,
      PERMISSIONS.CONTRACT_CREATE,
      PERMISSIONS.CONTRACT_READ,
      PERMISSIONS.CONTRACT_UPDATE,
    ],
  },
  MANAGER: {
    name: "Manager",
    description: "Manages employees, departments and positions day to day.",
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.ROLE_READ,
      PERMISSIONS.DEPARTMENT_READ,
      PERMISSIONS.POSITION_READ,
      PERMISSIONS.EMPLOYEE_CREATE,
      PERMISSIONS.EMPLOYEE_READ,
      PERMISSIONS.EMPLOYEE_UPDATE,
      PERMISSIONS.CONTRACT_CREATE,
      PERMISSIONS.CONTRACT_READ,
      PERMISSIONS.CONTRACT_UPDATE,
    ],
  },
  EMPLOYEE: {
    name: "Employee",
    description: "Standard employee with read-only access to their own data.",
    permissions: [
      PERMISSIONS.EMPLOYEE_READ,
      PERMISSIONS.DEPARTMENT_READ,
      PERMISSIONS.POSITION_READ,
      PERMISSIONS.CONTRACT_READ,
    ],
  },
};

export { SystemRoleKey };

const SYSTEM_ROLE_KEYS = new Set<string>(Object.keys(SYSTEM_ROLE_DEFINITIONS));

/** Narrows a free-form role.key string to SystemRoleKey if it matches a seeded system role. */
export function asSystemRoleKey(key: string): SystemRoleKey | null {
  return SYSTEM_ROLE_KEYS.has(key) ? (key as SystemRoleKey) : null;
}
