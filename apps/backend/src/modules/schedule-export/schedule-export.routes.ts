import { Router } from "express";
import * as scheduleExportController from "@/modules/schedule-export/schedule-export.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import { exportScheduleSchema } from "@/modules/schedule-export/schedule-export.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

// Export is just another read view over the same data GET /schedules/:id already
// exposes to COMPANY_OWNER/MANAGER — no dedicated permission key needed.
router.post(
  "/",
  authorize(PERMISSIONS.SCHEDULE_READ),
  validate({ body: exportScheduleSchema }),
  asyncHandler(async (req, res) => scheduleExportController.exportSchedule(req, res)),
);

export default router;
