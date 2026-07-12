import { Router } from "express";
import * as userController from "@/modules/users/user.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize, requireCompanyScope } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import { createUserSchema, listUsersQuerySchema, updateUserSchema, userIdParamsSchema } from "@/modules/users/user.dto";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate, requireCompanyScope);

router.get(
  "/",
  authorize(PERMISSIONS.USER_READ),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(async (req, res) => userController.list(req, res)),
);

router.post(
  "/",
  authorize(PERMISSIONS.USER_CREATE),
  validate({ body: createUserSchema }),
  asyncHandler(async (req, res) => userController.create(req, res)),
);

router.get(
  "/:id",
  authorize(PERMISSIONS.USER_READ),
  validate({ params: userIdParamsSchema }),
  asyncHandler(async (req, res) => userController.getById(req, res)),
);

router.patch(
  "/:id",
  authorize(PERMISSIONS.USER_UPDATE),
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  asyncHandler(async (req, res) => userController.update(req, res)),
);

router.delete(
  "/:id",
  authorize(PERMISSIONS.USER_DELETE),
  validate({ params: userIdParamsSchema }),
  asyncHandler(async (req, res) => userController.remove(req, res)),
);

export default router;
