import { Notification, NotificationType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { toPrismaSkipTake } from "@/shared/utils/pagination.util";

type Client = PrismaClient | Prisma.TransactionClient;

export interface CreateNotificationData {
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export class NotificationRepository {
  async create(data: CreateNotificationData, client: Client = prisma): Promise<Notification> {
    return client.notification.create({ data });
  }

  /** Bulk variant used when one event (e.g. schedule published) fans out to many recipients. */
  async createMany(data: CreateNotificationData[], client: Client = prisma): Promise<number> {
    if (data.length === 0) return 0;
    const result = await client.notification.createMany({ data });
    return result.count;
  }

  async findByIdForUser(id: string, userId: string, client: Client = prisma): Promise<Notification | null> {
    return client.notification.findFirst({ where: { id, userId } });
  }

  async findMany(
    filter: { userId: string; unreadOnly?: boolean },
    pagination: PaginationQuery,
    client: Client = prisma,
  ): Promise<{ items: Notification[]; total: number }> {
    const { skip, take } = toPrismaSkipTake(pagination);
    const where: Prisma.NotificationWhereInput = {
      userId: filter.userId,
      ...(filter.unreadOnly ? { readAt: null } : {}),
    };

    const [items, total] = await Promise.all([
      client.notification.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      client.notification.count({ where }),
    ]);
    return { items, total };
  }

  async countUnreadForUser(userId: string, client: Client = prisma): Promise<number> {
    return client.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, client: Client = prisma): Promise<void> {
    await client.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllReadForUser(userId: string, client: Client = prisma): Promise<void> {
    await client.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }
}

export const notificationRepository = new NotificationRepository();
