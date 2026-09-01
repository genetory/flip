// Career KPI(Phase 10) 순수 로직 단위 테스트. 실행: npx tsx apps/api/scripts/test-career-kpi.ts
import assert from "node:assert/strict";
import { computeNorthStar, isNorthStarComplete, computeKpiSet, mergeKpiTargets, kpiStatus, rate, DEFAULT_KPI_TARGETS, KPI_DEFINITIONS, type NorthStarStudent, type KpiInput } from "../src/career-kpi";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const full = (id: string): NorthStarStudent => ({ studentUserId: id, resumeFinalized: true, coverFinalized: true, initialMockDone: true, retryDone: true, growthViewed: true });

test("isNorthStarComplete: 5개 조건 모두 충족해야 완주", () => {
  assert.equal(isNorthStarComplete(full("a")), true);
  assert.equal(isNorthStarComplete({ ...full("a"), growthViewed: false }), false);
});

test("computeNorthStar: 고유 참여자·비율·breakdown", () => {
  const r = computeNorthStar([full("a"), full("a"), { ...full("b"), retryDone: false }]);
  assert.equal(r.total, 2); // a 중복 제거
  assert.equal(r.count, 1); // a만 완주
  assert.equal(r.ratePct, 50);
  assert.equal(r.breakdown.retryDone, 1);
});

test("computeNorthStar: 빈 입력 안전", () => {
  const r = computeNorthStar([]);
  assert.equal(r.total, 0);
  assert.equal(r.ratePct, 0);
});

test("rate: 분모 0 → null", () => {
  assert.deepEqual(rate(3, 0), { pct: null, num: 3, den: 0 });
  assert.deepEqual(rate(4, 8), { pct: 50, num: 4, den: 8 });
});

test("computeKpiSet: 산식 단일 정의", () => {
  const inp: KpiInput = { invited: 20, enrolled: 16, firstConsult: 12, targetConfirmed: 12, packageFinalized: 10, initialMock: 9, retryDone: 7, completed: 8, artifactsCreated: 20, artifactsConfirmed: 16, reaskReports: 1, conversationalCalls: 100, interventionTargets: 5, interventionRecovered: 2, surveyResponses: 10, recommendPositive: 8, realApplications: 5 };
  const k = computeKpiSet(inp);
  assert.equal(k.signup_rate.pct, 80); // 16/20
  assert.equal(k.completion_rate.pct, 50); // 8/16
  assert.equal(k.reask_rate.pct, 1); // 1/100
  assert.equal(k.recovery_rate.pct, 40); // 2/5
  assert.equal(k.real_application_rate.pct, 63); // 5/8 반올림
});

test("mergeKpiTargets: 설정 override(부분) 안전, 하드코딩 아님", () => {
  const t = mergeKpiTargets({ completionRate: 60 });
  assert.equal(t.completionRate, 60);
  assert.equal(t.signupRate, DEFAULT_KPI_TARGETS.signupRate); // 나머지 기본값 유지
});

test("kpiStatus: 목표 달성/미달, reask 는 이하가 목표", () => {
  const t = mergeKpiTargets();
  assert.equal(kpiStatus("completion_rate", rate(9, 16), t), "on_track"); // 56% >= 50
  assert.equal(kpiStatus("completion_rate", rate(6, 16), t), "below"); // 38% < 50
  assert.equal(kpiStatus("reask_rate", rate(1, 100), t), "on_track"); // 1% <= 10
  assert.equal(kpiStatus("reask_rate", rate(15, 100), t), "below"); // 15% > 10
  assert.equal(kpiStatus("signup_rate", rate(0, 0), t), "no_data");
});

test("KPI_DEFINITIONS: 12개 정의(분자/분모/이벤트/데이터)", () => {
  assert.ok(KPI_DEFINITIONS.length >= 12);
  for (const d of KPI_DEFINITIONS) {
    assert.ok(d.key && d.name && d.numerator && d.denominator);
    assert.ok(Array.isArray(d.events) && Array.isArray(d.data));
  }
});

console.log(`\n✅ career-kpi 단위 테스트 ${passed}개 통과`);
