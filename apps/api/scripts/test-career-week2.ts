// Career Week 2 순수 로직 단위 테스트. 실행: npx tsx apps/api/scripts/test-career-week2.ts
import assert from "node:assert/strict";
import {
  RESUME_SCORE_WEIGHTS,
  READINESS_WEIGHTS,
  resumeScoreTotal,
  coverScoreTotal,
  jdMatchTotal,
  computeApplicationReadiness,
  computeWeek2Completion,
  countUnsupported,
  countCriticalUnresolved,
  countByStatus,
  JdStructuredSchema,
  JdAnalysisSchema,
  ConsistencyResultSchema,
  InterviewQuestionSetSchema,
  SourceLinkSchema,
  SCORE_WEIGHTS_VERSION,
  type SourceLink,
  type ConsistencyFinding
} from "../src/career-week2";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
console.log("Career Week 2 순수 로직 테스트");

test("점수 가중치는 중앙 설정 + 합=1", () => {
  const sum = Object.values(RESUME_SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
  const rsum = Object.values(READINESS_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(rsum - 1) < 1e-9);
});

test("가중 총점 계산", () => {
  const total = resumeScoreTotal({ baseCompleteness: 80, experienceSpecificity: 80, jobRelevance: 80, evidenceReliability: 80, readability: 80, jdAlignment: 80 });
  assert.equal(total, 80);
  assert.equal(coverScoreTotal({ promptFulfillment: 60, experienceSpecificity: 60, motivationConnection: 60, jobRelevance: 60, evidenceReliability: 60, clarity: 60 }), 60);
  assert.equal(jdMatchTotal({ requiredCoverage: 100, preferredCoverage: 0, relatedExperience: 0, skillsCerts: 0 }), 45); // requiredCoverage 가중 0.45
});

test("Application Readiness 종합 + critical 게이트", () => {
  const r = computeApplicationReadiness({ resumeTotal: 80, coverTotal: 70, jdMatchTotal: 60, unsupportedCount: 0, criticalUnresolved: 0 });
  assert.equal(r.version, SCORE_WEIGHTS_VERSION);
  assert.ok(r.score > 0 && r.score <= 100);
  assert.equal(r.ready, true);
  // critical 있으면 blocker + ready=false
  const r2 = computeApplicationReadiness({ resumeTotal: 90, coverTotal: 90, jdMatchTotal: 90, unsupportedCount: 3, criticalUnresolved: 2 });
  assert.equal(r2.ready, false);
  assert.ok(r2.criticalBlockers.length >= 2);
  assert.ok(r2.breakdown.verification < 100); // 감점
});

test("검증 상태 집계", () => {
  const links: SourceLink[] = [
    { id: "1", text: "a", status: "verified" } as SourceLink,
    { id: "2", text: "b", status: "unsupported" } as SourceLink,
    { id: "3", text: "c", status: "needs_confirmation" } as SourceLink
  ];
  assert.equal(countUnsupported(links), 2); // unsupported + needs_confirmation
  const counts = countByStatus(links);
  assert.equal(counts.verified, 1);
  assert.equal(counts.unsupported, 1);
});

test("critical 미해결 카운트(해결/확인 제외)", () => {
  const findings: ConsistencyFinding[] = [
    { id: "1", severity: "critical", category: "x", message: "m", refs: [], resolved: false, userAcknowledged: false },
    { id: "2", severity: "critical", category: "x", message: "m", refs: [], resolved: true, userAcknowledged: false },
    { id: "3", severity: "warning", category: "x", message: "m", refs: [], resolved: false, userAcknowledged: false }
  ] as ConsistencyFinding[];
  assert.equal(countCriticalUnresolved(findings), 1);
});

test("zod 스키마: JD 구조화/분석/일관성/면접질문 파싱", () => {
  assert.ok(JdStructuredSchema.safeParse({ jobTitle: "PM" }).success);
  assert.ok(JdAnalysisSchema.safeParse({}).success); // 전부 optional default
  assert.ok(ConsistencyResultSchema.safeParse({ findings: [{ id: "1", severity: "critical", category: "period_mismatch", message: "기간 불일치" }] }).success);
  assert.ok(!ConsistencyResultSchema.safeParse({ findings: [{ id: "1", severity: "bogus", category: "x", message: "m" }] }).success); // 잘못된 severity
  assert.ok(InterviewQuestionSetSchema.safeParse({ questions: [{ question: "자기소개?", type: "intro", source: "resume" }] }).success);
  assert.ok(SourceLinkSchema.safeParse({ id: "s1", text: "문장", status: "verified" }).success);
});

test("Week2 완료 판정: 산출물 기준 11항목", () => {
  const partial = computeWeek2Completion({
    targetJobConfirmed: true, masterResumeExists: true, applicationTargetSelected: true, jdAnalyzed: true,
    targetedResumeExists: false, coverRequiredDone: false, criticalResolvedOrAck: true, unsupportedReviewed: false,
    readinessScoreExists: false, packageFinalized: false, interviewQuestionsGenerated: false
  });
  assert.equal(partial.complete, false);
  const full = computeWeek2Completion({
    targetJobConfirmed: true, masterResumeExists: true, applicationTargetSelected: true, jdAnalyzed: true,
    targetedResumeExists: true, coverRequiredDone: true, criticalResolvedOrAck: true, unsupportedReviewed: true,
    readinessScoreExists: true, packageFinalized: true, interviewQuestionsGenerated: true
  });
  assert.equal(full.complete, true);
  assert.equal(full.doneCount, 11);
});

console.log(`\n✅ 전체 ${passed}개 테스트 통과`);
