import { Request, Response } from "express";
import * as notificationService from "@/modules/notifications/notification.service";
import { ListNotificationsQuery } from "@/modules/notifications/notification.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

export async function list(req: Request, res: Response): Promise<void> {
  const result = await notificationService.listNotifications(
    req.user!.id,
    req.query as unknown as ListNotificationsQuery,
  );
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  const count = await notificationService.getUnreadCount(req.user!.id);
  sendSuccess(res, { count });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await notificationService.markAsRead(req.user!.id, id);
  sendSuccess(res, null);
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  await notificationService.markAllAsRead(req.user!.id);
  sendSuccess(res, null);
}
