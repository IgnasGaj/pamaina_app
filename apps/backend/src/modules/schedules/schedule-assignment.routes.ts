import { Router } from "express";
import * as scheduleController from "@/modules/schedules/schedule.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  assignmentIdParamsSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
} from "@/modules/schedules/schedule.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.post(
  "/",
  authorize(PERMISSIONS.SCHEDULE_UPDATE),
  validate({ body: createAssignmentSchema }),
  asyncHandler(async (req, res) => scheduleController.createAssignment(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.SCHEDULE_UPDATE),
  validate({ params: assignmentIdParamsSchema, body: updateAssignmentSchema }),
  asyncHandler(async (req, res) => scheduleController.updateAssignment(req, res)),
);

router.delete(
  "/:id",
  authorize(PERMISSIONS.SCHEDULE_UPDATE),
  validate({ params: assignmentIdParamsSchema }),
  asyncHandler(async (req, res) => scheduleController.deleteAssignment(req, res)),
);

export default router;
