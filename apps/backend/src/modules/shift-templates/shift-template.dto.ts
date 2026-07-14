import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex color, e.g. #2563EB");
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid 24h time, e.g. 08:00");

export const shiftTemplateStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export type ShiftTemplateStatusFilter = z.infer<typeof shiftTemplateStatusSchema>;

export const shiftTemplateSortBySchema = z.enum(["name", "startTime", "createdAt"]);
export type ShiftTemplateSortBy = z.infer<typeof shiftTemplateSortBySchema>;

export const createShiftTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  shortCode: z.string().min(1).max(4),
  color: hexColorSchema.default("#2563EB"),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
  breakMinutes: z.coerce.number().int().min(0).max(480).default(0),
});
export type CreateShiftTemplateDto = z.infer<typeof createShiftTemplateSchema>;

export const updateShiftTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  shortCode: z.string().min(1).max(4).optional(),
  color: hexColorSchema.optional(),
  startTime: timeOfDaySchema.optional(),
  endTime: timeOfDaySchema.optional(),
  breakMinutes: z.coerce.number().int().min(0).max(480).optional(),
  active: z.boolean().optional(),
});
export type UpdateShiftTemplateDto = z.infer<typeof updateShiftTemplateSchema>;

export const shiftTemplateIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listShiftTemplatesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: shiftTemplateStatusSchema.optional(),
  sortBy: shiftTemplateSortBySchema.default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type ListShiftTemplatesQuery = z.infer<typeof listShiftTemplatesQuerySchema>;

export const shiftTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string(),
  shortCode: z.string(),
  color: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakMinutes: z.number().int(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ShiftTemplateResponseDto = z.infer<typeof shiftTemplateResponseSchema>;
