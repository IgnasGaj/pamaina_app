import { Router } from "express";
import * as scheduleController from "@/modules/schedules/schedule.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  scheduleIdParamsSchema,
  updateScheduleSchema,
} from "@/modules/schedules/schedule.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/",
  authorize(PERMISSIONS.SCHEDULE_READ),
  validate({ query: listSchedulesQuerySchema }),
  asyncHandler(async (req, res) => scheduleController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.SCHEDULE_CREATE),
  validate({ body: createScheduleSchema }),
  asyncHandler(async (req, res) => scheduleController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.SCHEDULE_READ),
  validate({ params: scheduleIdParamsSchema }),
  asyncHandler(async (req, res) => scheduleController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.SCHEDULE_UPDATE),
  validate({ params: scheduleIdParamsSchema, body: updateScheduleSchema }),
  asyncHandler(async (req, res) => scheduleController.update(req, res)),
);

router.post(
  "/:id/publish",
  authorize(PERMISSIONS.SCHEDULE_UPDATE),
  validate({ params: scheduleIdParamsSchema }),
  asyncHandler(async (req, res) => scheduleController.publish(req, res)),
);

router.post(
  "/:id/copy-previous",
  authorize(PERMISSIONS.SCHEDULE_UPDATE),
  validate({ params: scheduleIdParamsSchema }),
  asyncHandler(async (req, res) => scheduleController.copyPrevious(req, res)),
);

export default router;
