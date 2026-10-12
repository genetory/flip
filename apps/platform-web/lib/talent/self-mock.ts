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
  /** 연습한 날(한국 시간 YYYY-MM-DD, 최근 60일) — 같은 질문은 덮어써서 답변만으로는 '며칠 연속'을 알 수 없다. */
  days?: string[];
  /** 10분 모의 면접 세트를 끝까지 한 횟수 — '면접 준비 단계'의 마지막 단계. */
  setsCompleted?: number;
}

/** 10분 모의 면접 세트를 끝까지 했다. */
export function markInterviewSetCompleted(): void {
  const cur = snapshotSelfMock();
  storeSet({ answers: cur?.answers ?? [], updatedAt: Date.now(), days: cur?.days, setsCompleted: (cur?.setsCompleted ?? 0) + 1 });
}

/** 한국 시간 기준 날짜(YYYY-MM-DD). */
function kstDate(ts: number): string {
  return new Date(ts + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** 연속 연습 일수 — 오늘(또는 어제)까지 하루도 빠지지 않고 연습한 날 수. 오늘 아직 안 했어도 어제까지 이어졌으면 유지. */
export function practiceStreak(record: SelfMockRecord | null | undefined, now = Date.now()): { streak: number; doneToday: boolean } {
  const days = new Set(record?.days ?? (record?.answers ?? []).map((a) => kstDate(a.updatedAt)));
  const today = kstDate(now);
  const doneToday = days.has(today);
  let streak = 0;
  for (let i = doneToday ? 0 : 1; i < 400; i++) {
    if (days.has(kstDate(now - i * 86_400_000))) streak++;
    else break;
  }
  return { streak, doneToday };
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
  const days = [...new Set([...(cur?.days ?? (cur?.answers ?? []).map((x) => kstDate(x.updatedAt))), kstDate(now)])].sort().slice(-60);
  storeSet({ answers, updatedAt: now, days, setsCompleted: cur?.setsCompleted });
}

export function clearSelfMock(): void {
  storeSet(null);
}
