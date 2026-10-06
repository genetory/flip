// 되돌리기 지점이 "무엇을 되돌리는지" 보여 주기 위한 비교.
//
// 되돌리기 버튼만 있으면 사용자는 **무엇이 사라질지 모른 채** 눌러야 한다. 그래서 지점마다
// "그 뒤로 무엇이 달라졌는지"를 먼저 보여 준다 — 되돌리기는 그 다음이다.
//
// 비교 방향: 스냅샷(그때) → 지금. 즉 "되돌리면 없어질 것"이 added, "되돌리면 돌아올 것"이 removed.
import type { CoverDoc, CoverItem } from "./cover-doc";
import type { ResumeDoc, ResumeItem } from "./resume-doc";

export type DocChange = {
  added: number;
  removed: number;
  edited: number;
  /** 바뀐 문서 단위 값(희망 직무·자기소개 등) 이름. */
  fields: string[];
  /** 사람이 읽는 예시 — 목록에 한두 줄 곁들인다. */
  examples: string[];
};

export const isEmptyChange = (c: DocChange) => c.added + c.removed + c.edited === 0 && c.fields.length === 0;

/** 목록에 쓰는 짧은 라벨 — 라벨 문구는 화면(다국어)에서 만들고 여기서는 숫자만 준다. */
const label = (s: string, max = 18) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

function compare<T>(
  before: T[],
  after: T[],
  idOf: (x: T) => string,
  sameContent: (a: T, b: T) => boolean,
  nameOf: (x: T) => string
): DocChange {
  const b = new Map(before.map((x) => [idOf(x), x]));
  const a = new Map(after.map((x) => [idOf(x), x]));
  const examples: string[] = [];
  let added = 0;
  let removed = 0;
  let edited = 0;
  for (const [id, x] of a) {
    const prev = b.get(id);
    if (!prev) {
      added += 1;
      if (examples.length < 3) examples.push(`+ ${label(nameOf(x))}`);
    } else if (!sameContent(prev, x)) {
      edited += 1;
      if (examples.length < 3) examples.push(`~ ${label(nameOf(x))}`);
    }
  }
  for (const [id, x] of b) {
    if (!a.has(id)) {
      removed += 1;
      if (examples.length < 3) examples.push(`− ${label(nameOf(x))}`);
    }
  }
  return { added, removed, edited, fields: [], examples };
}

const itemName = (it: ResumeItem) => (it.company ?? "").trim() || (it.text ?? "").trim() || "항목";
const itemSame = (x: ResumeItem, y: ResumeItem) =>
  (x.text ?? "") === (y.text ?? "") && (x.company ?? "") === (y.company ?? "") && (x.startDate ?? "") === (y.startDate ?? "") && (x.endDate ?? "") === (y.endDate ?? "");

/** 이력서 — 그때(before)와 지금(after)의 차이. fields 는 문서 단위 값 이름(화면에서 번역). */
export function diffResumeDocs(before: ResumeDoc | null, after: ResumeDoc | null): DocChange {
  if (!before || !after) return { added: 0, removed: 0, edited: 0, fields: [], examples: [] };
  const c = compare(before.items ?? [], after.items ?? [], (x) => x.id, itemSame, itemName);
  const fields: string[] = [];
  if ((before.targetRole ?? "") !== (after.targetRole ?? "")) fields.push("targetRole");
  if ((before.summary ?? "") !== (after.summary ?? "")) fields.push("summary");
  if (JSON.stringify(before.links ?? []) !== JSON.stringify(after.links ?? [])) fields.push("links");
  return { ...c, fields };
}

const coverName = (it: CoverItem) => (it.question ?? "").trim() || (it.text ?? "").trim() || "에피소드";
const coverSame = (x: CoverItem, y: CoverItem) => (x.text ?? "") === (y.text ?? "") && (x.question ?? "") === (y.question ?? "");

/** 자기소개서 — 에피소드 기준. 문항 목록 변경은 fields 에 담는다. */
export function diffCoverDocs(before: CoverDoc | null, after: CoverDoc | null): DocChange {
  if (!before || !after) return { added: 0, removed: 0, edited: 0, fields: [], examples: [] };
  const c = compare(before.items ?? [], after.items ?? [], (x) => x.id, coverSame, coverName);
  const fields: string[] = [];
  if (JSON.stringify(before.questions ?? []) !== JSON.stringify(after.questions ?? [])) fields.push("questions");
  if ((before.companyName ?? "") !== (after.companyName ?? "")) fields.push("companyName");
  if (JSON.stringify(before.keywords ?? []) !== JSON.stringify(after.keywords ?? [])) fields.push("keywords");
  return { ...c, fields };
}
