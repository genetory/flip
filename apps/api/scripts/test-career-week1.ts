// Career Week 1 순수 로직 단위 테스트(tsx + node:assert). 실행: npx tsx apps/api/scripts/test-career-week1.ts
// (미니체험·추천/결정·완료판정은 기능 제거로 테스트도 삭제. 남은 순수 로직: 직무군 taxonomy + 경험카드 스키마 + 목표 상수.)
import assert from "node:assert/strict";
import { JOB_FAMILIES, resolveJobFamily, getJobFamily, isJobFamilyKey, ExperienceCardSchema, TARGET_STATUSES, TARGET_TYPES } from "../src/career-week1";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
console.log("Career Week 1 순수 로직 테스트");

test("직무군 10개 + key 검증", () => {
  assert.equal(JOB_FAMILIES.length, 10);
  assert.ok(isJobFamilyKey("product_planning"));
  assert.ok(!isJobFamilyKey("nonsense"));
  assert.equal(getJobFamily("marketing")?.label, "마케팅");
});

test("resolveJobFamily: 정확 key / label / alias 매핑", () => {
  assert.equal(resolveJobFamily("data_analysis"), "data_analysis");
  assert.equal(resolveJobFamily("데이터 분석"), "data_analysis");
  assert.equal(resolveJobFamily("PM"), "product_planning");
  assert.equal(resolveJobFamily("백엔드"), "software_dev");
  assert.equal(resolveJobFamily("전혀없는직무xyz"), null);
});

test("ExperienceCardSchema: 최소 필드 파싱 + 기본값", () => {
  const r = ExperienceCardSchema.safeParse({ title: "동아리 회장" });
  assert.ok(r.success);
  assert.deepEqual(r.data.skills, []);
  assert.equal(r.data.userConfirmed, false);
  // title 없으면 실패
  assert.ok(!ExperienceCardSchema.safeParse({}).success);
});

test("목표 상태/유형 상수", () => {
  assert.ok(TARGET_STATUSES.includes("confirmed"));
  assert.ok(TARGET_TYPES.includes("primary"));
});

console.log(`\n✅ 전체 ${passed}개 테스트 통과`);
