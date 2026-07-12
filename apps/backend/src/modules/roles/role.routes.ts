import { Router } from "express";
import { listRoles } from "@/modules/roles/role.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { authorize } from "@/shared/middlewares/authorize.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { PERMISSIONS } from "@/shared/constants/permissions";

const router = Router();

router.use(authenticate);
router.get("/", authorize(PERMISSIONS.ROLE_READ), asyncHandler(async (req, res) => listRoles(req, res)));

export default router;
