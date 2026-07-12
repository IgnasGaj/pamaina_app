import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@/shared/errors";
import { verifyAccessToken } from "@/shared/utils/jwt.util";

/**
 * Verifies the access token and attaches `req.user`. Permissions are read
 * straight off the token rather than re-queried from the database on every
 * request, trading a short (access-token-lifetime) staleness window for
 * request latency — acceptable given the 15 minute default expiry.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      companyId: payload.companyId,
      roleId: payload.roleId,
      roleKey: payload.roleKey,
      permissions: payload.permissions,
    };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}
