import { Router } from "express";
import * as shiftTemplateController from "@/modules/shift-templates/shift-template.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  createShiftTemplateSchema,
  listShiftTemplatesQuerySchema,
  shiftTemplateIdParamsSchema,
  updateShiftTemplateSchema,
} from "@/modules/shift-templates/shift-template.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/",
  authorize(PERMISSIONS.SHIFT_TEMPLATE_READ),
  validate({ query: listShiftTemplatesQuerySchema }),
  asyncHandler(async (req, res) => shiftTemplateController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.SHIFT_TEMPLATE_CREATE),
  validate({ body: createShiftTemplateSchema }),
  asyncHandler(async (req, res) => shiftTemplateController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.SHIFT_TEMPLATE_READ),
  validate({ params: shiftTemplateIdParamsSchema }),
  asyncHandler(async (req, res) => shiftTemplateController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.SHIFT_TEMPLATE_UPDATE),
  validate({ params: shiftTemplateIdParamsSchema, body: updateShiftTemplateSchema }),
  asyncHandler(async (req, res) => shiftTemplateController.update(req, res)),
);

router.post(
  "/:id/archive",
  authorize(PERMISSIONS.SHIFT_TEMPLATE_DELETE),
  validate({ params: shiftTemplateIdParamsSchema }),
  asyncHandler(async (req, res) => shiftTemplateController.archive(req, res)),
);

router.post(
  "/:id/restore",
  authorize(PERMISSIONS.SHIFT_TEMPLATE_DELETE),
  validate({ params: shiftTemplateIdParamsSchema }),
  asyncHandler(async (req, res) => shiftTemplateController.restore(req, res)),
);

export default router;
