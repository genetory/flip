import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { embedAndSavePosition } from "../src/embedding/position-embedding";

const BATCH_SIZE = 25;
const RATE_LIMIT_MS = 50; // small gap between requests to be polite

async function main() {
  const prisma = new PrismaClient();
  const onlyMissing = process.argv.includes("--missing-only");
  try {
    // embedding column is Unsupported() in Prisma (pgvector type), so
    // the --missing-only filter has to be expressed in raw SQL.
    const positions = onlyMissing
      ? await prisma.$queryRaw<Array<{ id: string; title: string }>>`
          SELECT "id", "title"
          FROM "Position"
          WHERE "embedding" IS NULL
          ORDER BY "createdAt" ASC
        `
      : await prisma.position.findMany({
          select: { id: true, title: true },
          orderBy: { createdAt: "asc" }
        });
    console.log(`Backfilling embeddings for ${positions.length} positions${onlyMissing ? " (missing only)" : ""}...`);

    let done = 0;
    let failed = 0;
    for (let i = 0; i < positions.length; i += BATCH_SIZE) {
      const batch = positions.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (row) => {
          const ok = await embedAndSavePosition(prisma, row.id);
          return { id: row.id, title: row.title, ok };
        })
      );
      for (const r of results) {
        if (r.ok) done += 1;
        else {
          failed += 1;
          console.warn(`  - failed: ${r.id} (${r.title})`);
        }
      }
      console.log(`  progress: ${Math.min(i + BATCH_SIZE, positions.length)}/${positions.length}`);
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
    }

    console.log(`Done. embedded=${done}, failed=${failed}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exitCode = 1;
});
