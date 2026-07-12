import { z } from "zod";

export const roleResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid().nullable(),
  name: z.string(),
  key: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  permissions: z.array(z.string()),
});

export type RoleResponseDto = z.infer<typeof roleResponseSchema>;
