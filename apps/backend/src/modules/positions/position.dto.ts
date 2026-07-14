import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color, e.g. #2563EB");

export const positionSortBySchema = z.enum(["name", "createdAt", "employeeCount"]);
export type PositionSortBy = z.infer<typeof positionSortBySchema>;

export const positionStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export type PositionStatusFilter = z.infer<typeof positionStatusSchema>;

export const createPositionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  color: hexColorSchema.default("#2563EB"),
  departmentId: z.string().uuid().optional(),
});
export type CreatePositionDto = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  color: hexColorSchema.optional(),
  departmentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePositionDto = z.infer<typeof updatePositionSchema>;

export const positionIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listPositionsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  departmentId: z.string().uuid().optional(),
  status: positionStatusSchema.optional(),
  sortBy: positionSortBySchema.default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type ListPositionsQuery = z.infer<typeof listPositionsQuerySchema>;

export const positionResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  departmentId: z.string().uuid().nullable(),
  departmentName: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  color: z.string(),
  isActive: z.boolean(),
  isArchived: z.boolean(),
  employeeCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type PositionResponseDto = z.infer<typeof positionResponseSchema>;
