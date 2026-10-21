"use client";

// 커리어런치 지원 현황 — 추천 공고 · 지원 기록(단계) · 공고 분석 · 불합격 회고(서버 /career-launch/applications, /job-recs).
import { authedJsonFetch } from "../member-profile-client";

export type AppStage = "planned" | "applied" | "doc_passed" | "interview" | "offer" | "rejected" | "withdrawn";
export const APP_STAGES: AppStage[] = ["planned", "applied", "doc_passed", "interview", "offer", "rejected", "withdrawn"];

export type JobRec = { id: string; title: string; companyName: string; external: boolean; workLocation: string | null; foreignerFriendly: boolean; deadline: string | null; matchScore: number };
export type AppAnalysis = { fit: string; matched: string[]; missing: string[]; emphasizeInResume: string[]; emphasizeInCover: string[]; likelyInterview: string[] };
export type AppRetro = { summary: string; likelyCauses: string[]; nextActions: string[]; practiceQuestions: string[]; correctionIds?: string[] };
export type AppRecord = {
  id: string;
  positionId: string | null;
  companyName: string;
  jobTitle: string;
  sourceUrl: string | null;
  stage: AppStage;
  stageHistory: { stage: AppStage; at: string; note?: string }[];
  rejectedAtStage: "doc" | "interview" | null;
  analysis: AppAnalysis | null;
  retro: AppRetro | null;
  appliedAt: string | null;
  updatedAt: string;
};
export type AppSummary = { total: number; applied: number; docPassed: number; interview: number; offer: number; rejected: number };

const j = <T,>(r: unknown) => r as T;

export async function fetchJobRecs(): Promise<{ role: string; items: JobRec[]; reason?: string }> {
  return j(await authedJsonFetch<never>("/career-launch/job-recs", { method: "GET" }));
}
export async function fetchApplications(): Promise<{ items: AppRecord[]; summary: AppSummary }> {
  return j(await authedJsonFetch<never>("/career-launch/applications", { method: "GET" }));
}
export async function addApplication(input: { positionId?: string; companyName?: string; jobTitle?: string; sourceUrl?: string; stage?: AppStage }): Promise<AppRecord> {
  return j<{ item: AppRecord }>(await authedJsonFetch<never>("/career-launch/applications", { method: "POST", body: JSON.stringify(input) })).item;
}
export async function updateApplication(id: string, input: { stage?: AppStage; note?: string; rejectedAtStage?: "doc" | "interview" }): Promise<AppRecord> {
  return j<{ item: AppRecord }>(await authedJsonFetch<never>(`/career-launch/applications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })).item;
}
export async function deleteApplication(id: string): Promise<void> {
  await authedJsonFetch<never>(`/career-launch/applications/${encodeURIComponent(id)}`, { method: "DELETE" });
}
export async function analyzeApplication(id: string, jdText?: string): Promise<AppRecord> {
  return j<{ item: AppRecord }>(await authedJsonFetch<never>(`/career-launch/applications/${encodeURIComponent(id)}/analyze`, { method: "POST", body: JSON.stringify(jdText ? { jdText } : {}) })).item;
}
export async function retroApplication(id: string, input: { memo?: string; questions?: string[] }): Promise<{ item: AppRecord; corrections: number }> {
  return j(await authedJsonFetch<never>(`/career-launch/applications/${encodeURIComponent(id)}/retro`, { method: "POST", body: JSON.stringify(input) }));
}
