import { Router } from "express";
import * as authController from "@/modules/auth/auth.controller";
import { authenticate } from "@/shared/middlewares/authenticate.middleware";
import { asyncHandler } from "@/shared/middlewares/async-handler";
import { validate } from "@/shared/middlewares/validate.middleware";
import { authRateLimiter } from "@/shared/middlewares/rate-limiter.middleware";
import { changePasswordSchema, loginSchema, registerCompanySchema } from "@/modules/auth/auth.dto";

const router = Router();

router.post(
  "/register-company",
  authRateLimiter,
  validate({ body: registerCompanySchema }),
  asyncHandler(async (req, res) => authController.registerCompany(req, res)),
);

router.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => authController.login(req, res)),
);

router.post("/refresh", authRateLimiter, asyncHandler(async (req, res) => authController.refresh(req, res)));

router.post("/logout", asyncHandler(async (req, res) => authController.logout(req, res)));

router.get("/me", authenticate, asyncHandler(async (req, res) => authController.me(req, res)));

router.patch(
  "/password",
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => authController.changePassword(req, res)),
);

export default router;
