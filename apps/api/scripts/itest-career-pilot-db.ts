// Phase 9 파일럿 데이터 흐름 통합 테스트(실 DB, 비-LLM). 신규 모델 CRUD + 순수 로직 연동.
// 안전: 생성분만 정리(임시 기수/사용자 데이터), 운영 데이터 무변경.
// 실행: set -a; . ./.env; set +a; npx tsx apps/api/scripts/itest-career-pilot-db.ts
import { PrismaClient } from "@prisma/client";
import { computeReadiness, computeFunnel, computeStudentStatus, sanitizeSurveyAnswers, estimateLlmCost, computeEngagement, type FunnelStudent, type ActivityEvent } from "../src/career-pilot";

const prisma = new PrismaClient();
const log = (...a: unknown[]) => console.log(...a);

async function main() {
  // 실제 학생 1명(등록자) 재사용 — 없으면 스킵.
  const enr = await prisma.careerEnrollment.findFirst({ orderBy: { createdAt: "desc" }, select: { studentUserId: true, cohortId: true } });
  if (!enr) {
    log("등록 학생 없음 — 스킵");
    await prisma.$disconnect();
    return;
  }
  const userId = enr.studentUserId;
  const ids = { surveyId: "", feedbackId: "", costId: "", activityIds: [] as string[] };
  const tmpCohortId = "__ITEST_PILOT__";
  try {
    // 1) 파일럿 config 를 담은 임시 기수(식별) — inviteCode unique.
    const cohort = await prisma.careerCohort.create({
      data: { id: tmpCohortId, university: "__ITEST__", name: "파일럿", inviteCode: `__ITEST_PILOT_${tmpCohortId.slice(-4)}`, isPilot: true, programVersion: "v2", featureFlags: { career_launch_v2: true } as object, participantLimit: 20, surveyConfiguration: { enabled: true } as object, monitoringConfiguration: { supportContact: "ops@aply", manualChecks: { operator_assigned: true, analytics_events: true, privacy_notice: true, test_accounts_verified: true, migration_applied: true, rollback_ready: true } } as object }
    });
    log(`  ✓ 파일럿 기수 생성(isPilot=${cohort.isPilot}, flags 설정)`);

    // 2) 준비 체크리스트 — 자동 항목 + 수동 체크 병합(순수 로직).
    const readiness = computeReadiness({
      cohortExists: true, startAt: true, endAt: true, weeksScheduledCount: 4, seminarsCount: 1,
      enrolledCount: 12, participantLimit: 20, featureFlagsSet: true, llmEnvReady: true, surveyConfigured: true, supportContactSet: true,
      manualChecks: { operator_assigned: true, analytics_events: true, privacy_notice: true, test_accounts_verified: true, migration_applied: true, rollback_ready: true }
    });
    if (!readiness.ready) throw new Error(`준비 체크리스트가 ready 여야 함(누락 ${readiness.requiredMissing.length})`);
    log(`  ✓ 준비 체크리스트 ready=${readiness.ready} (필수 누락 0)`);

    // 3) 설문 upsert — surveyKey 별 1건(중복 노출 방지). sanitize 로 정의 밖 키 제거.
    const clean = sanitizeSurveyAnswers("week1_end", { helped_target: 5, reco_trust: 4, bogus: 1 });
    if ("bogus" in clean) throw new Error("정의 밖 키가 제거되지 않음");
    const s1 = await prisma.careerPilotSurvey.upsert({ where: { studentUserId_surveyKey: { studentUserId: userId, surveyKey: "__itest_week1_end" } }, create: { studentUserId: userId, cohortId: tmpCohortId, surveyKey: "__itest_week1_end", answers: clean as object }, update: {} });
    ids.surveyId = s1.id;
    // 재upsert → 중복 생성 없이 동일 id.
    const s2 = await prisma.careerPilotSurvey.upsert({ where: { studentUserId_surveyKey: { studentUserId: userId, surveyKey: "__itest_week1_end" } }, create: { studentUserId: userId, cohortId: tmpCohortId, surveyKey: "__itest_week1_end", answers: {} as object }, update: {} });
    if (s1.id !== s2.id) throw new Error("설문 unique 중복 방지 실패");
    log(`  ✓ 설문 저장 + 중복 노출 방지(unique) 확인`);

    // 4) 정성 피드백 — 원문 없이 category/severity.
    const fb = await prisma.careerQualitativeFeedback.create({ data: { studentUserId: userId, cohortId: tmpCohortId, category: "want_human", severity: "high", currentWeek: 1 } });
    ids.feedbackId = fb.id;
    log(`  ✓ 정성 피드백(category=${fb.category}, severity=${fb.severity}, 원문 없음)`);

    // 5) LLM 비용 집계 upsert — 토큰/추정비용.
    const est = estimateLlmCost("gpt-4o-mini", 12000, 3000);
    const cost = await prisma.careerAiCostDaily.upsert({
      where: { cohortId_feature_dateKey_model_promptVersion: { cohortId: tmpCohortId, feature: "resume", dateKey: "2026-08-31", model: "gpt-4o-mini", promptVersion: "" } },
      create: { cohortId: tmpCohortId, feature: "resume", dateKey: "2026-08-31", model: "gpt-4o-mini", calls: 1, inputTokens: BigInt(12000), outputTokens: BigInt(3000), estCostUsd: est },
      update: { calls: { increment: 1 }, inputTokens: { increment: BigInt(12000) }, outputTokens: { increment: BigInt(3000) }, estCostUsd: { increment: est } }
    });
    ids.costId = cost.id;
    log(`  ✓ 비용 집계(estUsd=${est.toFixed(6)}, calls=${cost.calls})`);

    // 5b) 행동 이벤트(계기) — 주차 진입 3건(체류시간·재진입) + 제안 수락/거절.
    const baseT = Date.now() - 2 * 3_600_000;
    const evSpecs = [
      { kind: "week_enter", week: 1, at: new Date(baseT) },
      { kind: "week_enter", week: 1, at: new Date(baseT + 12 * 60000) },
      { kind: "suggestion_accept", week: 1, at: new Date(baseT + 15 * 60000) },
      { kind: "suggestion_reject", week: 1, at: new Date(baseT + 16 * 60000) }
    ];
    for (const e of evSpecs) {
      const row = await prisma.careerActivityEvent.create({ data: { studentUserId: userId, cohortId: tmpCohortId, kind: e.kind, week: e.week, createdAt: e.at } });
      ids.activityIds.push(row.id);
    }
    const actRows = await prisma.careerActivityEvent.findMany({ where: { cohortId: tmpCohortId }, select: { kind: true, week: true, createdAt: true } });
    const eng = computeEngagement(actRows.map((a): ActivityEvent => ({ kind: a.kind as ActivityEvent["kind"], week: a.week ?? null, atMs: new Date(a.createdAt).getTime() })));
    if (eng.byWeek[0].activeMinutes !== 12) throw new Error(`체류시간 집계 오류(기대 12, 실제 ${eng.byWeek[0].activeMinutes})`);
    if (eng.suggestion.acceptRatePct !== 50) throw new Error(`수락률 오류(기대 50, 실제 ${eng.suggestion.acceptRatePct})`);
    log(`  ✓ 행동 이벤트 계기: W1 체류 ${eng.byWeek[0].activeMinutes}분, 제안 수락률 ${eng.suggestion.acceptRatePct}%`);

    // 5c) 비용 promptVersion 차원(프롬프트 개선 전후 비교).
    await prisma.careerAiCostDaily.upsert({
      where: { cohortId_feature_dateKey_model_promptVersion: { cohortId: tmpCohortId, feature: "resume", dateKey: "2026-08-31", model: "gpt-4o-mini", promptVersion: "v2" } },
      create: { cohortId: tmpCohortId, feature: "resume", dateKey: "2026-08-31", model: "gpt-4o-mini", promptVersion: "v2", calls: 2, inputTokens: BigInt(1000), outputTokens: BigInt(200), estCostUsd: 0.001 },
      update: {}
    });
    const pvRows = await prisma.careerAiCostDaily.findMany({ where: { cohortId: tmpCohortId } });
    const versions = new Set(pvRows.map((r) => r.promptVersion));
    if (!versions.has("v2")) throw new Error("promptVersion 차원 분리 실패");
    log(`  ✓ 비용 promptVersion 차원 분리(버전 ${[...versions].join(",")})`);

    // 6) 상태/퍼널 순수 로직 — 실제 학생 진행 프록시.
    const status = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: true, daysSinceActivity: 1, weeksCompleted: 1, programCompleted: false, openInterventionPriority: null });
    const funnelStudents: FunnelStudent[] = [{ invitedAt: Date.now() - 3 * 864e5, steps: { invited: { reached: true, at: Date.now() - 3 * 864e5 }, registered: { reached: true, at: Date.now() - 3 * 864e5 }, week1_completed: { reached: true, at: Date.now() - 864e5 } } }];
    const funnel = computeFunnel(funnelStudents);
    log(`  ✓ 상태=${status.computed}, 퍼널 총 ${funnel.total}명 / ${funnel.steps.length}단계`);

    log("\n✅ Phase 9 파일럿 데이터 흐름 통합 테스트 통과");
  } finally {
    if (ids.activityIds.length) await prisma.careerActivityEvent.deleteMany({ where: { id: { in: ids.activityIds } } }).catch(() => null);
    await prisma.careerAiCostDaily.deleteMany({ where: { cohortId: tmpCohortId } }).catch(() => null);
    if (ids.costId) await prisma.careerAiCostDaily.deleteMany({ where: { id: ids.costId } }).catch(() => null);
    if (ids.feedbackId) await prisma.careerQualitativeFeedback.deleteMany({ where: { id: ids.feedbackId } }).catch(() => null);
    if (ids.surveyId) await prisma.careerPilotSurvey.deleteMany({ where: { id: ids.surveyId } }).catch(() => null);
    await prisma.careerCohort.deleteMany({ where: { id: tmpCohortId } }).catch(() => null);
    log("  ✓ 테스트 데이터 정리 완료(DB 원상복구)");
    await prisma.$disconnect();
  }
}
main().catch(async (e) => {
  console.error("통합 테스트 실패:", e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
