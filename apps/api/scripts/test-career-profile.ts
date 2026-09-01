// 공통 Career Profile 순수 로직 단위 테스트(프레임워크 없이 tsx + node:assert).
// 실행: npx tsx apps/api/scripts/test-career-profile.mts
import assert from "node:assert/strict";
import {
  buildInitialCareerProfile,
  applyProfileUpdate,
  careerProfileAsksNeeded,
  buildCareerProfileContext,
  normalizeProfile,
  mergeSourceFactsIntoProfile,
  PROFILE_AREA_KEYS,
  type CareerProfileData,
  type ProfileField
} from "../src/career-profile";

const NOW = "2026-08-30T00:00:00.000Z";
let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}
function field(area: string, d: CareerProfileData): ProfileField | undefined {
  const v = d.areas[area as keyof typeof d.areas];
  return Array.isArray(v) ? v[0] : v;
}
function list(area: string, d: CareerProfileData): ProfileField[] {
  const v = d.areas[area as keyof typeof d.areas];
  return Array.isArray(v) ? v : v ? [v] : [];
}

console.log("Career Profile 순수 로직 테스트");

// ── 초기 병합 ──
test("초기 병합: 이력서 basic → confirmed, 강점 → inferred, 관심직무 → confirmed, 자격증 → missing", () => {
  const p = buildInitialCareerProfile(
    {
      resume: {
        basic: { name: "홍길동", email: "a@b.com" },
        educations: [{ school: "서울대", major: "컴공" }],
        experiences: [
          { kind: "work", title: "백엔드", org: "회사A", bullets: ["매출 20% 개선"] },
          { kind: "other", title: "동아리장", org: "코딩동아리" }
        ],
        skills: ["Python", "SQL"],
        languages: [{ language: "한국어", level: "TOPIK 6" }]
      },
      cover: { company: "토스", items: [{ question: "지원동기", answer: "..." }] },
      progress: { diagnosis: { strengths: ["끈기", "협업"] }, selectedJobs: ["백엔드 개발자"], experienceBank: [{ title: "PJT" }] }
    },
    NOW
  );
  assert.equal(field("basicInfo", p)?.status, "confirmed");
  assert.equal((field("basicInfo", p)?.value as { name: string }).name, "홍길동");
  assert.equal(list("educations", p)[0].status, "confirmed");
  assert.equal(list("careers", p).length, 1);
  assert.equal(list("careers", p)[0].status, "confirmed");
  assert.equal(list("activities", p).length, 1); // kind=other
  assert.equal(list("skills", p).length, 2);
  assert.equal(list("strengths", p)[0].status, "inferred"); // 진단 기반
  assert.equal(list("interestRoles", p)[0].status, "confirmed"); // 사용자 선택
  assert.equal(list("signatureExperiences", p)[0].status, "inferred");
  assert.equal(field("certifications", p)?.status, "missing");
  assert.equal(field("targetRole", p)?.status, "missing");
});

// ── 중복 질문 방지 ──
test("dedup: confirmed 영역은 ask 에서 제외, missing 은 포함", () => {
  const p = buildInitialCareerProfile({ resume: { basic: { name: "김" }, skills: ["Java"] } }, NOW);
  const { ask, confirmedAreas } = careerProfileAsksNeeded(p, PROFILE_AREA_KEYS);
  assert.ok(confirmedAreas.includes("basicInfo"));
  assert.ok(confirmedAreas.includes("skills"));
  assert.ok(!ask.includes("basicInfo")); // 다시 묻지 않음
  assert.ok(ask.includes("certifications")); // 없는 정보는 물어봄
});

// ── 상태머신: 사용자 확인 ──
test("업데이트: 사용자 confirm 이 missing 을 confirmed 로", () => {
  let p = buildInitialCareerProfile({}, NOW);
  const r = applyProfileUpdate(p, { area: "targetRole", value: "PM", intent: "user" }, NOW);
  assert.equal(field("targetRole", r.data)?.status, "confirmed");
  assert.equal(field("targetRole", r.data)?.value, "PM");
  assert.equal(r.event.action, "confirm");
});

// ── 상태머신: 충돌 ──
test("업데이트: 확정값과 다른 AI 추론 → conflicted(확정값 유지)", () => {
  let p = buildInitialCareerProfile({}, NOW);
  p = applyProfileUpdate(p, { area: "targetRole", value: "PM", intent: "user" }, NOW).data;
  const r = applyProfileUpdate(p, { area: "targetRole", value: "디자이너", intent: "ai" }, NOW);
  assert.equal(field("targetRole", r.data)?.status, "conflicted");
  assert.equal(field("targetRole", r.data)?.value, "PM"); // 확정 우선
  assert.deepEqual(field("targetRole", r.data)?.conflict, { previous: "PM", incoming: "디자이너" });
  assert.equal(r.event.action, "conflict");
});

