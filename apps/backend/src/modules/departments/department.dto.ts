import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});
export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;

export const departmentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listDepartmentsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
});
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;

export const departmentResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  employeeCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type DepartmentResponseDto = z.infer<typeof departmentResponseSchema>;
