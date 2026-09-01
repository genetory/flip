// Career Launch Phase 9 — 파일럿 운영·측정 순수 로직(DB 무의존, 테스트 가능).
// 학생 상태(운영자 확정 필요 구분)·15단계 퍼널·중단 조건·개입 SLA·KPI 목표·준비 체크리스트·
// 주차별 설문 정의·정성 피드백 분류·LLM 비용 추정. 신규 핵심 기능 없음 — 측정/운영만.
// 안전: 상태/신호는 근거(reasons)를 함께 반환하고, withdrawn·intervention_required 는 운영자 확정 대상.
import { z } from "zod";

// ── 파일럿 학생 상태 ─────────────────────────────────────────
export const PILOT_STUDENT_STATUSES = [
  "invited",
  "registered",
  "onboarding",
  "active",
  "at_risk",
  "intervention_required",
  "paused",
  "completed",
  "withdrawn"
] as const;
export type PilotStudentStatus = (typeof PILOT_STUDENT_STATUSES)[number];

// AI/규칙이 임의로 확정하면 안 되는 상태 — 운영자가 근거를 보고 확정한다.
export const OPERATOR_CONFIRM_STATUSES: PilotStudentStatus[] = ["withdrawn", "intervention_required"];

export type StudentStatusSignals = {
  enrolled: boolean; // 기수 등록됨
  registered: boolean; // 계정/진행 데이터 존재
  hadAnyActivity: boolean; // 의미 있는 활동 1회 이상
  daysSinceActivity: number | null; // 마지막 의미 있는 활동 경과일(null=활동 없음)
  weeksCompleted: number; // 0..4
  programCompleted: boolean; // 4주 완주(성장 리포트 등)
  openInterventionPriority: "critical" | "high" | "medium" | "low" | null; // 미해결 개입 최고 우선순위
};

export type StudentStatusResult = {
  computed: PilotStudentStatus; // 규칙이 제안하는 상태(운영자 override 없을 때)
  reasons: string[]; // 근거(운영자가 확인)
  needsOperatorConfirm: boolean; // withdrawn/intervention_required 제안 시 true
};

// 자동 상태 계산 — 운영자 override 가 있으면 그 값이 최종(여기서는 계산만).
// 규칙: 완주 > 개입필요(제안) > at_risk > active > onboarding > registered > invited.
export function computeStudentStatus(sig: StudentStatusSignals): StudentStatusResult {
  const reasons: string[] = [];
  if (!sig.enrolled && !sig.registered) {
    return { computed: "invited", reasons: ["아직 가입/등록 전"], needsOperatorConfirm: false };
  }
  if (sig.programCompleted) {
    return { computed: "completed", reasons: ["4주 프로그램 완주"], needsOperatorConfirm: false };
  }
  // 개입 필요는 '제안'만 — 운영자 확정 대상.
  if (sig.openInterventionPriority === "critical" || sig.openInterventionPriority === "high") {
    reasons.push(`미해결 개입(${sig.openInterventionPriority}) 존재`);
    return { computed: "intervention_required", reasons, needsOperatorConfirm: true };
  }
  if (!sig.hadAnyActivity) {
    if (sig.registered) return { computed: "onboarding", reasons: ["가입했으나 의미 있는 활동 없음"], needsOperatorConfirm: false };
    return { computed: "registered", reasons: ["등록됨"], needsOperatorConfirm: false };
  }
  const d = sig.daysSinceActivity ?? 999;
  if (d >= 3) {
    reasons.push(`최근 활동 ${d}일 전(3일 이상 정체)`);
    return { computed: "at_risk", reasons, needsOperatorConfirm: false };
  }
  reasons.push(`최근 활동 ${d}일 전`, `${sig.weeksCompleted}주차 완료`);
  return { computed: "active", reasons, needsOperatorConfirm: false };
}

// 자동 계산과 운영자 override 를 합쳐 최종 표시 상태를 정한다. override 가 항상 우선.
export function resolveStudentStatus(auto: StudentStatusResult, operatorOverride: PilotStudentStatus | null): {
  status: PilotStudentStatus;
  source: "operator" | "auto";
  reasons: string[];
} {
  if (operatorOverride) return { status: operatorOverride, source: "operator", reasons: auto.reasons };
  // 운영자 확정이 필요한 자동 제안은 표시하되 source=auto 로 명시(운영자 확정 전).
  return { status: auto.computed, source: "auto", reasons: auto.reasons };
}

