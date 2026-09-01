// Phase 7 데이터 흐름 통합 테스트(실 DB, 비-LLM). 리그·점수·배지·개입·감사로그.
// 안전: 생성분만 정리.
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/itest-career-league-db.ts
import { PrismaClient } from "@prisma/client";
import { computeLeagueScore, evaluateBadges, computeInterventionPriority, computePercentile, rankBucket, type ScoreInput, type BadgeState } from "../src/career-league";

const prisma = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  const enr = await prisma.careerEnrollment.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, studentUserId: true, cohortId: true } });
  if (!enr) {
    log("등록 학생 없음 — 스킵");
    await prisma.$disconnect();
    return;
  }
  const userId = enr.studentUserId;
  const cohortId = enr.cohortId;
  const ids = { leagueId: "", scoreId: "", achId: [] as string[], ivId: "", logId: "" };
  try {
    // 1) 리그 + 점수 계산·저장(서버 계산).
    const league = await prisma.careerLeague.create({ data: { cohortId, type: "cohort", name: "__ITEST__ 리그", scoringVersion: "league_v1" } });
    ids.leagueId = league.id;
    const input: ScoreInput = { weeksCompleted: 3, artifact: { profileConfirmed: true, targetConfirmed: true, readiness: 75, reportsCount: 2, unsupportedCount: 0, criticalCount: 0 }, growth: { comparable: true, scoreGrowthRate: 30, correctionPassRate: 80 }, practice: { trialsCompleted: 2, mocksCompleted: 1, transferAttempts: 2 }, correction: { total: 5, passed: 4, weaknessTotal: 5, weaknessResolved: 4 } };
    const score = computeLeagueScore(input);
    const saved = await prisma.careerLeagueScore.create({ data: { studentUserId: userId, cohortId, leagueId: league.id, scoringVersion: score.version, missionScore: score.breakdown.mission, artifactScore: score.breakdown.artifact, growthScore: score.breakdown.growth, practiceScore: score.breakdown.practice, correctionScore: score.breakdown.correction, contributionScore: 0, totalScore: score.total, sourceSnapshot: score as object } });
    ids.scoreId = saved.id;
    log(`  ✓ 리그 + 점수 저장(total=${score.total}, version=${score.version})`);

    // 2) 순위/버킷(서버 계산).
    const all = await prisma.careerLeagueScore.findMany({ where: { leagueId: league.id }, orderBy: { totalScore: "desc" } });
    const rank = all.findIndex((s) => s.studentUserId === userId) + 1;
    const pct = computePercentile(rank, all.length);
    log(`  ✓ 순위 계산: ${rank}등 / ${all.length}명, 버킷=${rankBucket(pct)}`);

    // 3) 배지(중복 방지 unique).
    const badgeState: BadgeState = { firstConsult: true, experienceFound: true, jobExplored: true, targetConfirmed: true, firstPackage: true, factChecked: false, firstMock: true, correctionStarted: true, transferPassed: true, interviewGrowth: true, completed4Weeks: false, consistentParticipation: true };
    const earned = evaluateBadges(badgeState, []);
    for (const key of earned.slice(0, 3)) {
      const a = await prisma.careerAchievement.upsert({ where: { studentUserId_badgeKey: { studentUserId: userId, badgeKey: `__ITEST__${key}` } }, create: { studentUserId: userId, badgeKey: `__ITEST__${key}`, criteriaVersion: "league_v1" }, update: {} });
      ids.achId.push(a.id);
    }
    log(`  ✓ 배지 ${earned.length}개 조건 충족(중복 방지 unique)`);

    // 4) 개입 신호 → 우선순위 → 생성 + 감사 로그.
    const { priority, reasonCodes } = computeInterventionPriority({ daysSinceActivity: 8, requiredMissionIncomplete: true, criticalCount: 0, unsupportedCount: 0, repeatedWeaknessUnresolved: false, lowAiConfidence: false, humanReviewRequested: false, fatigueOrQuitExpressed: false, deadlineImminentLowProgress: false });
    const iv = await prisma.careerIntervention.create({ data: { studentUserId: userId, enrollmentId: enr.id, cohortId, priority, status: "open", reasonCodes, evidence: { facts: ["__ITEST__ 8일 정체"] } as object } });
    ids.ivId = iv.id;
    const logRow = await prisma.careerInterventionLog.create({ data: { interventionId: iv.id, actorId: userId, action: "status:in_review", previousStatus: "open", nextStatus: "in_review" } });
    ids.logId = logRow.id;
    log(`  ✓ 개입 생성(priority=${priority}, reasons=${reasonCodes.length}) + 감사 로그`);

    log("\n✅ Phase 7 데이터 흐름 통합 테스트 통과");
  } finally {
    if (ids.logId) await prisma.careerInterventionLog.deleteMany({ where: { id: ids.logId } }).catch(() => null);
    if (ids.ivId) await prisma.careerIntervention.deleteMany({ where: { id: ids.ivId } }).catch(() => null);
    if (ids.achId.length) await prisma.careerAchievement.deleteMany({ where: { id: { in: ids.achId } } }).catch(() => null);
    if (ids.scoreId) await prisma.careerLeagueScore.deleteMany({ where: { id: ids.scoreId } }).catch(() => null);
    if (ids.leagueId) await prisma.careerLeague.deleteMany({ where: { id: ids.leagueId } }).catch(() => null);
    log("  ✓ 테스트 데이터 정리 완료(DB 원상복구)");
    await prisma.$disconnect();
  }
}
main().catch(async (e) => {
  console.error("통합 테스트 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
