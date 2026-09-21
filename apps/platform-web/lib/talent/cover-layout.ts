// 모듈형 자기소개서 구성(CoverLayout) 다루기 — 순수 함수.
//
// 모듈 = 에피소드 한 단락(CoverDoc.items). 버전은 회사마다 다른 문항(문구·글자 수 제한)과
// 문항별로 어떤 에피소드를 어떤 순서로 넣을지만 갖는다. 한 에피소드를 여러 문항에 써도 된다
// (한 문항 안에서만 중복 없이).
import type { CoverLayout } from "./doc-versions";
import type { CoverDoc } from "./cover-doc";

export type CoverQuestion = CoverLayout["questions"][number];

export type ResolvedCover = {
  questions: CoverQuestion[];
  /** 이 버전에서 뺀 에피소드(대표 버전 자동 배치에서도 제외). */
  hidden: string[];
  /** 이 버전의 어느 문항에도 없고 뺀 적도 없는 에피소드 — 새로 쓴 단락. */
  unplaced: string[];
};

const clone = (l: ResolvedCover): ResolvedCover => ({
  questions: l.questions.map((q) => ({ ...q, blocks: [...q.blocks] })),
  hidden: [...l.hidden],
  unplaced: [...l.unplaced]
});

/** hidden·unplaced 를 문항 구성에 맞춰 다시 계산한다. dropped = 방금 문항에서 빠진 에피소드(쓰는 데가 없으면 뺀 것으로). */
function settle(questions: CoverQuestion[], hidden: string[], doc: CoverDoc, dropped: string[] = []): ResolvedCover {
  const used = new Set(questions.flatMap((q) => q.blocks));
  const exists = new Set(doc.items.map((i) => i.id));
  const h = [...new Set([...hidden, ...dropped])].filter((id) => exists.has(id) && !used.has(id));
  const hs = new Set(h);
  return { questions, hidden: h, unplaced: doc.items.map((i) => i.id).filter((id) => !used.has(id) && !hs.has(id)) };
}

/** 저장된 구성을 지금 문서에 맞춘다 — 지워진 에피소드와 문항 안의 중복은 뺀다. */
export function resolveCoverLayout(layout: CoverLayout, doc: CoverDoc): ResolvedCover {
  const exists = new Set(doc.items.map((i) => i.id));
  const questions = layout.questions.map((q) => ({
    ...q,
    blocks: q.blocks.filter((id, i, arr) => exists.has(id) && arr.indexOf(id) === i)
  }));
  return settle(questions, layout.hidden ?? [], doc);
}

/**
 * 대표 버전 보기 — 새 에피소드(unplaced)는 원래 문항(item.question)과 같은 문구의 문항이 있으면
 * 그 끝에 넣는다(앱·기존 화면에서 쓴 단락이 빠지지 않게). 맞는 문항이 없으면 그대로 둔다.
 * 이 버전에서 뺀 에피소드는 넣지 않는다.
 */
export function autoPlaceCover(layout: ResolvedCover, doc: CoverDoc): ResolvedCover {
  const l = clone(layout);
  for (const id of layout.unplaced) {
    const item = doc.items.find((i) => i.id === id);
    const q = l.questions.find((x) => x.prompt === item?.question);
    if (q) q.blocks.push(id);
  }
  return settle(l.questions, l.hidden, doc);
}

export function toStoredCover(layout: ResolvedCover): CoverLayout {
  return { questions: layout.questions.map((q) => ({ ...q, blocks: [...q.blocks] })), hidden: [...layout.hidden] };
}

/** 문항 q 끝에 에피소드를 넣는다(이미 있으면 그대로). 뺀 에피소드였으면 다시 쓰는 것으로. */
export function addBlock(layout: ResolvedCover, doc: CoverDoc, q: number, id: string): ResolvedCover {
  const l = clone(layout);
  if (!l.questions[q] || l.questions[q].blocks.includes(id)) return layout;
  l.questions[q].blocks.push(id);
  return settle(l.questions, l.hidden, doc);
}

/** 문항에서 뺀다. 다른 문항에도 없으면 이 버전에서 뺀 에피소드가 된다. */
export function removeBlock(layout: ResolvedCover, doc: CoverDoc, q: number, i: number): ResolvedCover {
  const l = clone(layout);
  const dropped = l.questions[q]?.blocks.splice(i, 1) ?? [];
  return settle(l.questions, l.hidden, doc, dropped);
}

/** 같은 문항 안에서 위/아래로. 옮긴 뒤 위치를 함께 돌려준다. */
export function nudgeBlock(layout: ResolvedCover, q: number, i: number, delta: -1 | 1): { layout: ResolvedCover; index: number } {
  const blocks = layout.questions[q]?.blocks ?? [];
  const j = i + delta;
  if (j < 0 || j >= blocks.length) return { layout, index: i };
  const l = clone(layout);
  const b = l.questions[q].blocks;
  [b[i], b[j]] = [b[j], b[i]];
  return { layout: l, index: j };
}

/**
 * 앞/다음 문항 끝으로 옮긴다. 옮길 문항에 이미 같은 에피소드가 있으면 원래 자리만 빼고
 * 그 자리를 가리킨다(한 문항 안 중복 금지).
 */
export function moveBlockToQuestion(
  layout: ResolvedCover,
  doc: CoverDoc,
  q: number,
  i: number,
  to: number
): { layout: ResolvedCover; q: number; index: number } {
  if (to < 0 || to >= layout.questions.length || to === q) return { layout, q, index: i };
  const l = clone(layout);
  const [id] = l.questions[q].blocks.splice(i, 1);
  const existing = l.questions[to].blocks.indexOf(id);
  if (existing < 0) l.questions[to].blocks.push(id);
  const next = settle(l.questions, l.hidden, doc);
  return { layout: next, q: to, index: existing >= 0 ? existing : next.questions[to].blocks.length - 1 };
}

let seq = 0;
export function addQuestion(layout: ResolvedCover, doc: CoverDoc, prompt: string): ResolvedCover {
  const l = clone(layout);
  l.questions.push({ id: `q-${Date.now().toString(36)}-${(seq++).toString(36)}`, prompt, limit: null, blocks: [] });
  return settle(l.questions, l.hidden, doc);
}

export function removeQuestion(layout: ResolvedCover, doc: CoverDoc, q: number): ResolvedCover {
  const l = clone(layout);
  const [removed] = l.questions.splice(q, 1);
  return settle(l.questions, l.hidden, doc, removed?.blocks ?? []);
}

export function updateQuestion(layout: ResolvedCover, q: number, patch: Partial<Pick<CoverQuestion, "prompt" | "limit">>): ResolvedCover {
  const l = clone(layout);
  if (l.questions[q]) l.questions[q] = { ...l.questions[q], ...patch };
  return l;
}

export function moveQuestion(layout: ResolvedCover, q: number, delta: -1 | 1): ResolvedCover {
  const j = q + delta;
  if (j < 0 || j >= layout.questions.length) return layout;
  const l = clone(layout);
  [l.questions[q], l.questions[j]] = [l.questions[j], l.questions[q]];
  return l;
}

/** 문항 답변 — 단락을 빈 줄로 이어 붙인다(회사 지원서에 붙여 넣는 모양). */
export function answerText(texts: string[]): string {
  return texts.map((t) => t.trim()).filter(Boolean).join("\n\n");
}

/** 글자 수(공백·줄바꿈 포함) — 한국 채용 사이트 기본 기준. */
export function charCount(text: string): number {
  return Array.from(text).length;
}