// ── 15단계 핵심 퍼널 ────────────────────────────────────────
export const FUNNEL_STEPS = [
  { key: "invited", label: "초대" },
  { key: "registered", label: "가입" },
  { key: "first_consult", label: "첫 상담 시작" },
  { key: "week1_completed", label: "Week 1 완료" },
  { key: "target_confirmed", label: "목표 직무 확정" },
  { key: "week2_started", label: "Week 2 시작" },
  { key: "package_finalized", label: "지원 패키지 확정" },
  { key: "week3_started", label: "Week 3 시작" },
  { key: "initial_mock_completed", label: "최초 면접 완료" },
  { key: "correction_opened", label: "오답노트 확인" },
  { key: "week4_started", label: "Week 4 시작" },
  { key: "transfer_passed", label: "유사 질문 통과" },
  { key: "final_mock_completed", label: "최종 면접 완료" },
  { key: "program_completed", label: "4주 완주" },
  { key: "real_application", label: "실제 지원 행동" }
] as const;
export type FunnelStepKey = (typeof FUNNEL_STEPS)[number]["key"];

// 학생별 단계 도달 여부 + 도달 시각(ms). invitedAt 기준 소요시간 산출.
export type FunnelStudent = { invitedAt: number | null; steps: Partial<Record<FunnelStepKey, { reached: boolean; at: number | null }>> };
export type FunnelStepResult = { key: FunnelStepKey; label: string; count: number; conversionFromPrev: number | null; conversionFromStart: number | null; medianHoursFromStart: number | null };

const median = (arr: number[]): number | null => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// 퍼널 집계 — 표본이 작으므로 전환율과 함께 실제 인원을 항상 제공한다(호출부에서 count 노출).
export function computeFunnel(students: FunnelStudent[]): { total: number; steps: FunnelStepResult[] } {
  const total = students.length;
  const startCount = total || 1;
  let prevCount: number | null = null;
  const steps = FUNNEL_STEPS.map((step) => {
    const reachedStudents = students.filter((s) => s.steps[step.key]?.reached);
    const count = reachedStudents.length;
    const durations = reachedStudents
      .map((s) => {
        const at = s.steps[step.key]?.at;
        return s.invitedAt != null && at != null ? (at - s.invitedAt) / 3_600_000 : null;
      })
      .filter((x): x is number => x != null && x >= 0);
    const medHours = median(durations);
    const result: FunnelStepResult = {
      key: step.key,
      label: step.label,
      count,
      conversionFromPrev: prevCount != null && prevCount > 0 ? Math.round((count / prevCount) * 100) : null,
      conversionFromStart: Math.round((count / startCount) * 100),
      medianHoursFromStart: medHours != null ? Math.round(medHours) : null
    };
    prevCount = count;
    return result;
  });
  return { total, steps };
}

// ── 중단 조건 ───────────────────────────────────────────────
export const STOP_CONDITIONS = [
  { key: "data_loss", label: "사용자 데이터 손실", severity: "critical" },
  { key: "cross_tenant_leak", label: "다른 사용자/기관 데이터 노출", severity: "critical" },
  { key: "artifact_save_failure", label: "결과물 저장 실패", severity: "critical" },
  { key: "completion_state_loss", label: "기존 완료 상태 손실", severity: "critical" },
  { key: "confirmed_reask", label: "confirmed 정보 반복 질문", severity: "high" },
  { key: "fabrication_repeated", label: "AI 허위 경험/성과 반복 생성", severity: "high" },
  { key: "interview_answer_loss", label: "면접 답변 유실", severity: "critical" },
  { key: "mass_score_error", label: "점수 대량 오류", severity: "high" },
  { key: "llm_cost_spike", label: "LLM 비용 급증", severity: "high" },
  { key: "p0_error", label: "P0 오류 발생", severity: "critical" },
  { key: "p1_repeated", label: "동일 P1 오류 반복", severity: "high" },
  { key: "majority_dropoff", label: "특정 단계에서 과반 이탈", severity: "high" },
  { key: "intervention_blind", label: "운영자가 개입 대상자를 확인 불가", severity: "high" }
] as const;
export type StopConditionKey = (typeof STOP_CONDITIONS)[number]["key"];

