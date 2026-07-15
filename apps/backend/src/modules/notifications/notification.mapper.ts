import { Notification } from "@prisma/client";
import { NotificationResponseDto } from "@/modules/notifications/notification.dto";

export function toNotificationResponseDto(notification: Notification): NotificationResponseDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt.toISOString(),
  };
}
