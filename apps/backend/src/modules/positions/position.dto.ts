import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const createPositionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  departmentId: z.string().uuid().optional(),
});
export type CreatePositionDto = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
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
});
export type ListPositionsQuery = z.infer<typeof listPositionsQuerySchema>;

export const positionResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  departmentId: z.string().uuid().nullable(),
  departmentName: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  employeeCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});
export type PositionResponseDto = z.infer<typeof positionResponseSchema>;
