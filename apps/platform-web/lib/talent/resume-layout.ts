// 모듈형 이력서 구성(ResumeLayout) 다루기 — 순수 함수. 화면과 저장은 호출부가 한다.
//
// 구성은 "어떤 모듈을 어느 칸 몇 번째에 둘지"만 갖고, 모듈 내용은 ResumeDoc 이 원본이다.
// 그래서 문서가 바뀌면(앱에서 항목 추가·삭제) 구성과 어긋날 수 있다 → resolveLayout 으로 맞춘다.
import type { CareerSection } from "./career-chat";
import { FIXED_MODULES, isFixedModule, type ResumeLayout } from "./doc-versions";
import type { ResumeDoc } from "./resume-doc";

/** 2단일 때 왼쪽(좁은) 칸에 두는 섹션 — 짧은 항목들. */
export const SIDE_SECTIONS: CareerSection[] = ["skill", "language", "certificate", "award"];

export type ResolvedLayout = ResumeLayout & {
  /** 구성에 없는 모듈 — 앱이나 옛 화면에서 새로 추가된 항목 등. */
  unplaced: string[];
};

/** 문서에 실제로 있는 모듈 id(고정 모듈 포함). */
export function moduleIds(doc: ResumeDoc): string[] {
  return [FIXED_MODULES.basic, FIXED_MODULES.summary, ...doc.items.map((i) => i.id), FIXED_MODULES.links];
}

export function sectionOf(doc: ResumeDoc, id: string): CareerSection | null {
  if (isFixedModule(id)) return null;
  return doc.items.find((i) => i.id === id)?.section ?? null;
}

const colCount = (template: ResumeLayout["template"]) => (template === "two" ? 2 : 1);

/**
 * 저장된 구성을 지금 문서에 맞춘다.
 * - 지워진 모듈·중복 id 는 뺀다.
 * - 템플릿과 칸 수가 어긋나면(수동 편집·옛 데이터) 템플릿 기준으로 맞춘다.
 * - 구성에 없는 모듈은 unplaced 로 돌려준다(버리지 않는다).
 */
