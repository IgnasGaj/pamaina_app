import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "@/shared/errors";
import { logger } from "@/config/logger";
import { isProduction } from "@/config/env";

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandlerMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, "Unhandled application error");
    }
    const body: ErrorResponseBody = {
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with these unique fields already exists",
          details: isProduction ? undefined : err.meta,
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Record not found" },
      });
      return;
    }
  }

  logger.error({ err }, "Unexpected error");
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction ? "An unexpected error occurred" : String((err as Error)?.message ?? err),
    },
  });
}
