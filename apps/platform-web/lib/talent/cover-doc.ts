// 자기소개서 문서(1개) — 문항별 답변. 직접 편집 + AI 다듬기.
// 저장은 localStorage 가 아니라 로그인한 계정(서버 Resume.content)에 귀속된다(renewal-docs-store).
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setCoverDoc as storeSetCover, snapshotCover, subscribeDocs, syncUser } from "./renewal-docs-store";

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

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// 저장 — 계정(서버)에 반영. 실제 쓰기는 공유 스토어가 debounce 처리한다.
export function saveCoverDoc(doc: CoverDoc): void {
  storeSetCover({ ...doc, updatedAt: Date.now() });
}

export function clearCoverDoc(): void {
  storeSetCover(null);
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
  const doc = snapshotCover() ?? { items: [], showPhoto: false, createdAt: now, updatedAt: now };
  if (doc.items.some((i) => i.refId === refId)) return;
  const q = COVER_QUESTIONS.includes(question) ? question : COVER_QUESTIONS[0];
  const item: CoverItem = { id: uid(), question: q, text: t, refId };
  saveCoverDoc({ ...doc, items: [...doc.items, item] });
}

// 계정 귀속 — 로그인한 유저의 서버 자기소개서를 구독한다. 계정이 바뀌면 자동으로
// 캐시를 비우고 새 계정의 문서를 로드한다.
export function useCoverDoc(): CoverDoc | null {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotCover, () => null);
}
