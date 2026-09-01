// Career Launch Phase 7 — 경쟁·직무 리그·동기부여·운영자 개입 순수 로직(DB 무의존, 테스트 가능).
// 점수(6항목 중앙 가중치·정규화·어뷰징 캡)·리그 배정·다음 행동(서버 결정)·배지·개입 우선순위(규칙 기반).
// 안전/공정: 실명 기본 비노출, 소규모 리그 순위 숨김, 보호특성 미사용, 점수=합격률 아님, 서버 계산·스냅샷.
import { z } from "zod";

// ── 점수 버전 + 중앙 가중치 ──────────────────────────────────
export const LEAGUE_SCORING_VERSION = "league_v1";
// 동료 기여 기능(peer feedback)이 아직 없으므로 contribution 비활성 → 활성 항목으로 정규화.
export const CONTRIBUTION_ENABLED = false;
export const SCORE_WEIGHTS = { mission: 0.25, artifact: 0.25, growth: 0.2, practice: 0.15, correction: 0.1, contribution: 0.05 } as const;
// 어뷰징 방지 캡(실전훈련은 무한 반복으로 점수 못 얻게).
export const PRACTICE_CAPS = { trialUnit: 20, mockUnit: 25, transferUnit: 10, transferMax: 3 } as const;

export const LEAGUE_TYPES = ["cohort", "job_family", "weekly_growth", "correction", "consistency"] as const;
export type LeagueType = (typeof LEAGUE_TYPES)[number];
export const LEAGUE_SIZE = { min: 10, max: 20, hideRankBelow: 5 } as const;

// ── 점수 입력/계산 ──────────────────────────────────────────
export type ScoreInput = {
  weeksCompleted: number; // 0..4 (미션)
  artifact: { profileConfirmed: boolean; targetConfirmed: boolean; readiness: number | null; reportsCount: number; unsupportedCount: number; criticalCount: number };
  growth: { comparable: boolean; scoreGrowthRate: number | null; correctionPassRate: number | null };
  practice: { trialsCompleted: number; mocksCompleted: number; transferAttempts: number };
  correction: { total: number; passed: number; weaknessTotal: number; weaknessResolved: number };
};
export type ScoreBreakdown = { mission: number; artifact: number; growth: number; practice: number; correction: number; contribution: number };
export type LeagueScore = { breakdown: ScoreBreakdown; total: number; version: string; notes: string[]; contributionEnabled: boolean };

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function computeLeagueScore(inp: ScoreInput): LeagueScore {
  const notes: string[] = [];
  // 미션: 실제 주차 완료판정(방문·채팅 시작은 미포함 — index.ts 가 완료판정만 전달).
  const mission = clamp((Math.max(0, Math.min(4, inp.weeksCompleted)) / 4) * 100);
  // 결과물: 확인 상태 + readiness, unsupported/critical 감점.
  const a = inp.artifact;
  let artifact = 20 * (a.profileConfirmed ? 1 : 0) + 20 * (a.targetConfirmed ? 1 : 0) + 20 * (a.reportsCount >= 1 ? 1 : 0) + (a.readiness ?? 0) * 0.4;
  artifact -= Math.min(35, a.unsupportedCount * 5 + a.criticalCount * 10);
  artifact = clamp(artifact);
  // 성장: 비교 데이터 없으면 임의 생성 금지(0 + note). 성장률 + 오답 통과율 블렌드(낮은 초기점수만 과도 유리하지 않게 통과율 병행).
  let growth = 0;
  if (inp.growth.comparable && (inp.growth.scoreGrowthRate != null || inp.growth.correctionPassRate != null)) {
    const gr = clamp(inp.growth.scoreGrowthRate ?? 0, 0, 50) / 50; // 0..1
    const cp = clamp(inp.growth.correctionPassRate ?? 0) / 100; // 0..1
    growth = clamp((gr * 0.6 + cp * 0.4) * 100);
  } else {
    notes.push("growth_not_comparable");
  }
  // 실전훈련: 캡 적용(무한 반복 방지).
  const p = inp.practice;
  const practice = clamp(Math.min(100, p.trialsCompleted * PRACTICE_CAPS.trialUnit + p.mocksCompleted * PRACTICE_CAPS.mockUnit + Math.min(p.transferAttempts, PRACTICE_CAPS.transferMax) * PRACTICE_CAPS.transferUnit));
  // 오답 해결: 통과 상태 기준(재도전 횟수 아님).
  const c = inp.correction;
  const correction = c.total > 0 ? clamp((c.passed / c.total) * 70 + (c.weaknessTotal > 0 ? (c.weaknessResolved / c.weaknessTotal) * 30 : 0)) : 0;
  const contribution = 0; // 비활성
  if (!CONTRIBUTION_ENABLED) notes.push("contribution_disabled");

  // 가중 합(비활성 항목 제외하고 정규화 → 100점 만점 유지).
  const parts: [number, number][] = [
    [mission, SCORE_WEIGHTS.mission],
    [artifact, SCORE_WEIGHTS.artifact],
    [growth, SCORE_WEIGHTS.growth],
    [practice, SCORE_WEIGHTS.practice],
    [correction, SCORE_WEIGHTS.correction]
  ];
  if (CONTRIBUTION_ENABLED) parts.push([contribution, SCORE_WEIGHTS.contribution]);
  const wsum = parts.reduce((s, [, w]) => s + w, 0);
  const total = Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / wsum);
  return { breakdown: { mission, artifact, growth, practice, correction, contribution }, total, version: LEAGUE_SCORING_VERSION, notes, contributionEnabled: CONTRIBUTION_ENABLED };
}

