// 기존 내부(APLY CIP) 공고 백필 — 과거엔 'INTERNAL = 전부 외국인 지원 가능'으로 취급했으나,
// 이제 공고별 FOREIGNER_FRIENDLY 태그 기준으로 바뀌었다. 현재 동작(내부 전부 노출)을 보존하기 위해
// eligibleVisas 에 FOREIGNER_FRIENDLY 가 없는 모든 INTERNAL 공고에 태그를 추가한다(멱등).
// 이후 파트너가 에디터에서 개별로 끌 수 있다.
//
// 실행: node --import tsx scripts/backfill-internal-foreigner.ts
// 드라이런: BACKFILL_DRY_RUN=true node --import tsx scripts/backfill-internal-foreigner.ts
import { PositionSourceProvider, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TAG = "FOREIGNER_FRIENDLY";
const DRY_RUN = process.env.BACKFILL_DRY_RUN === "true";

async function main() {
  // INTERNAL 이면서 아직 태그가 없는 공고만 대상.
  const targets = await prisma.position.findMany({
    where: {
      sourceProvider: PositionSourceProvider.INTERNAL,
      NOT: { eligibleVisas: { has: TAG } }
    },
    select: { id: true, title: true, eligibleVisas: true }
  });

  console.log(`[backfill] INTERNAL positions missing ${TAG}: ${targets.length}${DRY_RUN ? " (dry-run)" : ""}`);
  if (DRY_RUN || targets.length === 0) {
    for (const p of targets.slice(0, 20)) console.log(`  - ${p.id} · ${p.title}`);
    if (targets.length > 20) console.log(`  … +${targets.length - 20} more`);
    return;
  }

  let updated = 0;
  for (const p of targets) {
    const next = Array.from(new Set([...(p.eligibleVisas ?? []), TAG]));
    await prisma.position.update({ where: { id: p.id }, data: { eligibleVisas: next } });
    updated += 1;
  }
  console.log(`[backfill] done. updated ${updated} positions.`);
}

main()
  .catch((e) => {
    console.error("[backfill] failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
