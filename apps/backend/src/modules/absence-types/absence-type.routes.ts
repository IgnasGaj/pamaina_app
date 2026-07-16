import { Router } from "express";
import * as absenceTypeController from "@/modules/absence-types/absence-type.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  absenceTypeIdParamsSchema,
  listAbsenceTypesQuerySchema,
  updateAbsenceTypeSchema,
} from "@/modules/absence-types/absence-type.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

// No POST / (create) or archive/restore routes: absence types are a fixed
// set of four per company (see absence-type.service.ts) — managers can only
// edit color/description/active via PATCH, never create or remove one.

router.get(
  "/",
  authorize(PERMISSIONS.ABSENCE_TYPE_READ),
  validate({ query: listAbsenceTypesQuerySchema }),
  asyncHandler(async (req, res) => absenceTypeController.list(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.ABSENCE_TYPE_READ),
  validate({ params: absenceTypeIdParamsSchema }),
  asyncHandler(async (req, res) => absenceTypeController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.ABSENCE_TYPE_UPDATE),
  validate({ params: absenceTypeIdParamsSchema, body: updateAbsenceTypeSchema }),
  asyncHandler(async (req, res) => absenceTypeController.update(req, res)),
);

export default router;