// ── 리그 배정(직무군, 최소/최대 인원 병합) ──────────────────
// members: [{ enrollmentId, jobKey }]. jobKey 별 그룹핑 후 min 미만이면 'mixed' 로 합침.
export function assignJobLeagues(members: { enrollmentId: string; jobKey: string | null }[]): Record<string, string> {
  const byKey: Record<string, string[]> = {};
  for (const m of members) {
    const k = m.jobKey || "unassigned";
    (byKey[k] ??= []).push(m.enrollmentId);
  }
  const out: Record<string, string> = {};
  const mixed: string[] = [];
  for (const [k, ids] of Object.entries(byKey)) {
    if (k !== "unassigned" && ids.length >= LEAGUE_SIZE.min) {
      for (const id of ids) out[id] = k;
    } else {
      mixed.push(...ids);
    }
  }
  // mixed 가 충분하면 mixed 리그, 아니면 전부 cohort 리그.
  const mixedKey = mixed.length >= LEAGUE_SIZE.min ? "mixed" : "cohort";
  for (const id of mixed) out[id] = mixedKey;
  return out;
}

// ── 순위 버킷 + 소규모 숨김 ─────────────────────────────────
export type RankBucket = "top" | "upper" | "middle" | "lower";
export function rankBucket(percentile: number): RankBucket {
  if (percentile >= 90) return "top";
  if (percentile >= 60) return "upper";
  if (percentile >= 30) return "middle";
  return "lower";
}
export function shouldHideRank(memberCount: number): boolean {
  return memberCount < LEAGUE_SIZE.hideRankBelow;
}
export function computePercentile(rank: number, total: number): number {
  if (total <= 1) return 100;
  return Math.round(((total - rank) / (total - 1)) * 100);
}

