"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, ImageSquare, X } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { PartnerAdminTwoColumn } from "../partner/PartnerAdminTwoColumn";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  createMyPartnerPosition,
  getMyPartnerPositionById,
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete,
  updateMyPartnerPosition
} from "../../lib/member-profile-client";

type PartnerPositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
type EmploymentType = "FULL_TIME" | "INTERN" | "PART_TIME" | "UNPAID_INTERN";
type EmploymentClassification =
  | "UNPAID_INTERN_EXPERIENCE"
  | "UNPAID_INTERN_CONVERSION"
  | "PAID_INTERN_EXPERIENCE"
  | "PAID_INTERN_CONVERSION"
  | "PART_TIME"
  | "FULL_TIME";

const VISA_OPTIONS = ["D-2", "D-4", "D-10", "E-7", "F-2", "F-4", "F-5", "F-6", "H-1"] as const;
const NO_VISA_OPTION = "NO_VISA_REQUIRED";

function workTypeDisplayTitle(workType: "On-site" | "Hybrid" | "Remote", t: (ko: string, en: string) => string) {
  if (workType === "On-site") return t("오피스 출근", "On-site");
  if (workType === "Hybrid") return t("하이브리드", "Hybrid");
  return t("원격", "Remote");
}

function employmentTypeDisplayTitle(employmentType: EmploymentType, t: (ko: string, en: string) => string) {
  if (employmentType === "FULL_TIME") return t("정직원", "Full-time");
  if (employmentType === "PART_TIME") return t("알바", "Part-time");
  if (employmentType === "UNPAID_INTERN") return t("무급 인턴", "Unpaid intern");
  return t("인턴", "Intern");
}

function employmentClassificationDisplayTitle(value: EmploymentClassification, t: (ko: string, en: string) => string) {
  if (value === "UNPAID_INTERN_EXPERIENCE") return t("무급 체험형 인턴", "Unpaid experience intern");
  if (value === "UNPAID_INTERN_CONVERSION") return t("무급 전환형 인턴", "Unpaid conversion intern");
  if (value === "PAID_INTERN_EXPERIENCE") return t("유급 체험형 인턴", "Paid experience intern");
  if (value === "PAID_INTERN_CONVERSION") return t("유급 전환형 인턴", "Paid conversion intern");
  if (value === "PART_TIME") return t("알바", "Part-time");
  return t("정직원", "Full-time");
}

function toEmploymentTypeFromClassification(value: EmploymentClassification): EmploymentType {
  if (value === "FULL_TIME") return "FULL_TIME";
  if (value === "PART_TIME") return "PART_TIME";
  if (value === "UNPAID_INTERN_EXPERIENCE" || value === "UNPAID_INTERN_CONVERSION") return "UNPAID_INTERN";
  return "INTERN";
}