// 자동 감지 가능한 지표(관측형) — 나머지는 운영자 수동 체크. 여기선 관측형만 자동 판정한다.
export type StopMetrics = {
  artifactSaveFailures: number;
  confirmedReaskCount: number;
  interviewAnswerLosses: number;
  llmCostToday: number;
  llmCostBaselineDaily: number; // 최근 평균
  p0Count: number;
  p1RepeatMax: number; // 동일 P1 최대 반복
  maxStepDropoffRate: number; // 인접 단계 최대 이탈률(0..100), 표본>=8 일 때만 의미
  funnelSampleSize: number;
  interventionListAvailable: boolean;
};

export function evaluateStopConditions(m: StopMetrics): { triggered: Array<{ key: StopConditionKey; label: string; severity: string; detail: string }>; anyCritical: boolean } {
  const out: Array<{ key: StopConditionKey; label: string; severity: string; detail: string }> = [];
  const push = (key: StopConditionKey, detail: string) => {
    const def = STOP_CONDITIONS.find((c) => c.key === key)!;
    out.push({ key, label: def.label, severity: def.severity, detail });
  };
  if (m.artifactSaveFailures > 0) push("artifact_save_failure", `저장 실패 ${m.artifactSaveFailures}건`);
  if (m.confirmedReaskCount > 0) push("confirmed_reask", `confirmed 반복 질문 ${m.confirmedReaskCount}건`);
  if (m.interviewAnswerLosses > 0) push("interview_answer_loss", `면접 답변 유실 ${m.interviewAnswerLosses}건`);
  if (m.p0Count > 0) push("p0_error", `P0 오류 ${m.p0Count}건`);
  if (m.p1RepeatMax >= 3) push("p1_repeated", `동일 P1 ${m.p1RepeatMax}회 반복`);
  if (m.llmCostBaselineDaily > 0 && m.llmCostToday > m.llmCostBaselineDaily * 3) push("llm_cost_spike", `오늘 비용 $${m.llmCostToday.toFixed(2)} (기준 $${m.llmCostBaselineDaily.toFixed(2)}의 3배 초과)`);
  if (m.funnelSampleSize >= 8 && m.maxStepDropoffRate >= 50) push("majority_dropoff", `단계 이탈률 ${m.maxStepDropoffRate}%`);
  if (!m.interventionListAvailable) push("intervention_blind", "개입 목록 조회 불가");
  return { triggered: out, anyCritical: out.some((c) => c.severity === "critical") };
}

// ── 개입 SLA ────────────────────────────────────────────────
// 우선순위/사유별 응답 기준(영업시간 아님, 시간 단위 근사). 초과 여부만 계산한다.
export const INTERVENTION_SLA = [
  { key: "p0", label: "P0", maxHours: 0 }, // 즉시
  { key: "p1", label: "P1", maxHours: 24 }, // 당일
  { key: "human_request", label: "사람 상담 요청", maxHours: 24 },
  { key: "artifact_conflict", label: "결과물 사실 충돌", maxHours: 24 },
  { key: "stall_3d", label: "3일 이상 정체", maxHours: 24 },
  { key: "low_confidence", label: "AI 낮은 confidence", maxHours: 72 },
  { key: "general_feedback", label: "일반 피드백", maxHours: 48 }
] as const;
export type SlaKey = (typeof INTERVENTION_SLA)[number]["key"];

// reasonCodes → SLA 키 매핑(가장 엄격한 것 선택).
export function slaKeyForIntervention(priority: string, reasonCodes: string[]): SlaKey {
  if (priority === "critical") return "p0";
  if (reasonCodes.includes("human_review_requested") || reasonCodes.includes("fatigue_or_quit")) return "human_request";
  if (reasonCodes.includes("critical_unresolved") || reasonCodes.includes("unsupported_claims")) return "artifact_conflict";
  if (priority === "high") return "p1";
  if (reasonCodes.includes("stalled")) return "stall_3d";
  if (reasonCodes.includes("low_ai_confidence")) return "low_confidence";
  return "general_feedback";
}