// ── 다음 행동 추천(서버 결정 + 예상 점수 변화) ──────────────
export type NextAction = { key: string; label: string; projectedDelta: number; category: string };
// 후보 행동을 ScoreInput 변형으로 정의 → 재계산 delta 로 영향도 산정(LLM 아님).
export function computeNextActions(inp: ScoreInput, maxN = 3): NextAction[] {
  const base = computeLeagueScore(inp).total;
  const candidates: { key: string; label: string; category: string; apply: (s: ScoreInput) => ScoreInput }[] = [];
  if (inp.weeksCompleted < 4) candidates.push({ key: "complete_week", label: `${inp.weeksCompleted + 1}주차 필수 미션을 완료하면`, category: "mission", apply: (s) => ({ ...s, weeksCompleted: s.weeksCompleted + 1 }) });
  if (!inp.artifact.targetConfirmed) candidates.push({ key: "confirm_target", label: "목표 직무를 확정하면", category: "artifact", apply: (s) => ({ ...s, artifact: { ...s.artifact, targetConfirmed: true } }) });
  if (inp.artifact.criticalCount > 0) candidates.push({ key: "resolve_critical", label: `지원서 critical ${inp.artifact.criticalCount}건을 해결하면`, category: "artifact", apply: (s) => ({ ...s, artifact: { ...s.artifact, criticalCount: 0 } }) });
  if (inp.artifact.unsupportedCount > 0) candidates.push({ key: "resolve_unsupported", label: `근거 부족 문장 ${Math.min(2, inp.artifact.unsupportedCount)}건을 확인하면`, category: "artifact", apply: (s) => ({ ...s, artifact: { ...s.artifact, unsupportedCount: Math.max(0, s.artifact.unsupportedCount - 2) } }) });
  if (inp.practice.mocksCompleted === 0) candidates.push({ key: "first_mock", label: "최초 모의면접을 완료하면", category: "practice", apply: (s) => ({ ...s, practice: { ...s.practice, mocksCompleted: 1 } }) });
  if (inp.correction.total > inp.correction.passed) candidates.push({ key: "pass_correction", label: "유사 질문 하나를 통과해 핵심 오답을 해결하면", category: "correction", apply: (s) => ({ ...s, correction: { ...s.correction, passed: Math.min(s.correction.total, s.correction.passed + 1), weaknessResolved: Math.min(s.correction.weaknessTotal, s.correction.weaknessResolved + 1) } }) });
  const scored = candidates
    .map((c) => ({ key: c.key, label: c.label, category: c.category, projectedDelta: Math.max(0, computeLeagueScore(c.apply(inp)).total - base) }))
    .sort((a, b) => b.projectedDelta - a.projectedDelta);
  return scored.slice(0, maxN);
}

// ── 배지 ────────────────────────────────────────────────────
export type BadgeState = {
  firstConsult: boolean;
  experienceFound: boolean;
  jobExplored: boolean;
  targetConfirmed: boolean;
  firstPackage: boolean;
  factChecked: boolean;
  firstMock: boolean;
  correctionStarted: boolean;
  transferPassed: boolean;
  interviewGrowth: boolean;
  completed4Weeks: boolean;
  consistentParticipation: boolean;
};
export const BADGES: { key: string; title: string; description: string; test: (s: BadgeState) => boolean }[] = [
  { key: "first_consult", title: "첫 상담 완료", description: "전담 코치와 첫 상담을 마쳤어요", test: (s) => s.firstConsult },
  { key: "experience_found", title: "대표 경험 발견", description: "나만의 대표 경험을 찾았어요", test: (s) => s.experienceFound },
  { key: "job_explorer", title: "직무 탐험가", description: "직무 미니 체험을 해봤어요", test: (s) => s.jobExplored },
  { key: "target_confirmed", title: "목표 직무 확정", description: "목표 직무를 정했어요", test: (s) => s.targetConfirmed },
  { key: "first_package", title: "첫 지원 패키지", description: "지원 패키지를 완성했어요", test: (s) => s.firstPackage },
  { key: "fact_checked", title: "사실 검증 완료", description: "서류의 사실 근거를 확인했어요", test: (s) => s.factChecked },
  { key: "first_mock", title: "첫 실전면접", description: "실전 모의면접을 완료했어요", test: (s) => s.firstMock },
  { key: "correction_started", title: "오답 해결 시작", description: "오답 훈련을 시작했어요", test: (s) => s.correctionStarted },
  { key: "transfer_passed", title: "유사 질문 통과", description: "유사 질문까지 통과했어요", test: (s) => s.transferPassed },
  { key: "interview_growth", title: "면접 성장", description: "최초보다 면접이 좋아졌어요", test: (s) => s.interviewGrowth },
  { key: "completed_4weeks", title: "4주 완주", description: "4주 프로그램을 완주했어요", test: (s) => s.completed4Weeks },
  { key: "consistent", title: "꾸준한 참여", description: "의미 있는 활동을 꾸준히 이어갔어요", test: (s) => s.consistentParticipation }
];
export function evaluateBadges(state: BadgeState, alreadyEarned: string[]): string[] {
  const earned = new Set(alreadyEarned);
  return BADGES.filter((b) => b.test(state) && !earned.has(b.key)).map((b) => b.key);
}

