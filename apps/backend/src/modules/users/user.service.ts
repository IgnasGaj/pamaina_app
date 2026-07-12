import { userRepository } from "@/modules/users/user.repository";
import { toUserResponseDto } from "@/modules/users/user.mapper";
import { CreateUserDto, ListUsersQuery, UpdateUserDto, UserResponseDto } from "@/modules/users/user.dto";
import { roleRepository } from "@/modules/roles/role.repository";
import { hashPassword } from "@/shared/utils/password.util";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

async function assertRoleBelongsToCompany(roleId: string, companyId: string): Promise<void> {
  const role = await roleRepository.findById(roleId);
  if (!role || role.companyId !== companyId) {
    throw new BadRequestError("The selected role does not belong to this company");
  }
}

export async function createUser(companyId: string, dto: CreateUserDto): Promise<UserResponseDto> {
  const existing = await userRepository.findByEmail(dto.email);
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  await assertRoleBelongsToCompany(dto.roleId, companyId);

  const passwordHash = await hashPassword(dto.password);
  const user = await userRepository.create({
    companyId,
    roleId: dto.roleId,
    email: dto.email,
    passwordHash,
    firstName: dto.firstName,
    lastName: dto.lastName,
    phone: dto.phone,
  });

  return toUserResponseDto(user);
}

export async function getUserByIdOrThrow(companyId: string, id: string): Promise<UserResponseDto> {
  const user = await userRepository.findByIdInCompany(id, companyId);
  if (!user) {
    throw new NotFoundError("User");
  }
  return toUserResponseDto(user);
}

export async function updateUser(companyId: string, id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
  const existing = await userRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("User");
  }

  if (dto.roleId) {
    await assertRoleBelongsToCompany(dto.roleId, companyId);
  }

  const updated = await userRepository.update(id, {
    firstName: dto.firstName,
    lastName: dto.lastName,
    phone: dto.phone,
    isActive: dto.isActive,
    ...(dto.roleId ? { role: { connect: { id: dto.roleId } } } : {}),
  });

  return toUserResponseDto(updated);
}

export async function listUsers(
  companyId: string,
  query: ListUsersQuery,
): Promise<PaginatedResult<UserResponseDto>> {
  const { items, total } = await userRepository.findMany(
    { companyId, search: query.search, roleId: query.roleId },
    query,
  );
  return buildPaginatedResult(items.map(toUserResponseDto), query, total);
}

export async function deleteUser(companyId: string, id: string, requestingUserId: string): Promise<void> {
  if (id === requestingUserId) {
    throw new BadRequestError("You cannot delete your own account");
  }
  const existing = await userRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("User");
  }
  await userRepository.softDelete(id);
}