export function computeSlaStatus(input: { createdAtMs: number; firstResponseAtMs: number | null; priority: string; reasonCodes: string[]; nowMs: number }): {
  slaKey: SlaKey;
  label: string;
  dueAtMs: number;
  breached: boolean;
  hoursOverdue: number;
} {
  const key = slaKeyForIntervention(input.priority, input.reasonCodes);
  const def = INTERVENTION_SLA.find((s) => s.key === key)!;
  const dueAtMs = input.createdAtMs + def.maxHours * 3_600_000;
  const settled = input.firstResponseAtMs != null;
  const refMs = settled ? input.firstResponseAtMs! : input.nowMs;
  const overMs = refMs - dueAtMs;
  return { slaKey: key, label: def.label, dueAtMs, breached: !settled && overMs > 0, hoursOverdue: overMs > 0 ? Math.round(overMs / 3_600_000) : 0 };
}

// ── KPI 목표(섹션 10, 운영자 수정 가능 기본값) ──────────────
export const PILOT_KPI_TARGETS = {
  inviteToSignup: 80,
  signupToFirstConsult: 70,
  week1Completed: 65,
  targetConfirmedOfWeek1: 80,
  week2PackageOfAll: 50,
  week3MockOfAll: 45,
  week4FinalOfAll: 35,
  fullCompletion: 35,
  confirmedReaskCount: 0, // 절대 목표
  overallReaskRatePct: 3, // 미만
  llmFailRatePct: 5, // 미만
  artifactSaveFailures: 0,
  avgInterviewGrowth: 15, // +점
  consultContinuitySat: 4, // 5점 만점
  humanFeelPositivePct: 60,
  competitionHelpfulPct: 50,
  realApplicationWithin30dPct: 60
} as const;
export type PilotKpiTargets = typeof PILOT_KPI_TARGETS;

// ── 준비 체크리스트(섹션 3) ─────────────────────────────────
export const READINESS_CHECKLIST = [
  { key: "cohort_created", label: "파일럿 기수 생성", required: true, auto: true },
  { key: "dates_set", label: "시작·종료일", required: true, auto: true },
  { key: "weeks_scheduled", label: "Week 1~4 일정", required: true, auto: true },
  { key: "seminars_scheduled", label: "세미나 일정", required: false, auto: true },
  { key: "participants_enrolled", label: "참여자 등록", required: true, auto: true },
  { key: "operator_assigned", label: "운영자 권한", required: true, auto: false },
  { key: "instructor_assigned", label: "강사 권한", required: false, auto: false },
  { key: "feature_flags", label: "feature flag", required: true, auto: true },
  { key: "llm_env", label: "LLM 환경변수", required: true, auto: true },
  { key: "analytics_events", label: "분석 이벤트", required: true, auto: false },
  { key: "error_tracking", label: "오류 추적", required: false, auto: false },
  { key: "notifications", label: "알림 설정", required: false, auto: false },
  { key: "survey_config", label: "설문 설정", required: true, auto: true },
  { key: "support_contact", label: "지원 연락처", required: true, auto: true },
  { key: "privacy_notice", label: "개인정보 안내", required: true, auto: false },
  { key: "test_accounts_verified", label: "테스트 계정 검증", required: true, auto: false },
  { key: "migration_applied", label: "마이그레이션 상태", required: true, auto: false },
  { key: "rollback_ready", label: "롤백 준비", required: true, auto: false }
] as const;
export type ReadinessKey = (typeof READINESS_CHECKLIST)[number]["key"];

// 자동 판정 가능한 항목만 계산, 나머지는 운영자 수동 확인(config.manualChecks).
export type ReadinessInput = {
  cohortExists: boolean;
  startAt: boolean;
  endAt: boolean;
  weeksScheduledCount: number; // 0..4
  seminarsCount: number;
  enrolledCount: number;
  participantLimit: number | null;
  featureFlagsSet: boolean;
  llmEnvReady: boolean;
  surveyConfigured: boolean;
  supportContactSet: boolean;
  manualChecks: Partial<Record<ReadinessKey, boolean>>;
};
export type ReadinessItem = { key: ReadinessKey; label: string; required: boolean; ok: boolean; auto: boolean; note?: string };

