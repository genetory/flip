// 자기소개서 문서(1개) — 문항별 답변. 직접 편집 + AI 다듬기.
// 지금은 localStorage 기반(mock), AI 다듬기는 /api/cover-assist. 추후 서버 저장으로 교체.
import { useSyncExternalStore } from "react";

export interface CoverItem {
  id: string;
  question: string; // 소속 문항(섹션)
  text: string; // 항목 내용
  refId?: string; // 피드 글 등 출처와 매핑(중복 삽입 방지)
}

export interface CoverDoc {
  items: CoverItem[];
  showPhoto?: boolean; // 자기소개서에 프로필 사진 표시 여부(기본 false)
  createdAt: number;
  updatedAt: number;
}

// 기본 자기소개서 문항.
export const COVER_QUESTIONS = ["지원 동기", "나의 강점과 준비된 경험", "성장 과정", "성격의 장단점", "입사 후 포부"];

// 문항별 이모지(칩·타이틀 표시용).
export const COVER_QUESTION_EMOJI: Record<string, string> = {
  "지원 동기": "🎯",
  "나의 강점과 준비된 경험": "💪",
  "성장 과정": "🌱",
  "성격의 장단점": "⚖️",
  "입사 후 포부": "🚀"
};

export function coverQuestionEmoji(question: string): string {
  return COVER_QUESTION_EMOJI[question] ?? "📝";
}

const KEY = "talent.coverDoc.v1";

const listeners = new Set<() => void>();
let cache: CoverDoc | null | undefined;

function read(): CoverDoc | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      cache = null;
    } else {
      const parsed = JSON.parse(raw) as CoverDoc;
      // 구버전({question, answer}) → 항목 기반({id, question, text})으로 마이그레이션. 빈 항목은 제거.
      const rawItems = (parsed.items ?? []) as Array<CoverItem & { answer?: string }>;
      const items: CoverItem[] = rawItems
        .map((it) => ({ id: it.id ?? uid(), question: it.question, text: (it.text ?? it.answer ?? "").trim(), ...(it.refId ? { refId: it.refId } : {}) }))
        .filter((it) => it.text.length > 0);
      cache = { ...parsed, items };
    }
  } catch {
    cache = null;
  }
  return cache;
}

function emit() {
  cache = undefined;
  listeners.forEach((l) => l());
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function saveCoverDoc(doc: CoverDoc): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...doc, updatedAt: Date.now() }));
  } catch {
    /* mock */
  }
  emit();
}

export function clearCoverDoc(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
  emit();
}

// 자기소개서 완성도(0~100) — 항목이 채워진 문항 비율.
export function coverCompleteness(doc: CoverDoc | null): number {
  if (!doc || doc.items.length === 0) return 0;
  const covered = new Set(doc.items.filter((i) => i.text.trim().length >= 20).map((i) => i.question));
  return Math.round((covered.size / COVER_QUESTIONS.length) * 100);
}

export function generateCoverDoc(): CoverDoc {
  const now = Date.now();
  return { items: [], showPhoto: false, createdAt: now, updatedAt: now };
}

export function addCoverItem(doc: CoverDoc, question: string, text: string): { doc: CoverDoc; id: string } {
  const id = uid();
  return { doc: { ...doc, items: [...doc.items, { id, question, text }] }, id };
}

// refId 로 매핑된 자소서 항목을 멱등 삽입(피드 자동 추출용). 문서가 없으면 새로 만든다.
// question 이 기본 문항이 아니면 "지원 동기"로 근사(자유 문항은 UI에서 정리).
export function ensureCoverItemByRef(refId: string, question: string, text: string): void {
  const t = text.trim();
  if (!t) return;
  const now = Date.now();
  const doc = read() ?? { items: [], showPhoto: false, createdAt: now, updatedAt: now };
  if (doc.items.some((i) => i.refId === refId)) return;
  const q = COVER_QUESTIONS.includes(question) ? question : COVER_QUESTIONS[0];
  const item: CoverItem = { id: uid(), question: q, text: t, refId };
  saveCoverDoc({ ...doc, items: [...doc.items, item] });
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCoverDoc(): CoverDoc | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
