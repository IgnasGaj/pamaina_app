import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  legalCode: z.string().max(50).optional(),
  vatCode: z.string().max(50).optional(),
});
export type CreateCompanyDto = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;

export const companyIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const companyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string(),
  timezone: z.string(),
  legalCode: z.string().nullable(),
  vatCode: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type CompanyResponseDto = z.infer<typeof companyResponseSchema>;
