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
  const q = query.trim();
  if (!q) return;
  // 검색 원문은 보내지 않는다 — 사람 이름·회사명·개인 상황이 섞여 들어온다.
  // 검색이 일어났다는 사실과 대략적인 길이만 남긴다.
  safeSendEvent("search", { term_length: Math.min(q.length, 200), has_space: q.includes(" ") });
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
  | "career_apply_cta_clicked"
  | "career_apply_cta_seeall"
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
  | "career_target_company_started"
  | "career_target_company_saved"
  | "career_posting_interview_started"
  | "career_posting_interview_completed"
  | "career_basic_interview_started"
  | "career_basic_interview_completed"
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

// ---- 대학별 랜딩(talent/university/[slug]) — 유입·전환 귀속 계측 ----

export function trackUniversityLandingViewed(slug: string, campaign?: string) {
  safeSendEvent("university_landing_viewed", { slug, ...(campaign ? { campaign } : {}) });
}

export function trackUniversityCtaClicked(slug: string, cta: "primary" | "jobs" | "secondary", campaign?: string) {
  safeSendEvent("university_cta_clicked", { slug, cta, ...(campaign ? { campaign } : {}) });
}


// ---- 유입·전환 기반(Growth Phase 1) ----
//
// 공개 콘텐츠 → 무료 도구 → 회원가입 → Career Launch 로 이어지는 경로를 한 이름 체계로 센다.
// 규칙: 개인정보·검색 원문·이력서 원문은 넣지 않는다. 식별자는 공개 ID(공고 id 등)만 쓴다.

/** 공개 콘텐츠 종류 — 어느 문맥에서 전환이 일어났는지 구분한다. */
export type GrowthSurface = "home" | "talent_landing" | "job_list" | "job_detail" | "visa" | "resume" | "interview" | "career_launch";

/** 공개 랜딩 진입. */
export function trackLandingView(surface: GrowthSurface) {
  safeSendEvent("landing_view", { surface });
}

export function trackJobListView(params: { count: number; tab?: string } = { count: 0 }) {
  safeSendEvent("job_list_view", { count: params.count, ...(params.tab ? { tab: params.tab } : {}) });
}

/** 공고 상세 열람. indexable 은 본문이 충분한 공고인지(품질 추적용). */
export function trackJobDetailView(positionId: string, params: { closed?: boolean; external?: boolean } = {}) {
  safeSendEvent("job_detail_view", { position_id: positionId, ...params });
}

/** 비자·이력서·면접 등 읽는 콘텐츠 열람. slug 는 공개 식별자만. */
export function trackContentView(surface: GrowthSurface, slug: string) {
  safeSendEvent("content_view", { surface, slug: slug.slice(0, 80) });
}

/** 무료 도구(진단·이력서 문장·모의면접 등) 시작·완료. */
export function trackFreeToolStart(tool: string) {
  safeSendEvent("free_tool_start", { tool });
}

export function trackFreeToolComplete(tool: string) {
  safeSendEvent("free_tool_complete", { tool });
}

/** 가입 버튼 클릭(아직 가입 전) — surface 로 어느 콘텐츠가 가입을 만들었는지 본다. */
export function trackSignupClick(surface: GrowthSurface) {
  safeSendEvent("signup_click", { surface });
}

export function trackSignupComplete(method: SignupMethod) {
  safeSendEvent("signup_complete", { method });
}

/** 커리어 프로필(기본 정보·경험) 작성 시작·완료. */
export function trackCareerProfileStart() {
  safeSendEvent("career_profile_start", {});
}

export function trackCareerProfileComplete() {
  safeSendEvent("career_profile_complete", {});
}

export function trackJobSave(positionId: string, surface: GrowthSurface) {
  safeSendEvent("job_save", { position_id: positionId, surface });
}

/** 지원 흐름 시작(지원 준비 또는 지원하기 클릭). */
export function trackApplyStart(positionId: string, surface: GrowthSurface) {
  safeSendEvent("apply_start", { position_id: positionId, surface });
}

/** Career Launch 진입(공개 랜딩에서 프로그램으로). */
export function trackCareerLaunchStart(surface: GrowthSurface) {
  safeSendEvent("career_launch_start", { surface });
}

/** 메인 랜딩 진입(Phase 2) — surface 로 어느 섹션이 전환을 만들었는지 본다. */
export function trackGrowthLandingView(params: { locale: string; loggedIn: boolean }) {
  safeSendEvent("growth_landing_view", { locale: params.locale, logged_in: params.loggedIn });
}

/** 랜딩 섹션의 CTA 클릭. section 은 고정 키만 보낸다(자유 입력 없음). */
export function trackLandingSectionCta(section: string) {
  safeSendEvent("landing_section_cta", { section });
}

/** Career Launch 공개 랜딩 진입. */
export function trackCareerLaunchLandingView(params: { locale: string; loggedIn: boolean }) {
  safeSendEvent("career_launch_landing_view", { locale: params.locale, logged_in: params.loggedIn });
}

/** Career Launch 시작 클릭 — source 로 어디서 눌렀는지 구분(고정 키만). */
export function trackCareerLaunchStartClick(source: string) {
  safeSendEvent("career_launch_start_click", { source });
}

// ---- 무료 비자·직무 진단(/tools/visa-job-fit) ----
// 자유 입력·개인정보는 절대 보내지 않는다. 고정 키(비자 계열·경력 수준·직무 카테고리)만.

export type VisaJobFitProps = {
  locale: string;
  source?: string;
  /** 비자 계열(앞 글자, 예: "D" / "E" / "F") — 코드 전체를 보내지 않는다. */
  visaCategory?: string;
  experienceLevel?: string;
  interestedJobCategory?: string;
  resultCount?: number;
  loggedIn?: boolean;
};

function fitParams(p: VisaJobFitProps): Record<string, unknown> {
  return {
    locale: p.locale,
    ...(p.source ? { source: p.source } : {}),
    ...(p.visaCategory ? { visa_category: p.visaCategory } : {}),
    ...(p.experienceLevel ? { experience_level: p.experienceLevel } : {}),
    ...(p.interestedJobCategory ? { interested_job_category: p.interestedJobCategory } : {}),
    ...(typeof p.resultCount === "number" ? { result_count: p.resultCount } : {}),
    ...(typeof p.loggedIn === "boolean" ? { logged_in: p.loggedIn } : {})
  };
}

export function trackVisaJobFitStart(p: VisaJobFitProps) {
  safeSendEvent("visa_job_fit_start", fitParams(p));
}

/** step 은 1부터. 입력한 값은 보내지 않고 어느 단계를 넘겼는지만. */
export function trackVisaJobFitStepComplete(step: number, p: VisaJobFitProps) {
  safeSendEvent("visa_job_fit_step_complete", { step, ...fitParams(p) });
}

export function trackVisaJobFitComplete(p: VisaJobFitProps) {
  safeSendEvent("visa_job_fit_complete", fitParams(p));
}

export function trackVisaJobFitResultView(p: VisaJobFitProps) {
  safeSendEvent("visa_job_fit_result_view", fitParams(p));
}

export function trackVisaJobFitSignupClick(p: VisaJobFitProps) {
  safeSendEvent("visa_job_fit_signup_click", fitParams(p));
}

export function trackVisaJobFitSignupComplete(p: VisaJobFitProps) {
  safeSendEvent("visa_job_fit_signup_complete", fitParams(p));
}

/** 추천 공고 노출 — 공개 공고 id 만 보낸다. */
export function trackRecommendedJobView(positionId: string, source: string) {
  safeSendEvent("recommended_job_view", { position_id: positionId, source });
}
