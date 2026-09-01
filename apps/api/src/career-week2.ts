// Career Launch Week 2 '실제 지원 가능한 서류 완성'(Phase 5) — 순수 로직/데이터 계층(DB 무의존, 테스트 가능).
// 공고 분석·문장별 근거/검증 상태·일관성 검사·4종 점수(중앙 가중치)·Week3 예상질문·완료 판정.
// 저장/조회/LLM 호출은 index.ts 가 담당한다.
import { z } from "zod";

// ── 프롬프트 버전(생성 결과 추적) ───────────────────────────
export const WEEK2_PROMPT_VERSIONS = {
  jdAnalysis: "jd_analysis_v1",
  resumeDraft: "resume_draft_v1",
  coverDraft: "cover_draft_v1",
  consistency: "consistency_v1",
  resumeScore: "resume_score_v1",
  coverScore: "cover_score_v1",
  jdMatch: "jd_match_v1",
  interviewQuestions: "iq_v1"
} as const;

// ── 점수 가중치(중앙 설정·버전 관리) ─────────────────────────
// 코드 여러 곳에 하드코딩하지 않고 여기 한 곳에서만 관리한다. 변경 시 version 도 올린다.
export const SCORE_WEIGHTS_VERSION = "w2_scores_v1";
export const RESUME_SCORE_WEIGHTS = { baseCompleteness: 0.15, experienceSpecificity: 0.25, jobRelevance: 0.2, evidenceReliability: 0.2, readability: 0.1, jdAlignment: 0.1 } as const;
export const COVER_SCORE_WEIGHTS = { promptFulfillment: 0.2, experienceSpecificity: 0.2, motivationConnection: 0.2, jobRelevance: 0.15, evidenceReliability: 0.15, clarity: 0.1 } as const;
export const JD_MATCH_WEIGHTS = { requiredCoverage: 0.45, preferredCoverage: 0.2, relatedExperience: 0.2, skillsCerts: 0.15 } as const;
// 지원 준비도 = 이력서·자소서·JD매치·사실검증 종합.
export const READINESS_WEIGHTS = { resume: 0.3, cover: 0.25, jdMatch: 0.3, verification: 0.15 } as const;

function weightedTotal(scores: Record<string, number>, weights: Record<string, number>): number {
  let sum = 0;
  let wsum = 0;
  for (const [k, w] of Object.entries(weights)) {
    if (typeof scores[k] === "number") {
      sum += Math.max(0, Math.min(100, scores[k])) * w;
      wsum += w;
    }
  }
  return wsum > 0 ? Math.round(sum / wsum) : 0;
}

