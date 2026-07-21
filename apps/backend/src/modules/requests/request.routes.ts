import { Router } from "express";
import * as requestController from "@/modules/requests/request.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  createRequestSchema,
  listRequestsQuerySchema,
  requestIdParamsSchema,
  reviewRequestSchema,
} from "@/modules/requests/request.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/",
  authorize(PERMISSIONS.REQUEST_READ),
  validate({ query: listRequestsQuerySchema }),
  asyncHandler(async (req, res) => requestController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.REQUEST_CREATE),
  validate({ body: createRequestSchema }),
  asyncHandler(async (req, res) => requestController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.REQUEST_READ),
  validate({ params: requestIdParamsSchema }),
  asyncHandler(async (req, res) => requestController.getById(req, res)),
);

router.get(
  "/:id/conflicts",
  authorize(PERMISSIONS.REQUEST_MANAGE),
  validate({ params: requestIdParamsSchema }),
  asyncHandler(async (req, res) => requestController.getConflicts(req, res)),
);

router.post(
  "/:id/approve",
  authorize(PERMISSIONS.REQUEST_MANAGE),
  validate({ params: requestIdParamsSchema, body: reviewRequestSchema }),
  asyncHandler(async (req, res) => requestController.approve(req, res)),
);

router.post(
  "/:id/revoke",
  authorize(PERMISSIONS.REQUEST_MANAGE),
  validate({ params: requestIdParamsSchema, body: reviewRequestSchema }),
  asyncHandler(async (req, res) => requestController.revoke(req, res)),
);

router.post(
  "/:id/reject",
  authorize(PERMISSIONS.REQUEST_MANAGE),
  validate({ params: requestIdParamsSchema, body: reviewRequestSchema }),
  asyncHandler(async (req, res) => requestController.reject(req, res)),
);

router.post(
  "/:id/cancel",
  authorize(PERMISSIONS.REQUEST_CREATE),
  validate({ params: requestIdParamsSchema }),
  asyncHandler(async (req, res) => requestController.cancel(req, res)),
);

export default router;
