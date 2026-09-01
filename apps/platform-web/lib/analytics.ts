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

// Career Launch 퍼널 이벤트 — 베타 검증용 단계별 시작/완료 계측(GA4).
export type CareerFunnelEvent =
  | "career_launch_started"
  | "profile_started"
  | "profile_completed"
  | "resume_generated"
  | "resume_edited"
  | "resume_downloaded"
  | "job_posting_added"
  | "job_match_completed"
  | "tailored_resume_generated"
  | "mock_interview_started"
  | "mock_interview_completed"
  | "career_report_viewed"
  | "next_action_clicked"
  | "survey_mid_prompted"
  | "survey_mid_clicked"
  | "survey_final_prompted"
  | "survey_final_clicked"
  | "career_week1_started"
  | "career_experience_confirmed"
  | "career_job_recommendations_viewed"
  | "career_job_trial_selected"
  | "career_job_trial_started"
  | "career_job_trial_saved"
  | "career_job_trial_completed"
  | "career_job_trial_feedback_viewed"
  | "career_target_job_confirmed"
  | "career_week1_completed"
  | "career_week2_started"
  | "career_resume_source_selected"
  | "career_resume_draft_generated"
  | "career_resume_confirmed"
  | "career_application_target_selected"
  | "career_job_posting_analyzed"
  | "career_targeted_resume_generated"
  | "career_cover_questions_created"
  | "career_cover_draft_generated"
  | "career_document_claim_confirmed"
  | "career_consistency_check_completed"
  | "career_application_package_finalized"
  | "career_interview_questions_generated"
  | "career_week2_completed"
  | "career_week3_started"
  | "career_interview_strategy_viewed"
  | "career_initial_mock_started"
  | "career_interview_answer_submitted"
  | "career_interview_followup_generated"
  | "career_initial_mock_completed"
  | "career_interview_report_viewed"
  | "career_interview_weakness_detected"
  | "career_correction_note_created"
  | "career_week3_completed"
  | "career_week4_started"
  | "career_correction_opened"
  | "career_correction_coaching_viewed"
  | "career_correction_retry_submitted"
  | "career_transfer_test_started"
  | "career_transfer_test_completed"
  | "career_correction_passed"
  | "career_final_mock_started"
  | "career_final_mock_completed"
  | "career_growth_report_viewed"
  | "career_week4_completed"
  | "career_league_viewed"
  | "career_rank_detail_viewed"
  | "career_next_action_clicked"
  | "career_achievement_viewed"
  | "career_cohort_goal_viewed"
  | "career_activity_feed_viewed"
  | "career_privacy_setting_changed"
  | "career_admin_cohort_dashboard_viewed"
  | "career_admin_student_filtered"
  | "career_intervention_created"
  | "career_intervention_assigned"
  | "career_intervention_status_changed"
  | "career_intervention_resolved"
  | "career_score_recalculated"
  | "career_pilot_survey_prompted"
  | "career_pilot_survey_submitted"
  | "career_pilot_feedback_submitted"
  | "career_dashboard_viewed"
  | "career_primary_action_viewed"
  | "career_primary_action_clicked"
  | "career_week_journey_viewed"
  | "career_week_card_clicked"
  | "career_artifact_clicked"
  | "career_growth_summary_clicked"
  | "career_cohort_activity_viewed"
  | "career_seminar_clicked"
  | "career_dashboard_retry_clicked"
  | "career_navigation_clicked"
  | "career_coaching_intro_viewed"
  | "career_coaching_started"
  | "career_coaching_message_sent"
  | "career_coaching_quick_reply_used"
  | "career_coaching_profile_opened"
  | "career_coaching_artifact_opened"
  | "career_coaching_suggestion_confirmed"
  | "career_coaching_suggestion_rejected"
  | "career_coaching_fact_corrected"
  | "career_coaching_resumed"
  | "career_coaching_completed"
  | "career_coaching_abandoned"
  | "career_coaching_retry"
  | "career_human_review_requested"
  | "career_week_viewed"
  | "career_week_primary_action_clicked"
  | "career_mission_viewed"
  | "career_mission_started"
  | "career_mission_completed"
  | "career_mission_locked_clicked"
  | "career_completion_criteria_viewed"
  | "career_next_week_preview_clicked"
  | "career_seminar_viewed"
  | "career_artifact_hub_viewed"
  | "career_artifact_opened"
  | "career_artifact_confirmation_clicked"
  | "career_artifact_version_viewed"
  | "career_correction_notebook_viewed"
  | "career_correction_next_action_clicked"
  | "career_answer_comparison_viewed"
  | "career_growth_viewed"
  | "career_growth_report_opened"
  | "career_interview_comparison_viewed"
  | "career_remaining_weakness_opened"
  | "career_thirty_day_plan_viewed"
  | "career_league_summary_viewed"
  | "career_admin_home_viewed"
  | "career_admin_attention_item_clicked"
  | "career_admin_cohort_opened"
  | "career_admin_student_opened"
  | "career_admin_intervention_opened"
  | "career_admin_seminar_opened"
  | "career_institution_outcome_viewed"
  | "career_institution_report_started"
  | "career_institution_report_downloaded"
  // Phase 9(파일럿) — 유입·AI 신뢰성·프로필 확정 측정 갭 보완.
  | "career_launch_viewed"
  | "career_launch_onboarding_completed"
  | "career_coaching_response_completed"
  | "career_coaching_response_failed"
  | "career_profile_confirmed"
  | "career_launch_completed";

export function trackCareerFunnel(event: CareerFunnelEvent, params: Record<string, unknown> = {}) {
  safeSendEvent(event, params);
}
