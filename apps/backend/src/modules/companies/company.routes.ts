import { Router } from "express";
import * as companyController from "@/modules/companies/company.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import { companyIdParamsSchema, updateCompanySchema } from "@/modules/companies/company.dto";
import { updateCompanySettingsSchema } from "@/modules/companies/company-settings.dto";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(PERMISSIONS.COMPANY_MANAGE),
  validate({ query: paginationQuerySchema }),
  asyncHandler(async (req, res) => companyController.list(req, res)),
);

router.get(
  "/:id",
  validate({ params: companyIdParamsSchema }),
  asyncHandler(async (req, res) => companyController.getById(req, res)),
);

router.patch(
  "/:id",
  validate({ params: companyIdParamsSchema, body: updateCompanySchema }),
  asyncHandler(async (req, res) => companyController.update(req, res)),
);

router.delete(
  "/:id",
  authorize(PERMISSIONS.COMPANY_MANAGE),
  validate({ params: companyIdParamsSchema }),
  asyncHandler(async (req, res) => companyController.remove(req, res)),
);

router.get(
  "/:id/settings",
  validate({ params: companyIdParamsSchema }),
  asyncHandler(async (req, res) => companyController.getSettings(req, res)),
);

router.patch(
  "/:id/settings",
  validate({ params: companyIdParamsSchema, body: updateCompanySettingsSchema }),
  asyncHandler(async (req, res) => companyController.updateSettings(req, res)),
);

router.post(
  "/:id/onboarding/complete",
  validate({ params: companyIdParamsSchema }),
  asyncHandler(async (req, res) => companyController.completeOnboardingHandler(req, res)),
);

export default router;
