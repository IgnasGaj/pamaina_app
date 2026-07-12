import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "@/shared/errors";
import { PermissionKey } from "@/shared/constants/permissions";

/**
 * Requires the authenticated user to hold ALL of the given permissions.
 * Must run after `authenticate()`. SUPER_ADMIN always carries every
 * permission because the seed grants it the full permission set.
 */
export function authorize(...required: PermissionKey[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const missing = required.filter((permission) => !req.user!.permissions.includes(permission));
    if (missing.length > 0) {
      throw new ForbiddenError(`Missing required permission(s): ${missing.join(", ")}`);
    }

    next();
  };
}

/** Restricts access to users belonging to a company (excludes platform Super Admins with companyId=null). */
export function requireCompanyScope(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  if (!req.user.companyId) {
    throw new ForbiddenError("This action requires a company-scoped account");
  }
  next();
}
