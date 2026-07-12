import rateLimit from "express-rate-limit";
import { env } from "@/config/env";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter limiter for authentication endpoints to slow brute-force attempts. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "TOO_MANY_REQUESTS", message: "Too many authentication attempts, please try again later" },
  },
});
