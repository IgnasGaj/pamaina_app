import { Router } from "express";
import * as contractController from "@/modules/contracts/contract.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  contractIdParamsSchema,
  createContractSchema,
  endContractSchema,
  listContractsQuerySchema,
  updateContractSchema,
} from "@/modules/contracts/contract.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/",
  authorize(PERMISSIONS.CONTRACT_READ),
  validate({ query: listContractsQuerySchema }),
  asyncHandler(async (req, res) => contractController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.CONTRACT_CREATE),
  validate({ body: createContractSchema }),
  asyncHandler(async (req, res) => contractController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.CONTRACT_READ),
  validate({ params: contractIdParamsSchema }),
  asyncHandler(async (req, res) => contractController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.CONTRACT_UPDATE),
  validate({ params: contractIdParamsSchema, body: updateContractSchema }),
  asyncHandler(async (req, res) => contractController.update(req, res)),
);

router.post(
  "/:id/end",
  authorize(PERMISSIONS.CONTRACT_UPDATE),
  validate({ params: contractIdParamsSchema, body: endContractSchema }),
  asyncHandler(async (req, res) => contractController.end(req, res)),
);

export default router;
