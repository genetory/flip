import "dotenv/config";
import { PositionSourceProvider, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.position.count({
    where: { sourceProvider: PositionSourceProvider.INTERNAL }
  });
  console.info(`[cleanup-internal] INTERNAL (Aply-created) positions before delete: ${before}`);

  if (before === 0) {
    console.info("[cleanup-internal] Nothing to delete. Done.");
    return;
  }

  console.warn(
    "[cleanup-internal] About to delete all INTERNAL positions.\n" +
    "[cleanup-internal] CASCADE: applications, interviews, assignments, matching participants,\n" +
    "[cleanup-internal] progress logs, status histories, and premium banners attached to these\n" +
    "[cleanup-internal] positions will also be removed."
  );

  const result = await prisma.position.deleteMany({
    where: { sourceProvider: PositionSourceProvider.INTERNAL }
  });

  console.info(`[cleanup-internal] Deleted ${result.count} INTERNAL positions (+ cascaded children).`);
}

main()
  .catch((error) => {
    console.error("[cleanup-internal] Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