export function computeReadiness(inp: ReadinessInput): { items: ReadinessItem[]; requiredMissing: ReadinessItem[]; ready: boolean } {
  const autoVal: Partial<Record<ReadinessKey, { ok: boolean; note?: string }>> = {
    cohort_created: { ok: inp.cohortExists },
    dates_set: { ok: inp.startAt && inp.endAt },
    weeks_scheduled: { ok: inp.weeksScheduledCount >= 4, note: `${inp.weeksScheduledCount}/4주 일정` },
    seminars_scheduled: { ok: inp.seminarsCount > 0, note: `${inp.seminarsCount}건` },
    participants_enrolled: { ok: inp.enrolledCount >= 1 && (inp.participantLimit == null || inp.enrolledCount <= inp.participantLimit), note: `${inp.enrolledCount}명${inp.participantLimit ? `/${inp.participantLimit}` : ""}` },
    feature_flags: { ok: inp.featureFlagsSet },
    llm_env: { ok: inp.llmEnvReady },
    survey_config: { ok: inp.surveyConfigured },
    support_contact: { ok: inp.supportContactSet }
  };
  const items: ReadinessItem[] = READINESS_CHECKLIST.map((def) => {
    if (def.auto) {
      const a = autoVal[def.key] ?? { ok: false };
      return { key: def.key, label: def.label, required: def.required, ok: a.ok, auto: true, note: a.note };
    }
    return { key: def.key, label: def.label, required: def.required, ok: inp.manualChecks[def.key] === true, auto: false };
  });
  const requiredMissing = items.filter((i) => i.required && !i.ok);
  return { items, requiredMissing, ready: requiredMissing.length === 0 };
}

// ── 주차별 짧은 설문 정의(섹션 7) ────────────────────────────
// 5점 척도 문항 + 선택 주관식 1문항. 같은 설문은 반복 노출하지 않는다(surveyKey unique).
export const SURVEY_DEFINITIONS = {
  consult_end: {
    label: "상담 종료",
    questions: [
      { key: "helpful", text: "오늘 상담이 도움이 됐나요?", scale5: true },
      { key: "understood_me", text: "AI가 나를 이해한다고 느꼈나요?", scale5: true },
      { key: "reasked", text: "같은 내용을 다시 질문받았나요?", scale5: true },
      { key: "too_many_q", text: "질문이 너무 많다고 느꼈나요?", scale5: true },
      { key: "needed_human", text: "사람의 도움이 필요했나요?", scale5: true }
    ]
  },
  week1_end: {
    label: "Week 1 종료",
    questions: [
      { key: "helped_target", text: "목표 직무를 정하는 데 도움이 됐나요?", scale5: true },
      { key: "trial_realistic", text: "직무 체험이 실제 업무 이해에 도움이 됐나요?", scale5: true },
      { key: "reco_trust", text: "추천 직무의 근거를 신뢰할 수 있었나요?", scale5: true },
      { key: "want_reselect", text: "직무를 다시 선택하고 싶은가요?", scale5: true }
    ]
  },
  week2_end: {
    label: "Week 2 종료",
    questions: [
      { key: "submittable", text: "현재 서류를 실제 공고에 제출할 수 있다고 느끼나요?", scale5: true },
      { key: "matches_experience", text: "AI가 만든 문장이 내 실제 경험과 일치하나요?", scale5: true },
      { key: "reasked", text: "서류 작성 과정에서 반복 질문이 있었나요?", scale5: true },
      { key: "time_saved", text: "직접 작성할 때보다 시간이 줄었다고 느끼나요?", scale5: true }
    ]
  },
  week3_end: {
    label: "Week 3 종료",
    questions: [
      { key: "felt_real", text: "실제 면접처럼 느껴졌나요?", scale5: true },
      { key: "feedback_specific", text: "피드백이 구체적이었나요?", scale5: true },
      { key: "understood_weakness", text: "내가 반복하는 약점을 이해했나요?", scale5: true },
      { key: "want_retry", text: "오답 훈련을 다시 해보고 싶은가요?", scale5: true }
    ]
  },
  week4_end: {
    label: "Week 4 종료",
    questions: [
      { key: "improved", text: "최초보다 답변이 좋아졌다고 느끼나요?", scale5: true },
      { key: "handle_similar", text: "유사 질문에도 대응할 수 있다고 느끼나요?", scale5: true },
      { key: "confidence", text: "면접 자신감이 어떻게 변했나요?", scale5: true },
      { key: "recommend", text: "프로그램을 다른 사람에게 추천하고 싶은가요?", scale5: true }
    ]
  },
  competition: {
    label: "경쟁 기능",
    questions: [
      { key: "motivated", text: "다른 참여자의 존재가 동기부여가 됐나요?", scale5: true },
      { key: "rank_pressure", text: "순위 또는 구간이 부담스러웠나요?", scale5: true },
      { key: "growth_vs_action", text: "성장률과 다음 행동 중 무엇이 더 도움이 됐나요?", scale5: true },
      { key: "keep_using", text: "경쟁 기능을 계속 사용하고 싶은가요?", scale5: true }
    ]
  }
} as const;
export type SurveyKey = keyof typeof SURVEY_DEFINITIONS;
export const SURVEY_KEYS = Object.keys(SURVEY_DEFINITIONS) as SurveyKey[];

