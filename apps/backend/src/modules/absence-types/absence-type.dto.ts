import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color, e.g. #F59E0B");

/** Code and name are fixed at creation time — managers may only edit color/description/active. */
export const updateAbsenceTypeSchema = z.object({
  color: hexColorSchema.optional(),
  description: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});
export type UpdateAbsenceTypeDto = z.infer<typeof updateAbsenceTypeSchema>;

export const absenceTypeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listAbsenceTypesQuerySchema = paginationQuerySchema;
export type ListAbsenceTypesQuery = z.infer<typeof listAbsenceTypesQuerySchema>;

export const absenceTypeResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  color: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AbsenceTypeResponseDto = z.infer<typeof absenceTypeResponseSchema>;
