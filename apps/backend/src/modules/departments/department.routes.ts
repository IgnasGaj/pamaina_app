import { Router } from "express";
import * as departmentController from "@/modules/departments/department.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  createDepartmentSchema,
  departmentIdParamsSchema,
  listDepartmentsQuerySchema,
  updateDepartmentSchema,
} from "@/modules/departments/department.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/",
  authorize(PERMISSIONS.DEPARTMENT_READ),
  validate({ query: listDepartmentsQuerySchema }),
  asyncHandler(async (req, res) => departmentController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.DEPARTMENT_CREATE),
  validate({ body: createDepartmentSchema }),
  asyncHandler(async (req, res) => departmentController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.DEPARTMENT_READ),
  validate({ params: departmentIdParamsSchema }),
  asyncHandler(async (req, res) => departmentController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.DEPARTMENT_UPDATE),
  validate({ params: departmentIdParamsSchema, body: updateDepartmentSchema }),
  asyncHandler(async (req, res) => departmentController.update(req, res)),
);

router.post(
  "/:id/archive",
  authorize(PERMISSIONS.DEPARTMENT_DELETE),
  validate({ params: departmentIdParamsSchema }),
  asyncHandler(async (req, res) => departmentController.archive(req, res)),
);

router.post(
  "/:id/restore",
  authorize(PERMISSIONS.DEPARTMENT_DELETE),
  validate({ params: departmentIdParamsSchema }),
  asyncHandler(async (req, res) => departmentController.restore(req, res)),
);

export default router;
