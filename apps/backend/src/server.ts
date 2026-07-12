import { createApp } from "@/app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { prisma } from "@/config/prisma";

async function main(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Pamaina API listening on port ${env.PORT} (${env.NODE_ENV})`);
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
