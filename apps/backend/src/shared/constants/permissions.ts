/**
 * Canonical permission keys. These are seeded into the `permissions` table
 * (see prisma/seed.ts) and referenced from route definitions via the
 * `authorize()` middleware. Keeping them as a const object (not a Prisma
 * enum) means new permissions can be added without a schema migration.
 */
export const PERMISSIONS = {
  COMPANY_MANAGE: "company.manage",

  USER_CREATE: "user.create",
  USER_READ: "user.read",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  ROLE_READ: "role.read",
  ROLE_MANAGE: "role.manage",

  DEPARTMENT_CREATE: "department.create",
  DEPARTMENT_READ: "department.read",
  DEPARTMENT_UPDATE: "department.update",
  DEPARTMENT_DELETE: "department.delete",

  POSITION_CREATE: "position.create",
  POSITION_READ: "position.read",
  POSITION_UPDATE: "position.update",
  POSITION_DELETE: "position.delete",

  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_READ: "employee.read",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",

  SCHEDULE_CREATE: "schedule.create",
  SCHEDULE_READ: "schedule.read",
  SCHEDULE_UPDATE: "schedule.update",

  SHIFT_TEMPLATE_CREATE: "shift_template.create",
  SHIFT_TEMPLATE_READ: "shift_template.read",
  SHIFT_TEMPLATE_UPDATE: "shift_template.update",
  SHIFT_TEMPLATE_DELETE: "shift_template.delete",

  ABSENCE_TYPE_CREATE: "absence_type.create",
  ABSENCE_TYPE_READ: "absence_type.read",
  ABSENCE_TYPE_UPDATE: "absence_type.update",
  ABSENCE_TYPE_DELETE: "absence_type.delete",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly PermissionKey[] = Object.values(PERMISSIONS);

const PERMISSION_KEY_SET = new Set<string>(ALL_PERMISSIONS);

/** Narrows permission keys loaded from the database (plain strings) back to PermissionKey. */
export function toPermissionKeys(keys: readonly string[]): PermissionKey[] {
  return keys.filter((key): key is PermissionKey => PERMISSION_KEY_SET.has(key));
}