// 설문 응답 검증(엔드포인트에서 사용). 척도 1~5, 주관식 최대 500자, 정의된 문항 키만 허용.
export const surveyResponseSchema = z.object({
  surveyKey: z.enum(SURVEY_KEYS as [SurveyKey, ...SurveyKey[]]),
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
  comment: z.string().max(500).optional()
});
export type SurveyResponseInput = z.infer<typeof surveyResponseSchema>;

// 응답 키가 정의된 문항에 속하는지 확인(정의 밖 키 제거).
export function sanitizeSurveyAnswers(surveyKey: SurveyKey, answers: Record<string, number>): Record<string, number> {
  const validKeys = new Set<string>(SURVEY_DEFINITIONS[surveyKey].questions.map((q) => q.key as string));
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(answers)) if (validKeys.has(k)) out[k] = v;
  return out;
}

// ── 정성 피드백 분류(섹션 8) ────────────────────────────────
// 원문은 이벤트/로그에 넣지 않는다 — category·severity 만 사용한다.
export const QUALITATIVE_CATEGORIES = [
  { key: "already_answered", label: "이미 답했어요", severity: "high" },
  { key: "too_many_questions", label: "질문이 너무 많아요", severity: "medium" },
  { key: "result_mismatch", label: "결과가 내 경험과 달라요", severity: "high" },
  { key: "reco_unclear", label: "왜 이 직무를 추천했는지 모르겠어요", severity: "medium" },
  { key: "want_human", label: "사람에게 상담받고 싶어요", severity: "high" },
  { key: "score_unclear", label: "점수가 이해되지 않아요", severity: "medium" },
  { key: "competition_pressure", label: "경쟁 기능이 부담스러워요", severity: "medium" },
  { key: "content_lost", label: "작성 내용이 사라졌어요", severity: "critical" },
  { key: "interview_blocked", label: "면접을 계속 진행할 수 없어요", severity: "critical" }
] as const;
export type QualitativeCategory = (typeof QUALITATIVE_CATEGORIES)[number]["key"];
export const QUALITATIVE_CATEGORY_KEYS = QUALITATIVE_CATEGORIES.map((c) => c.key) as QualitativeCategory[];

export function severityForCategory(cat: QualitativeCategory): string {
  return QUALITATIVE_CATEGORIES.find((c) => c.key === cat)?.severity ?? "medium";
}

export const qualitativeFeedbackSchema = z.object({
  category: z.enum(QUALITATIVE_CATEGORY_KEYS as [QualitativeCategory, ...QualitativeCategory[]]),
  currentWeek: z.number().int().min(0).max(4).optional(),
  currentStep: z.string().max(40).optional(),
  sessionId: z.string().max(80).optional()
});

// ── LLM 비용 추정 ───────────────────────────────────────────
// 모델별 1M 토큰당 USD(근사, 운영 화면 참고용). 실제 청구와 다를 수 있음 → '추정' 표기.
export const LLM_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  "gpt-5": { inputPerM: 1.25, outputPerM: 10 },
  "gpt-5-mini": { inputPerM: 0.25, outputPerM: 2 },
  "gpt-4o": { inputPerM: 2.5, outputPerM: 10 },
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 }
};
export const DEFAULT_PRICING = { inputPerM: 2.5, outputPerM: 10 };

export function estimateLlmCost(model: string, inputTokens: number, outputTokens: number): number {
  // 가장 구체적인(긴) prefix 우선 — "gpt-4o-mini" 가 "gpt-4o" 보다 먼저 매칭돼야 한다.
  const key = Object.keys(LLM_PRICING)
    .sort((a, b) => b.length - a.length)
    .find((k) => model.startsWith(k));
  const p = key ? LLM_PRICING[key] : DEFAULT_PRICING;
  return (inputTokens / 1_000_000) * p.inputPerM + (outputTokens / 1_000_000) * p.outputPerM;
}

