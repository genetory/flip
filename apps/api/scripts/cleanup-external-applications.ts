import "dotenv/config";
import { PositionSourceProvider, PrismaClient } from "@prisma/client";

// 외부 출처(BUDDIES / WANTED / OTHER) Position 에 달린 Application 일괄 정리.
// "Aply 가 직접 만든 (INTERNAL) 포지션 에 대한 지원만 남기고 나머지 정리" 가
// 목표. Position 자체는 건드리지 않는다 (별도 cleanup-* 스크립트 책임 영역).
//
// 기본 동작: dry-run — preview 출력만. 실제 삭제는 `--apply` 플래그 필요.
//
// Cascade 가 Application 의 자식 행 (ApplicationStatusHistory, InterviewSlot,
// Assignment, Program → ProgramMeeting/Feedback/Certificate 등, Application-
// Comment) 까지 알아서 정리하므로 별도 처리 불필요.
//
// 사용 예:
//   # preview (안전)
//   DATABASE_URL=... npm exec --workspace=apps/api -- tsx scripts/cleanup-external-applications.ts
//
//   # 실제 삭제 (트랜잭션 안에서 진행 — 도중에 실패하면 전체 롤백)
//   DATABASE_URL=... npm exec --workspace=apps/api -- tsx scripts/cleanup-external-applications.ts --apply

const EXTERNAL_PROVIDERS = [
  PositionSourceProvider.BUDDIES,
  PositionSourceProvider.WANTED,
  PositionSourceProvider.OTHER
] as const;

const prisma = new PrismaClient();

async function summarize() {
  // provider 별 application 개수 + 기간 범위. SQL 조인 한 번으로 끝남.
  const rows = await prisma.$queryRaw<
    { provider: string; apps: bigint; earliest: Date | null; latest: Date | null }[]
  >`
    SELECT
      p."sourceProvider"::text AS provider,
      COUNT(a.id)::bigint AS apps,
      MIN(a."submittedAt") AS earliest,
      MAX(a."submittedAt") AS latest
    FROM "Application" a
    JOIN "Position" p ON p.id = a."positionId"
    WHERE p."sourceProvider" <> 'INTERNAL'
    GROUP BY p."sourceProvider"
    ORDER BY p."sourceProvider"
  `;

  const totalApps = await prisma.application.count();
  const willDelete = rows.reduce((acc, r) => acc + Number(r.apps), 0);

  console.info("--- Preview ---");
  if (rows.length === 0) {
    console.info("No external-source applications found. Nothing to delete.");
  } else {
    for (const r of rows) {
      console.info(
        `  ${r.provider.padEnd(10)} : ${String(Number(r.apps)).padStart(5)} apps  (${r.earliest?.toISOString() ?? "?"} → ${r.latest?.toISOString() ?? "?"})`
      );
    }
  }
  console.info("---");
  console.info(`Total applications  : ${totalApps}`);
  console.info(`Will be deleted     : ${willDelete}`);
  console.info(`Will remain         : ${totalApps - willDelete}`);
  return { rows, totalApps, willDelete };
}

async function applyDelete() {
  // 트랜잭션 안에서 — 도중 실패하면 전체 롤백.
  return prisma.$transaction(async (tx) => {
    const result = await tx.application.deleteMany({
      where: {
        position: {
          sourceProvider: { in: EXTERNAL_PROVIDERS as unknown as PositionSourceProvider[] }
        }
      }
    });
    const remaining = await tx.application.count();
    return { deleted: result.count, remaining };
  });
}

async function main() {
  const apply = process.argv.includes("--apply");

  console.info(`Mode: ${apply ? "APPLY (will delete)" : "DRY-RUN (preview only)"}`);
  const { willDelete } = await summarize();

  if (!apply) {
    console.info("\nDry-run only. Re-run with --apply to actually delete.");
    return;
  }
  if (willDelete === 0) {
    console.info("\nNothing to delete. Done.");
    return;
  }

  console.info("\nApplying delete in transaction...");
  const { deleted, remaining } = await applyDelete();
  console.info(`✅ Deleted ${deleted} applications. Remaining: ${remaining}.`);
}

main()
  .catch((error) => {
    console.error("[cleanup-external-applications] Fatal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
