// 자기소개서 문서(1개) — 문항별 답변. 직접 편집 + AI 다듬기.
// 저장은 localStorage 가 아니라 로그인한 계정(서버 Resume.content)에 귀속된다(renewal-docs-store).
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setCoverDoc as storeSetCover, snapshotCover, snapshotCoverHistory, subscribeDocs, syncUser, type DocVersion } from "./renewal-docs-store";

export interface CoverItem {
  id: string;
  question: string; // 소속 문항(섹션)
  text: string; // 항목 내용
  refId?: string; // 피드 글 등 출처와 매핑(중복 삽입 방지)
}

export interface CoverDoc {
  items: CoverItem[];
  questions?: string[]; // 문항(섹션) 목록·순서. 없으면 기본 COVER_QUESTIONS. 사용자가 이름 변경·추가·삭제 가능.
  showPhoto?: boolean; // 자기소개서에 프로필 사진 표시 여부(기본 false)
  // ── AI 자소서 엔진(/members/me/ai/cover-letter) 입력 — 전부 선택값이라 기존 문서와 호환된다.
  companyName?: string; // 지원 회사명
  jobText?: string; // 목표 공고(JD) 본문. 있으면 프롬프트의 '공고 1:1 연결' 규칙이 켜진다.
  keywords?: string[]; // 반드시 본문에 녹일 소재. 프롬프트에서 최우선(누락 시 실패) 규칙으로 처리된다.
  targetChars?: Record<string, number>; // 문항명 → 목표 글자 수. 없는 문항은 길이 지시 없이 생성.
  createdAt: number;
  updatedAt: number;
}

// 기본 자기소개서 문항.
export const COVER_QUESTIONS = ["지원 동기", "나의 강점과 준비된 경험", "성장 과정", "성격의 장단점", "입사 후 포부"];

// 문서의 실제 문항 목록 — 사용자가 커스텀했으면 그 목록, 아니면 기본값.
export function coverQuestions(doc: CoverDoc | null | undefined): string[] {
  return doc?.questions && doc.questions.length ? doc.questions : COVER_QUESTIONS;
}

// 미리보기·렌더용 — 문항 목록 + 목록에 없는 항목의 문항(rename 불일치 등 유실 방지)까지 순서대로.
export function coverSectionOrder(doc: CoverDoc): string[] {
  const qs = coverQuestions(doc);
  const extra: string[] = [];
  for (const it of doc.items) {
    if (!qs.includes(it.question) && !extra.includes(it.question)) extra.push(it.question);
  }
  return [...qs, ...extra];
}

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
  const qs = coverQuestions(doc);
  const covered = new Set(doc.items.filter((i) => i.text.trim().length >= 20 && qs.includes(i.question)).map((i) => i.question));
  return qs.length ? Math.round((covered.size / qs.length) * 100) : 0;
}

export function generateCoverDoc(): CoverDoc {
  const now = Date.now();
  return { items: [], questions: [...COVER_QUESTIONS], showPhoto: false, createdAt: now, updatedAt: now };
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

// 자소서 버전 히스토리 — 에디터 헤더의 '이전 버전' 메뉴용.
const EMPTY_HISTORY: DocVersion<CoverDoc>[] = [];
export function useCoverHistory(): DocVersion<CoverDoc>[] {
  return useSyncExternalStore(subscribeDocs, snapshotCoverHistory, () => EMPTY_HISTORY);
}
