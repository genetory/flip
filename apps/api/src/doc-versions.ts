// 이력서·자기소개서 버전(DocVersion) — 순수 로직(DB 접근은 index.ts).
//
// 모듈 = talent 문서(Resume.content)의 항목 하나.
//   이력서: renewalResume.items[] (경력 한 건, 자격증 한 건 …)
//   자소서: renewalCover.items[]  (에피소드 한 단락)
// 버전은 그 모듈들을 어떤 순서·배치로 넣을지(layout)와 이 버전에서만 고친 문구(overrides)다.
// 모듈 내용 자체는 여기에 복사하지 않는다 — 앱·매칭·기업 화면이 읽는 원본은 하나로 둔다.
import { z } from "zod";

export const DOC_VERSION_KINDS = ["resume", "cover"] as const;
export type DocVersionKind = (typeof DOC_VERSION_KINDS)[number];
export const docVersionKindSchema = z.enum(DOC_VERSION_KINDS);

/** 종류별 버전 수 상한 — 회사별로 만들어도 충분하고, 목록이 끝없이 늘지 않게. */
export const MAX_VERSIONS_PER_KIND = 30;

/** 섹션 항목이 아닌 고정 모듈(이력서 머리·자기소개·링크). 항목 id 와 겹치지 않게 '@' 로 시작. */
export const FIXED_RESUME_MODULES = { basic: "@basic", summary: "@summary", links: "@links" } as const;

/** 웹 talent 와 같은 이력서 섹션 순서(career-chat.ts SECTION_META). */
export const RESUME_SECTION_ORDER = ["education", "certificate", "experience", "project", "language", "skill", "award", "activity"];

/** 웹 cover-doc.ts COVER_QUESTIONS 와 같은 기본 문항. */
export const DEFAULT_COVER_QUESTIONS = ["지원 동기", "나의 강점과 준비된 경험", "성장 과정", "성격의 장단점", "입사 후 포부"];

const moduleId = z.string().trim().min(1).max(80);

export const resumeLayoutSchema = z
  .object({
    template: z.enum(["two", "one"]),
    // 1단이면 칸 1개, 2단이면 2개.
    cols: z.array(z.array(moduleId).max(300)).min(1).max(2),
    // 이 버전에서 뺀 모듈.
    hidden: z.array(moduleId).max(600)
  })
  .strict();
export type ResumeLayout = z.infer<typeof resumeLayoutSchema>;

export const coverLayoutSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            id: z.string().trim().min(1).max(60),
            prompt: z.string().max(300),
            // 글자 수 제한(공백 포함). null = 제한 없음.
            limit: z.number().int().min(0).max(20000).nullable(),
            blocks: z.array(moduleId).max(100)
          })
          .strict()
      )
      .max(30),
    // 이 버전에서 뺀 에피소드(대표 버전이 새 단락을 자동으로 넣을 때 다시 넣지 않게). 예전 저장본엔 없다.
    hidden: z.array(moduleId).max(600).optional()
  })
  .strict();
export type CoverLayout = z.infer<typeof coverLayoutSchema>;

/** { [moduleId]: { [field]: 문구 } } — 이 버전에서만 따로 고친 문구. */
export const overridesSchema = z
  .record(moduleId, z.record(z.string().max(40), z.string().max(6000)))
  .refine((o) => Object.keys(o).length <= 300, { message: "too many overrides" });

export function layoutSchemaFor(kind: DocVersionKind) {
  return kind === "resume" ? resumeLayoutSchema : coverLayoutSchema;
}

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const asArr = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter((x): x is Obj => !!x && typeof x === "object") : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** talent 행 판별 — renewal* 키가 있으면 웹 talent 리뉴얼 문서(커리어런치 미러엔 없다). */
export function isTalentContent(content: unknown): boolean {
  return Object.keys(asObj(content)).some((k) => k.startsWith("renewal"));
}

/**
 * 기본 이력서 구성 — 지금 talent 문서를 그대로. 처음엔 사용자가 지금 보던 모습과 같도록
 * 1단 + 웹과 같은 섹션 순서로 두고, 모르는 섹션의 항목도 빠뜨리지 않고 끝에 붙인다.
 */
export function defaultResumeLayout(content: unknown): ResumeLayout {
  const items = asArr(asObj(asObj(content).renewalResume).items).filter((it) => str(it.id));
  const known = new Set(RESUME_SECTION_ORDER);
  const ordered = [
    ...RESUME_SECTION_ORDER.flatMap((sec) => items.filter((it) => it.section === sec)),
    ...items.filter((it) => !known.has(str(it.section)))
  ].map((it) => str(it.id));
  return {
    template: "one",
    cols: [[FIXED_RESUME_MODULES.basic, FIXED_RESUME_MODULES.summary, ...ordered, FIXED_RESUME_MODULES.links]],
    hidden: []
  };
}

/**
 * 기본 자소서 구성 — 지금 문항 목록과, 문항별로 이미 써 둔 단락을 그대로 옮긴다.
 * renewalCover 가 없으면 웹처럼 레거시 coverLetterItems 에서 읽는다.
 */
export function defaultCoverLayout(content: unknown): CoverLayout {
  const c = asObj(content);
  const cover = asObj(c.renewalCover);
  const items: { id: string; question: string }[] = c.renewalCover
    ? asArr(cover.items).map((it) => ({ id: str(it.id), question: str(it.question) }))
    : asArr(c.coverLetterItems).map((it) => ({ id: str(it.id), question: str(it.prompt) }));
  const valid = items.filter((it) => it.id);
  const custom = Array.isArray(cover.questions) ? cover.questions.filter((q): q is string => typeof q === "string") : [];
  const base = custom.length ? custom : DEFAULT_COVER_QUESTIONS;
  // 문항 목록에 없는 문항의 단락도 잃지 않게 문항으로 살린다(웹 coverSectionOrder 와 같은 규칙).
  const extra = [...new Set(valid.map((it) => it.question).filter((q) => !base.includes(q)))];
  return {
    questions: [...base, ...extra].map((prompt, i) => ({
      id: `q${i + 1}`,
      prompt,
      limit: null,
      blocks: valid.filter((it) => it.question === prompt).map((it) => it.id)
    })),
    hidden: []
  };
}

export function defaultLayout(kind: DocVersionKind, content: unknown): ResumeLayout | CoverLayout {
  return kind === "resume" ? defaultResumeLayout(content) : defaultCoverLayout(content);
}
