"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, FileText, Warning } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";
import { getMyResumes, type Resume } from "../../lib/member-profile-client";
import {
  getMySgcApplication,
  submitSgcApplication,
  type SgcApplication,
  type SgcDesiredJob,
  type SgcVisaType
} from "../../lib/sgc-event-client";
import { isSgcRecruitClosed } from "../../lib/sgc-event-config";

// ---------------------------------------------------------------------------
// /events/seoul-global-center/apply — SGC 6주 일경험 프로그램 지원 페이지.
// 회원 + 이력서 보유자만 지원 가능. 비로그인은 /login 으로, 이력서 없으면
// /resume/new/edit 로 부드럽게 안내. 이미 지원한 사용자는 status 화면.
// ---------------------------------------------------------------------------

const VISA_OPTIONS: SgcVisaType[] = ["D-2", "D-10", "OTHER"];
const DESIRED_JOB_OPTIONS: SgcDesiredJob[] = ["MARKETING", "SALES", "TRANSLATION", "DEV", "OTHER"];

type Copy = {
  pageHeading: string;
  pageSubheading: string;
  // 비-회원 / 이력서 없음 / 이미 지원 / 학생 아님 / 모집 마감 안내
  loginRequiredTitle: string;
  loginRequiredBody: string;
  loginCta: string;
  noResumeTitle: string;
  noResumeBody: string;
  noResumeCta: string;
  alreadyAppliedTitle: string;
  alreadyAppliedBody: string;
  notStudentTitle: string;
  notStudentBody: string;
  closedTitle: string;
  closedBody: string;
  statusLabel: string;
  statusValue: Record<string, string>;
  backToDetail: string;
  // 폼
  resumeSectionLabel: string;
  resumeSelectHint: string;
  resumeEditLink: string;
  visaTypeLabel: string;
  visaTypeNote: string;
  visaOptionLabel: Record<SgcVisaType, string>;
  visaOtherPlaceholder: string;
  healthLabel: string;
  healthPlaceholder: string;
  desiredJobLabel: string;
  desiredJobOptionLabel: Record<SgcDesiredJob, string>;
  desiredJobOtherPlaceholder: string;
  motivationLabel: string;
  motivationPlaceholder: string;
  motivationHelp: string;
  marketingHeading: string;
  marketingBody: string;
  marketingYes: string;
  marketingNo: string;
  privacyHeading: string;
  privacyBody: string;
  privacyAgree: string;
  submit: string;
  submitting: string;
  // 에러
  errRequired: string;
  errRetry: string;
  // 성공
  successTitle: string;
  successBody: string;
};

