import { UserWithRole } from "@/modules/auth/auth.repository";
import { AuthUserResponseDto } from "@/modules/auth/auth.dto";
import { asSystemRoleKey } from "@/shared/constants/roles";

export function toAuthUserResponseDto(user: UserWithRole): AuthUserResponseDto {
  return {
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roleId: user.roleId,
    roleKey: asSystemRoleKey(user.role.key),
    roleName: user.role.name,
    permissions: user.role.rolePermissions.map((rp) => rp.permission.key),
    onboardingCompletedAt: user.company?.settings?.onboardingCompletedAt?.toISOString() ?? null,
    mustChangePassword: user.mustChangePassword,
  };
}
