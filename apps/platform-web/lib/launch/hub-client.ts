// UX Phase 5 — 결과물 허브 / 오답노트 / 성장 view model 클라이언트(서버 결정적 조합).
const TOKEN_KEY = "platform_access_token";
function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  try {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (t) h.Authorization = `Bearer ${t}`;
  } catch {
    /* 익명 */
  }
  return h;
}
async function get(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}${path}`, { headers: authHeaders() });
  const d = (await res.json().catch(() => null)) as (Record<string, unknown> & { ok?: boolean; message?: string }) | null;
  if (!res.ok || d?.ok !== true) throw new Error(d?.message ?? "불러오지 못했어요.");
  return d;
}

// 결과물/오답 그룹 상태 라벨 — 중앙 copy.ts 단일 소스 재사용(UX Phase 7).
export { ARTIFACT_STATUS_LABEL, CORRECTION_GROUP_LABEL } from "./copy";

export type ArtifactItem = { type: string; label: string; status: string; detail?: string | null; updatedAt?: string | null; remaining?: number; destination: string };
export type ArtifactHubVM = {
  summary: { targetJob: string | null; finalizedCount: number; needsConfirmCount: number; firstNeedsConfirm: ArtifactItem | null };
  groups: { direction: ArtifactItem[]; applicationPackage: ArtifactItem[]; interviewPrep: ArtifactItem[] };
};
export type CorrectionCard = { id: string; question: string; weakness: string | null; coachOneLine: string | null; status: string; group: string; attemptCount: number; transferAttempts: number; transferPassed: boolean; initialScore: number | null; latestScore: number | null; lastPracticedAt: string | null };
export type CorrectionsVM = { summary: { total: number; passed: number; inTraining: number; transferPassRatePct: number | null; nextRecommended: CorrectionCard | null }; cards: CorrectionCard[] };
export type GrowthVM = {
  summarySentence: string;
  weekOutcomes: { week: number; done: boolean; label: string }[];
  interviewComparison: { available: boolean; initialScore?: number | null; finalScore?: number | null; delta?: number | null; axes?: { key: string; label: string; initial: number; final: number }[] };
  correctionSummary: { total: number; passed: number; weaknessResolved: number; weaknessTotal: number };
  remainingWeaknesses: unknown[];
  scoreGrowthRate: number | null;
  hasGrowthReport: boolean;
};

export const fetchArtifacts = () => get("/career-launch/artifacts") as Promise<ArtifactHubVM & { ok: boolean }>;
export const fetchCorrections = () => get("/career-launch/corrections") as Promise<CorrectionsVM & { ok: boolean }>;
export const fetchGrowth = () => get("/career-launch/growth") as Promise<GrowthVM & { ok: boolean }>;
