import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "@/config/env";
import { AccessTokenPayload } from "@/shared/types/auth.types";

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
  return { token, jti };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Reads the `exp` claim off an already-signed token without re-verifying it. */
export function getTokenExpiry(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new Error("Token does not contain an exp claim");
  }
  return new Date(decoded.exp * 1000);
}
