afterAll(async () => {
  try {
    const { closeReportQueue } =
      (await import("../src/queues/report.queue")) as typeof import("../src/queues/report.queue");
    await closeReportQueue();
  } catch {
    // queue module not loaded in this run
  }

  try {
    const { disconnectRedis } =
      (await import("../src/config/redisClient")) as typeof import("../src/config/redisClient");
    await disconnectRedis();
  } catch {
    // redis client not loaded or already closed
  }

  try {
    const { prisma } =
      (await import("../src/config/prismaClient")) as typeof import("../src/config/prismaClient");
    await prisma.$disconnect();
  } catch {
    // prisma not loaded or mocked without $disconnect
  }
});
