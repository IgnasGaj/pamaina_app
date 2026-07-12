import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8).max(128),
  roleId: z.string().uuid(),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
  roleId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  roleId: z.string().uuid().optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  roleId: z.string().uuid(),
  roleName: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});
export type UserResponseDto = z.infer<typeof userResponseSchema>;
