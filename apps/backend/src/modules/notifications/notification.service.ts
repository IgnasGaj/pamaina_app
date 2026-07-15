import { Prisma, PrismaClient } from "@prisma/client";
import { notificationRepository, CreateNotificationData } from "@/modules/notifications/notification.repository";
import { toNotificationResponseDto } from "@/modules/notifications/notification.mapper";
import { ListNotificationsQuery, NotificationResponseDto } from "@/modules/notifications/notification.dto";
import { NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

/**
 * Internal helper used by other modules (requests, schedules) to raise an
 * in-app notification for a single recipient. Never throws on its own
 * behalf — callers only invoke this after their own business logic has
 * already succeeded, so a notification failure should not roll back the
 * triggering action (create() itself can still throw on a genuine DB error).
 */
export async function notifyUser(data: CreateNotificationData, client: Client | undefined = undefined): Promise<void> {
  await notificationRepository.create(data, client);
}

/** Fan-out variant for events with multiple recipients (e.g. a schedule being published). */
export async function notifyUsers(data: CreateNotificationData[], client: Client | undefined = undefined): Promise<void> {
  await notificationRepository.createMany(data, client);
}

export async function listNotifications(
  userId: string,
  query: ListNotificationsQuery,
): Promise<PaginatedResult<NotificationResponseDto>> {
  const { items, total } = await notificationRepository.findMany({ userId, unreadOnly: query.unreadOnly }, query);
  return buildPaginatedResult(items.map(toNotificationResponseDto), query, total);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return notificationRepository.countUnreadForUser(userId);
}

export async function markAsRead(userId: string, id: string): Promise<void> {
  const existing = await notificationRepository.findByIdForUser(id, userId);
  if (!existing) {
    throw new NotFoundError("Notification");
  }
  if (!existing.readAt) {
    await notificationRepository.markRead(id);
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  await notificationRepository.markAllReadForUser(userId);
}
