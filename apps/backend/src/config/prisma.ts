import { PrismaClient } from "@prisma/client";
import { isProduction } from "@/config/env";

/**
 * Single shared Prisma client for the process. In dev, tsx watch can
 * re-evaluate this module on reload, so we cache the instance on
 * globalThis to avoid exhausting the Postgres connection pool.
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ["warn", "error"] : ["warn", "error"],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
