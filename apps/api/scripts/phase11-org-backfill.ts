// Phase 11 기관 backfill — 레거시 CareerCohort.university(문자열) → Organization 매핑.
// 기본은 DRY-RUN(읽기 전용). 실제 반영은 `--commit` 인자. 멱등: 이미 organizationId 있는 기수는 건너뜀.
// 파괴적 변경 없음(기존 university 문자열·데이터 무변경, organizationId 채우기만).
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/phase11-org-backfill.ts [--commit]
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  const commit = process.argv.includes("--commit");
  log(`=== Phase 11 기관 backfill (${commit ? "COMMIT" : "DRY-RUN 읽기전용"}) ===\n`);

  const cohorts = await prisma.careerCohort.findMany({ select: { id: true, university: true, organizationId: true } });
  const unlinked = cohorts.filter((c) => !c.organizationId);
  const byUniversity = new Map<string, string[]>();
  for (const c of unlinked) {
    const key = (c.university || "미지정").trim();
    const arr = byUniversity.get(key) ?? [];
    arr.push(c.id);
    byUniversity.set(key, arr);
  }
  log(`전체 기수: ${cohorts.length}, 이미 기관 연결: ${cohorts.length - unlinked.length}, 미연결: ${unlinked.length}`);
  log(`고유 university 문자열: ${byUniversity.size}\n`);

  let orgsToCreate = 0;
  let orgsExisting = 0;
  let cohortsToLink = 0;

  for (const [university, cohortIds] of byUniversity) {
    // 이름이 같은 기존 Organization 재사용(멱등).
    const existing = await prisma.organization.findFirst({ where: { name: university }, select: { id: true } });
    let orgId = existing?.id ?? null;
    if (existing) orgsExisting++;
    else orgsToCreate++;
    cohortsToLink += cohortIds.length;
    log(`  ${university}: 기수 ${cohortIds.length}개 → ${existing ? `기존 기관(${existing.id.slice(-6)})` : "신규 기관 생성 예정"}`);

    if (commit) {
      if (!orgId) {
        const org = await prisma.organization.create({ data: { name: university, type: "university", status: "active" } });
        orgId = org.id;
      }
      await prisma.careerCohort.updateMany({ where: { id: { in: cohortIds } }, data: { organizationId: orgId } });
    }
  }

  log(`\n[요약]`);
  log(`  생성할 기관: ${orgsToCreate}, 재사용 기관: ${orgsExisting}`);
  log(`  연결할 기수: ${cohortsToLink}`);
  log(`  파괴적 변경: 0 (university 문자열·학생·결과물 무변경)`);
  if (!commit) log(`\n※ DRY-RUN 입니다. 실제 반영하려면 --commit 인자를 붙이세요.`);
  else log(`\n✅ COMMIT 완료.`);
  await prisma.$disconnect();
}
main().catch(async (e) => {
  console.error("backfill 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