// 안내 본문은 분량이 많아 ko 만 풍부하게 + 영어는 핵심만, 나머지 4개 로케일은
// 추후 운영팀이 다듬을 수 있도록 한국어로 fallback. event-page 의 일반적인
// 풀 6로케일 패턴과 다른 이유는 SGC 프로그램이 한국 정부 기관 협력이라
// 한국어가 1차 언어이기 때문.
const COPY: Record<PlatformLocale, Copy> = (() => {
  const ko: Copy = {
    pageHeading: "프로그램 지원",
    pageSubheading: "서울글로벌센터 × Aply 6주 일경험 프로그램 신청",
    loginRequiredTitle: "Aply 회원만 지원 가능합니다",
    loginRequiredBody:
      "신청을 위해서는 Aply 회원가입과 이력서가 필요해요. 로그인 후 다시 진입하시면 됩니다.",
    loginCta: "로그인 / 가입하기",
    noResumeTitle: "이력서를 먼저 작성해 주세요",
    noResumeBody:
      "SGC 프로그램 지원에는 Aply 이력서가 필요합니다. 1분 만에 이력서를 만들고 지원할 수 있어요.",
    noResumeCta: "이력서 만들기",
    alreadyAppliedTitle: "이미 지원이 접수됐습니다",
    alreadyAppliedBody:
      "한 사용자당 1회 지원 가능해요. 운영팀에서 검토 후 개별 연락드릴게요.",
    notStudentTitle: "학생 회원만 지원 가능합니다",
    notStudentBody:
      "본 프로그램은 외국인 유학생 대상이라 STUDENT 계정에서만 신청 가능해요. 학생 계정으로 다시 로그인해 주세요.",
    closedTitle: "모집이 마감됐어요",
    closedBody:
      "신청 기간이 종료됐습니다. 다음 모집 공지는 Aply 이벤트 페이지에서 안내드릴게요.",
    statusLabel: "지원 상태",
    statusValue: {
      SUBMITTED: "접수 완료",
      INTERVIEW: "면접 진행",
      ACCEPTED: "합격",
      REJECTED: "불합격",
      WITHDRAWN: "지원 취소"
    },
    backToDetail: "프로그램 페이지로 돌아가기",
    resumeSectionLabel: "지원에 사용할 이력서",
    resumeSelectHint: "운영팀이 검토할 이력서를 선택해 주세요. 보완이 필요하면 옆의 \"수정\"으로 바로 편집할 수 있어요.",
    resumeEditLink: "수정",
    visaTypeLabel: "체류자격",
    visaTypeNote: "※ D-2, D-10 비자 소지자 또는 소지 예정자만 지원 가능",
    visaOptionLabel: {
      "D-2": "D-2 (유학) · 9월 졸업 예정자",
      "D-10": "D-10 (구직)",
      OTHER: "기타"
    },
    visaOtherPlaceholder: "보유 비자 코드 입력",
    healthLabel: "건강상 특이사항 (지병, 알러지, 식습관 등)",
    healthPlaceholder: "예) 갑각류 알러지, 저혈압, 채식 등",
    desiredJobLabel: "희망 직무",
    desiredJobOptionLabel: {
      MARKETING:   "마케팅",
      SALES:       "세일즈",
      TRANSLATION: "통번역",
      DEV:         "개발",
      OTHER:       "기타"
    },
    desiredJobOtherPlaceholder: "희망 직무 입력",
    motivationLabel: "기업 현장 일경험에 왜 신청하셨나요?",
    motivationPlaceholder: "신청 이유를 자세하게 작성해 주세요.",
    motivationHelp: "20자 이상 작성해 주세요.",
    marketingHeading:
      "서울글로벌센터의 외국인 가이드 교육 / 프리랜서 기회 정보를 받아보시겠어요?",
    marketingBody:
      "Seoul Global Center is offering training programs for foreign guides, along with opportunities for work experience and freelance activities.",
    marketingYes: "네, 정보 받기를 원합니다",
    marketingNo: "아니요, 원하지 않습니다",
    privacyHeading: "개인정보 수집 및 이용 동의 (필수)",
    privacyBody:
      "수집 항목: 성명, 전화번호, 국적, 이메일 등 (필수) / 학교·전공 등 (선택)\n" +
      "이용 목적: 프로그램 일정 안내 · 업무 연락 · 향후 사업 안내\n" +
      "보유 기간: 2년\n\n" +
      "동의를 거부할 권리가 있으나, 거부 시 참가가 제한될 수 있습니다.",
    privacyAgree: "위 내용에 동의합니다",
    submit: "지원하기",
    submitting: "전송 중...",
    errRequired: "필수 항목을 모두 입력해 주세요.",
    errRetry: "잠시 후 다시 시도해 주세요.",
    successTitle: "지원이 완료됐어요",
    successBody:
      "운영팀이 이력서와 함께 신청을 검토 후 면접 일정을 개별 안내드릴 예정입니다."
  };
  const en: Copy = {
    ...ko,
    pageHeading: "Apply to the program",
    pageSubheading: "Seoul Global Center × Aply · 6-Week Korea Work Experience",
    loginRequiredTitle: "Sign in to apply",
    loginRequiredBody: "Applying requires an Aply account and a resume. Sign in and come back.",
    loginCta: "Sign in / Sign up",
    noResumeTitle: "Create your resume first",
    noResumeBody: "An Aply resume is required to apply. It only takes a minute.",
    noResumeCta: "Create a resume",
    alreadyAppliedTitle: "Application already received",
    alreadyAppliedBody:
      "One application per user. Our team will review it and contact you with the next steps.",
    notStudentTitle: "Student members only",
    notStudentBody:
      "This program is for international students, so applications are accepted only from STUDENT accounts. Please sign in with a student account.",
    closedTitle: "Applications closed",
    closedBody:
      "The application window has closed. We'll announce the next round on Aply's events page.",
    statusLabel: "Status",
    statusValue: {
      SUBMITTED: "Received",
      INTERVIEW: "In interview",
      ACCEPTED: "Accepted",
      REJECTED: "Not selected",
      WITHDRAWN: "Withdrawn"
    },
    backToDetail: "Back to program page",
    resumeSectionLabel: "Resume to submit",
    resumeSelectHint: "Choose which resume our team should review. Tap \"Edit\" next to a resume to touch it up first.",
    resumeEditLink: "Edit",
    visaTypeLabel: "Residency status",
    visaTypeNote: "※ Open to D-2 or D-10 holders (or about to hold one)",
    visaOptionLabel: {
      "D-2": "D-2 (student) · graduating this September",
      "D-10": "D-10 (job-seeking)",
      OTHER: "Other"
    },
    visaOtherPlaceholder: "Enter your visa code",
    healthLabel: "Health notes (conditions, allergies, dietary, etc.)",
    healthPlaceholder: "e.g. shellfish allergy, vegetarian diet",
    desiredJobLabel: "Desired role",
    desiredJobOptionLabel: {
      MARKETING:   "Marketing",
      SALES:       "Sales",
      TRANSLATION: "Translation / Interpretation",
      DEV:         "Engineering / Dev",
      OTHER:       "Other"
    },
    desiredJobOtherPlaceholder: "Enter your desired role",
    motivationLabel: "Why are you applying to this work-experience program?",
    motivationPlaceholder: "Tell us in detail why you're applying.",
    motivationHelp: "Please write at least 20 characters.",
    marketingHeading:
      "Seoul Global Center is offering training programs for foreign guides + freelance opportunities. Want updates?",
    marketingBody: "",
    marketingYes: "Yes, send me information",
    marketingNo: "No, thanks",
    privacyHeading: "Consent to use of personal information (required)",
    privacyBody:
      "Required items: name, phone, nationality, email, etc.\n" +
      "Optional: school / department / company name.\n" +
      "Purpose: program scheduling, follow-up, future program info.\n" +
      "Storage period: 2 years.\n\n" +
      "You may refuse; refusal may limit participation.",
    privacyAgree: "I agree to the terms above",
    submit: "Submit application",
    submitting: "Sending...",
    errRequired: "Please complete the required fields.",
    errRetry: "Something went wrong — please try again.",
    successTitle: "Application received",
    successBody: "Our team will review your resume + answers and contact you with interview details."
  };
  // 나머지 4개 로케일은 한국어 fallback (운영팀이 추후 다듬을 수 있게 자리만
  // 마련. 다른 event-page 와 달리 SGC 는 한국 정부 기관 협력 폼이라 KR/EN 가
  // 1차 언어).
  return { ko, en, "zh-CN": ko, vi: ko, ja: ko, id: ko };
})();

