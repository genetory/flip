// Career League(Phase 7) 순수 로직 단위 테스트. 실행: npx tsx apps/api/scripts/test-career-league.ts
import assert from "node:assert/strict";
import {
  computeLeagueScore,
  computeNextActions,
  evaluateBadges,
  computeInterventionPriority,
  canTransitionIntervention,
  assignJobLeagues,
  rankBucket,
  shouldHideRank,
  computePercentile,
  SCORE_WEIGHTS,
  LEAGUE_SCORING_VERSION,
  BADGES,
  type ScoreInput,
  type BadgeState
} from "../src/career-league";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
console.log("Career League 순수 로직 테스트");

const emptyInput: ScoreInput = { weeksCompleted: 0, artifact: { profileConfirmed: false, targetConfirmed: false, readiness: null, reportsCount: 0, unsupportedCount: 0, criticalCount: 0 }, growth: { comparable: false, scoreGrowthRate: null, correctionPassRate: null }, practice: { trialsCompleted: 0, mocksCompleted: 0, transferAttempts: 0 }, correction: { total: 0, passed: 0, weaknessTotal: 0, weaknessResolved: 0 } };

test("점수 0~100 + 버전 + contribution 비활성 정규화", () => {
  const zero = computeLeagueScore(emptyInput);
  assert.equal(zero.total, 0);
  assert.equal(zero.version, LEAGUE_SCORING_VERSION);
  assert.ok(zero.notes.includes("contribution_disabled"));
  const full: ScoreInput = { weeksCompleted: 4, artifact: { profileConfirmed: true, targetConfirmed: true, readiness: 90, reportsCount: 2, unsupportedCount: 0, criticalCount: 0 }, growth: { comparable: true, scoreGrowthRate: 40, correctionPassRate: 90 }, practice: { trialsCompleted: 2, mocksCompleted: 2, transferAttempts: 3 }, correction: { total: 5, passed: 5, weaknessTotal: 5, weaknessResolved: 5 } };
  const f = computeLeagueScore(full);
  assert.ok(f.total >= 90 && f.total <= 100);
});

test("가중치 합=1(6항목)", () => {
  const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

test("어뷰징 방지: 성장 비교불가시 0, 실전 캡, 오답은 통과기준", () => {
  const noGrowth = computeLeagueScore({ ...emptyInput, growth: { comparable: false, scoreGrowthRate: 999, correctionPassRate: 999 } });
  assert.equal(noGrowth.breakdown.growth, 0); // 비교불가 → 임의 생성 금지
  // 실전훈련 캡(무한 반복 방지)
  const overPractice = computeLeagueScore({ ...emptyInput, practice: { trialsCompleted: 99, mocksCompleted: 99, transferAttempts: 99 } });
  assert.ok(overPractice.breakdown.practice <= 100);
  // 오답: 재도전 많아도 통과 없으면 0
  const noPass = computeLeagueScore({ ...emptyInput, correction: { total: 5, passed: 0, weaknessTotal: 5, weaknessResolved: 0 } });
  assert.equal(noPass.breakdown.correction, 0);
});

test("다음 행동: 예상 점수 변화(서버 계산·양수) 상위", () => {
  const actions = computeNextActions(emptyInput);
  assert.ok(actions.length > 0 && actions.length <= 3);
  assert.ok(actions.every((a) => a.projectedDelta >= 0));
  // 미션 완료가 큰 영향
  assert.ok(actions.some((a) => a.key === "complete_week"));
});

test("리그 배정: 최소인원 미달 직무군은 mixed/cohort 병합", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ enrollmentId: `m${i}`, jobKey: "marketing" }));
  const few = [{ enrollmentId: "x1", jobKey: "finance" }, { enrollmentId: "x2", jobKey: "hr" }];
  const assigned = assignJobLeagues([...many, ...few]);
  assert.equal(assigned["m0"], "marketing"); // 12명 → 자체 리그
  assert.notEqual(assigned["x1"], "finance"); // 소수 → 병합
});

test("순위 버킷 + 소규모 숨김 + 백분위", () => {
  assert.equal(rankBucket(95), "top");
  assert.equal(rankBucket(70), "upper");
  assert.equal(rankBucket(40), "middle");
  assert.equal(rankBucket(10), "lower");
  assert.equal(shouldHideRank(4), true); // 5명 미만 숨김
  assert.equal(shouldHideRank(10), false);
  assert.equal(computePercentile(1, 10), 100); // 1등
});

test("배지: 중복 방지 + 조건 충족만", () => {
  const state: BadgeState = { firstConsult: true, experienceFound: true, jobExplored: false, targetConfirmed: true, firstPackage: false, factChecked: false, firstMock: false, correctionStarted: false, transferPassed: false, interviewGrowth: false, completed4Weeks: false, consistentParticipation: false };
  const earned = evaluateBadges(state, []);
  assert.ok(earned.includes("first_consult"));
  assert.ok(earned.includes("target_confirmed"));
  assert.ok(!earned.includes("first_mock"));
  // 이미 획득한 건 재부여 안 함
  assert.ok(!evaluateBadges(state, ["first_consult"]).includes("first_consult"));
  assert.equal(BADGES.length, 12);
});

test("개입 우선순위: 규칙 기반(사람검토→critical, 정체7일→high)", () => {
  const critical = computeInterventionPriority({ daysSinceActivity: 1, requiredMissionIncomplete: false, criticalCount: 0, unsupportedCount: 0, repeatedWeaknessUnresolved: false, lowAiConfidence: false, humanReviewRequested: true, fatigueOrQuitExpressed: false, deadlineImminentLowProgress: false });
  assert.equal(critical.priority, "critical");
  assert.ok(critical.reasonCodes.includes("human_review_requested"));
  const high = computeInterventionPriority({ daysSinceActivity: 8, requiredMissionIncomplete: true, criticalCount: 0, unsupportedCount: 0, repeatedWeaknessUnresolved: false, lowAiConfidence: false, humanReviewRequested: false, fatigueOrQuitExpressed: false, deadlineImminentLowProgress: false });
  assert.equal(high.priority, "high");
  const low = computeInterventionPriority({ daysSinceActivity: 1, requiredMissionIncomplete: false, criticalCount: 0, unsupportedCount: 0, repeatedWeaknessUnresolved: false, lowAiConfidence: false, humanReviewRequested: false, fatigueOrQuitExpressed: false, deadlineImminentLowProgress: false });
  assert.equal(low.priority, "low");
});

test("개입 상태 전이 규칙", () => {
  assert.equal(canTransitionIntervention("open", "assigned"), true);
  assert.equal(canTransitionIntervention("assigned", "resolved"), true);
  assert.equal(canTransitionIntervention("resolved", "assigned"), false);
  assert.equal(canTransitionIntervention("resolved", "open"), true);
});

console.log(`\n✅ 전체 ${passed}개 테스트 통과`);
