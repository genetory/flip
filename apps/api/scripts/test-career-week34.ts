// Career Week 3~4 순수 로직 단위 테스트. 실행: npx tsx apps/api/scripts/test-career-week34.ts
import assert from "node:assert/strict";
import {
  answerEvalTotal,
  weaknessLabel,
  isWeaknessType,
  followUpNeeded,
  evaluateCorrectionPass,
  canTransitionCorrection,
  computeGrowth,
  computeWeek3Completion,
  computeWeek4Completion,
  INTERVIEW_LIMITS,
  WEAKNESS_TYPES,
  AnswerEvaluationSchema,
  WeaknessAnalysisSchema,
  GrowthReportSchema
} from "../src/career-week34";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
console.log("Career Week 3~4 순수 로직 테스트");

test("답변 8축 평균 총점", () => {
  assert.equal(answerEvalTotal({ questionUnderstanding: 80, relevance: 80, specificity: 80, evidence: 80, structure: 80, jobConnection: 80, consistency: 80, delivery: 80 }), 80);
});

test("취약패턴 taxonomy 17종 + 한국어 라벨", () => {
  assert.equal(WEAKNESS_TYPES.length, 17);
  assert.ok(isWeaknessType("UNCLEAR_ROLE"));
  assert.ok(weaknessLabel("UNCLEAR_ROLE").includes("본인이 한 행동"));
  assert.equal(weaknessLabel("UNKNOWN_CODE"), "UNKNOWN_CODE"); // 미지정은 원본
});

test("꼬리질문 필요 조건(추상/근거 약함)", () => {
  assert.equal(followUpNeeded({ scores: { specificity: 40, evidence: 40 } }), true);
  assert.equal(followUpNeeded({ scores: { specificity: 90, evidence: 90 }, weaknessTypes: ["UNCLEAR_ROLE"] }), true);
  assert.equal(followUpNeeded({ scores: { specificity: 90, evidence: 90 }, weaknessTypes: [] }), false);
});

test("오답 통과 판정: 점수만으로 통과 아님(필수 조건 종합)", () => {
  // 필수 충족 + 선택 1개 → 통과
  const pass = evaluateCorrectionPass({ sameQuestionImproved: true, similarUsedStructure: true, consistentWithDocument: true, evidenceConcrete: true, roleClear: true, jobConnected: false, noNewCritical: true, aiConfidence: 0.8 });
  assert.equal(pass.passed, true);
  assert.equal(pass.needsHumanReview, false);
  // 유사질문 구조 미사용(필수) → 미통과
  const fail = evaluateCorrectionPass({ sameQuestionImproved: true, similarUsedStructure: false, consistentWithDocument: true, evidenceConcrete: true, roleClear: true, jobConnected: true, noNewCritical: true, aiConfidence: 0.3 });
  assert.equal(fail.passed, false);
  assert.equal(fail.needsHumanReview, true); // 낮은 확신도
});

test("오답 상태 전이 규칙", () => {
  assert.equal(canTransitionCorrection("discovered", "coaching"), true);
  assert.equal(canTransitionCorrection("coaching", "retrying"), true);
  assert.equal(canTransitionCorrection("retrying", "transfer_test"), true);
  assert.equal(canTransitionCorrection("transfer_test", "passed"), true);
  assert.equal(canTransitionCorrection("discovered", "passed"), false); // 건너뛰기 금지
  assert.equal(canTransitionCorrection("passed", "retrying"), false);
});

test("성장률 11지표(총점+취약+오답통과율+축변화)", () => {
  const g = computeGrowth({
    initialTotal: 50, finalTotal: 70, initialAxes: { evidence: 40, consistency: 50, jobConnection: 45 }, finalAxes: { evidence: 65, consistency: 60, jobConnection: 60 },
    correctionsTotal: 5, correctionsPassed: 4, transferTotal: 4, transferPassed: 3, weaknessesTotal: 6, weaknessesResolved: 4, followupHandled: 0.6, scoringVersion: "iv_scoring_v1"
  });
  assert.equal(g.scoreDelta, 20);
  assert.equal(g.scoreGrowthRate, 40);
  assert.equal(g.correctionPassRate, 80);
  assert.equal(g.transferPassRate, 75);
  assert.equal(g.weaknessResolvedCount, 4);
  assert.equal(g.remainingWeaknessCount, 2);
  assert.equal(g.evidenceChange, 25);
  assert.equal(g.scoringVersion, "iv_scoring_v1");
});

test("비용/피로 제한 상수", () => {
  assert.equal(INTERVIEW_LIMITS.maxRetriesPerQuestion, 2);
  assert.ok(INTERVIEW_LIMITS.maxCoreQuestions >= INTERVIEW_LIMITS.minCoreQuestions);
});

test("완료 판정: Week3 9항목 / Week4 7항목", () => {
  const w3 = computeWeek3Completion({ packageExists: true, strategyViewed: true, initialMockCompleted: true, minQuestionsAnswered: true, perQuestionEvaluated: true, weaknessAnalyzed: true, correctionNotes: 5, reportViewed: true, trainingPlanCreated: true });
  assert.equal(w3.complete, true);
  assert.equal(w3.doneCount, 9);
  const w3partial = computeWeek3Completion({ packageExists: true, strategyViewed: true, initialMockCompleted: true, minQuestionsAnswered: true, perQuestionEvaluated: true, weaknessAnalyzed: true, correctionNotes: 3, reportViewed: false, trainingPlanCreated: false });
  assert.equal(w3partial.complete, false);
  const w4 = computeWeek4Completion({ correctionsTrained: 5, sameQuestionRetried: true, requiredTransferDone: true, finalMockCompleted: true, comparisonDone: true, growthReportExists: true, plan30Viewed: true });
  assert.equal(w4.complete, true);
  assert.equal(w4.doneCount, 7);
});

test("zod 스키마 파싱", () => {
  assert.ok(AnswerEvaluationSchema.safeParse({ scores: { questionUnderstanding: 70, relevance: 70, specificity: 70, evidence: 70, structure: 70, jobConnection: 70, consistency: 70, delivery: 70 }, total: 70 }).success);
  assert.ok(WeaknessAnalysisSchema.safeParse({ weaknesses: [{ weaknessType: "ABSTRACT_ANSWER", title: "추상적", occurrenceCount: 3 }] }).success);
  assert.ok(GrowthReportSchema.safeParse({}).success);
});

console.log(`\n✅ 전체 ${passed}개 테스트 통과`);
