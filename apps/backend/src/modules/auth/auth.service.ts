import { prisma } from "@/config/prisma";
import { authRepository, UserWithRole } from "@/modules/auth/auth.repository";
import { toAuthUserResponseDto } from "@/modules/auth/auth.mapper";
import {
  AuthTokensDto,
  AuthUserResponseDto,
  ChangePasswordDto,
  LoginDto,
  RegisterCompanyDto,
} from "@/modules/auth/auth.dto";
import { createCompany } from "@/modules/companies/company.service";
import { ensureSystemRolesForCompany } from "@/modules/roles/role.service";
import { hashPassword, verifyPassword } from "@/shared/utils/password.util";
import {
  getTokenExpiry,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/shared/utils/jwt.util";
import { ConflictError, ForbiddenError, UnauthorizedError } from "@/shared/errors";
import { asSystemRoleKey } from "@/shared/constants/roles";
import { toPermissionKeys } from "@/shared/constants/permissions";

export interface AuthResult {
  user: AuthUserResponseDto;
  tokens: AuthTokensDto;
  refreshToken: string;
}

interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

function buildAccessTokenPayload(user: UserWithRole) {
  return {
    sub: user.id,
    companyId: user.companyId,
    roleId: user.roleId,
    roleKey: asSystemRoleKey(user.role.key),
    permissions: toPermissionKeys(user.role.rolePermissions.map((rp) => rp.permission.key)),
  };
}

async function issueTokens(user: UserWithRole, ctx: RequestContext): Promise<{ tokens: AuthTokensDto; refreshToken: string }> {
  const accessToken = signAccessToken(buildAccessTokenPayload(user));
  const { token: refreshToken } = signRefreshToken(user.id);

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpiry(refreshToken),
    createdByIp: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  });

  return {
    tokens: { accessToken, accessTokenExpiresAt: getTokenExpiry(accessToken).toISOString() },
    refreshToken,
  };
}

/** Self-service SaaS signup: creates a Company, its system roles, and the Company Owner user. */
export async function registerCompany(dto: RegisterCompanyDto, ctx: RequestContext): Promise<AuthResult> {
  const existingUser = await authRepository.findUserByEmail(dto.owner.email);
  if (existingUser) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await hashPassword(dto.owner.password);

  const user = await prisma.$transaction(async (tx) => {
    const company = await createCompany(dto.company, tx);
    const roles = await ensureSystemRolesForCompany(company.id, tx);
    const createdUser = await authRepository.createUser(
      {
        companyId: company.id,
        roleId: roles.COMPANY_OWNER.id,
        email: dto.owner.email,
        passwordHash,
        firstName: dto.owner.firstName,
        lastName: dto.owner.lastName,
      },
      tx,
    );
    const fullUser = await authRepository.findUserById(createdUser.id, tx);
    if (!fullUser) {
      throw new Error("Failed to load user immediately after creation");
    }
    return fullUser;
  });

  const { tokens, refreshToken } = await issueTokens(user, ctx);
  return { user: toAuthUserResponseDto(user), tokens, refreshToken };
}

export async function login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
  const user = await authRepository.findUserByEmail(dto.email);
  if (!user || user.deletedAt || !user.isActive) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const validPassword = await verifyPassword(dto.password, user.passwordHash);
  if (!validPassword) {
    throw new UnauthorizedError("Invalid email or password");
  }

  await authRepository.touchLastLogin(user.id);
  const { tokens, refreshToken } = await issueTokens(user, ctx);
  return { user: toAuthUserResponseDto(user), tokens, refreshToken };
}

export async function refreshSession(rawRefreshToken: string, ctx: RequestContext): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await authRepository.findRefreshTokenByHash(tokenHash);

  if (!stored || stored.userId !== payload.sub) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  if (stored.revokedAt || stored.expiresAt < new Date()) {
    // Reuse of a revoked/expired refresh token indicates possible token theft.
    await authRepository.revokeAllRefreshTokensForUser(stored.userId);
    throw new UnauthorizedError("Refresh token has already been used; all sessions have been revoked");
  }

  const user = await authRepository.findUserById(stored.userId);
  if (!user || user.deletedAt || !user.isActive) {
    throw new UnauthorizedError("Account is no longer active");
  }

  const { tokens, refreshToken } = await issueTokens(user, ctx);
  await authRepository.revokeRefreshToken(stored.id, hashToken(refreshToken));

  return { user: toAuthUserResponseDto(user), tokens, refreshToken };
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  const stored = await authRepository.findRefreshTokenByHash(tokenHash);
  if (stored && !stored.revokedAt) {
    await authRepository.revokeRefreshToken(stored.id, null);
  }
}

export async function getCurrentUser(userId: string): Promise<AuthUserResponseDto> {
  const user = await authRepository.findUserById(userId);
  if (!user || user.deletedAt || !user.isActive) {
    throw new ForbiddenError("Account is no longer active");
  }
  return toAuthUserResponseDto(user);
}

export async function changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
  const user = await authRepository.findUserById(userId);
  if (!user || user.deletedAt || !user.isActive) {
    throw new ForbiddenError("Account is no longer active");
  }

  const validCurrentPassword = await verifyPassword(dto.currentPassword, user.passwordHash);
  if (!validCurrentPassword) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  const newPasswordHash = await hashPassword(dto.newPassword);
  await authRepository.updatePasswordHash(userId, newPasswordHash);
  // Rotating the password invalidates every existing session for safety.
  await authRepository.revokeAllRefreshTokensForUser(userId);
}
