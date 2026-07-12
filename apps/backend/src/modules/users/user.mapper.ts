import { UserWithRoleName } from "@/modules/users/user.repository";
import { UserResponseDto } from "@/modules/users/user.dto";

export function toUserResponseDto(user: UserWithRoleName): UserResponseDto {
  return {
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    roleId: user.roleId,
    roleName: user.role.name,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
