import { z } from "zod";

export const registerCompanySchema = z.object({
  company: z.object({
    name: z.string().min(2).max(200),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    address: z.string().max(300).optional(),
    city: z.string().max(120).optional(),
    legalCode: z.string().max(50).optional(),
    vatCode: z.string().max(50).optional(),
  }),
  owner: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number"),
  }),
});
export type RegisterCompanyDto = z.infer<typeof registerCompanySchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const authUserResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  roleId: z.string().uuid(),
  roleKey: z.string().nullable(),
  roleName: z.string(),
  permissions: z.array(z.string()),
  // Null while the owning company is still onboarding, or for
  // company-less accounts (e.g. platform Super Admins).
  onboardingCompletedAt: z.string().nullable(),
});
export type AuthUserResponseDto = z.infer<typeof authUserResponseSchema>;

export interface AuthTokensDto {
  accessToken: string;
  accessTokenExpiresAt: string;
}
