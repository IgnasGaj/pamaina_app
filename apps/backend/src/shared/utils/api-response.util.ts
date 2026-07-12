import { Response } from "express";

interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): void {
  const body: SuccessBody<T> = { success: true, data };
  if (meta) {
    body.meta = meta;
  }
  res.status(statusCode).json(body);
}
