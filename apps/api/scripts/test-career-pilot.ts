// Career Pilot(Phase 9) 순수 로직 단위 테스트. 실행: npx tsx apps/api/scripts/test-career-pilot.ts
import assert from "node:assert/strict";
import {
  computeStudentStatus,
  resolveStudentStatus,
  computeFunnel,
  evaluateStopConditions,
  computeSlaStatus,
  slaKeyForIntervention,
  computeReadiness,
  sanitizeSurveyAnswers,
  severityForCategory,
  estimateLlmCost,
  surveyResponseSchema,
  SURVEY_KEYS,
  FUNNEL_STEPS,
  computeEngagement,
  activityEventSchema,
  SESSION_GAP_MS,
  REENTRY_GAP_MS,
  type FunnelStudent,
  type StopMetrics,
  type ActivityEvent
} from "../src/career-pilot";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const HOUR = 3_600_000;
const DAY = 86_400_000;
const now = 1_700_000_000_000; // 고정 기준시각(테스트 결정성)

// ── 학생 상태 ──
test("computeStudentStatus: 미가입 → invited", () => {
  const r = computeStudentStatus({ enrolled: false, registered: false, hadAnyActivity: false, daysSinceActivity: null, weeksCompleted: 0, programCompleted: false, openInterventionPriority: null });
  assert.equal(r.computed, "invited");
  assert.equal(r.needsOperatorConfirm, false);
});

test("computeStudentStatus: 완주 → completed(최우선)", () => {
  const r = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: true, daysSinceActivity: 10, weeksCompleted: 4, programCompleted: true, openInterventionPriority: "high" });
  assert.equal(r.computed, "completed");
});

test("computeStudentStatus: critical 개입 → intervention_required + 운영자 확정 필요", () => {
  const r = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: true, daysSinceActivity: 1, weeksCompleted: 2, programCompleted: false, openInterventionPriority: "critical" });
  assert.equal(r.computed, "intervention_required");
  assert.equal(r.needsOperatorConfirm, true);
});

test("computeStudentStatus: 3일 이상 정체 → at_risk", () => {
  const r = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: true, daysSinceActivity: 4, weeksCompleted: 1, programCompleted: false, openInterventionPriority: null });
  assert.equal(r.computed, "at_risk");
  assert.equal(r.needsOperatorConfirm, false);
});

test("computeStudentStatus: 최근 활동 → active", () => {
  const r = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: true, daysSinceActivity: 1, weeksCompleted: 2, programCompleted: false, openInterventionPriority: null });
  assert.equal(r.computed, "active");
});

test("computeStudentStatus: 가입만 하고 활동 없음 → onboarding", () => {
  const r = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: false, daysSinceActivity: null, weeksCompleted: 0, programCompleted: false, openInterventionPriority: null });
  assert.equal(r.computed, "onboarding");
});

test("resolveStudentStatus: 운영자 override 가 자동 계산보다 우선", () => {
  const auto = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: true, daysSinceActivity: 4, weeksCompleted: 1, programCompleted: false, openInterventionPriority: null });
  assert.equal(auto.computed, "at_risk");
  const r = resolveStudentStatus(auto, "paused");
  assert.equal(r.status, "paused");
  assert.equal(r.source, "operator");
});

test("resolveStudentStatus: override 없으면 자동값 + source=auto", () => {
  const auto = computeStudentStatus({ enrolled: true, registered: true, hadAnyActivity: true, daysSinceActivity: 1, weeksCompleted: 2, programCompleted: false, openInterventionPriority: null });
  const r = resolveStudentStatus(auto, null);
  assert.equal(r.status, "active");
  assert.equal(r.source, "auto");
});

