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
import { companySettingsRepository } from "@/modules/companies/company-settings.repository";
import { ensureSystemRolesForCompany } from "@/modules/roles/role.service";
import { departmentRepository } from "@/modules/departments/department.repository";
import { positionRepository } from "@/modules/positions/position.repository";
import { ensureDefaultAbsenceTypesForCompany } from "@/modules/absence-types/absence-type.service";
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
  rememberMe: boolean;
}

// Bcrypt hash of an unguessable, never-issued password. Compared against on
// every login attempt for an email that doesn't exist so the response takes
// roughly the same time either way, avoiding a user-enumeration side channel.
const DUMMY_PASSWORD_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8wj8AB4iH8T.b6IuZzWuU2iu9tUFsu";

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

async function issueTokens(
  user: UserWithRole,
  ctx: RequestContext,
  rememberMe: boolean,
): Promise<{ tokens: AuthTokensDto; refreshToken: string }> {
  const accessToken = signAccessToken(buildAccessTokenPayload(user));
  const { token: refreshToken } = signRefreshToken(user.id);

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpiry(refreshToken),
    rememberMe,
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

    // Default org structure + settings row so a brand new company has a
    // working baseline (an employee can be added immediately) and a stable
    // 1:1 CompanySettings record for the onboarding wizard to update.
    const generalDepartment = await departmentRepository.create(
      { companyId: company.id, name: "General", color: "#2563EB" },
      tx,
    );
    await positionRepository.create(
      { companyId: company.id, title: "Employee", color: "#2563EB", departmentId: generalDepartment.id },
      tx,
    );
    await companySettingsRepository.create({ companyId: company.id }, tx);
    await ensureDefaultAbsenceTypesForCompany(company.id, tx);

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

  // A brand new company owner should stay signed in past a browser restart
  // without having to think about "remember me" on their very first visit.
  const rememberMe = true;
  const { tokens, refreshToken } = await issueTokens(user, ctx, rememberMe);
  return { user: toAuthUserResponseDto(user), tokens, refreshToken, rememberMe };
}

export async function login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
  const user = await authRepository.findUserByEmail(dto.email);

  // Always run a bcrypt comparison, even for an email that doesn't exist,
  // so response timing doesn't reveal whether an account is registered.
  const validPassword = await verifyPassword(dto.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || user.deletedAt || !user.isActive || !validPassword) {
    throw new UnauthorizedError("Invalid email or password");
  }

  await authRepository.touchLastLogin(user.id);
  const { tokens, refreshToken } = await issueTokens(user, ctx, dto.rememberMe);
  return { user: toAuthUserResponseDto(user), tokens, refreshToken, rememberMe: dto.rememberMe };
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

  // Carry the original "remember me" choice forward across rotations so the
  // cookie set here stays session-only (or persistent) exactly as it was at
  // the initial login, without needing the client to resend the preference.
  const { tokens, refreshToken } = await issueTokens(user, ctx, stored.rememberMe);
  await authRepository.revokeRefreshToken(stored.id, hashToken(refreshToken));

  return { user: toAuthUserResponseDto(user), tokens, refreshToken, rememberMe: stored.rememberMe };
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
