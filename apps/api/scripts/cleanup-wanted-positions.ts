import "dotenv/config";
import { PositionSourceProvider, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.position.count({
    where: { sourceProvider: PositionSourceProvider.WANTED }
  });
  console.info(`[cleanup-wanted] WANTED positions before delete: ${before}`);

  if (before === 0) {
    console.info("[cleanup-wanted] Nothing to delete. Done.");
    return;
  }

  const result = await prisma.position.deleteMany({
    where: { sourceProvider: PositionSourceProvider.WANTED }
  });

  console.info(`[cleanup-wanted] Deleted ${result.count} WANTED positions.`);
}

main()
  .catch((error) => {
    console.error("[cleanup-wanted] Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