// ── 퍼널 ──
test("computeFunnel: 단계별 인원·전환율·소요시간", () => {
  const students: FunnelStudent[] = [
    { invitedAt: now, steps: { invited: { reached: true, at: now }, registered: { reached: true, at: now + 2 * HOUR }, first_consult: { reached: true, at: now + 5 * HOUR } } },
    { invitedAt: now, steps: { invited: { reached: true, at: now }, registered: { reached: true, at: now + 4 * HOUR } } },
    { invitedAt: now, steps: { invited: { reached: true, at: now } } }
  ];
  const f = computeFunnel(students);
  assert.equal(f.total, 3);
  assert.equal(f.steps[0].count, 3); // invited
  assert.equal(f.steps[1].count, 2); // registered
  assert.equal(f.steps[1].conversionFromPrev, 67); // 2/3
  assert.equal(f.steps[1].conversionFromStart, 67);
  assert.equal(f.steps[1].medianHoursFromStart, 3); // median(2h,4h)=3h
  assert.equal(f.steps[2].count, 1); // first_consult
  assert.equal(f.steps.length, FUNNEL_STEPS.length);
});

test("computeFunnel: 빈 파일럿(0명)도 안전", () => {
  const f = computeFunnel([]);
  assert.equal(f.total, 0);
  assert.equal(f.steps[0].count, 0);
  assert.equal(f.steps[0].conversionFromStart, 0);
});

// ── 중단 조건 ──
test("evaluateStopConditions: critical 관측 시 anyCritical=true", () => {
  const m: StopMetrics = { artifactSaveFailures: 2, confirmedReaskCount: 0, interviewAnswerLosses: 0, llmCostToday: 1, llmCostBaselineDaily: 1, p0Count: 0, p1RepeatMax: 0, maxStepDropoffRate: 0, funnelSampleSize: 3, interventionListAvailable: true };
  const r = evaluateStopConditions(m);
  assert.ok(r.triggered.some((t) => t.key === "artifact_save_failure"));
  assert.equal(r.anyCritical, true);
});

test("evaluateStopConditions: 비용 3배 초과 감지, 표본 작으면 과반이탈 미판정", () => {
  const m: StopMetrics = { artifactSaveFailures: 0, confirmedReaskCount: 0, interviewAnswerLosses: 0, llmCostToday: 4, llmCostBaselineDaily: 1, p0Count: 0, p1RepeatMax: 0, maxStepDropoffRate: 80, funnelSampleSize: 5, interventionListAvailable: true };
  const r = evaluateStopConditions(m);
  assert.ok(r.triggered.some((t) => t.key === "llm_cost_spike"));
  assert.ok(!r.triggered.some((t) => t.key === "majority_dropoff")); // 표본<8
});

test("evaluateStopConditions: 정상 상태면 triggered 비어있음", () => {
  const m: StopMetrics = { artifactSaveFailures: 0, confirmedReaskCount: 0, interviewAnswerLosses: 0, llmCostToday: 1, llmCostBaselineDaily: 1, p0Count: 0, p1RepeatMax: 0, maxStepDropoffRate: 10, funnelSampleSize: 12, interventionListAvailable: true };
  const r = evaluateStopConditions(m);
  assert.equal(r.triggered.length, 0);
  assert.equal(r.anyCritical, false);
});

// ── SLA ──
test("slaKeyForIntervention: critical → p0(즉시)", () => {
  assert.equal(slaKeyForIntervention("critical", []), "p0");
});

test("slaKeyForIntervention: 사람 상담 요청 우선 매핑", () => {
  assert.equal(slaKeyForIntervention("medium", ["human_review_requested"]), "human_request");
});

test("computeSlaStatus: 미응답 + 기한 초과 → breached", () => {
  const r = computeSlaStatus({ createdAtMs: now - 30 * HOUR, firstResponseAtMs: null, priority: "high", reasonCodes: [], nowMs: now });
  assert.equal(r.slaKey, "p1"); // high → 24h
  assert.equal(r.breached, true);
  assert.equal(r.hoursOverdue, 6);
});

