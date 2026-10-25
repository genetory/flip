"use client";

// 말로 하는 면접 — 한국어 말하기 분석(서버 /career-launch/speaking-analysis). 내용 점수와 별개.
// 숫자(말 빠르기·군말·멈춤·문장 길이·말투)는 서버가 규칙으로 세고, 어색한 표현 고치기·말로 하기 좋은 답은 AI.
import { authedJsonFetch } from "../member-profile-client";

export type SpeakingMetrics = {
  chars: number;
  durationSec: number;
  cpm: number; // 분당 글자(음절) — 멈춘 시간 포함
  pace: "slow" | "good" | "fast";
  fillers: number;
  pauses: number; // 3초 넘게 멈춘 횟수
  sentences: number;
  avgSentence: number;
  longSentences: number;
  endings: { formal: number; polite: number; casual: number };
};
export type SpeakingReport = {
  oneLine: string;
  honorific: "consistent" | "mixed" | "casual";
  honorificNote: string;
  fixes: { original: string; better: string; why: string }[];
  spokenVersion: string;
  tips: string[];
};
/** 면접 기록 한 문항에 붙여 저장(state.basicInterviews[].items[].speakingData) — 4주 성장 기록에 쓴다. */
export type SpeakingData = { mode: "voice"; at: string; metrics: SpeakingMetrics; report: SpeakingReport | null; transcript: string };

export async function analyzeSpeaking(input: { question: string; transcript: string; durationSec: number; pauses: number }): Promise<{ metrics: SpeakingMetrics; report: SpeakingReport | null }> {
  return (await authedJsonFetch<never>("/career-launch/speaking-analysis", { method: "POST", body: JSON.stringify(input) })) as unknown as { metrics: SpeakingMetrics; report: SpeakingReport | null };
}

// ── 꼬리 질문 면접관 ──
export async function requestFollowUp(input: { question: string; answer: string; context?: string; depth: number }): Promise<{ followUp: string; intent: string }> {
  return (await authedJsonFetch<never>("/career-launch/follow-up", { method: "POST", body: JSON.stringify(input) })) as unknown as { followUp: string; intent: string };
}

// ── 1분 자기소개 ──
export type IntroKey = "intro" | "strength" | "evidence" | "closing";
export type Intro1minResult = {
  score: number;
  opening: { ok: boolean; note: string };
  structure: { key: IntroKey; ok: boolean; note: string }[];
  timeNote: string;
  improved: string;
  tips: string[];
  chars: number;
  seconds: number;
  estimated: boolean; // 글로 쓴 경우 — 말하면 걸릴 시간 추정
};
export async function evaluateIntro1min(input: { text: string; durationSec?: number; voice: boolean }): Promise<Intro1minResult> {
  return ((await authedJsonFetch<never>("/career-launch/intro-1min", { method: "POST", body: JSON.stringify(input) })) as unknown as { result: Intro1minResult }).result;
}
/** 1분 자기소개 연습 기록(state.introPractice) — 처음과 최근을 비교한다. */
export type IntroAttempt = { at: string; text: string; seconds: number; voice: boolean; score: number; speakingData?: SpeakingData };
