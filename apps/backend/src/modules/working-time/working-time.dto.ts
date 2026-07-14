import { z } from "zod";
import { EmploymentType } from "@prisma/client";

export const employmentTypeSchema = z.nativeEnum(EmploymentType);

export const monthlyHoursQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  employmentType: employmentTypeSchema,
});
export type MonthlyHoursQuery = z.infer<typeof monthlyHoursQuerySchema>;

export const holidaysQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12).optional(),
});
export type HolidaysQuery = z.infer<typeof holidaysQuerySchema>;

export const createNonWorkingDaySchema = z.object({
  date: z.coerce.date(),
  name: z.string().min(1).max(200),
});
export type CreateNonWorkingDayDto = z.infer<typeof createNonWorkingDaySchema>;

export const nonWorkingDayIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const holidaySourceSchema = z.enum(["default", "company"]);

export const holidayResponseSchema = z.object({
  date: z.string(),
  name: z.string(),
  source: holidaySourceSchema,
});
export type HolidayResponseDto = z.infer<typeof holidayResponseSchema>;

export const monthlyHoursResponseSchema = z.object({
  year: z.number().int(),
  month: z.number().int(),
  employmentType: employmentTypeSchema,
  employmentFraction: z.number(),
  calendarDays: z.number().int(),
  workingDays: z.number().int(),
  baseHours: z.number(),
  ruleReductionHours: z.number(),
  requiredHours: z.number(),
  holidays: z.array(holidayResponseSchema),
});
export type MonthlyHoursResponseDto = z.infer<typeof monthlyHoursResponseSchema>;

export const companyNonWorkingDayResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  date: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CompanyNonWorkingDayResponseDto = z.infer<typeof companyNonWorkingDayResponseSchema>;
