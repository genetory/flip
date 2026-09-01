// Career Launch Week 3~4 '실전 모의면접 & 오답노트'(Phase 6) — 순수 로직/데이터 계층(DB 무의존, 테스트 가능).
// 면접 세션·질문별 평가(8축)·반복 취약패턴(taxonomy)·오답 상태전이·유사질문 통과기준·성장률·완료 판정.
// 저장/조회/LLM 호출은 index.ts. 안전/공정: 합격가능성 표현 금지, 보호특성 미사용, 억양/말투를 역량으로 단정 금지.
import { z } from "zod";

// ── 프롬프트/점수 버전 ──────────────────────────────────────
export const WEEK34_VERSIONS = {
  strategy: "iv_strategy_v1",
  questionGen: "iv_qgen_v1",
  answerEval: "iv_eval_v1",
  weakness: "iv_weakness_v1",
  report: "iv_report_v1",
  coaching: "iv_coaching_v1",
  similar: "iv_similar_v1",
  growth: "iv_growth_v1"
} as const;
export const SCORING_VERSION = "iv_scoring_v1";

// ── 세션 ────────────────────────────────────────────────────
export const SESSION_TYPES = ["initial_mock", "practice", "retry", "final_mock"] as const;
export type SessionType = (typeof SESSION_TYPES)[number];
export const SESSION_STATUSES = ["ready", "in_progress", "paused", "completed", "abandoned", "failed"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export const INPUT_MODES = ["text", "voice_to_text"] as const;
export type InputMode = (typeof INPUT_MODES)[number];

// ── 질문 유형 ───────────────────────────────────────────────
export const QUESTION_TYPES = ["intro", "motivation", "job_understanding", "job_competency", "experience", "problem_solving", "collaboration", "conflict", "failure", "achievement_verify", "jd_requirement", "tech_knowledge", "culture_fit", "pressure", "fact_check", "follow_up"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

// ── 비용/피로 방지 제한 ─────────────────────────────────────
export const INTERVIEW_LIMITS = {
  minCoreQuestions: 7,
  maxCoreQuestions: 10,
  maxFollowupsPerQuestion: 2,
  maxTotalQuestions: 14,
  maxRetriesPerQuestion: 2, // 같은 질문 재도전 상한(외운 답변 방지)
  maxTrainingPerSession: 8 // 한 세션 최대 훈련 질문
} as const;

// ── 질문별 평가(8축, 텍스트 기반) ───────────────────────────
export const ANSWER_EVAL_AXES = ["questionUnderstanding", "relevance", "specificity", "evidence", "structure", "jobConnection", "consistency", "delivery"] as const;
export const AnswerEvaluationSchema = z.object({
  scores: z.object({
    questionUnderstanding: z.number().min(0).max(100),
    relevance: z.number().min(0).max(100),
    specificity: z.number().min(0).max(100),
    evidence: z.number().min(0).max(100),
    structure: z.number().min(0).max(100),
    jobConnection: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
    delivery: z.number().min(0).max(100)
  }),
  total: z.number().min(0).max(100),
  good: z.array(z.string().max(300)).max(6).optional().default([]),
  keyProblem: z.string().max(400).optional().default(""),
  problemSpan: z.string().max(500).optional().default(""), // 문제 구간/문장
  whyImprove: z.string().max(500).optional().default(""),
  recommendedStructure: z.string().max(500).optional().default(""),
  useExperience: z.string().max(300).optional().default(""),
  recommendedFollowUp: z.string().max(400).optional().default(""),
  weaknessTypes: z.array(z.string().max(40)).max(6).optional().default([]), // 감지된 취약 패턴 코드
  confidence: z.number().min(0).max(1).optional().default(0.6)
});
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;
export function answerEvalTotal(scores: Record<string, number>): number {
  const vals = ANSWER_EVAL_AXES.map((a) => Math.max(0, Math.min(100, scores[a] ?? 0)));
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// ── 반복 취약 패턴 taxonomy(코드→한국어) ────────────────────
export const WEAKNESS_TYPES = [
  "QUESTION_MISREAD", "ABSTRACT_ANSWER", "MISSING_CONTEXT", "UNCLEAR_ROLE", "MISSING_ACTION", "MISSING_RESULT",
  "WEAK_EVIDENCE", "POOR_STRUCTURE", "TOO_LONG", "TOO_SHORT", "WEAK_JOB_CONNECTION", "INCONSISTENT_WITH_DOCUMENT",
  "UNVERIFIED_CLAIM", "DEFENSIVE_RESPONSE", "WEAK_MOTIVATION", "LACK_OF_REFLECTION", "FOLLOWUP_BREAKDOWN"
] as const;
export type WeaknessType = (typeof WEAKNESS_TYPES)[number];
export const WEAKNESS_LABELS: Record<WeaknessType, string> = {
  QUESTION_MISREAD: "질문의 핵심을 놓치고 다른 답을 합니다.",
  ABSTRACT_ANSWER: "답변이 추상적이고 구체적인 사례가 적습니다.",
  MISSING_CONTEXT: "어떤 상황이었는지 배경 설명이 부족합니다.",
  UNCLEAR_ROLE: "팀 성과는 설명하지만 본인이 한 행동이 분명하지 않습니다.",
  MISSING_ACTION: "무엇을 했는지 구체적 행동이 빠져 있습니다.",
  MISSING_RESULT: "결과나 변화가 드러나지 않습니다.",
  WEAK_EVIDENCE: "주장을 뒷받침하는 근거가 약합니다.",
  POOR_STRUCTURE: "답변 구조가 정리되지 않아 전달이 어렵습니다.",
  TOO_LONG: "핵심보다 배경 설명이 길어집니다.",
  TOO_SHORT: "답변이 너무 짧아 설득력이 부족합니다.",
  WEAK_JOB_CONNECTION: "경험은 구체적이지만 지원 직무와 연결되지 않습니다.",
  INCONSISTENT_WITH_DOCUMENT: "이력서·자기소개서 내용과 답변이 다릅니다.",
  UNVERIFIED_CLAIM: "확인되지 않은 성과나 사실을 말합니다.",
  DEFENSIVE_RESPONSE: "지적에 방어적으로 반응합니다.",
  WEAK_MOTIVATION: "지원 동기가 약하거나 회사와 연결되지 않습니다.",
  LACK_OF_REFLECTION: "경험에서 배운 점·성찰이 부족합니다.",
  FOLLOWUP_BREAKDOWN: "첫 답변은 괜찮지만 꼬리질문에서 근거가 약해집니다."
};
export function isWeaknessType(x: unknown): x is WeaknessType {
  return typeof x === "string" && (WEAKNESS_TYPES as readonly string[]).includes(x);
}
export function weaknessLabel(code: string): string {
  return isWeaknessType(code) ? WEAKNESS_LABELS[code] : code;
}

export const WeaknessAnalysisSchema = z.object({
  weaknesses: z.array(z.object({
    weaknessType: z.string().max(40),
    title: z.string().max(300),
    evidence: z.array(z.string().max(300)).max(6).optional().default([]), // 발생한 질문/답변 근거
    occurrenceCount: z.number().int().min(1).max(20),
    severity: z.enum(["low", "medium", "high"]).optional().default("medium"),
    priority: z.number().int().min(1).max(10).optional().default(5),
    coachingStrategy: z.string().max(500).optional().default("")
  })).max(12)
});
export type WeaknessAnalysis = z.infer<typeof WeaknessAnalysisSchema>;

// ── 오답 상태 전이 ──────────────────────────────────────────
export const CORRECTION_STATUSES = ["discovered", "coaching", "retrying", "transfer_test", "passed", "paused", "archived"] as const;
export type CorrectionStatus = (typeof CORRECTION_STATUSES)[number];
export const ATTEMPT_TYPES = ["same_question", "similar_question", "follow_up"] as const;
export type AttemptType = (typeof ATTEMPT_TYPES)[number];
// 정상 진행 전이(보조 paused/archived 는 어디서든 가능).
const CORRECTION_FLOW: Record<CorrectionStatus, CorrectionStatus[]> = {
  discovered: ["coaching", "paused", "archived"],
  coaching: ["retrying", "paused", "archived"],
  retrying: ["transfer_test", "coaching", "paused", "archived"],
  transfer_test: ["passed", "retrying", "coaching", "paused", "archived"],
  passed: ["archived"],
  paused: ["coaching", "retrying", "transfer_test", "archived"],
  archived: []
};
export function canTransitionCorrection(from: CorrectionStatus, to: CorrectionStatus): boolean {
  if (from === to) return true;
  return (CORRECTION_FLOW[from] ?? []).includes(to);
}

// 오답 통과 판정 — 점수만 오르면 통과 아님. 여러 조건 종합.
export type PassInput = {
  sameQuestionImproved: boolean; // 같은 질문 재도전에서 핵심 문제 개선
  similarUsedStructure: boolean; // 유사 질문에서도 개선된 구조 사용
  consistentWithDocument: boolean;
  evidenceConcrete: boolean;
  roleClear: boolean;
  jobConnected: boolean;
  noNewCritical: boolean; // 심각한 새 취약점 없음
  aiConfidence: number; // 0~1
};
export type PassResult = { passed: boolean; reason: string; needsHumanReview: boolean; met: string[]; unmet: string[] };
export function evaluateCorrectionPass(inp: PassInput): PassResult {
  const criteria: { key: keyof PassInput; label: string; required: boolean }[] = [
    { key: "sameQuestionImproved", label: "같은 질문에서 핵심 문제 개선", required: true },
    { key: "similarUsedStructure", label: "유사 질문에서도 개선된 구조 사용", required: true },
    { key: "consistentWithDocument", label: "지원서와 일관", required: true },
    { key: "evidenceConcrete", label: "근거 구체적", required: false },
    { key: "roleClear", label: "본인 역할·행동 명확", required: true },
    { key: "jobConnected", label: "목표 직무 연결", required: false },
    { key: "noNewCritical", label: "새 취약점 없음", required: true }
  ];
  const met: string[] = [];
  const unmet: string[] = [];
  for (const c of criteria) {
    if (inp[c.key] === true) met.push(c.label);
    else unmet.push(c.label);
  }
  const requiredUnmet = criteria.filter((c) => c.required && inp[c.key] !== true);
  // 필수 조건 + 선택 중 최소 1개 이상 충족.
  const optionalMet = criteria.filter((c) => !c.required && inp[c.key] === true).length;
  const passed = requiredUnmet.length === 0 && optionalMet >= 1;
  const needsHumanReview = inp.aiConfidence < 0.5;
  const reason = passed ? `필수 기준 충족(${met.join(", ")})` : `미충족: ${requiredUnmet.map((c) => c.label).join(", ")}`;
  return { passed, reason, needsHumanReview, met, unmet };
}

export const CorrectionCoachingSchema = z.object({
  keyIssue: z.string().max(400), // 가장 중요한 한 가지
  whyWeak: z.string().max(500),
  recommendedStructure: z.string().max(500),
  useExperience: z.string().max(300).optional().default(""),
  hint: z.string().max(400).optional().default("")
});
export const SimilarQuestionSchema = z.object({ question: z.string().max(500), competency: z.string().max(120), context: z.string().max(300).optional().default("") });

// ── 성장률(11지표) ─────────────────────────────────────────
export type GrowthInput = {
  initialTotal: number;
  finalTotal: number;
  initialAxes: Partial<Record<(typeof ANSWER_EVAL_AXES)[number], number>>;
  finalAxes: Partial<Record<(typeof ANSWER_EVAL_AXES)[number], number>>;
  correctionsTotal: number;
  correctionsPassed: number;
  transferTotal: number;
  transferPassed: number;
  weaknessesTotal: number;
  weaknessesResolved: number;
  followupHandled: number; // 0~1
  scoringVersion: string;
};
export type GrowthData = {
  initialScore: number;
  finalScore: number;
  scoreDelta: number;
  scoreGrowthRate: number;
  correctionPassRate: number;
  transferPassRate: number;
  weaknessResolvedCount: number;
  remainingWeaknessCount: number;
  consistencyChange: number;
  evidenceChange: number;
  jobConnectionChange: number;
  scoringVersion: string;
};
export function computeGrowth(inp: GrowthInput): GrowthData {
  const axisDelta = (a: (typeof ANSWER_EVAL_AXES)[number]) => (inp.finalAxes[a] ?? 0) - (inp.initialAxes[a] ?? 0);
  const scoreDelta = inp.finalTotal - inp.initialTotal;
  return {
    initialScore: inp.initialTotal,
    finalScore: inp.finalTotal,
    scoreDelta,
    scoreGrowthRate: inp.initialTotal > 0 ? Math.round((scoreDelta / inp.initialTotal) * 100) : 0,
    correctionPassRate: inp.correctionsTotal > 0 ? Math.round((inp.correctionsPassed / inp.correctionsTotal) * 100) : 0,
    transferPassRate: inp.transferTotal > 0 ? Math.round((inp.transferPassed / inp.transferTotal) * 100) : 0,
    weaknessResolvedCount: inp.weaknessesResolved,
    remainingWeaknessCount: Math.max(0, inp.weaknessesTotal - inp.weaknessesResolved),
    consistencyChange: axisDelta("consistency"),
    evidenceChange: axisDelta("evidence"),
    jobConnectionChange: axisDelta("jobConnection"),
    scoringVersion: inp.scoringVersion
  };
}

export const GrowthReportSchema = z.object({
  mostImproved: z.array(z.string().max(200)).max(6).optional().default([]),
  remainingWeaknesses: z.array(z.string().max(200)).max(8).optional().default([]),
  bestAnswerExample: z.string().max(600).optional().default(""),
  confirmedCompetencies: z.array(z.string().max(120)).max(8).optional().default([]),
  interviewerWillCheck: z.array(z.string().max(200)).max(6).optional().default([]),
  interviewDayTips: z.array(z.string().max(200)).max(8).optional().default([]),
  next7Days: z.array(z.string().max(200)).max(8).optional().default([]),
  next30Days: z.array(z.string().max(200)).max(8).optional().default([]),
  coachMessage: z.string().max(800).optional().default("")
});
export type GrowthReport = z.infer<typeof GrowthReportSchema>;

// Week3 종합 리포트.
export const Week3ReportSchema = z.object({
  totalScore: z.number().min(0).max(100),
  strongCompetencies: z.array(z.string().max(120)).max(8).optional().default([]),
  bestAnswer: z.string().max(500).optional().default(""),
  topWeaknesses: z.array(z.string().max(300)).max(3).optional().default([]),
  jdRequirementEval: z.array(z.object({ requirement: z.string().max(200), assessment: z.string().max(300) })).max(12).optional().default([]),
  documentConsistency: z.string().max(400).optional().default(""),
  interviewerWillCheck: z.array(z.string().max(200)).max(6).optional().default([]),
  week4Order: z.array(z.string().max(200)).max(8).optional().default([]),
  coachSummary: z.string().max(800).optional().default(""),
  humanReviewRequired: z.boolean().optional().default(false)
});
export type Week3Report = z.infer<typeof Week3ReportSchema>;

// 훈련계획.
export const TrainingPlanSchema = z.object({ steps: z.array(z.object({ title: z.string().max(200), why: z.string().max(300), weaknessType: z.string().max(40).optional().default("") })).max(10) });

// ── 완료 판정(산출물 기준) ─────────────────────────────────
export type Week3CompletionInput = { packageExists: boolean; strategyViewed: boolean; initialMockCompleted: boolean; minQuestionsAnswered: boolean; perQuestionEvaluated: boolean; weaknessAnalyzed: boolean; correctionNotes: number; reportViewed: boolean; trainingPlanCreated: boolean };
export function computeWeek3Completion(inp: Week3CompletionInput): { complete: boolean; checks: { key: string; label: string; done: boolean }[]; doneCount: number } {
  const checks = [
    { key: "package", label: "기준 지원 패키지 존재", done: inp.packageExists },
    { key: "strategy", label: "면접 전략 확인", done: inp.strategyViewed },
    { key: "initial_mock", label: "최초 실전면접 완료", done: inp.initialMockCompleted },
    { key: "min_questions", label: "최소 필수 질문 답변", done: inp.minQuestionsAnswered },
    { key: "evaluated", label: "질문별 평가 완료", done: inp.perQuestionEvaluated },
    { key: "weakness", label: "반복 취약 패턴 분석", done: inp.weaknessAnalyzed },
    { key: "notes", label: "핵심 오답 5개 이상 생성", done: inp.correctionNotes >= 5 },
    { key: "report", label: "Week 3 종합 리포트 확인", done: inp.reportViewed },
    { key: "plan", label: "Week 4 훈련계획 생성", done: inp.trainingPlanCreated }
  ];
  const doneCount = checks.filter((c) => c.done).length;
  return { complete: checks.every((c) => c.done), checks, doneCount };
}

export type Week4CompletionInput = { correctionsTrained: number; sameQuestionRetried: boolean; requiredTransferDone: boolean; finalMockCompleted: boolean; comparisonDone: boolean; growthReportExists: boolean; plan30Viewed: boolean };
export function computeWeek4Completion(inp: Week4CompletionInput): { complete: boolean; checks: { key: string; label: string; done: boolean }[]; doneCount: number } {
  const checks = [
    { key: "trained", label: "핵심 오답 5개 이상 훈련", done: inp.correctionsTrained >= 5 },
    { key: "same_retry", label: "같은 질문 재도전 완료", done: inp.sameQuestionRetried },
    { key: "transfer", label: "필수 오답 유사 질문 검증", done: inp.requiredTransferDone },
    { key: "final_mock", label: "최종 실전면접 완료", done: inp.finalMockCompleted },
    { key: "comparison", label: "최초·최종 비교 완료", done: inp.comparisonDone },
    { key: "growth", label: "성장 리포트 생성", done: inp.growthReportExists },
    { key: "plan30", label: "30일 행동계획 확인", done: inp.plan30Viewed }
  ];
  const doneCount = checks.filter((c) => c.done).length;
  return { complete: checks.every((c) => c.done), checks, doneCount };
}

// 꼬리질문 필요 조건(평가 기반). 공격적이지 않게, 근거 확인 목적.
export function followUpNeeded(ev: { scores: Record<string, number>; weaknessTypes?: string[] }): boolean {
  const w = ev.weaknessTypes ?? [];
  if (w.some((x) => ["ABSTRACT_ANSWER", "UNCLEAR_ROLE", "MISSING_RESULT", "WEAK_EVIDENCE", "UNVERIFIED_CLAIM", "INCONSISTENT_WITH_DOCUMENT", "WEAK_JOB_CONNECTION"].includes(x))) return true;
  return (ev.scores.specificity ?? 100) < 55 || (ev.scores.evidence ?? 100) < 55;
}
