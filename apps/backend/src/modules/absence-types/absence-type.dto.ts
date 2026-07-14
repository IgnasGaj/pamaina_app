import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color, e.g. #F59E0B");

export const absenceTypeStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export type AbsenceTypeStatusFilter = z.infer<typeof absenceTypeStatusSchema>;

export const absenceTypeSortBySchema = z.enum(["name", "createdAt"]);
export type AbsenceTypeSortBy = z.infer<typeof absenceTypeSortBySchema>;

export const createAbsenceTypeSchema = z.object({
  name: z.string().min(1).max(100),
  color: hexColorSchema.default("#F59E0B"),
  paid: z.boolean().default(true),
});
export type CreateAbsenceTypeDto = z.infer<typeof createAbsenceTypeSchema>;

export const updateAbsenceTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: hexColorSchema.optional(),
  paid: z.boolean().optional(),
  active: z.boolean().optional(),
});
export type UpdateAbsenceTypeDto = z.infer<typeof updateAbsenceTypeSchema>;

export const absenceTypeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listAbsenceTypesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: absenceTypeStatusSchema.optional(),
  sortBy: absenceTypeSortBySchema.default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type ListAbsenceTypesQuery = z.infer<typeof listAbsenceTypesQuerySchema>;

export const absenceTypeResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  paid: z.boolean(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AbsenceTypeResponseDto = z.infer<typeof absenceTypeResponseSchema>;
