import { Router } from "express";
import * as employeeController from "@/modules/employees/employee.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  updateOwnProfileSchema,
} from "@/modules/employees/employee.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

// Registered before "/:id" so "me" is never matched as an id param. No
// authorize() gate — these are always scoped to the caller's own linked
// Employee record, so there's nothing a permission check would add.
router.get("/me", asyncHandler(async (req, res) => employeeController.getOwnProfile(req, res)));

router.patch(
  "/me",
  validate({ body: updateOwnProfileSchema }),
  asyncHandler(async (req, res) => employeeController.updateOwnProfile(req, res)),
);

router.get(
  "/",
  authorize(PERMISSIONS.EMPLOYEE_READ),
  validate({ query: listEmployeesQuerySchema }),
  asyncHandler(async (req, res) => employeeController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.EMPLOYEE_CREATE),
  validate({ body: createEmployeeSchema }),
  asyncHandler(async (req, res) => employeeController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.EMPLOYEE_READ),
  validate({ params: employeeIdParamsSchema }),
  asyncHandler(async (req, res) => employeeController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.EMPLOYEE_UPDATE),
  validate({ params: employeeIdParamsSchema, body: updateEmployeeSchema }),
  asyncHandler(async (req, res) => employeeController.update(req, res)),
);

router.post(
  "/:id/archive",
  authorize(PERMISSIONS.EMPLOYEE_DELETE),
  validate({ params: employeeIdParamsSchema }),
  asyncHandler(async (req, res) => employeeController.archive(req, res)),
);

router.post(
  "/:id/restore",
  authorize(PERMISSIONS.EMPLOYEE_DELETE),
  validate({ params: employeeIdParamsSchema }),
  asyncHandler(async (req, res) => employeeController.restore(req, res)),
);

export default router;
