import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { globalRateLimiter } from "@/shared/middlewares/rate-limiter.middleware";
import { errorHandlerMiddleware } from "@/shared/middlewares/error-handler.middleware";
import { notFoundMiddleware } from "@/shared/middlewares/not-found.middleware";

import authRoutes from "@/modules/auth/auth.routes";
import companyRoutes from "@/modules/companies/company.routes";
import userRoutes from "@/modules/users/user.routes";
import roleRoutes from "@/modules/roles/role.routes";
import departmentRoutes from "@/modules/departments/department.routes";
import positionRoutes from "@/modules/positions/position.routes";
import employeeRoutes from "@/modules/employees/employee.routes";
import contractRoutes from "@/modules/contracts/contract.routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimiter);

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  const api = express.Router();
  api.use("/auth", authRoutes);
  api.use("/companies", companyRoutes);
  api.use("/users", userRoutes);
  api.use("/roles", roleRoutes);
  api.use("/departments", departmentRoutes);
  api.use("/positions", positionRoutes);
  api.use("/employees", employeeRoutes);
  api.use("/contracts", contractRoutes);

  app.use(env.API_PREFIX, api);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
