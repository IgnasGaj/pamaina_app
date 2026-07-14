import { Router } from "express";
import * as positionController from "@/modules/positions/position.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  createPositionSchema,
  listPositionsQuerySchema,
  positionIdParamsSchema,
  updatePositionSchema,
} from "@/modules/positions/position.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/",
  authorize(PERMISSIONS.POSITION_READ),
  validate({ query: listPositionsQuerySchema }),
  asyncHandler(async (req, res) => positionController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.POSITION_CREATE),
  validate({ body: createPositionSchema }),
  asyncHandler(async (req, res) => positionController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.POSITION_READ),
  validate({ params: positionIdParamsSchema }),
  asyncHandler(async (req, res) => positionController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.POSITION_UPDATE),
  validate({ params: positionIdParamsSchema, body: updatePositionSchema }),
  asyncHandler(async (req, res) => positionController.update(req, res)),
);

router.post(
  "/:id/archive",
  authorize(PERMISSIONS.POSITION_DELETE),
  validate({ params: positionIdParamsSchema }),
  asyncHandler(async (req, res) => positionController.archive(req, res)),
);

router.post(
  "/:id/restore",
  authorize(PERMISSIONS.POSITION_DELETE),
  validate({ params: positionIdParamsSchema }),
  asyncHandler(async (req, res) => positionController.restore(req, res)),
);

export default router;
