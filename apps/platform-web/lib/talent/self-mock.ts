"use client";

// 내 서류(이력서·자기소개서) 기반 self 모의 면접 기록 — 계정(서버 Resume.content.renewalMockInterview)에 귀속.
// 문항별 답변·점수·피드백을 저장해 다시 열면 이어서 볼 수 있다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setSelfMock as storeSet, snapshotSelfMock, subscribeDocs, syncUser } from "./renewal-docs-store";

export interface SelfMockFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
}

export interface SelfMockAnswer {
  question: string;
  category: string;
  answer: string;
  score: number | null;
  feedback?: SelfMockFeedback | null;
  updatedAt: number;
}

export interface SelfMockRecord {
  answers: SelfMockAnswer[];
  updatedAt: number;
}

export function useSelfMock(): SelfMockRecord | null {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotSelfMock, () => null);
}

// 한 문항 답변 저장(멱등: 같은 question 은 최신 답변으로 덮어씀).
export function saveSelfMockAnswer(a: {
  question: string;
  category: string;
  answer: string;
  score: number | null;
  feedback?: SelfMockFeedback | null;
}): void {
  const now = Date.now();
  const cur = snapshotSelfMock();
  const answers = [...(cur?.answers ?? [])];
  const entry: SelfMockAnswer = { ...a, updatedAt: now };
  const idx = answers.findIndex((x) => x.question === a.question);
  if (idx >= 0) answers[idx] = entry;
  else answers.push(entry);
  storeSet({ answers, updatedAt: now });
}

export function clearSelfMock(): void {
  storeSet(null);
}
