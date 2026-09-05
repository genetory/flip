// Career Launch Phase 10 — KPI·North Star 공통 계산(DB 무의존, 테스트 가능).
// 산식을 화면마다 중복 구현하지 않도록 여기서 단일 정의한다. 목표값은 하드코딩이 아니라
// monitoringConfiguration.kpiTargets 로 주입(여기 상수는 파일럿 기본 제안값).
import { z } from "zod";

export const KPI_METRICS_VERSION = "kpi_v1";

// ── North Star Metric ───────────────────────────────────────
// "4주 안에 지원서와 면접 준비를 모두 완료한 참여자 수/비율."
// 조건: 이력서 확정 + 자소서 확정 + 최초 모의면접 완료 + 오답 재도전 완료 + 성장 리포트 확인.
export type NorthStarStudent = {
  studentUserId: string;
  resumeFinalized: boolean;
  coverFinalized: boolean;
  initialMockDone: boolean;
  retryDone: boolean;
  growthViewed: boolean;
};
export function isNorthStarComplete(s: NorthStarStudent): boolean {
  return s.resumeFinalized && s.coverFinalized && s.initialMockDone && s.retryDone && s.growthViewed;
}
export function computeNorthStar(students: NorthStarStudent[]): { count: number; total: number; ratePct: number; breakdown: Record<string, number> } {
  const uniq = new Map<string, NorthStarStudent>();
  for (const s of students) uniq.set(s.studentUserId, s); // 고유 참여자.
  const arr = [...uniq.values()];
  const count = arr.filter(isNorthStarComplete).length;
  const total = arr.length;
  return {
    count,
    total,
    ratePct: total ? Math.round((count / total) * 100) : 0,
    breakdown: {
      resumeFinalized: arr.filter((s) => s.resumeFinalized).length,
      coverFinalized: arr.filter((s) => s.coverFinalized).length,
      initialMockDone: arr.filter((s) => s.initialMockDone).length,
      retryDone: arr.filter((s) => s.retryDone).length,
      growthViewed: arr.filter((s) => s.growthViewed).length
    }
  };
}

// ── KPI 정의(§10) — 산식·포함/제외·이벤트·데이터 단일 문서화 ──
export type KpiDef = {
  key: string;
  name: string;
  purpose: string;
  numerator: string;
  denominator: string;
  include?: string;
  exclude?: string;
  events: string[];
  data: string[];
  targetKey?: keyof typeof DEFAULT_KPI_TARGETS;
};
export const KPI_DEFINITIONS: KpiDef[] = [
  { key: "signup_rate", name: "초대 대비 가입률", purpose: "유입 효율", numerator: "가입 인원", denominator: "초대 인원", events: ["career_launch_viewed"], data: ["invite", "enrollment"], targetKey: "signupRate" },
  { key: "activation_rate", name: "24시간 내 첫 상담 시작률", purpose: "초기 활성화", numerator: "가입 후 24h 내 첫 상담 시작", denominator: "가입 인원", events: ["career_coaching_started"], data: ["progress.firstConsult"], targetKey: "activationRate" },
  { key: "week1_rate", name: "1주차 완료율(목표 직무 확정)", purpose: "방향 결정", numerator: "목표 직무 확정 인원", denominator: "등록 인원", events: ["career_target_job_confirmed"], data: ["CareerTargetJob"], targetKey: "week1Rate" },
  { key: "week2_rate", name: "2주차 지원 패키지 완성률", purpose: "서류 완성", numerator: "패키지 finalized", denominator: "등록 인원", events: ["career_application_package_finalized"], data: ["CareerApplicationPackage"], targetKey: "week2Rate" },
  { key: "week3_rate", name: "3주차 최초 모의면접 완료율", purpose: "면접 실전", numerator: "최초 면접 완료", denominator: "등록 인원", events: ["mock_interview_completed"], data: ["CareerInterviewSession"], targetKey: "week3Rate" },
  { key: "week4_rate", name: "4주차 오답 재도전 완료율", purpose: "반복 교정", numerator: "재도전 완료", denominator: "등록 인원", events: ["career_correction_retry_submitted"], data: ["CareerInterviewCorrection"], targetKey: "week4Rate" },
  { key: "completion_rate", name: "4주 완주율", purpose: "완주", numerator: "성장 리포트 확인(완주)", denominator: "등록 인원", events: ["career_launch_completed"], data: ["CareerInterviewGrowthReport"], targetKey: "completionRate" },
  { key: "artifact_confirm_rate", name: "결과물 사용자 확인률", purpose: "품질(초안 아님)", numerator: "사용자 확정 결과물", denominator: "생성된 결과물", events: ["career_resume_confirmed", "career_document_claim_confirmed"], data: ["CareerDocumentVersion.userConfirmed"], targetKey: "artifactConfirmRate" },
  { key: "reask_rate", name: "반복 질문 경험률", purpose: "코치 연속성", numerator: "이미 답했어요 신고", denominator: "대화형 호출", exclude: "운영자·테스트", events: ["career_pilot_feedback_submitted"], data: ["CareerQualitativeFeedback(already_answered)"], targetKey: "reaskRate" },
  { key: "recovery_rate", name: "코치 개입 후 복귀율", purpose: "개입 효과", numerator: "개입 후 재활성화", denominator: "개입 대상", events: ["career_intervention_resolved"], data: ["CareerIntervention", "progress.updatedAt"], targetKey: "recoveryRate" },
  { key: "recommend_rate", name: "프로그램 추천 의향", purpose: "만족", numerator: "추천 긍정 응답", denominator: "종료 설문 응답", events: ["career_pilot_survey_submitted"], data: ["CareerPilotSurvey(week4_end.recommend)"], targetKey: "recommendRate" },
  { key: "real_application_rate", name: "실제 지원 시작률", purpose: "성과", numerator: "실제 지원 행동", denominator: "완주 인원", events: [], data: ["CareerEmploymentOutcome"], targetKey: undefined }
];

