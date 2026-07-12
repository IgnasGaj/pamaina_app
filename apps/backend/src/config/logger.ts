import pino from "pino";
import { env, isProduction } from "@/config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.refreshToken",
      "*.accessToken",
    ],
    remove: true,
  },
});
