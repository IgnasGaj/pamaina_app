import { Router } from "express";
import * as workingTimeController from "@/modules/working-time/working-time.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  createNonWorkingDaySchema,
  holidaysQuerySchema,
  monthlyHoursQuerySchema,
  nonWorkingDayIdParamsSchema,
} from "@/modules/working-time/working-time.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/monthly-hours",
  authorize(PERMISSIONS.WORKING_TIME_READ),
  validate({ query: monthlyHoursQuerySchema }),
  asyncHandler(async (req, res) => workingTimeController.getMonthlyHours(req, res)),
);

router.get(
  "/holidays",
  authorize(PERMISSIONS.WORKING_TIME_READ),
  validate({ query: holidaysQuerySchema }),
  asyncHandler(async (req, res) => workingTimeController.listHolidays(req, res)),
);

router.get(
  "/non-working-days",
  authorize(PERMISSIONS.WORKING_TIME_READ),
  asyncHandler(async (req, res) => workingTimeController.listNonWorkingDays(req, res)),
);

router.post(
  "/non-working-days",
  authorize(PERMISSIONS.WORKING_TIME_MANAGE),
  validate({ body: createNonWorkingDaySchema }),
  asyncHandler(async (req, res) => workingTimeController.createNonWorkingDay(req, res)),
);

router.delete(
  "/non-working-days/:id",
  authorize(PERMISSIONS.WORKING_TIME_MANAGE),
  validate({ params: nonWorkingDayIdParamsSchema }),
  asyncHandler(async (req, res) => workingTimeController.deleteNonWorkingDay(req, res)),
);

export default router;
