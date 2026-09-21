// 이력서·자기소개서 버전(DocVersion) 순수 로직 점검 — 기본 구성 생성과 검증 규칙.
//   npm run check:doc-versions
import assert from "node:assert/strict";
import { defaultResumeLayout, defaultCoverLayout, isTalentContent, resumeLayoutSchema, coverLayoutSchema, resumeSnapshotSchema, coverSnapshotSchema, snapshotSchemaFor } from "../src/doc-versions";

// talent 판별
assert.equal(isTalentContent({ renewalFollows: [] }), true);
assert.equal(isTalentContent({ basicName: "x", careers: [] }), false, "커리어런치 미러는 talent 아님");

// 이력서 기본 구성: 웹 섹션 순서 + 모르는 섹션은 끝 + 고정 모듈
const r = defaultResumeLayout({ renewalResume: { items: [
  { id: "s1", section: "skill" }, { id: "e1", section: "experience" }, { id: "ed", section: "education" },
  { id: "x1", section: "mystery" }, { section: "experience" } /* id 없음 → 제외 */
] } });
assert.deepEqual(r.cols, [["@basic", "@summary", "ed", "e1", "s1", "x1", "@links"]]);
assert.equal(r.template, "one");
assert.ok(resumeLayoutSchema.safeParse(r).success);

// 자소서 기본 구성: 기본 문항 + 목록 밖 문항도 살림
const c = defaultCoverLayout({ renewalCover: { items: [
  { id: "p1", question: "지원 동기", text: "a" }, { id: "p2", question: "내가 만든 문항", text: "b" }
] } });
assert.equal(c.questions.length, 6);
assert.deepEqual(c.questions[0].blocks, ["p1"]);
assert.equal(c.questions[5].prompt, "내가 만든 문항");
assert.deepEqual(c.questions[5].blocks, ["p2"]);
assert.ok(coverLayoutSchema.safeParse(c).success);
assert.deepEqual(c.hidden, []);
assert.ok(coverLayoutSchema.safeParse({ questions: [] }).success, "hidden 없는 예전 저장본도 통과");

// 레거시 coverLetterItems 에서도 읽음
const legacy = defaultCoverLayout({ renewalFollows: [], coverLetterItems: [{ id: "L1", prompt: "성장 과정", answer: "c" }] });
assert.deepEqual(legacy.questions.find((q) => q.prompt === "성장 과정")!.blocks, ["L1"]);

// 사용자 문항 목록 우선
const custom = defaultCoverLayout({ renewalCover: { questions: ["A", "B"], items: [] } });
assert.deepEqual(custom.questions.map((q) => q.prompt), ["A", "B"]);

// 검증: 잘못된 구성 거절
assert.equal(resumeLayoutSchema.safeParse({ template: "three", cols: [[]], hidden: [] }).success, false);
assert.equal(resumeLayoutSchema.safeParse({ template: "two", cols: [[], [], []], hidden: [] }).success, false, "칸은 최대 2");
assert.equal(coverLayoutSchema.safeParse({ questions: [{ id: "q", prompt: "p", limit: -1, blocks: [] }] }).success, false);
assert.equal(resumeLayoutSchema.safeParse({ template: "one", cols: [[]], hidden: [], extra: 1 }).success, false, "모르는 키 거절");
// 저장본 내용
assert.ok(resumeSnapshotSchema.safeParse({ resume: { items: [] }, basicInfo: { realName: "a" } }).success);
assert.equal(resumeSnapshotSchema.safeParse({ resume: { items: [] } }).success, false, "기본 정보 빠지면 거절");
assert.equal(resumeSnapshotSchema.safeParse({ resume: {}, basicInfo: {}, extra: 1 }).success, false, "모르는 키 거절");
assert.ok(coverSnapshotSchema.safeParse({ cover: { items: [] } }).success);
assert.equal(snapshotSchemaFor("cover").safeParse({ resume: {}, basicInfo: {} }).success, false, "종류가 다르면 거절");

console.log("모든 검사 통과");
