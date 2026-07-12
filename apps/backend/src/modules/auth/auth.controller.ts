import { Request, Response } from "express";
import * as authService from "@/modules/auth/auth.service";
import { ChangePasswordDto, LoginDto, RegisterCompanyDto } from "@/modules/auth/auth.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";
import { UnauthorizedError } from "@/shared/errors";
import { isProduction } from "@/config/env";
import { getTokenExpiry } from "@/shared/utils/jwt.util";

const REFRESH_COOKIE_NAME = "pamaina_refresh_token";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    expires: getTokenExpiry(refreshToken),
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

function getRefreshTokenFromRequest(req: Request): string {
  const token = (req.cookies as Record<string, string | undefined>)?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedError("No refresh token provided");
  }
  return token;
}

export async function registerCompany(req: Request, res: Response): Promise<void> {
  const result = await authService.registerCompany(req.body as RegisterCompanyDto, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, { user: result.user, tokens: result.tokens }, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginDto, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, { user: result.user, tokens: result.tokens });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefreshToken = getRefreshTokenFromRequest(req);
  const result = await authService.refreshSession(rawRefreshToken, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  setRefreshCookie(res, result.refreshToken);
  sendSuccess(res, { user: result.user, tokens: result.tokens });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = (req.cookies as Record<string, string | undefined>)?.[REFRESH_COOKIE_NAME];
  if (token) {
    await authService.logout(token);
  }
  clearRefreshCookie(res);
  sendSuccess(res, { success: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, user);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await authService.changePassword(req.user!.id, req.body as ChangePasswordDto);
  clearRefreshCookie(res);
  sendSuccess(res, { success: true });
}