// ── 개입 신호 → 우선순위(규칙 기반, AI 요약과 분리) ─────────
export const INTERVENTION_PRIORITIES = ["critical", "high", "medium", "low", "resolved"] as const;
export type InterventionPriority = (typeof INTERVENTION_PRIORITIES)[number];
export const INTERVENTION_STATUSES = ["open", "assigned", "contacted", "in_review", "waiting_user", "resolved", "dismissed"] as const;
export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];
export type InterventionSignals = {
  daysSinceActivity: number;
  requiredMissionIncomplete: boolean;
  criticalCount: number;
  unsupportedCount: number;
  repeatedWeaknessUnresolved: boolean;
  lowAiConfidence: boolean;
  humanReviewRequested: boolean;
  fatigueOrQuitExpressed: boolean;
  deadlineImminentLowProgress: boolean;
};
export function computeInterventionPriority(s: InterventionSignals): { priority: InterventionPriority; reasonCodes: string[] } {
  const reasonCodes: string[] = [];
  if (s.humanReviewRequested) reasonCodes.push("human_review_requested");
  if (s.fatigueOrQuitExpressed) reasonCodes.push("fatigue_or_quit");
  if (s.criticalCount > 0) reasonCodes.push("document_critical");
  if (s.deadlineImminentLowProgress) reasonCodes.push("deadline_low_progress");
  if (s.daysSinceActivity >= 7) reasonCodes.push("stalled_7d");
  else if (s.daysSinceActivity >= 4) reasonCodes.push("stalled_4d");
  if (s.requiredMissionIncomplete) reasonCodes.push("mission_incomplete");
  if (s.repeatedWeaknessUnresolved) reasonCodes.push("repeated_weakness");
  if (s.unsupportedCount > 0) reasonCodes.push("unsupported_claims");
  if (s.lowAiConfidence) reasonCodes.push("low_ai_confidence");

  let priority: InterventionPriority = "low";
  if (s.humanReviewRequested || s.fatigueOrQuitExpressed || s.deadlineImminentLowProgress) priority = "critical";
  else if (s.criticalCount > 0 || s.daysSinceActivity >= 7 || s.repeatedWeaknessUnresolved) priority = "high";
  else if (s.unsupportedCount > 0 || s.daysSinceActivity >= 4 || s.lowAiConfidence) priority = "medium";
  return { priority, reasonCodes };
}
// 개입 상태 전이(dismissed 는 사유 필요 — index.ts 에서 검증).
const INTERVENTION_FLOW: Record<InterventionStatus, InterventionStatus[]> = {
  open: ["assigned", "contacted", "in_review", "dismissed", "resolved"],
  assigned: ["contacted", "in_review", "waiting_user", "resolved", "dismissed"],
  contacted: ["in_review", "waiting_user", "resolved", "dismissed"],
  in_review: ["waiting_user", "resolved", "dismissed"],
  waiting_user: ["in_review", "contacted", "resolved", "dismissed"],
  resolved: ["open"],
  dismissed: ["open"]
};
export function canTransitionIntervention(from: InterventionStatus, to: InterventionStatus): boolean {
  if (from === to) return true;
  return (INTERVENTION_FLOW[from] ?? []).includes(to);
}

// ── zod(JSON 필드 검증) ─────────────────────────────────────
export const ScoreSnapshotSchema = z.object({
  version: z.string().max(40),
  breakdown: z.object({ mission: z.number(), artifact: z.number(), growth: z.number(), practice: z.number(), correction: z.number(), contribution: z.number() }),
  total: z.number(),
  notes: z.array(z.string().max(60)).optional().default([])
});
export const CohortGoalConfigSchema = z.object({ goalType: z.string().max(40), targetValue: z.number(), unit: z.string().max(40).optional().default("") });
export const InterventionEvidenceSchema = z.object({ signals: z.record(z.string(), z.unknown()).optional(), facts: z.array(z.string().max(300)).max(20).optional().default([]) });

export const COHORT_GOAL_TYPES = ["mission_completion", "job_trials", "packages", "mock_interviews", "corrections_resolved"] as const;