type FormState =
  | "loading"
  | "unauth"
  | "not-student"
  | "closed"
  | "no-resume"
  | "already-applied"
  | "form"
  | "submitting"
  | "success";

export function SgcApplyPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = COPY[locale] ?? COPY.ko;
  const { isReady, isAuthenticated, user } = useAuthSession();

  const [state, setState] = useState<FormState>("loading");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [application, setApplication] = useState<SgcApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 폼 상태
  const [resumeId, setResumeId] = useState<string>("");
  const [visaType, setVisaType] = useState<SgcVisaType | "">("");
  const [visaOther, setVisaOther] = useState("");
  const [healthNote, setHealthNote] = useState("");
  const [desiredJob, setDesiredJob] = useState<SgcDesiredJob | "">("");
  const [desiredJobOther, setDesiredJobOther] = useState("");
  const [motivation, setMotivation] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState<"" | "yes" | "no">("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // 인증 + 역할 + 모집 마감 + 이력서 + 기존 지원 상태 우선순위 조회.
  // 우선순위:
  //   (1) 모집 마감 → "closed" (가장 단호한 메시지, 모든 분기보다 위)
  //   (2) 비로그인 → "unauth"
  //   (3) STUDENT 아님 → "not-student"
  //   (4) 이미 지원 → "already-applied"
  //   (5) 이력서 없음 → "no-resume"
  //   (6) 그 외 → "form"
  useEffect(() => {
    if (!isReady) return;
    // (1) 마감 — 인증 여부와 무관하게 가장 먼저 차단.
    if (isSgcRecruitClosed()) {
      setState("closed");
      return;
    }
    // (2) 비로그인.
    if (!isAuthenticated) {
      setState("unauth");
      return;
    }
    // (3) 학생이 아닌 역할(파트너/운영자).
    if (user && user.role !== "STUDENT") {
      setState("not-student");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [resumeList, existing] = await Promise.all([
          getMyResumes().catch(() => []),
          getMySgcApplication().catch(() => null)
        ]);
        if (cancelled) return;
        if (existing) {
          setApplication(existing);
          setState("already-applied");
          return;
        }
        if (!resumeList || resumeList.length === 0) {
          setState("no-resume");
          return;
        }
        setResumes(resumeList);
        // 기본값: 대표 이력서 우선, 없으면 첫 번째.
        const primary = resumeList.find((r) => r.isPrimary) ?? resumeList[0];
        setResumeId(primary.id);
        setState("form");
      } catch {
        if (!cancelled) {
          setError(t.errRetry);
          setState("form");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, user, t.errRetry]);

  // 폼 검증 — 필수 항목 모두 채워졌고 동의가 잡혔는지.
  const canSubmit = useMemo(() => {
    if (state !== "form" && state !== "submitting") return false;
    if (!resumeId) return false;
    if (!visaType) return false;
    if (visaType === "OTHER" && !visaOther.trim()) return false;
    if (!healthNote.trim()) return false;
    if (!desiredJob) return false;
    if (desiredJob === "OTHER" && !desiredJobOther.trim()) return false;
    if (motivation.trim().length < 20) return false;
    if (!marketingOptIn) return false;
    if (!privacyAgreed) return false;
    return true;
  }, [
    state,
    resumeId,
    visaType,
    visaOther,
    healthNote,
    desiredJob,
    desiredJobOther,
    motivation,
    marketingOptIn,
    privacyAgreed
  ]);

  async function submit() {
    if (!canSubmit) {
      setError(t.errRequired);
      return;
    }
    setState("submitting");
    setError(null);
    try {
      const result = await submitSgcApplication({
        resumeId,
        visaType: visaType as SgcVisaType,
        visaOther: visaType === "OTHER" ? visaOther.trim() : undefined,
        healthNote: healthNote.trim(),
        desiredJob: desiredJob as SgcDesiredJob,
        desiredJobOther: desiredJob === "OTHER" ? desiredJobOther.trim() : undefined,
        motivation: motivation.trim(),
        marketingOptIn: marketingOptIn === "yes",
        privacyConsent: true,
        locale
      });
      setApplication(result.application);
      // 서버가 unique([userId]) 충돌을 P2002 로 받아 alreadyApplied=true 로
      // 돌려주면, "이미 접수됐어요" 화면으로 안내. 사용자가 두 탭을 열어 두
      // 번 submit 한 경우 등에 자연스럽게 작동.
      setState(result.alreadyApplied ? "already-applied" : "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errRetry);
      setState("form");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="flex-1">
        <section className="container py-10 md:py-14">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8 md:mb-10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Seoul Global Center × Aply
              </p>
              <h1 className={`${paperlogy.className} mt-2 text-3xl font-black tracking-[-0.03em] text-black md:text-4xl`}>
                {t.pageHeading}
              </h1>
              <p className="mt-2 text-sm text-slate-600 md:text-base">{t.pageSubheading}</p>
            </header>

            {state === "loading" ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : null}

            {state === "closed" ? (
              <GateCard
                icon={<Warning className="h-6 w-6" weight="bold" />}
                title={t.closedTitle}
                body={t.closedBody}
                cta={
                  <Link
                    href="/events/seoul-global-center"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground"
                  >
                    {t.backToDetail}
                  </Link>
                }
              />
            ) : null}

            {state === "unauth" ? (
              <GateCard
                icon={<Warning className="h-6 w-6" weight="bold" />}
                title={t.loginRequiredTitle}
                body={t.loginRequiredBody}
                cta={
                  <Link
                    href={`/login?next=${encodeURIComponent("/events/seoul-global-center/apply")}`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
                  >
                    {t.loginCta}
                    <ArrowRight className="h-4 w-4" weight="bold" />
                  </Link>
                }
              />
            ) : null}

            {state === "not-student" ? (
              <GateCard
                icon={<Warning className="h-6 w-6" weight="bold" />}
                title={t.notStudentTitle}
                body={t.notStudentBody}
                cta={
                  <Link
                    href="/events/seoul-global-center"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground"
                  >
                    {t.backToDetail}
                  </Link>
                }
              />
            ) : null}

            {state === "no-resume" ? (
              <GateCard
                icon={<FileText className="h-6 w-6" weight="bold" />}
                title={t.noResumeTitle}
                body={t.noResumeBody}
                cta={
                  <Link
                    href={`/resume/new/edit?next=${encodeURIComponent("/events/seoul-global-center/apply")}`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
                  >
                    {t.noResumeCta}
                    <ArrowRight className="h-4 w-4" weight="bold" />
                  </Link>
                }
              />
            ) : null}

            {state === "already-applied" && application ? (
              <GateCard
                icon={<CheckCircle className="h-6 w-6" weight="bold" />}
                title={t.alreadyAppliedTitle}
                body={t.alreadyAppliedBody}
                extra={
                  <div className="mt-4 rounded-xl bg-muted/40 px-4 py-3 text-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.statusLabel}
                    </p>
                    <p className="mt-1 font-display text-base font-bold">
                      {t.statusValue[application.status] ?? application.status}
                    </p>
                  </div>
                }
                cta={
                  <Link
                    href="/events/seoul-global-center"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground"
                  >
                    {t.backToDetail}
                  </Link>
                }
              />
            ) : null}

            {state === "success" ? (
              <GateCard
                icon={<CheckCircle className="h-6 w-6" weight="bold" />}
                title={t.successTitle}
                body={t.successBody}
                cta={
                  <button
                    type="button"
                    onClick={() => router.push("/events/seoul-global-center")}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
                  >
                    {t.backToDetail}
                  </button>
                }
              />
            ) : null}

            {state === "form" || state === "submitting" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                className="space-y-6"
              >
                {/* 이력서 선택 */}
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <label className="block text-sm font-bold text-foreground">
                    {t.resumeSectionLabel}
                    <span className="ml-0.5 text-rose-500" aria-hidden>*</span>
                  </label>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{t.resumeSelectHint}</p>
                  <div className="mt-3 space-y-2">
                    {resumes.map((r) => {
                      const checked = resumeId === r.id;
                      // 카드 전체는 div — 라디오 선택은 좌측 label 영역에만,
                      // 우측 "수정" 링크는 별도 Link 로 클릭 충돌 없이 분리.
                      // 편집 후 돌아오기 위해 ?next= 동봉.
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-border/60 bg-white hover:border-primary/40"
                          }`}
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                            <input
                              type="radio"
                              name="sgc-resume"
                              value={r.id}
                              checked={checked}
                              onChange={() => setResumeId(r.id)}
                              className="h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{r.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {r.isPrimary ? "★ " : ""}
                                {new Date(r.updatedAt).toLocaleDateString("ko-KR")}
                              </p>
                            </div>
                          </label>
                          <Link
                            href={`/resume/${r.id}/edit?next=${encodeURIComponent(
                              "/events/seoul-global-center/apply"
                            )}`}
                            className="shrink-0 rounded-lg border border-border/60 bg-white px-3 py-1.5 text-[12px] font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
                          >
                            {t.resumeEditLink}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 체류자격 */}
                <FormSection title={t.visaTypeLabel} note={t.visaTypeNote} required>
                  <div className="space-y-2">
                    {VISA_OPTIONS.map((opt) => (
                      <RadioRow
                        key={opt}
                        name="sgc-visa"
                        value={opt}
                        checked={visaType === opt}
                        label={t.visaOptionLabel[opt]}
                        onChange={() => setVisaType(opt)}
                      />
                    ))}
                  </div>
                  {visaType === "OTHER" ? (
                    <input
                      className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={visaOther}
                      onChange={(e) => setVisaOther(e.target.value)}
                      placeholder={t.visaOtherPlaceholder}
                      maxLength={80}
                    />
                  ) : null}
                </FormSection>

                {/* 건강상 특이사항 */}
                <FormSection title={t.healthLabel} required>
                  <textarea
                    className="h-24 w-full rounded-xl border border-border bg-white p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={healthNote}
                    onChange={(e) => setHealthNote(e.target.value)}
                    placeholder={t.healthPlaceholder}
                    maxLength={2000}
                  />
                </FormSection>

                {/* 희망 직무 */}
                <FormSection title={t.desiredJobLabel} required>
                  <div className="space-y-2">
                    {DESIRED_JOB_OPTIONS.map((opt) => (
                      <RadioRow
                        key={opt}
                        name="sgc-desired"
                        value={opt}
                        checked={desiredJob === opt}
                        label={t.desiredJobOptionLabel[opt]}
                        onChange={() => setDesiredJob(opt)}
                      />
                    ))}
                  </div>
                  {desiredJob === "OTHER" ? (
                    <input
                      className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={desiredJobOther}
                      onChange={(e) => setDesiredJobOther(e.target.value)}
                      placeholder={t.desiredJobOtherPlaceholder}
                      maxLength={80}
                    />
                  ) : null}
                </FormSection>

                {/* 신청 동기 */}
                <FormSection title={t.motivationLabel} note={t.motivationHelp} required>
                  <textarea
                    className="h-40 w-full rounded-xl border border-border bg-white p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder={t.motivationPlaceholder}
                    maxLength={4000}
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    {motivation.length} / 4000
                  </p>
                </FormSection>

                {/* SGC 마케팅 동의 */}
                <FormSection title={t.marketingHeading} note={t.marketingBody} required>
                  <div className="space-y-2">
                    <RadioRow
                      name="sgc-marketing"
                      value="yes"
                      checked={marketingOptIn === "yes"}
                      label={t.marketingYes}
                      onChange={() => setMarketingOptIn("yes")}
                    />
                    <RadioRow
                      name="sgc-marketing"
                      value="no"
                      checked={marketingOptIn === "no"}
                      label={t.marketingNo}
                      onChange={() => setMarketingOptIn("no")}
                    />
                  </div>
                </FormSection>

                {/* 개인정보 동의 */}
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <p className="text-sm font-bold">
                    {t.privacyHeading}
                    <span className="ml-0.5 text-rose-500" aria-hidden>*</span>
                  </p>
                  <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-3 font-sans text-[12.5px] leading-relaxed text-foreground/85">
                    {t.privacyBody}
                  </pre>
                  <label className="mt-3 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold">{t.privacyAgree}</span>
                  </label>
                </section>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <button
                  type="submit"
                  disabled={!canSubmit || state === "submitting"}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                >
                  {state === "submitting" ? t.submitting : t.submit}
                  {state === "submitting" ? null : <ArrowRight className="h-4 w-4" weight="bold" />}
                </button>
              </form>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// ---- Helpers ---------------------------------------------------------------

function GateCard({
  icon,
  title,
  body,
  extra,
  cta
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  extra?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-border/40 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {extra}
      {cta ? <div className="mt-6">{cta}</div> : null}
    </article>
  );
}

function FormSection({
  title,
  note,
  required,
  children
}: {
  title: string;
  note?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-bold text-foreground">
        {title}
        {required ? <span className="ml-0.5 text-rose-500" aria-hidden>*</span> : null}
      </p>
      {note ? <p className="mt-1 text-[12.5px] text-muted-foreground">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function RadioRow({
  name,
  value,
  checked,
  label,
  onChange
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
        checked ? "border-primary bg-primary/5" : "border-border/60 bg-white hover:border-primary/40"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4" />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}