// 파일럿에서 비용을 나눠 볼 기능 목록(섹션 13). feature 문자열은 careerChatComplete ctx.feature 와 일치시킨다.
export const COST_FEATURES = [
  "consult",
  "profile_extract",
  "job_reco",
  "job_trial_eval",
  "jd_analysis",
  "resume",
  "cover",
  "consistency",
  "interview_questions",
  "interview_eval",
  "weakness",
  "correction",
  "final_report",
  "ops_summary"
] as const;
export type CostFeature = (typeof COST_FEATURES)[number];

// ── Phase 10 계기(instrumentation) — 행동 이벤트 ─────────────
// 다음 파일럿에서 Phase 10 분석(체류시간·이탈·다음행동·제안 수락률 등)이 실제로 가능하도록
// 서버측에 영속화한다. 원문/개인정보 없음 — 정해진 kind(enum)와 week/step/sessionId 만.
export const ACTIVITY_KINDS = [
  "week_enter", // 주차 화면 진입/하트비트(체류시간·재진입 산출)
  "next_action_click", // 다음 행동 클릭
  "league_view", // 리그 조회
  "rank_detail_view", // 순위 상세 조회
  "privacy_change", // 경쟁 공개 설정 변경
  "suggestion_accept", // AI 제안 수락
  "suggestion_modify", // AI 제안 수정
  "suggestion_reject", // AI 제안 거절
  "skip", // 건너뛰기
  "unsure", // 잘 모르겠어요
  "ask_ai", // AI 추천 요청
  "dashboard_view" // 대시보드 진입(참여 funnel — KI-1 후속, 순수 뷰 이벤트 DB 적재)
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const activityEventSchema = z.object({
  kind: z.enum([...ACTIVITY_KINDS] as [ActivityKind, ...ActivityKind[]]),
  week: z.number().int().min(0).max(4).optional(),
  step: z.string().max(40).optional(),
  sessionId: z.string().max(80).optional()
});
export type ActivityEventInput = z.infer<typeof activityEventSchema>;

// 세션 경계 근사 — 이벤트 간격이 이보다 크면 다른 세션으로 본다(체류시간 과대추정 방지).
export const SESSION_GAP_MS = 30 * 60 * 1000;
// 재진입 판정 — 같은 주차에서 이 간격 이상 비웠다가 돌아오면 재진입 1회.
export const REENTRY_GAP_MS = 6 * 60 * 60 * 1000;

export type ActivityEvent = { kind: ActivityKind; week: number | null; atMs: number };
export type WeekEngagement = { week: number; enters: number; activeMinutes: number; reEntries: number };
export type EngagementResult = {
  byWeek: WeekEngagement[];
  suggestion: { accept: number; modify: number; reject: number; acceptRatePct: number | null };
  signals: { skip: number; unsure: number; askAi: number; nextActionClicks: number; leagueViews: number; rankDetailViews: number; privacyChanges: number };
};

// 행동 이벤트 → 참여 지표(순수). week_enter 간격으로 체류시간·재진입을 근사한다.
export function computeEngagement(events: ActivityEvent[]): EngagementResult {
  const byWeek: WeekEngagement[] = [1, 2, 3, 4].map((week) => {
    const enters = events.filter((e) => e.kind === "week_enter" && e.week === week).map((e) => e.atMs).sort((a, b) => a - b);
    let activeMs = 0;
    let reEntries = 0;
    for (let i = 1; i < enters.length; i++) {
      const gap = enters[i] - enters[i - 1];
      if (gap <= SESSION_GAP_MS) activeMs += gap; // 같은 세션 내 체류 누적
      if (gap >= REENTRY_GAP_MS) reEntries++; // 비웠다가 복귀
    }
    return { week, enters: enters.length, activeMinutes: Math.round(activeMs / 60000), reEntries };
  });
  const count = (k: ActivityKind) => events.filter((e) => e.kind === k).length;
  const accept = count("suggestion_accept");
  const modify = count("suggestion_modify");
  const reject = count("suggestion_reject");
  const decided = accept + modify + reject;
  return {
    byWeek,
    suggestion: { accept, modify, reject, acceptRatePct: decided > 0 ? Math.round((accept / decided) * 100) : null },
    signals: { skip: count("skip"), unsure: count("unsure"), askAi: count("ask_ai"), nextActionClicks: count("next_action_click"), leagueViews: count("league_view"), rankDetailViews: count("rank_detail_view"), privacyChanges: count("privacy_change") }
  };
}
