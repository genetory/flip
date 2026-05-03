"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageSquare, X } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { PartnerAdminTwoColumn } from "../partner/PartnerAdminTwoColumn";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  createMyPartnerPosition,
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete
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

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("썸네일 파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

function createObjectUrl(file: File) {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return null;
  return URL.createObjectURL(file);
}

async function convertImageFileToWebpDataUrl(
  file: File,
  readFailed: string
) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(readFailed));
    img.src = originalDataUrl;
  });

  let width = image.width;
  let height = image.height;
  let quality = 0.9;
  let output = originalDataUrl;

  for (let i = 0; i < 6; i += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(readFailed);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    output = canvas.toDataURL("image/webp", quality);
    if (estimateDataUrlBytes(output) <= 5 * 1024 * 1024) return output;
    quality = Math.max(0.5, quality - 0.1);
    width *= 0.9;
    height *= 0.9;
  }

  return output;
}

export function PartnerPositionCreatePage({
  embedded = false,
  onEmbeddedClose
}: {
  embedded?: boolean;
  onEmbeddedClose?: () => void;
} = {}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [isCheckingOrg, setIsCheckingOrg] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
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

  const [isEducationalPurpose, setIsEducationalPurpose] = useState(false);
  const [notReplacingWorker, setNotReplacingWorker] = useState(false);
  const [hasMentor, setHasMentor] = useState(false);
  const [hasLearningPlan, setHasLearningPlan] = useState(false);
  const [notSimpleRepetitive, setNotSimpleRepetitive] = useState(false);
  const [reasonableHours, setReasonableHours] = useState(false);
  const [hasFeedbackPlan, setHasFeedbackPlan] = useState(false);
  const [visaNoticeConfirmed, setVisaNoticeConfirmed] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingThumbnails, setIsUploadingThumbnails] = useState(false);
  const [thumbnailPreviewUrls, setThumbnailPreviewUrls] = useState<string[]>([]);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!embedded) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [embedded]);

  const stepTitles = useMemo(
    () => [
      t("1. 기본 정보", "1. Basics"),
      t("2. 인턴십 내용", "2. Program"),
      t("3. 지원 조건", "3. Eligibility"),
      t("4. 무급 인턴 체크", "4. Compliance"),
      t("5. 미리보기/제출", "5. Review")
    ],
    [locale]
  );

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user || user.role !== "PARTNER") return;
    let ignore = false;
    setIsCheckingOrg(true);
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (ignore) return;
        setCanCreate(isPartnerOrganizationProfileComplete(org));
      } catch (error) {
        if (ignore) return;
        setCanCreate(false);
        setErrorMessage(error instanceof Error ? error.message : t("기업 정보를 불러오지 못했습니다.", "Failed to load company information."));
      } finally {
        if (!ignore) setIsCheckingOrg(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isReady, user, locale]);

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
    if (step === 2) {
      if (!mainResponsibilities.trim()) {
        setErrorMessage(t("주요 활동/업무를 입력해주세요.", "Please enter main responsibilities."));
        return false;
      }
    }
    if (step === 4) {
      const ok =
        isEducationalPurpose &&
        notReplacingWorker &&
        hasMentor &&
        hasLearningPlan &&
        notSimpleRepetitive &&
        reasonableHours &&
        hasFeedbackPlan &&
        visaNoticeConfirmed;
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
      await createMyPartnerPosition({
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
      setErrorMessage(error instanceof Error ? error.message : t("포지션 생성에 실패했습니다.", "Failed to create position."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleThumbnailUpload(selected: File[]) {
    if (!selected || selected.length === 0) return;
    const maxRawFileSize = 20 * 1024 * 1024;
    if (selected.some((file) => file.size > maxRawFileSize)) {
      setErrorMessage(t("원본 파일은 20MB 이하만 선택할 수 있습니다.", "Original files up to 20MB are allowed."));
      return;
    }

    setIsUploadingThumbnails(true);
    setErrorMessage(null);
    const previews = selected
      .map((file) => createObjectUrl(file))
      .filter((item): item is string => Boolean(item));
    try {
      const remain = Math.max(0, 5 - thumbnailImages.length);
      if (remain <= 0) return;
      if (previews.length > 0) {
        setThumbnailPreviewUrls((prev) => [...prev, ...previews].slice(0, 5));
      }
      const converted: string[] = [];
      let failedCount = 0;
      for (const file of selected.slice(0, remain)) {
        try {
          let data = await readFileAsDataUrl(file);
          if (estimateDataUrlBytes(data) > 5 * 1024 * 1024) {
            data = await convertImageFileToWebpDataUrl(
              file,
              t("파일을 읽지 못했습니다.", "Failed to read file.")
            );
            if (estimateDataUrlBytes(data) > 5 * 1024 * 1024) {
              failedCount += 1;
              continue;
            }
          }
          converted.push(data);
        } catch {
          try {
            const fallback = await readFileAsDataUrl(file);
            if (fallback && estimateDataUrlBytes(fallback) <= 5 * 1024 * 1024) {
              converted.push(fallback);
            } else {
              failedCount += 1;
            }
          } catch {
            failedCount += 1;
          }
        }
      }

      if (converted.length > 0) {
        setThumbnailImages((prev) => [...prev, ...converted].slice(0, 5));
      }
      if (failedCount > 0 && converted.length === 0) {
        setErrorMessage(
          t(
            "이미지 변환에 실패했어요. 다른 이미지로 다시 시도해주세요.",
            "Image conversion failed. Please try with a different image."
          )
        );
      } else if (failedCount > 0) {
        setErrorMessage(
          t(
            "일부 이미지는 변환되지 않아 제외되었어요.",
            "Some images could not be converted and were skipped."
          )
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("썸네일 업로드에 실패했습니다.", "Failed to upload thumbnails."));
    } finally {
      previews.forEach((item) => URL.revokeObjectURL(item));
      if (previews.length > 0) {
        setThumbnailPreviewUrls((prev) => prev.filter((item) => !previews.includes(item)));
      }
      setIsUploadingThumbnails(false);
    }
  }

  const content = (
    <div className={embedded ? "mx-auto flex h-full max-w-4xl flex-col" : "mx-auto max-w-4xl"}>
      <h1 className={embedded ? "shrink-0 pb-4 font-display text-3xl font-bold tracking-tight" : "mb-6 font-display text-3xl font-bold tracking-tight"}>
        {t("포지션 등록", "Create position")}
      </h1>

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
              <p className="text-sm text-muted-foreground">{t("파트너회원만 포지션을 생성할 수 있습니다.", "Only partner accounts can create positions.")}</p>
              <Button variant="outline" asChild>
                <Link href="/positions">{t("포지션 목록으로", "Go to positions")}</Link>
              </Button>
            </div>
          ) : isCheckingOrg ? (
            <p className="text-sm text-muted-foreground">{t("기업 정보 상태를 확인하는 중...", "Checking company profile status...")}</p>
          ) : !canCreate ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("포지션 생성 전 기업 기본 정보 입력이 필요합니다.", "Basic company information is required before creating positions.")}</p>
              <Button variant="dark" asChild>
                <Link href="/partner/company-profile?required=1">{t("기업 정보 입력하러 가기", "Go to company profile")}</Link>
              </Button>
            </div>
          ) : (
            <section className={embedded ? "flex min-h-0 flex-1 flex-col space-y-6 p-1 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-inset [&_input]:focus-visible:ring-[#0B1227]/20 [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-inset [&_select]:focus-visible:ring-[#0B1227]/20 [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-inset [&_textarea]:focus-visible:ring-[#0B1227]/20" : "space-y-6 rounded-2xl border border-border/70 bg-card p-5 md:p-6 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-inset [&_input]:focus-visible:ring-[#0B1227]/20 [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-inset [&_select]:focus-visible:ring-[#0B1227]/20 [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-inset [&_textarea]:focus-visible:ring-[#0B1227]/20"}>
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

              <div className={embedded ? "min-h-0 flex-1 overflow-y-auto px-1" : ""}>
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("포지션명", "Position title")}</label>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("모집 분야", "Category/Role")}</label>
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={preferredJobRole} onChange={(e) => setPreferredJobRole(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("모집 인원", "Hiring count")}</label>
                      <input type="number" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={hiringCount} onChange={(e) => setHiringCount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("근무 방식", "Work type")}</label>
                      <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={workType} onChange={(e) => setWorkType(e.target.value as "On-site" | "Hybrid" | "Remote")}>
                        <option value="On-site">{t("오피스 출근", "On-site")}</option>
                        <option value="Hybrid">{t("하이브리드", "Hybrid")}</option>
                        <option value="Remote">{t("원격", "Remote")}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("근무 지역", "Location")}</label>
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("시작 예정일", "Start date")}</label>
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("썸네일 (최대 5장)", "Thumbnails (max 5)")}</label>
                    <input
                      id="position-thumbnail-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      ref={thumbnailInputRef}
                      className="sr-only"
                      onChange={(e) => {
                        const selected = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
                        e.currentTarget.value = "";
                        void handleThumbnailUpload(selected);
                      }}
                      disabled={isUploadingThumbnails || isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">{t("최대 5MB", "Up to 5MB")} · {thumbnailImages.length}/5</p>
                    <div className="overflow-x-auto py-2">
                      <div className="flex w-max gap-3">
                        <div className="h-20 w-20 shrink-0">
                          <label
                            htmlFor="position-thumbnail-upload"
                            className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-muted text-muted-foreground ${isUploadingThumbnails || isSubmitting || thumbnailImages.length >= 5 ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
                            aria-label={t("썸네일 업로드", "Upload thumbnail")}
                            aria-disabled={isUploadingThumbnails || isSubmitting || thumbnailImages.length >= 5}
                          >
                            <ImageSquare size={22} />
                          </label>
                        </div>
                        {(thumbnailImages.length > 0 ? thumbnailImages : thumbnailPreviewUrls).map((image, index) => (
                          <div key={`${index}-${image.slice(0, 24)}`} className="relative h-20 w-20 shrink-0">
                            {thumbnailImages.length > 0 ? (
                              <button
                                type="button"
                                aria-label={t("이미지 삭제", "Remove image")}
                                className="absolute -right-1 -top-1 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.9)] transition hover:bg-black/85"
                                onClick={() => setThumbnailImages((prev) => prev.filter((_, i) => i !== index))}
                                disabled={isUploadingThumbnails || isSubmitting}
                              >
                                <X size={12} weight="bold" />
                              </button>
                            ) : null}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image}
                              alt={t("썸네일 미리보기", "Thumbnail preview")}
                              className="h-20 w-20 rounded-2xl object-cover"
                            />
                            {thumbnailImages.length === 0 ? (
                              <p className="absolute inset-x-0 bottom-1 text-center text-[10px] text-white/90">{t("변환 중...", "Converting...")}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("프로그램 목적", "Program goal")}</label>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("주요 업무", "Main responsibilities")}</label>
                    <textarea className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={mainResponsibilities} onChange={(e) => setMainResponsibilities(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("채용/진행 프로세스", "Hiring process")}</label>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={hiringProcess} onChange={(e) => setHiringProcess(e.target.value)} />
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("지원 가능 비자", "Eligible visas")}</label>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {[NO_VISA_OPTION, ...VISA_OPTIONS].map((visa) => {
                        const checked = eligibleVisas.includes(visa);
                        return (
                          <label key={visa} className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setEligibleVisas((prev) => {
                                  if (visa === NO_VISA_OPTION) {
                                    return e.target.checked ? [NO_VISA_OPTION] : [];
                                  }
                                  const withoutNoVisa = prev.filter((item) => item !== NO_VISA_OPTION);
                                  return e.target.checked
                                    ? [...withoutNoVisa, visa]
                                    : withoutNoVisa.filter((item) => item !== visa);
                                });
                              }}
                            />
                            {visaDisplayTitle(visa, t)}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("소통 언어(줄바꿈)", "Languages (one per line)")}</label>
                      <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={communicationLanguages} onChange={(e) => setCommunicationLanguages(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("선호 국적(줄바꿈)", "Preferred nationalities (one per line)")}</label>
                      <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={preferredNationalities} onChange={(e) => setPreferredNationalities(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("필수 역량/조건", "Required qualifications")}</label>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={requiredQualifications} onChange={(e) => setRequiredQualifications(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("우대 사항", "Preferred qualifications")}</label>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm" value={preferredQualifications} onChange={(e) => setPreferredQualifications(e.target.value)} />
                  </div>
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
                  <p className="text-xs text-muted-foreground">{t("제출 후 운영자 승인 전에는 공개 운영이 제한될 수 있습니다.", "Before admin approval, public operation may be limited.")}</p>
                </div>
              ) : null}

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              </div>

              <div className={embedded ? "sticky bottom-0 z-10 flex items-center justify-between gap-2 border-t border-border/50 bg-card pt-3" : "flex items-center justify-between gap-2 pt-2"}>
                <Button
                  variant="outline"
                  onClick={() => (embedded ? (onEmbeddedClose ? onEmbeddedClose() : router.back()) : router.push("/partner/positions"))}
                  disabled={isSubmitting}
                >
                  {t("취소", "Cancel")}
                </Button>

                <div className="flex items-center gap-2">
                  {step > 1 ? (
                    <Button variant="outline" onClick={goPrev} disabled={isSubmitting}>
                      {t("이전", "Previous")}
                    </Button>
                  ) : null}

                  {step < 5 ? (
                    <Button variant="dark" onClick={goNext} disabled={isSubmitting}>
                      {t("다음", "Next")}
                    </Button>
                  ) : (
                    <Button variant="dark" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                      {isSubmitting ? t("생성 중...", "Creating...") : t("승인 요청 제출", "Submit for review")}
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}
    </div>
  );

  if (embedded) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4">
        <div className="h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-card p-5 md:p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30 font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <PartnerAdminTwoColumn>
          {content}
        </PartnerAdminTwoColumn>
      </main>
      <Footer />
    </div>
  );
}
