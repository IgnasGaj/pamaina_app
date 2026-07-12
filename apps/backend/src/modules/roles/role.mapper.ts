import { RoleResponseDto } from "@/modules/roles/role.dto";
import { RoleWithPermissions } from "@/modules/roles/role.repository";

export function toRoleResponseDto(role: RoleWithPermissions): RoleResponseDto {
  return {
    id: role.id,
    companyId: role.companyId,
    name: role.name,
    key: role.key,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.rolePermissions.map((rp) => rp.permission.key),
  };
}
