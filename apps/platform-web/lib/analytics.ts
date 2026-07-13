import { sendGAEvent } from "@next/third-parties/google";

/**
 * Thin wrapper around `@next/third-parties/google.sendGAEvent` that is safe to
 * call from anywhere (SSR / lib helpers / event handlers). Becomes a no-op when
 * GA is disabled (no Measurement ID configured) or when `window`/gtag isn't
 * available yet — silently dropped events are preferable to runtime errors in
 * production.
 */
function safeSendEvent(name: string, params: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) return;
    sendGAEvent("event", name, params);
  } catch {
    // analytics failure must never break user flow
  }
}

// ---- auth ----

export type SignupMethod = "email" | "naver" | "google" | "kakao";

export function trackSignUp(method: SignupMethod) {
  safeSendEvent("sign_up", { method });
}

export function trackLogin(method: SignupMethod) {
  safeSendEvent("login", { method });
}

export function trackEmailVerified() {
  safeSendEvent("email_verified", {});
}

export function trackAccountDeleted() {
  safeSendEvent("account_deleted", {});
}

// ---- positions ----

export function trackPositionSearch(query: string) {
  if (!query.trim()) return;
  safeSendEvent("search", { search_term: query.trim().slice(0, 120) });
}

export function trackPositionView(positionId: string, source: string) {
  safeSendEvent("view_position", { position_id: positionId, source });
}

export function trackPositionApply(positionId: string, source: string) {
  safeSendEvent("apply_position", { position_id: positionId, source });
}

export function trackPositionFavorite(positionId: string, source: string, isFavorite: boolean) {
  safeSendEvent("favorite_position", { position_id: positionId, source, is_favorite: isFavorite });
}

export function trackExternalPositionClick(positionId: string, source: string) {
  safeSendEvent("click_external_position", { position_id: positionId, source });
}

// ---- AI matching ----

export function trackAiAnalysisStart() {
  safeSendEvent("start_ai_analysis", {});
}

export function trackAiAnalysisCompleted(score: number) {
  safeSendEvent("complete_ai_analysis", { score });
}

// ---- resume maker (AI 이력서 만들기) ----

export function trackResumeBuilderViewed() {
  safeSendEvent("resume_builder_viewed", {});
}

export function trackResumeBuilderStarted(mode: "new" | "improve" | "import") {
  safeSendEvent("resume_builder_started", { mode });
}

export function trackResumePurposeSelected(purpose: string) {
  safeSendEvent("resume_purpose_selected", { purpose });
}

export function trackResumeJobSelected(jobs: string[]) {
  safeSendEvent("resume_job_selected", { jobs: jobs.join(",") });
}

export function trackExperienceCreated(experienceType: string) {
  safeSendEvent("experience_created", { experience_type: experienceType });
}

export function trackExperienceInterviewStarted() {
  safeSendEvent("experience_interview_started", {});
}

export function trackExperienceInterviewCompleted() {
  safeSendEvent("experience_interview_completed", {});
}

export function trackResumeSentenceGenerated(count: number) {
  safeSendEvent("resume_sentence_generated", { count });
}

export function trackResumeSentenceAccepted() {
  safeSendEvent("resume_sentence_accepted", {});
}

export function trackResumeTemplateSelected(templateId: string) {
  safeSendEvent("resume_template_selected", { template_id: templateId });
}

export function trackResumeDiagnosed(level: string) {
  safeSendEvent("resume_diagnosed", { level });
}

export function trackResumePdfDownloaded(templateId: string) {
  safeSendEvent("resume_pdf_downloaded", { template_id: templateId });
}

export function trackResumeBuilderCompleted() {
  safeSendEvent("resume_builder_completed", {});
}

// ---- Career Launch (기수 취업 부트캠프) ----

export type CareerStep =
  | "diagnosis"
  | "jobs"
  | "materials"
  | "resume"
  | "cover"
  | "interview_self"
  | "interview_job"
  | "interview_fit";

// 기수 등록 성공(초대코드 자가등록 / 운영자 직접 추가).
export function trackCareerEnroll(method: "code" | "operator") {
  safeSendEvent("career_enroll", { method });
}

// 스텝(진단·직무·정리·이력서·자소서·모의면접) 완료.
export function trackCareerStepComplete(step: CareerStep) {
  safeSendEvent("career_step_complete", { step });
}

// 결과물 PDF 다운로드(이력서/자기소개서).
export function trackCareerPdfDownload(doc: "resume" | "cover") {
  safeSendEvent("career_pdf_download", { doc });
}

// 완주 최종 피드백 — 열람/다시 받기.
export function trackCareerFinalFeedback(action: "view" | "regenerate") {
  safeSendEvent("career_final_feedback", { action });
}