test("computeSlaStatus: 기한 내 응답 완료 → breached=false", () => {
  const r = computeSlaStatus({ createdAtMs: now - 30 * HOUR, firstResponseAtMs: now - 20 * HOUR, priority: "high", reasonCodes: [], nowMs: now });
  assert.equal(r.breached, false);
});

test("computeSlaStatus: p0 는 즉시(maxHours=0)", () => {
  const r = computeSlaStatus({ createdAtMs: now - 1 * HOUR, firstResponseAtMs: null, priority: "critical", reasonCodes: [], nowMs: now });
  assert.equal(r.slaKey, "p0");
  assert.equal(r.breached, true);
});

// ── 준비 체크리스트 ──
test("computeReadiness: 필수 미충족 시 ready=false + requiredMissing", () => {
  const r = computeReadiness({
    cohortExists: true, startAt: true, endAt: false, weeksScheduledCount: 4, seminarsCount: 1,
    enrolledCount: 12, participantLimit: 20, featureFlagsSet: true, llmEnvReady: true, surveyConfigured: true, supportContactSet: true,
    manualChecks: { operator_assigned: true, analytics_events: true, privacy_notice: true, test_accounts_verified: true, migration_applied: true, rollback_ready: true }
  });
  assert.equal(r.ready, false);
  assert.ok(r.requiredMissing.some((i) => i.key === "dates_set")); // endAt=false
});

test("computeReadiness: 모든 필수 충족 시 ready=true", () => {
  const r = computeReadiness({
    cohortExists: true, startAt: true, endAt: true, weeksScheduledCount: 4, seminarsCount: 1,
    enrolledCount: 12, participantLimit: 20, featureFlagsSet: true, llmEnvReady: true, surveyConfigured: true, supportContactSet: true,
    manualChecks: { operator_assigned: true, analytics_events: true, privacy_notice: true, test_accounts_verified: true, migration_applied: true, rollback_ready: true }
  });
  assert.equal(r.ready, true);
  assert.equal(r.requiredMissing.length, 0);
});

test("computeReadiness: 정원 초과 시 참여자 항목 실패", () => {
  const r = computeReadiness({
    cohortExists: true, startAt: true, endAt: true, weeksScheduledCount: 4, seminarsCount: 1,
    enrolledCount: 25, participantLimit: 20, featureFlagsSet: true, llmEnvReady: true, surveyConfigured: true, supportContactSet: true,
    manualChecks: {}
  });
  const item = r.items.find((i) => i.key === "participants_enrolled")!;
  assert.equal(item.ok, false);
});

// ── 설문 ──
test("sanitizeSurveyAnswers: 정의 밖 키 제거", () => {
  const out = sanitizeSurveyAnswers("week1_end", { helped_target: 5, bogus: 3, reco_trust: 4 });
  assert.deepEqual(Object.keys(out).sort(), ["helped_target", "reco_trust"]);
});

test("surveyResponseSchema: 척도 범위 밖(6) 거부", () => {
  const r = surveyResponseSchema.safeParse({ surveyKey: "week1_end", answers: { helped_target: 6 } });
  assert.equal(r.success, false);
});

test("surveyResponseSchema: 정상 응답 통과", () => {
  const r = surveyResponseSchema.safeParse({ surveyKey: "consult_end", answers: { helpful: 5, understood_me: 4 }, comment: "좋았어요" });
  assert.equal(r.success, true);
});

test("SURVEY_KEYS: 6종 설문 정의", () => {
  assert.equal(SURVEY_KEYS.length, 6);
});

// ── 정성 피드백 ──
test("severityForCategory: content_lost=critical, too_many_questions=medium", () => {
  assert.equal(severityForCategory("content_lost"), "critical");
  assert.equal(severityForCategory("too_many_questions"), "medium");
});