// ── 상태머신: 충돌 해결 ──
test("업데이트: resolve 로 충돌 해결 → confirmed 새 값", () => {
  let p = buildInitialCareerProfile({}, NOW);
  p = applyProfileUpdate(p, { area: "targetRole", value: "PM", intent: "user" }, NOW).data;
  p = applyProfileUpdate(p, { area: "targetRole", value: "디자이너", intent: "ai" }, NOW).data;
  const r = applyProfileUpdate(p, { area: "targetRole", value: "디자이너", intent: "resolve" }, NOW);
  assert.equal(field("targetRole", r.data)?.status, "confirmed");
  assert.equal(field("targetRole", r.data)?.value, "디자이너");
  assert.equal(field("targetRole", r.data)?.conflict, null);
});

// ── 상태머신: 거부한 해석 재제안 금지 ──
test("거부: reject 후 동일 AI 추론은 noop(재제안 금지)", () => {
  let p = buildInitialCareerProfile({}, NOW);
  const r1 = applyProfileUpdate(p, { area: "workPreferences", value: "재택 선호", intent: "reject" }, NOW);
  assert.equal(r1.data.rejected.length, 1);
  const r2 = applyProfileUpdate(r1.data, { area: "workPreferences", value: "재택 선호", intent: "ai" }, NOW);
  assert.equal(r2.event.action, "noop"); // 같은 형태 재제안 무시
});

// ── 다중값: 항목 추가/키로 수정 ──
test("다중값: 스킬 항목 추가 후 itemKey 로 수정", () => {
  let p = buildInitialCareerProfile({}, NOW);
  const add = applyProfileUpdate(p, { area: "skills", value: "Go", intent: "user", itemKey: "skill-x" }, NOW);
  assert.equal(list("skills", add.data).length, 1);
  const upd = applyProfileUpdate(add.data, { area: "skills", value: "Golang", intent: "user", itemKey: "skill-x" }, NOW);
  assert.equal(list("skills", upd.data).length, 1); // 새로 추가 아님
  assert.equal(list("skills", upd.data)[0].value, "Golang");
  assert.equal(upd.event.action, "update");
});

// ── 컨텍스트 빌더 ──
test("컨텍스트: 확정/추론/없는/거부 섹션 + 길이 제한", () => {
  let p = buildInitialCareerProfile({ resume: { basic: { name: "홍길동" }, skills: ["Python"] }, progress: { diagnosis: { strengths: ["끈기"] } } }, NOW);
  p = applyProfileUpdate(p, { area: "workConditions", value: "야근 싫음", intent: "reject" }, NOW).data;
  const ctx = buildCareerProfileContext(p, { maxChars: 5000 });
  assert.ok(ctx.includes("확정된 정보"));
  assert.ok(ctx.includes("홍길동"));
  assert.ok(ctx.includes("추론된 정보"));
  assert.ok(ctx.includes("없는 정보"));
  assert.ok(ctx.includes("거부한 해석"));
  const short = buildCareerProfileContext(p, { maxChars: 30 });
  assert.ok(short.length <= 31);
});

// ── 정규화(저장 JSON → 안전 구조) ──
test("정규화: 누락 영역 missing 채움, rejected 보존", () => {
  const raw = { areas: { basicInfo: { value: { name: "김" }, status: "confirmed" } }, rejected: [{ area: "skills", value: "x", at: NOW }] };
  const p = normalizeProfile(raw, NOW);
  assert.equal(field("basicInfo", p)?.status, "confirmed");
  assert.equal(field("certifications", p)?.status, "missing");
  assert.equal(p.rejected.length, 1);
});

// ── 소스 사실 최신화(비파괴) ──
test("소스 최신화: missing/추론 영역은 최신 소스로 갱신, 사용자 결정은 보존", () => {
  // 저장된 프로필: 사용자가 targetRole 확정 + skills 는 초기 소스 병합(source=resume)
  let stored = buildInitialCareerProfile({ resume: { skills: ["Java"] } }, NOW);
  stored = applyProfileUpdate(stored, { area: "targetRole", value: "PM", intent: "user" }, NOW).data;
  // 새 소스: 스킬이 늘고 학력이 새로 생김
  const fresh = buildInitialCareerProfile({ resume: { skills: ["Java", "Go"], educations: [{ school: "KAIST" }] } }, NOW);
  const { data, changed } = mergeSourceFactsIntoProfile(stored, fresh, NOW);
  assert.equal(changed, true);
  assert.equal(list("skills", data).length, 2); // 소스 갱신 반영
  assert.equal(list("educations", data).length, 1); // 새 소스 사실 반영
  assert.equal(field("targetRole", data)?.value, "PM"); // 사용자 확정 보존
});

test("소스 최신화: 사용자가 거부/확정한 영역은 소스로 덮어쓰지 않음", () => {
  let stored = buildInitialCareerProfile({ resume: { skills: ["Java"] } }, NOW);
  // 사용자가 skills 를 직접 확정(source=user)
  stored = applyProfileUpdate(stored, { area: "skills", value: "Rust", intent: "user", itemKey: "s1" }, NOW).data;
  const fresh = buildInitialCareerProfile({ resume: { skills: ["Python", "SQL"] } }, NOW);
  const { data } = mergeSourceFactsIntoProfile(stored, fresh, NOW);
  // 사용자 결정이 있는 영역이므로 소스로 덮지 않음(Rust 포함 유지)
  assert.ok(list("skills", data).some((f) => f.value === "Rust"));
});

console.log(`\n✅ 전체 ${passed}개 테스트 통과`);
