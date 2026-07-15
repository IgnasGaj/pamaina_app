import { z } from "zod";
import { NotificationType } from "@prisma/client";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const notificationTypeSchema = z.nativeEnum(NotificationType);

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const notificationIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  link: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationResponseDto = z.infer<typeof notificationResponseSchema>;

export const unreadCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});
export type UnreadCountResponseDto = z.infer<typeof unreadCountResponseSchema>;
