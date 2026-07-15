import { Router } from "express";
import * as notificationController from "@/modules/notifications/notification.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import { listNotificationsQuerySchema, notificationIdParamsSchema } from "@/modules/notifications/notification.dto";

const router = Router();

router.use(authenticate, requireCompanyScope);

// No authorize() gate beyond authentication — every route here is always
// scoped to the caller's own userId (see notification.service.ts), so there
// is nothing a permission check could additionally restrict.

router.get(
  "/",
  validate({ query: listNotificationsQuerySchema }),
  asyncHandler(async (req, res) => notificationController.list(req, res)),
);

router.get("/unread-count", asyncHandler(async (req, res) => notificationController.unreadCount(req, res)));

router.post(
  "/:id/read",
  validate({ params: notificationIdParamsSchema }),
  asyncHandler(async (req, res) => notificationController.markRead(req, res)),
);

router.post("/read-all", asyncHandler(async (req, res) => notificationController.markAllRead(req, res)));

export default router;
