import { PrismaClient } from "@prisma/client";
import { embedQueryCached, keywordScore, toPgVector } from "../src/embedding/position-embedding";

const SEMANTIC_WEIGHT = 0.65;
const KEYWORD_WEIGHT = 0.35;
const ANN_POOL_SIZE = 100;

async function main() {
  const query = process.argv[2] ?? "그림 그리는";
  const prisma = new PrismaClient();
  try {
    const t0 = Date.now();
    console.log(`Query: "${query}"`);
    const queryVector = await embedQueryCached(query);
    if (!queryVector) {
      console.error("Failed to embed query");
      return;
    }
    const t1 = Date.now();
    const vectorLiteral = toPgVector(queryVector);
    const annResults = await prisma.$queryRaw<Array<{ id: string; distance: number }>>`
      SELECT "id", "embedding" <=> ${vectorLiteral}::vector AS distance
      FROM "Position"
      WHERE "status" = 'OPEN' AND "embedding" IS NOT NULL
      ORDER BY "embedding" <=> ${vectorLiteral}::vector
      LIMIT ${ANN_POOL_SIZE}
    `;
    const t2 = Date.now();
    const ids = annResults.map((r) => r.id);
    const positions = await prisma.position.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        preferredJobRole: true,
        workLocation: true,
        mainResponsibilities: true,
        requiredQualifications: true,
        preferredQualifications: true,
        partnerOrganization: { select: { name: true } }
      }
    });
    const distMap = new Map(annResults.map((r) => [r.id, Number(r.distance)]));
    const scored = positions
      .map((p) => {
        const distance = distMap.get(p.id) ?? 1;
        const semantic = Math.max(0, 1 - distance);
        const lexical = keywordScore(
          {
            title: p.title,
            preferredJobRole: p.preferredJobRole,
            workLocation: p.workLocation,
            mainResponsibilities: p.mainResponsibilities,
            requiredQualifications: p.requiredQualifications,
            preferredQualifications: p.preferredQualifications,
            partnerOrganizationName: p.partnerOrganization?.name ?? null
          },
          query
        );
        return {
          title: p.title,
          role: p.preferredJobRole,
          company: p.partnerOrganization?.name,
          distance,
          semantic,
          lexical,
          hybrid: SEMANTIC_WEIGHT * semantic + KEYWORD_WEIGHT * lexical
        };
      })
      .sort((a, b) => b.hybrid - a.hybrid)
      .slice(0, 10);
    const t3 = Date.now();
    console.log(`\nTiming: embed=${t1 - t0}ms  ann=${t2 - t1}ms  rerank=${t3 - t2}ms  total=${t3 - t0}ms`);
    console.log(`\nTop 10 (hybrid) from ${annResults.length}-pool ANN:\n`);
    for (const s of scored) {
      console.log(
        `  total=${s.hybrid.toFixed(4)}  sem=${s.semantic.toFixed(3)}  lex=${s.lexical.toFixed(3)}  ${s.title}${s.role ? ` (${s.role})` : ""}${s.company ? ` - ${s.company}` : ""}`
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
