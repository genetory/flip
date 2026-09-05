// Career 결과물 일관성(Phase 14) 순수 로직 단위 테스트. 실행: npx tsx apps/api/scripts/test-career-artifact-consistency.ts
import assert from "node:assert/strict";
import { classifyFactGroup, checkArtifactConsistency, type FactGroup } from "../src/career-artifact-consistency";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

test("일치: 여러 결과물 값이 동일 → match", () => {
  const g: FactGroup = { field: "company", label: "회사명", values: [{ value: "카카오", source: "resume", confirmed: true }, { value: "카카오", source: "cover", confirmed: true }] };
  assert.equal(classifyFactGroup(g).verdict, "match");
});

test("표현만 다름: 정규화 후 같으면 paraphrase(마침표 차이)", () => {
  const g: FactGroup = { field: "school", label: "학교", values: [{ value: "서울대학교.", source: "profile", confirmed: true }, { value: "서울대학교", source: "resume", confirmed: true }] };
  assert.equal(classifyFactGroup(g).verdict, "paraphrase");
});

test("충돌: 값이 다르면 conflict (+critical=company)", () => {
  const g: FactGroup = { field: "company", label: "회사명", values: [{ value: "네이버", source: "resume", confirmed: true }, { value: "카카오", source: "cover" }] };
  const f = classifyFactGroup(g);
  assert.equal(f.verdict, "conflict");
  assert.equal(f.critical, true);
});

test("기간(숫자) 충돌: 2025.3~6 vs 2025.4~7 → conflict", () => {
  const g: FactGroup = { field: "period", label: "프로젝트 기간", values: [{ value: "2025.03~2025.06", source: "profile", confirmed: true }, { value: "2025.04~2025.07", source: "resume" }] };
  assert.equal(classifyFactGroup(g).verdict, "conflict");
});

test("기간(숫자) 일치: 표현 달라도 숫자 같으면 match/paraphrase", () => {
  const g: FactGroup = { field: "period", label: "기간", values: [{ value: "2025.03 ~ 2025.06", source: "profile", confirmed: true }, { value: "2025.3~2025.6", source: "resume", confirmed: true }] };
  const v = classifyFactGroup(g).verdict;
  assert.ok(v === "match" || v === "paraphrase");
});

test("확인 필요: 근거 하나이고 AI 추론이면 needs_confirmation", () => {
  const g: FactGroup = { field: "strength", label: "강점", values: [{ value: "이해관계자 조율", source: "profile", inferred: true }] };
  assert.equal(classifyFactGroup(g).verdict, "needs_confirmation");
});

test("확인 필요: 근거 하나이고 미확인이면 needs_confirmation", () => {
  const g: FactGroup = { field: "metric", label: "성과", values: [{ value: "전환율 12%", source: "resume", confirmed: false }] };
  assert.equal(classifyFactGroup(g).verdict, "needs_confirmation");
});

test("근거 없음: 값이 전혀 없으면 unsupported", () => {
  const g: FactGroup = { field: "metric", label: "성과 수치", values: [{ value: "", source: "resume" }] };
  assert.equal(classifyFactGroup(g).verdict, "unsupported");
});

test("checkArtifactConsistency: critical 충돌 시 finalizeBlocked", () => {
  const groups: FactGroup[] = [
    { field: "target_job", label: "목표 직무", values: [{ value: "서비스 기획", source: "profile", confirmed: true }, { value: "서비스 기획", source: "cover", confirmed: true }] },
    { field: "company", label: "회사명", values: [{ value: "네이버", source: "resume", confirmed: true }, { value: "카카오", source: "cover" }] }, // critical 충돌
    { field: "metric", label: "성과", values: [{ value: "", source: "resume" }] } // critical 근거없음
  ];
  const r = checkArtifactConsistency(groups);
  assert.equal(r.summary.total, 3);
  assert.equal(r.summary.match, 1);
  assert.equal(r.summary.criticalConflicts, 2);
  assert.equal(r.finalizeBlocked, true);
  assert.equal(r.blockers.length, 2);
});

test("checkArtifactConsistency: 전부 일치·확인이면 finalize 허용", () => {
  const groups: FactGroup[] = [
    { field: "target_job", label: "목표 직무", values: [{ value: "데이터 분석", source: "profile", confirmed: true }, { value: "데이터 분석", source: "resume", confirmed: true }] },
    { field: "school", label: "학교", values: [{ value: "연세대학교", source: "profile", confirmed: true }] }
  ];
  const r = checkArtifactConsistency(groups);
  assert.equal(r.finalizeBlocked, false);
  assert.equal(r.summary.criticalConflicts, 0);
});

console.log(`\n✅ career-artifact-consistency 단위 테스트 ${passed}개 통과`);
