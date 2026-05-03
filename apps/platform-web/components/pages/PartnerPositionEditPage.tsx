"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { PartnerAdminTwoColumn } from "../partner/PartnerAdminTwoColumn";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  getMyPartnerPositionById,
  updateMyPartnerPosition
} from "../../lib/member-profile-client";

type WizardStep = 1 | 2 | 3 | 4 | 5;
type PartnerPositionStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "OPEN" | "PAUSED" | "MATCHING" | "CLOSED" | "REJECTED";

const VISA_OPTIONS = ["D-2", "D-4", "D-10", "E-7", "F-2", "F-4", "F-5", "F-6", "H-1"] as const;
const NO_VISA_OPTION = "NO_VISA_REQUIRED";

function workTypeDisplayTitle(workType: "On-site" | "Hybrid" | "Remote", t: (ko: string, en: string) => string) {
  if (workType === "On-site") return t("오피스 출근", "On-site");
  if (workType === "Hybrid") return t("하이브리드", "Hybrid");
  return t("원격", "Remote");
}

function visaDisplayTitle(visa: string, t: (ko: string, en: string) => string) {
  if (visa === NO_VISA_OPTION) return t("비자 무관", "No visa required");
  if (visa === "D-2") return t("D-2 (유학)", "D-2 (Student)");
  if (visa === "D-4") return t("D-4 (일반연수)", "D-4 (General training)");
  if (visa === "D-10") return t("D-10 (구직)", "D-10 (Job seeker)");
  if (visa === "E-7") return t("E-7 (특정활동)", "E-7 (Specific activities)");
  if (visa === "F-2") return t("F-2 (거주)", "F-2 (Resident)");
  if (visa === "F-4") return t("F-4 (재외동포)", "F-4 (Overseas Korean)");
  if (visa === "F-5") return t("F-5 (영주)", "F-5 (Permanent resident)");
  if (visa === "F-6") return t("F-6 (결혼이민)", "F-6 (Marriage migrant)");
  if (visa === "H-1") return t("H-1 (관광취업)", "H-1 (Working holiday)");
  return visa;
}

function toLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toIsoDateStart(value: string) {
  if (!value) return null;
  return `${value}T00:00:00.000Z`;
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("썸네일 파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

async function readFilesAsDataUrls(files: FileList | null) {
  if (!files) return [] as string[];
  const items = Array.from(files);
  return Promise.all(items.map((file) => readFileAsDataUrl(file)));
}

export function PartnerPositionEditPage({ positionId }: { positionId: string }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<PartnerPositionStatus>("OPEN");
  const [workType, setWorkType] = useState<"On-site" | "Hybrid" | "Remote">("On-site");
  const [thumbnailImages, setThumbnailImages] = useState<string[]>([]);
  const [preferredJobRole, setPreferredJobRole] = useState("");
  const [hiringCount, setHiringCount] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [startDate, setStartDate] = useState("");

  const [mainResponsibilities, setMainResponsibilities] = useState("");
  const [hiringProcess, setHiringProcess] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [eligibleVisas, setEligibleVisas] = useState<string[]>([]);
  const [communicationLanguages, setCommunicationLanguages] = useState("");
  const [preferredNationalities, setPreferredNationalities] = useState("");
  const [requiredQualifications, setRequiredQualifications] = useState("");
  const [preferredQualifications, setPreferredQualifications] = useState("");

  const [isEducationalPurpose, setIsEducationalPurpose] = useState(true);
  const [notReplacingWorker, setNotReplacingWorker] = useState(true);
  const [hasMentor, setHasMentor] = useState(true);
  const [hasLearningPlan, setHasLearningPlan] = useState(true);
  const [notSimpleRepetitive, setNotSimpleRepetitive] = useState(true);
  const [reasonableHours, setReasonableHours] = useState(true);
  const [hasFeedbackPlan, setHasFeedbackPlan] = useState(true);
  const [visaNoticeConfirmed, setVisaNoticeConfirmed] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepTitles = useMemo(
    () => [
      t("1. 기본 정보", "1. Basics"),
      t("2. 인턴십 내용", "2. Program"),
      t("3. 지원 조건", "3. Eligibility"),
      t("4. 무급 인턴 체크", "4. Compliance"),
      t("5. 미리보기/저장", "5. Review")
    ],
    [locale]
  );

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user || user.role !== "PARTNER") return;
    let ignore = false;
    setIsLoading(true);
    void (async () => {
      try {
        const item = await getMyPartnerPositionById(positionId);
        if (ignore) return;

        setTitle(item.title ?? "");
        setStatus((item.status as PartnerPositionStatus) ?? "OPEN");
        setWorkType(item.workType === "Hybrid" || item.workType === "Remote" ? item.workType : "On-site");
        setThumbnailImages(item.thumbnailImages ?? []);
        setEligibleVisas(item.eligibleVisas ?? []);
        setPreferredJobRole(item.preferredJobRole ?? "");
        setHiringCount(item.hiringCount ? String(item.hiringCount) : "");
        setWorkLocation(item.workLocation ?? "");
        setStartDate(toDateInputValue(item.startDate));
        setHiringProcess(item.hiringProcess ?? "");
        setCommunicationLanguages((item.communicationLanguages ?? []).join("\n"));
        setPreferredNationalities((item.preferredNationalities ?? []).join("\n"));
        setMainResponsibilities(item.mainResponsibilities ?? "");
        setRequiredQualifications(item.requiredQualifications ?? "");
        setPreferredQualifications(item.preferredQualifications ?? "");
        setAdditionalNotes(item.additionalNotes ?? "");
      } catch (error) {
        if (ignore) return;
        setErrorMessage(error instanceof Error ? error.message : t("포지션 정보를 불러오지 못했습니다.", "Failed to load position information."));
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isReady, positionId, user, locale]);

  function validateCurrentStep() {
    if (step === 1) {
      if (!title.trim()) {
        setErrorMessage(t("포지션 제목을 입력해주세요.", "Please enter a position title."));
        return false;
      }
      if (!preferredJobRole.trim()) {
        setErrorMessage(t("모집 분야를 입력해주세요.", "Please enter the role/category."));
        return false;
      }
    }
    if (step === 2 && !mainResponsibilities.trim()) {
      setErrorMessage(t("주요 활동/업무를 입력해주세요.", "Please enter main responsibilities."));
      return false;
    }
    if (step === 4) {
      const ok =
        isEducationalPurpose && notReplacingWorker && hasMentor && hasLearningPlan && notSimpleRepetitive && reasonableHours && hasFeedbackPlan && visaNoticeConfirmed;
      if (!ok) {
        setErrorMessage(t("체크리스트를 모두 확인해주세요.", "Please complete all compliance checks."));
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setStep((prev) => (prev < 5 ? ((prev + 1) as WizardStep) : prev));
  }

  function goPrev() {
    setErrorMessage(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev));
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateMyPartnerPosition(positionId, {
        title: title.trim(),
        status,
        workType,
        thumbnailImages,
        eligibleVisas: eligibleVisas.includes(NO_VISA_OPTION) ? [] : eligibleVisas,
        preferredJobRole: preferredJobRole.trim() || undefined,
        hiringCount: hiringCount.trim() ? Number(hiringCount) : undefined,
        workLocation: workLocation.trim() || undefined,
        startDate: toIsoDateStart(startDate),
        hiringProcess: hiringProcess.trim() || undefined,
        communicationLanguages: toLines(communicationLanguages),
        preferredNationalities: toLines(preferredNationalities),
        mainResponsibilities: mainResponsibilities.trim() || undefined,
        requiredQualifications: requiredQualifications.trim() || undefined,
        preferredQualifications: preferredQualifications.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined
      });
      router.push("/partner/positions");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("포지션 수정에 실패했습니다.", "Failed to update position."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30 font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <PartnerAdminTwoColumn>
        <div className="mx-auto max-w-4xl">
                    <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{t("포지션 수정", "Edit position")}</h1>

          {!isReady ? (
            <p className="text-sm text-muted-foreground">{t("정보를 불러오는 중...", "Loading information...")}</p>
          ) : !isAuthenticated || !user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("로그인이 필요합니다.", "Sign in is required.")}</p>
              <Button variant="dark" asChild>
                <Link href="/login">{t("로그인하러 가기", "Go to login")}</Link>
              </Button>
            </div>
          ) : user.role !== "PARTNER" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("파트너회원만 포지션을 수정할 수 있습니다.", "Only partner accounts can edit positions.")}</p>
              <Button variant="outline" asChild>
                <Link href="/positions">{t("포지션 목록으로", "Go to positions")}</Link>
              </Button>
            </div>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">{t("포지션 정보를 불러오는 중...", "Loading position information...")}</p>
          ) : (
            <section className="space-y-6 rounded-2xl border border-border/70 bg-card p-5 md:p-6 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-inset [&_input]:focus-visible:ring-[#0B1227]/20 [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-inset [&_select]:focus-visible:ring-[#0B1227]/20 [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-inset [&_textarea]:focus-visible:ring-[#0B1227]/20">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {stepTitles.map((label, index) => {
                  const n = index + 1;
                  const active = step === n;
                  return (
                    <div
                      key={label}
                      className={`inline-flex h-9 w-full items-center justify-center rounded-full border px-2 text-center text-[13px] transition-colors ${
                        active
                          ? "border-foreground bg-foreground font-semibold text-background"
                          : "border-border bg-background font-medium text-muted-foreground"
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-medium">{t("포지션명", "Position title")}</label><input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-sm font-medium">{t("모집 분야", "Category/Role")}</label><input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={preferredJobRole} onChange={(e) => setPreferredJobRole(e.target.value)} /></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-sm font-medium">{t("모집 인원", "Hiring count")}</label><input type="number" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={hiringCount} onChange={(e) => setHiringCount(e.target.value)} /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">{t("근무 방식", "Work type")}</label><select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={workType} onChange={(e) => setWorkType(e.target.value as "On-site" | "Hybrid" | "Remote")}><option value="On-site">{t("오피스 출근", "On-site")}</option><option value="Hybrid">{t("하이브리드", "Hybrid")}</option><option value="Remote">{t("원격", "Remote")}</option></select></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-sm font-medium">{t("근무 지역", "Location")}</label><input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">{t("시작 예정일", "Start date")}</label><input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("썸네일 (최대 5장)", "Thumbnails (max 5)")}</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => { const files=e.currentTarget.files; e.currentTarget.value=""; void (async()=>{const next=await readFilesAsDataUrls(files); setThumbnailImages((prev)=>[...prev,...next].slice(0,5));})(); }} className="block w-full text-sm" />
                    {thumbnailImages.length > 0 ? <p className="text-xs text-muted-foreground">{thumbnailImages.length}/5</p> : null}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-medium">{t("프로그램 목적", "Program goal")}</label><textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">{t("주요 업무", "Main responsibilities")}</label><textarea className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={mainResponsibilities} onChange={(e) => setMainResponsibilities(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">{t("채용/진행 프로세스", "Hiring process")}</label><textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={hiringProcess} onChange={(e) => setHiringProcess(e.target.value)} /></div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-medium">{t("지원 가능 비자", "Eligible visas")}</label><div className="grid grid-cols-3 gap-2 text-sm">{[NO_VISA_OPTION, ...VISA_OPTIONS].map((visa)=>{const checked=eligibleVisas.includes(visa); return <label key={visa} className="inline-flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(e)=>setEligibleVisas((prev)=>{if(visa===NO_VISA_OPTION){return e.target.checked?[NO_VISA_OPTION]:[];} const withoutNoVisa=prev.filter((item)=>item!==NO_VISA_OPTION); return e.target.checked?[...withoutNoVisa,visa]:withoutNoVisa.filter((i)=>i!==visa);})} />{visaDisplayTitle(visa, t)}</label>;})}</div></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><label className="text-sm font-medium">{t("소통 언어(줄바꿈)", "Languages (one per line)")}</label><textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={communicationLanguages} onChange={(e) => setCommunicationLanguages(e.target.value)} /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">{t("선호 국적(줄바꿈)", "Preferred nationalities (one per line)")}</label><textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={preferredNationalities} onChange={(e) => setPreferredNationalities(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><label className="text-sm font-medium">{t("필수 역량/조건", "Required qualifications")}</label><textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={requiredQualifications} onChange={(e) => setRequiredQualifications(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-sm font-medium">{t("우대 사항", "Preferred qualifications")}</label><textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={preferredQualifications} onChange={(e) => setPreferredQualifications(e.target.value)} /></div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t("무급 인턴 운영 체크리스트를 모두 확인해야 제출할 수 있습니다.", "Please complete all compliance checks before submission.")}</p>
                  {[
                    [isEducationalPurpose, setIsEducationalPurpose, t("교육/경험 제공 목적입니다.", "This is for educational/experience purpose.")],
                    [notReplacingWorker, setNotReplacingWorker, t("정규 인력을 대체하지 않습니다.", "It does not replace regular workforce.")],
                    [hasMentor, setHasMentor, t("담당 멘토가 지정되어 있습니다.", "A mentor is assigned.")],
                    [hasLearningPlan, setHasLearningPlan, t("학습/온보딩 계획이 있습니다.", "There is a learning/onboarding plan.")],
                    [notSimpleRepetitive, setNotSimpleRepetitive, t("단순 반복업무 위주가 아닙니다.", "It is not simple repetitive work.")],
                    [reasonableHours, setReasonableHours, t("과도한 활동 시간을 요구하지 않습니다.", "Hours are reasonable.")],
                    [hasFeedbackPlan, setHasFeedbackPlan, t("피드백/수료 기준이 있습니다.", "Feedback/completion criteria exist.")],
                    [visaNoticeConfirmed, setVisaNoticeConfirmed, t("비자/체류자격 안내를 확인했습니다.", "Visa/residency notice is acknowledged.")]
                  ].map(([checked, setter, label]) => (
                    <label key={String(label)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} />
                      {String(label)}
                    </label>
                  ))}
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    <p><span className="text-muted-foreground">{t("포지션", "Position")}:</span> {title || "-"}</p>
                    <p><span className="text-muted-foreground">{t("분야", "Role")}:</span> {preferredJobRole || "-"}</p>
                    <p><span className="text-muted-foreground">{t("근무 방식", "Work type")}:</span> {workTypeDisplayTitle(workType, t)}</p>
                    <p><span className="text-muted-foreground">{t("근무 지역", "Location")}:</span> {workLocation || "-"}</p>
                    <p><span className="text-muted-foreground">{t("지원 비자", "Eligible visas")}:</span> {(eligibleVisas.length > 0 ? eligibleVisas.map((visa) => visaDisplayTitle(visa, t)).join(", ") : t("비자 무관", "No visa required"))}</p>
                    <p><span className="text-muted-foreground">{t("주요 업무", "Main responsibilities")}:</span> {mainResponsibilities || "-"}</p>
                  </div>
                </div>
              ) : null}

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => router.push("/partner/positions")} disabled={isSubmitting}>
                  {t("취소", "Cancel")}
                </Button>

                <div className="flex items-center gap-2">
                  {step > 1 ? <Button variant="outline" onClick={goPrev} disabled={isSubmitting}>{t("이전", "Previous")}</Button> : null}
                  {step < 5 ? (
                    <Button variant="dark" onClick={goNext} disabled={isSubmitting}>{t("다음", "Next")}</Button>
                  ) : (
                    <Button variant="dark" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                      {isSubmitting ? t("저장 중...", "Saving...") : t("수정사항 저장", "Save changes")}
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
    </div>
  );
}
