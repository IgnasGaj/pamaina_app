import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color, e.g. #2563EB");

export const departmentSortBySchema = z.enum(["name", "createdAt", "employeeCount"]);
export type DepartmentSortBy = z.infer<typeof departmentSortBySchema>;

export const departmentStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export type DepartmentStatusFilter = z.infer<typeof departmentStatusSchema>;

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  color: hexColorSchema.default("#2563EB"),
});
export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  color: hexColorSchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;

export const departmentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listDepartmentsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: departmentStatusSchema.optional(),
  sortBy: departmentSortBySchema.default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;

export const departmentResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  employeeCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type DepartmentResponseDto = z.infer<typeof departmentResponseSchema>;
