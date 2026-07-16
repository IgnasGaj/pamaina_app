import { createApp } from "@/app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { prisma } from "@/config/prisma";
import { ensureDefaultAbsenceTypesForAllCompanies } from "@/modules/absence-types/absence-type.service";

async function main(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Pamaina API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  // Idempotent backfill so every company always has the four standard
  // absence types, even one created before this feature existed. Logged
  // but never fatal — a hiccup here shouldn't take the whole API down.
  ensureDefaultAbsenceTypesForAllCompanies().catch((err) => {
    logger.error({ err }, "Failed to ensure default absence types on startup");
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
