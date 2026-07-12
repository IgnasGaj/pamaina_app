import { PermissionKey } from "@/shared/constants/permissions";
import { SystemRoleKey } from "@/shared/constants/roles";

/**
 * The shape of the decoded JWT access token payload, and of `req.user`
 * once `authenticate()` has run.
 */
export interface AuthenticatedUser {
  id: string;
  companyId: string | null;
  roleId: string;
  /** Null for company-defined custom roles that aren't one of the four system roles. */
  roleKey: SystemRoleKey | null;
  permissions: PermissionKey[];
}

export interface AccessTokenPayload {
  sub: string;
  companyId: string | null;
  roleId: string;
  roleKey: SystemRoleKey | null;
  permissions: PermissionKey[];
}
