// Career Org(Phase 11) 순수 로직 단위 테스트. 실행: npx tsx apps/api/scripts/test-career-org.ts
import assert from "node:assert/strict";
import {
  can,
  canAny,
  PERMISSION_MATRIX,
  computeSeatUsage,
  canAllocateSeat,
  deriveLicenseStatus,
  canTransitionInvite,
  validateCsvRows,
  shouldHideGroup,
  orgAllowsNewActivation,
  ORG_ROLES,
  PLATFORM_ROLES,
  type SeatStudent
} from "../src/career-org";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const HOUR = 3_600_000;
const now = 1_700_000_000_000;

// ── 권한 매트릭스 ──
test("can: aply_super 는 전체 권한", () => {
  assert.equal(can("aply_super", "org:update"), true);
  assert.equal(can("aply_super", "student:read_raw"), true);
  assert.equal(can("aply_super", "audit:read"), true);
});

test("can: org_observer 는 수정·원문 불가, 리포트 열람만", () => {
  assert.equal(can("org_observer", "report:read"), true);
  assert.equal(can("org_observer", "org:update"), false);
  assert.equal(can("org_observer", "student:read_raw"), false);
  assert.equal(can("org_observer", "student:enroll"), false);
});

test("can: org_admin 은 원문(student:read_raw) 접근 불가", () => {
  assert.equal(can("org_admin", "student:enroll"), true);
  assert.equal(can("org_admin", "student:read_raw"), false); // 원문은 APLY 측만
  assert.equal(can("org_admin", "org:manage_members"), true);
});

test("can: instructor 는 배정 범위 진행/결과 검토만, 원문·개입 불가", () => {
  assert.equal(can("instructor", "student:read"), true);
  assert.equal(can("instructor", "student:read_raw"), false);
  assert.equal(can("instructor", "intervention:manage"), false);
});

test("can: counselor 는 개입 관리 가능, 등록·설정 불가", () => {
  assert.equal(can("counselor", "intervention:manage"), true);
  assert.equal(can("counselor", "student:enroll"), false);
  assert.equal(can("counselor", "org:update"), false);
});

test("canAny: 복수 membership 합집합", () => {
  assert.equal(canAny(["org_observer", "counselor"], "intervention:manage"), true);
  assert.equal(canAny(["org_observer", "instructor"], "org:update"), false);
});

test("PERMISSION_MATRIX: 모든 역할 정의됨", () => {
  for (const r of [...ORG_ROLES, ...PLATFORM_ROLES]) assert.ok(Array.isArray(PERMISSION_MATRIX[r]));
});

// ── 좌석 계산 ──
test("computeSeatUsage: 중복 학생은 좌석 1개(중복 차감 방지, 활성 OR 병합)", () => {
  const students: SeatStudent[] = [
    { studentUserId: "a", activated: false, completed: false },
    { studentUserId: "a", activated: true, completed: false }, // 재초대 중복
    { studentUserId: "b", activated: true, completed: true }
  ];
  const u = computeSeatUsage(students, 10);
  assert.equal(u.allocated, 2); // a,b (중복 제거)
  assert.equal(u.activated, 2); // a(OR true), b
  assert.equal(u.completed, 1); // b
  assert.equal(u.remaining, 8);
  assert.equal(u.overCommitted, false);
});

test("computeSeatUsage: 계약 초과 감지", () => {
  const students: SeatStudent[] = [
    { studentUserId: "a", activated: true, completed: false },
    { studentUserId: "b", activated: false, completed: false },
    { studentUserId: "c", activated: false, completed: false }
  ];
  const u = computeSeatUsage(students, 2);
  assert.equal(u.allocated, 3);
  assert.equal(u.overCommitted, true);
  assert.equal(u.remaining, 0);
});

test("canAllocateSeat: 좌석 소진 시 신규 제한(기존 유지)", () => {
  const u = computeSeatUsage([{ studentUserId: "a", activated: true, completed: false }, { studentUserId: "b", activated: false, completed: false }], 2);
  const r = canAllocateSeat(u, "active", "active");
  assert.equal(r.allowed, false);
});

test("canAllocateSeat: 여유 좌석·active 면 허용", () => {
  const u = computeSeatUsage([{ studentUserId: "a", activated: true, completed: false }], 10);
  assert.equal(canAllocateSeat(u, "active", "active").allowed, true);
});

test("canAllocateSeat: suspended 기관은 신규 제한", () => {
  const u = computeSeatUsage([], 10);
  assert.equal(canAllocateSeat(u, "suspended", "active").allowed, false);
});

// ── 라이선스 ──
test("deriveLicenseStatus: 만료일 지나면 expired", () => {
  assert.equal(deriveLicenseStatus({ stored: "active", endAtMs: now - HOUR, nowMs: now, allocated: 1, contractedSeats: 10 }), "expired");
});

test("deriveLicenseStatus: 좌석 소진 시 exhausted", () => {
  assert.equal(deriveLicenseStatus({ stored: "active", endAtMs: now + HOUR, nowMs: now, allocated: 10, contractedSeats: 10 }), "exhausted");
});

test("deriveLicenseStatus: draft/suspended 는 그대로", () => {
  assert.equal(deriveLicenseStatus({ stored: "draft", endAtMs: null, nowMs: now, allocated: 0, contractedSeats: null }), "draft");
  assert.equal(deriveLicenseStatus({ stored: "suspended", endAtMs: null, nowMs: now, allocated: 0, contractedSeats: null }), "suspended");
});

// ── 초대 전이 ──
test("canTransitionInvite: pending→sent 허용, enrolled→sent 불가", () => {
  assert.equal(canTransitionInvite("pending", "sent"), true);
  assert.equal(canTransitionInvite("sent", "enrolled"), true);
  assert.equal(canTransitionInvite("enrolled", "sent"), false);
});

// ── CSV 검증 ──
test("validateCsvRows: 정상/오류/파일내 중복 구분", () => {
  const r = validateCsvRows([{ email: "A@x.com" }, { email: "a@x.com" }, { email: "bad" }, { email: "c@x.com", name: "C" }]);
  assert.equal(r.total, 4);
  assert.equal(r.valid, 2); // A@x.com(정규화 a), c@x.com
  assert.equal(r.duplicates, 1); // 두번째 a@x.com
  assert.equal(r.invalid, 1); // bad
  assert.equal(r.rows[1].duplicateInFile, true);
});

test("validateCsvRows: 최대 행 초과 시 capped", () => {
  const many = Array.from({ length: 600 }, (_, i) => ({ email: `u${i}@x.com` }));
  const r = validateCsvRows(many);
  assert.equal(r.capped, true);
  assert.equal(r.total, 500);
});

// ── 리포트 작은 표본 ──
test("shouldHideGroup: 5명 미만 숨김", () => {
  assert.equal(shouldHideGroup(4), true);
  assert.equal(shouldHideGroup(5), false);
});

test("orgAllowsNewActivation: active/onboarding 만 허용", () => {
  assert.equal(orgAllowsNewActivation("active"), true);
  assert.equal(orgAllowsNewActivation("onboarding"), true);
  assert.equal(orgAllowsNewActivation("expired"), false);
  assert.equal(orgAllowsNewActivation("archived"), false);
});

console.log(`\n✅ career-org 단위 테스트 ${passed}개 통과`);