// ── 비용 추정 ──
test("estimateLlmCost: gpt-4o-mini 100k in / 20k out", () => {
  const cost = estimateLlmCost("gpt-4o-mini", 100_000, 20_000);
  // 0.1M*0.15 + 0.02M*0.6 = 0.015 + 0.012 = 0.027
  assert.ok(Math.abs(cost - 0.027) < 1e-9);
});

test("estimateLlmCost: 알 수 없는 모델은 기본 단가", () => {
  const cost = estimateLlmCost("unknown-model", 1_000_000, 0);
  assert.equal(cost, 2.5);
});

test("estimateLlmCost: prefix 매칭(gpt-5-mini-2025 → gpt-5-mini)", () => {
  const cost = estimateLlmCost("gpt-5-mini-2025-01", 1_000_000, 0);
  assert.equal(cost, 0.25);
});

// ── 참여(engagement) 계기 ──
test("computeEngagement: 체류시간(세션 내 누적)·재진입 산출", () => {
  const base = now;
  const events: ActivityEvent[] = [
    { kind: "week_enter", week: 1, atMs: base },
    { kind: "week_enter", week: 1, atMs: base + 10 * 60000 }, // +10분(같은 세션)
    { kind: "week_enter", week: 1, atMs: base + 20 * 60000 }, // +10분(같은 세션) → 누적 20분
    { kind: "week_enter", week: 1, atMs: base + REENTRY_GAP_MS + 25 * 60000 } // 6h+ 후 복귀 → 재진입
  ];
  const r = computeEngagement(events);
  const w1 = r.byWeek.find((w) => w.week === 1)!;
  assert.equal(w1.enters, 4);
  assert.equal(w1.activeMinutes, 20); // 큰 간격은 체류에서 제외
  assert.equal(w1.reEntries, 1);
});

test("computeEngagement: 큰 간격(세션 초과)은 체류에 미포함", () => {
  const events: ActivityEvent[] = [
    { kind: "week_enter", week: 2, atMs: now },
    { kind: "week_enter", week: 2, atMs: now + SESSION_GAP_MS + 1 } // 세션 경계 초과
  ];
  const w2 = computeEngagement(events).byWeek.find((w) => w.week === 2)!;
  assert.equal(w2.activeMinutes, 0);
});

test("computeEngagement: 제안 수락률 + 신호 카운트", () => {
  const events: ActivityEvent[] = [
    { kind: "suggestion_accept", week: 2, atMs: now },
    { kind: "suggestion_accept", week: 2, atMs: now },
    { kind: "suggestion_modify", week: 2, atMs: now },
    { kind: "suggestion_reject", week: 2, atMs: now },
    { kind: "skip", week: 1, atMs: now },
    { kind: "unsure", week: 1, atMs: now },
    { kind: "ask_ai", week: 1, atMs: now },
    { kind: "next_action_click", week: null, atMs: now },
    { kind: "league_view", week: null, atMs: now }
  ];
  const r = computeEngagement(events);
  assert.equal(r.suggestion.acceptRatePct, 50); // 2/(2+1+1)
  assert.equal(r.signals.skip, 1);
  assert.equal(r.signals.unsure, 1);
  assert.equal(r.signals.askAi, 1);
  assert.equal(r.signals.nextActionClicks, 1);
  assert.equal(r.signals.leagueViews, 1);
});

test("computeEngagement: 빈 이벤트 안전(acceptRate null)", () => {
  const r = computeEngagement([]);
  assert.equal(r.suggestion.acceptRatePct, null);
  assert.equal(r.byWeek.length, 4);
  assert.equal(r.byWeek[0].enters, 0);
});

test("activityEventSchema: 허용되지 않은 kind 거부 / 정상 통과", () => {
  assert.equal(activityEventSchema.safeParse({ kind: "bogus" }).success, false);
  assert.equal(activityEventSchema.safeParse({ kind: "week_enter", week: 2 }).success, true);
});

console.log(`\n✅ career-pilot 단위 테스트 ${passed}개 통과`);