// ── 문장별 검증 상태 ────────────────────────────────────────
export const VERIFICATION_STATUSES = ["verified", "needs_confirmation", "unsupported", "conflicted", "user_edited", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

// AI 생성 문장/항목에 붙는 근거·검증 메타.
export const SourceLinkSchema = z.object({
  id: z.string().max(80), // 문장/항목 식별자
  field: z.string().max(80).optional().default(""), // 어느 항목(summary, project.0.bullet.1 등)
  text: z.string().max(2000),
  sourceExperienceId: z.string().max(80).nullable().optional(),
  sourceProfileField: z.string().max(80).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
  needsConfirmation: z.boolean().optional().default(false),
  generatedBy: z.string().max(40).optional().default("ai"),
  promptVersion: z.string().max(40).optional().default(""),
  status: z.enum(VERIFICATION_STATUSES).optional().default("needs_confirmation")
});
export type SourceLink = z.infer<typeof SourceLinkSchema>;

// ── 공고 구조화/분석 ────────────────────────────────────────
export const JD_SOURCE_TYPES = ["internal", "saved", "url", "paste", "manual"] as const;
export type JdSourceType = (typeof JD_SOURCE_TYPES)[number];

// 사용자/공고에서 받는 원문 → 구조화.
export const JdStructuredSchema = z.object({
  companyName: z.string().max(200).optional().default(""),
  jobTitle: z.string().max(200).optional().default(""),
  jobDescription: z.string().max(6000).optional().default(""),
  responsibilities: z.array(z.string().max(400)).max(30).optional().default([]),
  requirements: z.array(z.string().max(400)).max(30).optional().default([]),
  preferredQualifications: z.array(z.string().max(400)).max(30).optional().default([]),
  requiredSkills: z.array(z.string().max(80)).max(40).optional().default([]),
  employmentType: z.string().max(60).optional().default(""),
  coverLetterPrompts: z.array(z.string().max(400)).max(12).optional().default([]) // 공고에 실제 자소서 문항이 있으면
});
export type JdStructured = z.infer<typeof JdStructuredSchema>;

// 공고 요구역량 분석(AI). 근거 없는 기업문화/인재상 생성 금지 — 프롬프트로 강제.
export const JdAnalysisSchema = z.object({
  coreResponsibilities: z.array(z.string().max(300)).max(12).optional().default([]),
  requiredCompetencies: z.array(z.string().max(120)).max(20).optional().default([]),
  preferredCompetencies: z.array(z.string().max(120)).max(20).optional().default([]),
  emphasizedKeywords: z.array(z.string().max(60)).max(30).optional().default([]),
  expectedExperience: z.array(z.string().max(200)).max(12).optional().default([]),
  evaluationCriteria: z.array(z.string().max(200)).max(12).optional().default([]),
  // 사용자 경험과의 연결
  matched: z.array(z.object({ requirement: z.string().max(200), evidence: z.string().max(300), sourceExperienceId: z.string().max(80).nullable().optional() })).max(20).optional().default([]),
  missing: z.array(z.string().max(200)).max(20).optional().default([]),
  needsCheck: z.array(z.string().max(200)).max(20).optional().default([]),
  emphasizeInResume: z.array(z.string().max(200)).max(12).optional().default([]),
  emphasizeInCover: z.array(z.string().max(200)).max(12).optional().default([]),
  avoidOverclaiming: z.array(z.string().max(200)).max(12).optional().default([]),
  likelyInterview: z.array(z.string().max(200)).max(12).optional().default([])
});
export type JdAnalysis = z.infer<typeof JdAnalysisSchema>;

// ── 문서 버전(대표 / 공고맞춤) ──────────────────────────────
export const DOCUMENT_TYPES = ["resume", "cover"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const DOCUMENT_VARIANTS = ["master", "targeted"] as const; // 대표 / 공고맞춤
export type DocumentVariant = (typeof DOCUMENT_VARIANTS)[number];

// 이력서 버전 콘텐츠(기존 CareerResumeData.content 확장 — 항목별 강조/순서 조정).
export const ResumeVersionContentSchema = z.object({
  headline: z.string().max(300).optional().default(""), // 한 줄 소개
  targetRole: z.string().max(120).optional().default(""),
  coreCompetencies: z.array(z.string().max(80)).max(12).optional().default([]),
  basic: z.record(z.string(), z.unknown()).optional(),
  educations: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  experiences: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  skills: z.array(z.string().max(80)).optional().default([]),
  languages: z.array(z.record(z.string(), z.unknown())).optional().default([])
});
export type ResumeVersionContent = z.infer<typeof ResumeVersionContentSchema>;

export const CoverItemSchema = z.object({ id: z.string().max(80), prompt: z.string().max(500), answer: z.string().max(6000), intent: z.string().max(300).optional().default("") });
export const CoverVersionContentSchema = z.object({ company: z.string().max(200).optional().default(""), items: z.array(CoverItemSchema).max(12).optional().default([]) });
export type CoverVersionContent = z.infer<typeof CoverVersionContentSchema>;

// 자소서 권장 문항 생성.
export const CoverPromptSetSchema = z.object({
  prompts: z.array(z.object({ prompt: z.string().max(400), intent: z.string().max(300), fromJd: z.boolean().optional().default(false), recommendedExperience: z.string().max(200).optional().default("") })).max(12)
});
export type CoverPromptSet = z.infer<typeof CoverPromptSetSchema>;

// ── 일관성 검사 ─────────────────────────────────────────────
export const CONSISTENCY_SEVERITIES = ["critical", "warning", "suggestion", "passed"] as const;
export type ConsistencySeverity = (typeof CONSISTENCY_SEVERITIES)[number];
export const ConsistencyFindingSchema = z.object({
  id: z.string().max(80),
  severity: z.enum(CONSISTENCY_SEVERITIES),
  category: z.string().max(60), // period_mismatch | role_mismatch | metric_mismatch | project_mismatch | skill_mismatch | target_mismatch | duplicate_desc | over_emphasis | unsupported_claim | ai_added_fact
  message: z.string().max(500),
  refs: z.array(z.string().max(120)).max(8).optional().default([]),
  resolved: z.boolean().optional().default(false),
  userAcknowledged: z.boolean().optional().default(false)
});
export type ConsistencyFinding = z.infer<typeof ConsistencyFindingSchema>;
export const ConsistencyResultSchema = z.object({ findings: z.array(ConsistencyFindingSchema).max(40) });
export type ConsistencyResult = z.infer<typeof ConsistencyResultSchema>;

// ── 점수 스키마(LLM 출력 검증) ──────────────────────────────
export const ResumeScoreSchema = z.object({
  breakdown: z.object({ baseCompleteness: z.number(), experienceSpecificity: z.number(), jobRelevance: z.number(), evidenceReliability: z.number(), readability: z.number(), jdAlignment: z.number() }),
  strong: z.array(z.string().max(200)).max(6).optional().default([]),
  improvements: z.array(z.string().max(200)).max(6).optional().default([])
});
export const CoverScoreSchema = z.object({
  breakdown: z.object({ promptFulfillment: z.number(), experienceSpecificity: z.number(), motivationConnection: z.number(), jobRelevance: z.number(), evidenceReliability: z.number(), clarity: z.number() }),
  strong: z.array(z.string().max(200)).max(6).optional().default([]),
  improvements: z.array(z.string().max(200)).max(6).optional().default([])
});
export const JdMatchScoreSchema = z.object({
  breakdown: z.object({ requiredCoverage: z.number(), preferredCoverage: z.number(), relatedExperience: z.number(), skillsCerts: z.number() }),
  matched: z.array(z.string().max(200)).max(20).optional().default([]),
  missing: z.array(z.string().max(200)).max(20).optional().default([])
});
export function resumeScoreTotal(b: z.infer<typeof ResumeScoreSchema>["breakdown"]): number {
  return weightedTotal(b as Record<string, number>, RESUME_SCORE_WEIGHTS);
}
export function coverScoreTotal(b: z.infer<typeof CoverScoreSchema>["breakdown"]): number {
  return weightedTotal(b as Record<string, number>, COVER_SCORE_WEIGHTS);
}
export function jdMatchTotal(b: z.infer<typeof JdMatchScoreSchema>["breakdown"]): number {
  return weightedTotal(b as Record<string, number>, JD_MATCH_WEIGHTS);
}

// ── Application Readiness(4종 종합) ─────────────────────────
export type ReadinessInput = {
  resumeTotal: number | null;
  coverTotal: number | null;
  jdMatchTotal: number | null;
  unsupportedCount: number; // 근거 부족 문장 수(미확인)
  criticalUnresolved: number; // 미해결 critical 일관성 수
};
export type ReadinessResult = {
  score: number;
  version: string;
  breakdown: { resume: number; cover: number; jdMatch: number; verification: number };
  topImprovements: string[];
  criticalBlockers: string[];
  ready: boolean;
};
export function computeApplicationReadiness(inp: ReadinessInput): ReadinessResult {
  const resume = inp.resumeTotal ?? 0;
  const cover = inp.coverTotal ?? 0;
  const jd = inp.jdMatchTotal ?? 0;
  // 검증 점수: 근거부족·critical 이 많을수록 감점(0~100).
  const verification = Math.max(0, 100 - inp.unsupportedCount * 12 - inp.criticalUnresolved * 25);
  const score = Math.round(resume * READINESS_WEIGHTS.resume + cover * READINESS_WEIGHTS.cover + jd * READINESS_WEIGHTS.jdMatch + verification * READINESS_WEIGHTS.verification);
  // 가장 낮은 하위 3개를 개선 우선순위로.
  const parts: { key: string; label: string; val: number }[] = [
    { key: "resume", label: "이력서 완성도", val: resume },
    { key: "cover", label: "자기소개서 완성도", val: cover },
    { key: "jdMatch", label: "공고 정합성", val: jd },
    { key: "verification", label: "근거·사실 검증", val: verification }
  ];
  const topImprovements = parts
    .filter((p) => p.val < 80)
    .sort((a, b) => a.val - b.val)
    .slice(0, 3)
    .map((p) => `${p.label} (${p.val}점) 보완`);
  const criticalBlockers: string[] = [];
  if (inp.criticalUnresolved > 0) criticalBlockers.push(`미해결 critical 일관성 ${inp.criticalUnresolved}건`);
  if (inp.unsupportedCount > 0) criticalBlockers.push(`근거 부족 문장 ${inp.unsupportedCount}건 확인 필요`);
  return { score, version: SCORE_WEIGHTS_VERSION, breakdown: { resume, cover, jdMatch: jd, verification }, topImprovements, criticalBlockers, ready: criticalBlockers.length === 0 };
}

// ── Week 3 예상 면접 질문 세트 ──────────────────────────────
export const INTERVIEW_QUESTION_TYPES = ["intro", "motivation", "job_competency", "experience_verify", "problem_solving", "collaboration", "failure_conflict", "jd_requirement", "follow_up", "fact_check"] as const;
export const InterviewQuestionSchema = z.object({
  question: z.string().max(500),
  type: z.enum(INTERVIEW_QUESTION_TYPES),
  source: z.string().max(60), // jd | resume | cover | weak_point | job_trial | risk
  sourceReference: z.string().max(300).optional().default(""),
  difficulty: z.enum(["low", "medium", "high"]).optional().default("medium"),
  evaluationCriteria: z.array(z.string().max(160)).max(6).optional().default([]),
  followUpCandidates: z.array(z.string().max(300)).max(4).optional().default([]),
  riskLevel: z.enum(["low", "medium", "high"]).optional().default("low")
});
export const InterviewQuestionSetSchema = z.object({ questions: z.array(InterviewQuestionSchema).max(20) });
export type InterviewQuestionSet = z.infer<typeof InterviewQuestionSetSchema>;

// ── Week 2 완료 판정(산출물 기준) ──────────────────────────
export type Week2CompletionInput = {
  targetJobConfirmed: boolean;
  masterResumeExists: boolean;
  applicationTargetSelected: boolean;
  jdAnalyzed: boolean;
  targetedResumeExists: boolean;
  coverRequiredDone: boolean;
  criticalResolvedOrAck: boolean; // critical 해결 또는 사용자 확인
  unsupportedReviewed: boolean; // 근거부족 검토 완료
  readinessScoreExists: boolean;
  packageFinalized: boolean;
  interviewQuestionsGenerated: boolean;
};
export type Week2Check = { key: string; label: string; done: boolean };
export function computeWeek2Completion(inp: Week2CompletionInput): { complete: boolean; checks: Week2Check[]; doneCount: number } {
  const checks: Week2Check[] = [
    { key: "target_job", label: "목표 직무 확정", done: inp.targetJobConfirmed },
    { key: "master_resume", label: "대표 이력서 존재", done: inp.masterResumeExists },
    { key: "application_target", label: "기준 채용공고 선택", done: inp.applicationTargetSelected },
    { key: "jd_analyzed", label: "공고 요구역량 분석", done: inp.jdAnalyzed },
    { key: "targeted_resume", label: "공고 맞춤 이력서", done: inp.targetedResumeExists },
    { key: "cover_required", label: "자기소개서 필수 문항 완료", done: inp.coverRequiredDone },
    { key: "critical", label: "critical 일관성 해결/확인", done: inp.criticalResolvedOrAck },
    { key: "unsupported", label: "근거 부족 문장 검토", done: inp.unsupportedReviewed },
    { key: "readiness", label: "Application Readiness Score 생성", done: inp.readinessScoreExists },
    { key: "finalized", label: "지원 패키지 최종 확정", done: inp.packageFinalized },
    { key: "interview_questions", label: "Week 3 예상 면접 질문 생성", done: inp.interviewQuestionsGenerated }
  ];
  const doneCount = checks.filter((c) => c.done).length;
  return { complete: checks.every((c) => c.done), checks, doneCount };
}

// ── 검증 상태 집계(경고 판단용) ────────────────────────────
export function countUnsupported(links: SourceLink[]): number {
  // 근거 부족(unsupported) + 확인 필요(needs_confirmation)로 아직 미확인인 문장.
  return links.filter((l) => l.status === "unsupported" || l.status === "needs_confirmation").length;
}
export function countByStatus(links: SourceLink[]): Record<VerificationStatus, number> {
  const out = Object.fromEntries(VERIFICATION_STATUSES.map((s) => [s, 0])) as Record<VerificationStatus, number>;
  for (const l of links) out[l.status] = (out[l.status] ?? 0) + 1;
  return out;
}
export function countCriticalUnresolved(findings: ConsistencyFinding[]): number {
  return findings.filter((f) => f.severity === "critical" && !f.resolved && !f.userAcknowledged).length;
}
