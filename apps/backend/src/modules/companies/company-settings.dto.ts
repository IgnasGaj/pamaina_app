import { z } from "zod";

export const businessTypeSchema = z.enum([
  "FACTORY",
  "RESTAURANT",
  "RETAIL",
  "WAREHOUSE",
  "LOGISTICS",
  "OFFICE",
  "OTHER",
]);
export type BusinessType = z.infer<typeof businessTypeSchema>;

export const workWeekTypeSchema = z.enum(["FIVE_DAY", "SIX_DAY", "SUMMARIZED"]);
export type WorkWeekType = z.infer<typeof workWeekTypeSchema>;

export const vacationPolicyTypeSchema = z.enum(["ANNUAL_ALLOCATION", "MONTHLY_ACCRUAL"]);
export type VacationPolicyType = z.infer<typeof vacationPolicyTypeSchema>;

export const updateCompanySettingsSchema = z.object({
  // Data URL or hosted URL for the company logo. Capped well above a
  // reasonably-compressed image to avoid abuse; see company-settings.service.ts.
  logoUrl: z.string().max(3_500_000).optional(),
  preferredLanguage: z.string().min(2).max(10).optional(),
  businessType: businessTypeSchema.optional(),
  workWeekType: workWeekTypeSchema.optional(),
  vacationPolicy: vacationPolicyTypeSchema.optional(),
  annualVacationDays: z.coerce.number().int().min(0).max(365).optional(),
});
export type UpdateCompanySettingsDto = z.infer<typeof updateCompanySettingsSchema>;

export const companySettingsResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  logoUrl: z.string().nullable(),
  preferredLanguage: z.string(),
  businessType: businessTypeSchema.nullable(),
  workWeekType: workWeekTypeSchema.nullable(),
  vacationPolicy: vacationPolicyTypeSchema.nullable(),
  annualVacationDays: z.number().int(),
  onboardingCompletedAt: z.string().nullable(),
});
export type CompanySettingsResponseDto = z.infer<typeof companySettingsResponseSchema>;
