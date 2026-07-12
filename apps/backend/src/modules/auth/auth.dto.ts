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
    password: z.string().min(8).max(128),
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
});
export type AuthUserResponseDto = z.infer<typeof authUserResponseSchema>;

export interface AuthTokensDto {
  accessToken: string;
  accessTokenExpiresAt: string;
}