export function resolveLayout(layout: ResumeLayout, doc: ResumeDoc): ResolvedLayout {
  const exists = new Set(moduleIds(doc));
  const seen = new Set<string>();
  const keep = (id: string) => {
    if (!exists.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  };
  let cols = layout.cols.map((col) => col.filter(keep));
  const hidden = layout.hidden.filter(keep);
  const unplaced = moduleIds(doc).filter((id) => !seen.has(id));

  const want = colCount(layout.template);
  if (cols.length === 0) cols = [[]];
  if (cols.length > want) cols = [cols.flat()];
  if (cols.length < want) cols = splitTwo(cols[0], doc);
  return { template: layout.template, cols, hidden, unplaced };
}

/** 한 칸을 두 칸으로 — 기본 정보·짧은 섹션은 왼쪽, 나머지는 오른쪽(순서는 그대로). */
function splitTwo(col: string[], doc: ResumeDoc): string[][] {
  const left: string[] = [];
  const right: string[] = [];
  for (const id of col) {
    const sec = sectionOf(doc, id);
    if (id === FIXED_MODULES.basic || (sec && SIDE_SECTIONS.includes(sec))) left.push(id);
    else right.push(id);
  }
  return [left, right];
}

/** 템플릿 전환 — 2단→1단은 왼쪽 칸 뒤에 오른쪽 칸을 잇고, 1단→2단은 섹션 기준으로 나눈다. */
export function setTemplate(layout: ResolvedLayout, template: ResumeLayout["template"], doc: ResumeDoc): ResolvedLayout {
  if (layout.template === template) return layout;
  const cols = template === "one" ? [layout.cols.flat()] : splitTwo(layout.cols.flat(), doc);
  return { ...layout, template, cols };
}

const clone = (l: ResolvedLayout): ResolvedLayout => ({
  ...l,
  cols: l.cols.map((c) => [...c]),
  hidden: [...l.hidden],
  unplaced: [...l.unplaced]
});

function detach(l: ResolvedLayout, id: string) {
  l.cols = l.cols.map((c) => c.filter((x) => x !== id));
  l.hidden = l.hidden.filter((x) => x !== id);
  l.unplaced = l.unplaced.filter((x) => x !== id);
}

/** 모듈이 들어갈 자연스러운 자리 — 같은 섹션의 마지막 모듈 뒤, 없으면 섹션 성격에 맞는 칸 끝. */
function naturalSlot(l: ResolvedLayout, doc: ResumeDoc, id: string): { col: number; index: number } {
  const last = l.cols.length - 1;
  if (id === FIXED_MODULES.basic) return { col: 0, index: 0 };
  if (id === FIXED_MODULES.summary) {
    const col = last;
    const at = l.cols[col].indexOf(FIXED_MODULES.basic);
    return { col, index: at >= 0 ? at + 1 : 0 };
  }
  if (id === FIXED_MODULES.links) return { col: last, index: l.cols[last].length };
  const sec = sectionOf(doc, id);
  for (let c = l.cols.length - 1; c >= 0; c--) {
    const idx = l.cols[c].map((x) => sectionOf(doc, x)).lastIndexOf(sec);
    if (idx >= 0) return { col: c, index: idx + 1 };
  }
  const col = l.template === "two" && sec && SIDE_SECTIONS.includes(sec) ? 0 : last;
  // 링크 모듈은 늘 끝에 두므로 그 앞에 넣는다.
  const linksAt = l.cols[col].indexOf(FIXED_MODULES.links);
  return { col, index: linksAt >= 0 ? linksAt : l.cols[col].length };
}

/** 모듈을 자연스러운 자리에 넣는다(배치 안 된 모듈 넣기·빼 둔 모듈 다시 넣기·새 항목). */
export function placeModule(layout: ResolvedLayout, doc: ResumeDoc, id: string): ResolvedLayout {
  const l = clone(layout);
  detach(l, id);
  const slot = naturalSlot(l, doc, id);
  l.cols[slot.col].splice(slot.index, 0, id);
  return l;
}

/** 배치 안 된 모듈을 모두 자연스러운 자리에 넣는다 — 대표 버전은 새 항목이 빠지지 않게 늘 이렇게 본다. */
export function placeAllUnplaced(layout: ResolvedLayout, doc: ResumeDoc): ResolvedLayout {
  return layout.unplaced.reduce((acc, id) => placeModule(acc, doc, id), { ...layout, unplaced: [...layout.unplaced] });
}

/** 지정한 칸의 index 자리로 옮긴다(드래그 앤 드롭). index 는 옮기기 전 기준 위치. */
export function moveModuleTo(layout: ResolvedLayout, id: string, col: number, index: number): ResolvedLayout {
  const l = clone(layout);
  const from = l.cols.findIndex((c) => c.includes(id));
  const fromIndex = from >= 0 ? l.cols[from].indexOf(id) : -1;
  detach(l, id);
  // 같은 칸에서 아래로 옮기면 빼낸 만큼 자리가 당겨진다.
  const target = from === col && fromIndex >= 0 && fromIndex < index ? index - 1 : index;
  const c = Math.max(0, Math.min(col, l.cols.length - 1));
  l.cols[c].splice(Math.max(0, Math.min(target, l.cols[c].length)), 0, id);
  return l;
}

/** 같은 칸 안에서 한 칸 위/아래로. */
export function nudgeModule(layout: ResolvedLayout, id: string, delta: -1 | 1): ResolvedLayout {
  const c = layout.cols.findIndex((col) => col.includes(id));
  if (c < 0) return layout;
  const i = layout.cols[c].indexOf(id);
  const j = i + delta;
  if (j < 0 || j >= layout.cols[c].length) return layout;
  const l = clone(layout);
  [l.cols[c][i], l.cols[c][j]] = [l.cols[c][j], l.cols[c][i]];
  return l;
}

/** 다른 칸 끝으로(2단에서만). */
export function moveToOtherColumn(layout: ResolvedLayout, id: string): ResolvedLayout {
  if (layout.cols.length < 2) return layout;
  const c = layout.cols.findIndex((col) => col.includes(id));
  if (c < 0) return layout;
  const to = c === 0 ? 1 : 0;
  return moveModuleTo(layout, id, to, layout.cols[to].length);
}

/** 이 버전에서 빼기. */
export function hideModule(layout: ResolvedLayout, id: string): ResolvedLayout {
  const l = clone(layout);
  detach(l, id);
  l.hidden.push(id);
  return l;
}

/** 저장용 — 화면 전용 필드(unplaced)를 뺀다. */
export function toStoredLayout(layout: ResolvedLayout): ResumeLayout {
  return { template: layout.template, cols: layout.cols.map((c) => [...c]), hidden: [...layout.hidden] };
}

export function locate(layout: ResolvedLayout, id: string): { col: number; index: number } | null {
  for (let c = 0; c < layout.cols.length; c++) {
    const i = layout.cols[c].indexOf(id);
    if (i >= 0) return { col: c, index: i };
  }
  return null;
}