// ── 파일럿 기본 목표값(§11) — 설정으로 덮어쓸 수 있다 ──
export const DEFAULT_KPI_TARGETS = {
  signupRate: 80,
  activationRate: 70,
  week1Rate: 75,
  week2Rate: 65,
  week3Rate: 60,
  week4Rate: 50,
  completionRate: 50,
  artifactConfirmRate: 80,
  reaskRate: 10, // 이하
  recoveryRate: 40,
  recommendRate: 70
} as const;
export type KpiTargets = typeof DEFAULT_KPI_TARGETS;

// 목표값 병합(설정 우선). 부분 override 안전.
export function mergeKpiTargets(override?: Partial<Record<string, number>> | null): Record<string, number> {
  return { ...DEFAULT_KPI_TARGETS, ...(override ?? {}) };
}
// KPI 목표 override 검증(설정 저장용).
export const kpiTargetsSchema = z.record(z.string(), z.number().min(0).max(100));

// 비율 계산 헬퍼(분모 0 안전, 표본과 함께).
export type Rate = { pct: number | null; num: number; den: number };
export function rate(num: number, den: number): Rate {
  return { pct: den > 0 ? Math.round((num / den) * 100) : null, num, den };
}

// KPI 집계 입력 → 값 세트. 산식은 여기 단일 정의(화면 중복 금지).
export type KpiInput = {
  invited: number;
  enrolled: number;
  firstConsult: number;
  targetConfirmed: number;
  packageFinalized: number;
  initialMock: number;
  retryDone: number;
  completed: number;
  artifactsCreated: number;
  artifactsConfirmed: number;
  reaskReports: number;
  conversationalCalls: number;
  interventionTargets: number;
  interventionRecovered: number;
  surveyResponses: number;
  recommendPositive: number;
  realApplications: number;
};
export function computeKpiSet(inp: KpiInput): Record<string, Rate> {
  return {
    signup_rate: rate(inp.enrolled, inp.invited),
    activation_rate: rate(inp.firstConsult, inp.enrolled),
    week1_rate: rate(inp.targetConfirmed, inp.enrolled),
    week2_rate: rate(inp.packageFinalized, inp.enrolled),
    week3_rate: rate(inp.initialMock, inp.enrolled),
    week4_rate: rate(inp.retryDone, inp.enrolled),
    completion_rate: rate(inp.completed, inp.enrolled),
    artifact_confirm_rate: rate(inp.artifactsConfirmed, inp.artifactsCreated),
    reask_rate: rate(inp.reaskReports, inp.conversationalCalls),
    recovery_rate: rate(inp.interventionRecovered, inp.interventionTargets),
    recommend_rate: rate(inp.recommendPositive, inp.surveyResponses),
    real_application_rate: rate(inp.realApplications, inp.completed)
  };
}

// 목표 대비 상태(작은 표본 주의). reask 는 '이하'가 목표라 방향 반대.
export function kpiStatus(key: string, r: Rate, targets: Record<string, number>): "on_track" | "below" | "no_data" {
  if (r.pct == null) return "no_data";
  const t = targets[toCamelTargetKey(key)];
  if (t == null) return "on_track";
  if (key === "reask_rate") return r.pct <= t ? "on_track" : "below"; // 낮을수록 좋음.
  return r.pct >= t ? "on_track" : "below";
}
function toCamelTargetKey(key: string): string {
  const map: Record<string, string> = { signup_rate: "signupRate", activation_rate: "activationRate", week1_rate: "week1Rate", week2_rate: "week2Rate", week3_rate: "week3Rate", week4_rate: "week4Rate", completion_rate: "completionRate", artifact_confirm_rate: "artifactConfirmRate", reask_rate: "reaskRate", recovery_rate: "recoveryRate", recommend_rate: "recommendRate" };
  return map[key] ?? key;
}
// 작은 표본에서 세부 통계 노출 자제 기준(개인 추정 방지).
export const KPI_MIN_SAMPLE = 5;