function isUnpaidInternClassification(value: EmploymentClassification) {
  return value === "UNPAID_INTERN_EXPERIENCE" || value === "UNPAID_INTERN_CONVERSION";
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

function RequiredMark() {
  return <span className="ml-1 text-red-500">*</span>;
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
  onEmbeddedClose,
  mode = "create",
  positionId
}: {
  embedded?: boolean;
  onEmbeddedClose?: () => void;
  mode?: "create" | "edit";
  positionId?: string;
} = {}) {
  const isEditMode = mode === "edit";
  const router = useRouter();
  const { locale } = useLanguage();
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [isCheckingOrg, setIsCheckingOrg] = useState(false);
  const [isLoadingPosition, setIsLoadingPosition] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [createBlockedReason, setCreateBlockedReason] = useState<"profile" | "verification" | null>(null);
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<PartnerPositionStatus>("PENDING_REVIEW");
  const [workType, setWorkType] = useState<"On-site" | "Hybrid" | "Remote">("On-site");
  const [employmentClassification, setEmploymentClassification] = useState<EmploymentClassification>("UNPAID_INTERN_EXPERIENCE");
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
  const [hasMentorAndPlan, setHasMentorAndPlan] = useState(false);
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

  useEffect(() => {
    if (mode !== "create") return;
    if (!isReady || !isAuthenticated || !user || user.role !== "PARTNER") return;
    let ignore = false;
    setIsCheckingOrg(true);
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (ignore) return;
        const isProfileComplete = isPartnerOrganizationProfileComplete(org);
        const canPostPositions = Boolean(org?.permissions?.canPostPositions);
        const verificationStatus = org?.verification?.isApproved
          ? t("운영중", "Active")
          : t("검토중 (승인 대기)", "Under review (approval pending)");
        const allowed = isProfileComplete && canPostPositions;
        setCurrentVerificationStatus(verificationStatus);
        setCanCreate(allowed);
        if (allowed) {
          setCreateBlockedReason(null);
        } else if (!isProfileComplete) {
          setCreateBlockedReason("profile");
        } else {
          setCreateBlockedReason("verification");
        }
      } catch (error) {
        if (ignore) return;
        setCanCreate(false);
        setCreateBlockedReason("profile");
        setCurrentVerificationStatus(null);
        setErrorMessage(error instanceof Error ? error.message : t("기업 정보를 불러오지 못했습니다.", "Failed to load company information."));
      } finally {
        if (!ignore) setIsCheckingOrg(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isReady, user, locale, mode]);

  useEffect(() => {
    if (mode !== "edit") return;
    if (!positionId) return;
    if (!isReady || !isAuthenticated || !user || user.role !== "PARTNER") return;
    let ignore = false;
    setIsLoadingPosition(true);
    void (async () => {
      try {
        const item = await getMyPartnerPositionById(positionId);
        if (ignore) return;
        setTitle(item.title ?? "");
        setStatus((item.status as PartnerPositionStatus) ?? "PENDING_REVIEW");
        setWorkType(item.workType === "Hybrid" || item.workType === "Remote" ? item.workType : "On-site");
        setEmploymentClassification(
          (item.employmentClassification as EmploymentClassification | null | undefined)
          ?? (item.employmentType === "FULL_TIME"
            ? "FULL_TIME"
            : item.employmentType === "PART_TIME"
              ? "PART_TIME"
              : item.employmentType === "UNPAID_INTERN"
                ? "UNPAID_INTERN_EXPERIENCE"
                : "PAID_INTERN_EXPERIENCE")
        );
        setThumbnailImages(item.thumbnailImages ?? []);
        setEligibleVisas(item.eligibleVisas ?? []);
        setPreferredJobRole(item.preferredJobRole ?? "");
        setHiringCount(item.hiringCount ? String(item.hiringCount) : "");
        setWorkLocation(item.workLocation ?? "");
        setStartDate(item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : "");
        setHiringProcess(item.hiringProcess ?? "");
        setCommunicationLanguages((item.communicationLanguages ?? []).join("\n"));
        setPreferredNationalities((item.preferredNationalities ?? []).join("\n"));
        setMainResponsibilities(item.mainResponsibilities ?? "");
        setRequiredQualifications(item.requiredQualifications ?? "");
        setPreferredQualifications(item.preferredQualifications ?? "");
        setAdditionalNotes(item.additionalNotes ?? "");
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : t("포지션 정보를 불러오지 못했습니다.", "Failed to load position information."));
        }
      } finally {
        if (!ignore) setIsLoadingPosition(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [mode, positionId, isReady, isAuthenticated, user, locale]);

  function validateCurrentStep() {
    if (!title.trim()) {
      setErrorMessage(t("포지션 제목을 입력해주세요.", "Please enter a position title."));
      return false;
    }
    if (!preferredJobRole.trim()) {
      setErrorMessage(t("모집 분야를 입력해주세요.", "Please enter the role/category."));
      return false;
    }
    if (!mainResponsibilities.trim()) {
      setErrorMessage(t("주요 활동/업무를 입력해주세요.", "Please enter main responsibilities."));
      return false;
    }
    if (hiringCount.trim()) {
      const parsedHiringCount = Number(hiringCount);
      if (!Number.isFinite(parsedHiringCount)) {
        setErrorMessage(t("모집 인원 형식을 확인해주세요.", "Please check hiring count format."));
        return false;
      }
    }
    if (isUnpaidInternClassification(employmentClassification)) {
      const ok = isEducationalPurpose && notReplacingWorker && hasMentorAndPlan && visaNoticeConfirmed;
      if (!ok) {
        setErrorMessage(t("체크리스트를 모두 확인해주세요.", "Please complete all compliance checks."));
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;

    const parsedHiringCount = hiringCount.trim() ? Number(hiringCount) : undefined;
    const employmentType = toEmploymentTypeFromClassification(employmentClassification);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        title: title.trim(),
        workType,
        employmentType,
        employmentClassification,
        thumbnailImages,
        eligibleVisas: eligibleVisas.includes(NO_VISA_OPTION) ? [] : eligibleVisas,
        preferredJobRole: preferredJobRole.trim() || undefined,
        hiringCount: parsedHiringCount && parsedHiringCount >= 1 ? parsedHiringCount : undefined,
        workLocation: workLocation.trim() || undefined,
        startDate: toIsoDateStart(startDate),
        hiringProcess: hiringProcess.trim() || undefined,
        communicationLanguages: toLines(communicationLanguages),
        preferredNationalities: toLines(preferredNationalities),
        mainResponsibilities: mainResponsibilities.trim() || undefined,
        requiredQualifications: requiredQualifications.trim() || undefined,
        preferredQualifications: preferredQualifications.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined
      };
      if (mode === "edit" && positionId) {
        await updateMyPartnerPosition(positionId, payload);
        if (embedded) {
          onEmbeddedClose?.();
        } else {
          window.alert(t("수정사항이 저장되었고 어드민 관리자 승인 요청이 접수되었습니다.", "Changes were saved and sent for ops admin approval."));
          router.push("/profile");
        }
      } else {
        const created = await createMyPartnerPosition(payload);
        if (embedded) {
          onEmbeddedClose?.();
        } else {
          window.alert(t("포지션이 등록되었고 어드민 관리자 승인 요청이 접수되었습니다.", "Position was created and sent for ops admin approval."));
          router.push(`/positions/${encodeURIComponent(created.id)}`);
        }
      }
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : mode === "edit"
            ? t("포지션 수정에 실패했습니다.", "Failed to update position.")
            : t("포지션 생성에 실패했습니다.", "Failed to create position.")
      );
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
      <h1 className={embedded ? "shrink-0 pb-2 font-display text-3xl font-bold tracking-tight" : "mb-6 font-display text-3xl font-bold tracking-tight"}>
        {mode === "edit" ? t("포지션 수정", "Edit position") : t("포지션 등록", "Create position")}
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
          ) : mode === "edit" && isLoadingPosition ? (
            <p className="text-sm text-muted-foreground">{t("포지션 정보를 불러오는 중...", "Loading position information...")}</p>
          ) : isCheckingOrg ? (
            <p className="text-sm text-muted-foreground">{t("기업 정보 상태를 확인하는 중...", "Checking company profile status...")}</p>
          ) : mode === "create" && !canCreate ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {createBlockedReason === "verification"
                  ? t("파트너 운영중이 승인되지 않으면 포지션을 등록할 수 없습니다", "Positions cannot be created until partner operation is approved.")
                  : t("포지션 생성 전 기업 기본 정보 입력이 필요합니다.", "Basic company information is required before creating positions.")}
              </p>
              {createBlockedReason === "verification" && currentVerificationStatus ? (
                <p className="text-sm text-muted-foreground">
                  {t("현재 인증상태", "Current verification status")}: {currentVerificationStatus}
                </p>
              ) : null}
              <Button variant="dark" asChild>
                <Link href={createBlockedReason === "verification" ? "/partner-profile/verification/edit" : "/partner-profile/edit?required=1"}>
                  {createBlockedReason === "verification"
                    ? t("인증 정보 확인하러 가기", "Go to verification")
                    : t("기업 정보 입력하러 가기", "Go to company profile")}
                </Link>
              </Button>
            </div>
          ) : (
            <section className={embedded ? "flex min-h-0 flex-1 flex-col space-y-4 p-1 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-inset [&_input]:focus-visible:ring-[#0B1227]/20 [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-inset [&_select]:focus-visible:ring-[#0B1227]/20 [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-inset [&_textarea]:focus-visible:ring-[#0B1227]/20" : "space-y-6 rounded-2xl border border-border/70 bg-card p-5 md:p-6 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-inset [&_input]:focus-visible:ring-[#0B1227]/20 [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-inset [&_select]:focus-visible:ring-[#0B1227]/20 [&_textarea]:focus-visible:outline-none [&_textarea]:focus-visible:ring-2 [&_textarea]:focus-visible:ring-inset [&_textarea]:focus-visible:ring-[#0B1227]/20"}>
              <div className={embedded ? "min-h-0 flex-1 overflow-y-auto px-1" : ""}>
              <div className="space-y-6">
                <div className="space-y-4">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("포지션명", "Position title")}<RequiredMark /></label>
                    <input
                      className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                      placeholder={t("예) 프론트엔드 개발 인턴", "e.g. Frontend Developer Intern")}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("모집 분야", "Category/Role")}<RequiredMark /></label>
                      <input
                        className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                        placeholder={t("예) 프론트개발자, 디자이너", "e.g. Frontend Developer, Designer")}
                        value={preferredJobRole}
                        onChange={(e) => setPreferredJobRole(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("모집 인원", "Hiring count")}</label>
                      <input
                        type="number"
                        className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                        placeholder={t("예) 3", "e.g. 3")}
                        value={hiringCount}
                        onChange={(e) => setHiringCount(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">{t("0 또는 비워두면 종료까지로 처리됩니다.", "If 0 or empty, it is treated as until closed.")}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("근무 방식", "Work type")}</label>
                      <div className="relative">
                        <select
                          className="h-10 w-full appearance-none rounded-md border-0 bg-muted/50 px-3 pr-10 text-sm"
                          value={workType}
                          onChange={(e) => setWorkType(e.target.value as "On-site" | "Hybrid" | "Remote")}
                        >
                          <option value="On-site">{t("오피스 출근", "On-site")}</option>
                          <option value="Hybrid">{t("하이브리드", "Hybrid")}</option>
                          <option value="Remote">{t("원격", "Remote")}</option>
                        </select>
                        <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("고용 형태", "Employment type")}<RequiredMark /></label>
                      <div className="relative">
                        <select
                          className="h-10 w-full appearance-none rounded-md border-0 bg-muted/50 px-3 pr-10 text-sm"
                          value={employmentClassification}
                          onChange={(e) => setEmploymentClassification(e.target.value as EmploymentClassification)}
                        >
                          <option value="UNPAID_INTERN_EXPERIENCE">{t("무급 체험형 인턴", "Unpaid experience intern")}</option>
                          <option value="UNPAID_INTERN_CONVERSION">{t("무급 전환형 인턴", "Unpaid conversion intern")}</option>
                          <option value="PAID_INTERN_EXPERIENCE">{t("유급 체험형 인턴", "Paid experience intern")}</option>
                          <option value="PAID_INTERN_CONVERSION">{t("유급 전환형 인턴", "Paid conversion intern")}</option>
                          <option value="PART_TIME">{t("알바", "Part-time")}</option>
                          <option value="FULL_TIME">{t("정직원", "Full-time")}</option>
                        </select>
                        <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("근무 지역", "Location")}</label>
                      <input
                        className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm"
                        placeholder={t("예) 서울 강남구", "e.g. Gangnam-gu, Seoul")}
                        value={workLocation}
                        onChange={(e) => setWorkLocation(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("시작 예정일", "Start date")}</label>
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                  </div>
                </div>

              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("프로그램 목적", "Program goal")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("인턴십 목적과 기대 효과를 간단히 작성해주세요.", "Briefly describe the internship goal and expected outcomes.")}
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("주요 업무", "Main responsibilities")}<RequiredMark /></label>
                    <textarea
                      className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("담당 업무를 항목별로 작성해주세요.", "List key responsibilities by bullet points.")}
                      value={mainResponsibilities}
                      onChange={(e) => setMainResponsibilities(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("채용/진행 프로세스", "Hiring process")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("예) 서류 검토 → 1차 인터뷰 → 최종 합격", "e.g. Resume review -> Interview -> Final decision")}
                      value={hiringProcess}
                      onChange={(e) => setHiringProcess(e.target.value)}
                    />
                  </div>
                </div>

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
                      <textarea
                        className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                        placeholder={t("예) 한국어\n영어", "e.g. Korean\nEnglish")}
                        value={communicationLanguages}
                        onChange={(e) => setCommunicationLanguages(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("선호 국적(줄바꿈)", "Preferred nationalities (one per line)")}</label>
                      <textarea
                        className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                        placeholder={t("예) 무관 또는 선호 국적 기재", "e.g. Any nationality or list preferred ones")}
                        value={preferredNationalities}
                        onChange={(e) => setPreferredNationalities(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("필수 역량/조건", "Required qualifications")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("필수 기술/경험/자격 요건을 작성해주세요.", "Describe required skills, experience, and qualifications.")}
                      value={requiredQualifications}
                      onChange={(e) => setRequiredQualifications(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("우대 사항", "Preferred qualifications")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm"
                      placeholder={t("우대 기술/경험/포트폴리오 조건을 작성해주세요.", "Describe preferred skills, experiences, or portfolio criteria.")}
                      value={preferredQualifications}
                      onChange={(e) => setPreferredQualifications(e.target.value)}
                    />
                  </div>
                </div>

              <div className="space-y-4">
                  {isUnpaidInternClassification(employmentClassification) ? (
                    <>
                      <p className="text-sm text-muted-foreground">{t("무급 인턴 운영 체크리스트를 모두 확인해야 제출할 수 있습니다.", "Please complete all compliance checks before submission.")}</p>
                      <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={isEducationalPurpose && notReplacingWorker && hasMentorAndPlan && visaNoticeConfirmed}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsEducationalPurpose(checked);
                            setNotReplacingWorker(checked);
                            setHasMentorAndPlan(checked);
                            setVisaNoticeConfirmed(checked);
                          }}
                        />
                        {t("전체 선택", "Select all")}
                      </label>
                      {[
                        [isEducationalPurpose, setIsEducationalPurpose, t("교육/경험 제공 목적입니다.", "This is for educational/experience purpose.")],
                        [notReplacingWorker, setNotReplacingWorker, t("정규 인력을 대체하지 않습니다.", "It does not replace regular workforce.")],
                        [hasMentorAndPlan, setHasMentorAndPlan, t("담당 멘토와 학습/온보딩 계획이 있습니다.", "A mentor and onboarding plan are prepared.")],
                        [visaNoticeConfirmed, setVisaNoticeConfirmed, t("비자/체류자격 안내를 확인했습니다.", "Visa/residency notice is acknowledged.")]
                      ].map(([checked, setter, label]) => (
                        <label key={String(label)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                          <input type="checkbox" checked={Boolean(checked)} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} />
                          {String(label)}
                        </label>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("유급/정직원/알바 포지션은 체크리스트 없이 다음 단계로 진행됩니다.", "For paid/full-time/part-time positions, you can proceed without this checklist.")}</p>
                  )}
                </div>
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              </div>

              <div className={embedded ? "sticky bottom-0 z-10 flex items-center justify-between gap-2 bg-card pt-3" : "flex items-center justify-between gap-2 pt-2"}>
                <Button
                  variant="outline"
                  onClick={() => (embedded ? (onEmbeddedClose ? onEmbeddedClose() : router.back()) : router.push("/profile"))}
                  disabled={isSubmitting}
                >
                  {t("취소", "Cancel")}
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="dark" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                    {isSubmitting
                      ? isEditMode
                        ? t("저장 중...", "Saving...")
                        : t("생성 중...", "Creating...")
                      : isEditMode
                        ? t("수정사항 저장", "Save changes")
                        : t("승인 요청 제출", "Submit for review")}
                  </Button>
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
