"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { CheckSquare, Square } from "@phosphor-icons/react/dist/ssr";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  createMyPartnerPosition,
  getMyPartnerOrganization,
  isPartnerOrganizationProfileComplete
} from "../../lib/member-profile-client";

const VISA_OPTIONS = [
  { code: "D-2", ko: "유학", en: "Study" },
  { code: "D-4", ko: "일반연수", en: "General training" },
  { code: "D-10", ko: "구직", en: "Job seeking" },
  { code: "E-7", ko: "특정활동", en: "Special activity" },
  { code: "F-2", ko: "거주", en: "Residence" },
  { code: "F-4", ko: "재외동포", en: "Overseas Korean" },
  { code: "F-5", ko: "영주", en: "Permanent resident" },
  { code: "F-6", ko: "결혼이민", en: "Marriage migrant" },
  { code: "H-1", ko: "워킹홀리데이", en: "Working holiday" }
] as const;

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

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("이미지 데이터를 읽지 못했습니다."));
    reader.readAsDataURL(blob);
  });
}

async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("썸네일 파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

async function convertFileToWebpDataUrl(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 변환 컨텍스트를 생성하지 못했습니다.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const webpBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.9);
    });

    if (!webpBlob) {
      return canvas.toDataURL("image/webp", 0.9);
    }
    return await blobToDataUrl(webpBlob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function readFilesAsDataUrls(files: FileList | File[] | null) {
  if (!files) return [] as string[];
  const items = Array.isArray(files) ? files : Array.from(files);
  return Promise.all(
    items.map(
      async (file) => {
        try {
          return await convertFileToWebpDataUrl(file);
        } catch (error) {
          console.warn("[thumbnail][webp-fallback]", file.name, error);
          return await readFileAsDataUrl(file);
        }
      }
    )
  );
}

function moveImageItem(items: string[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return items;
  next.splice(toIndex, 0, moved);
  return next;
}

export function PartnerPositionCreatePage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const { user, isReady, isAuthenticated } = useAuthSession();
  const [isCheckingOrg, setIsCheckingOrg] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "OPEN">("OPEN");
  const [workType, setWorkType] = useState<"On-site" | "Hybrid" | "Remote">("On-site");
  const [eligibleVisas, setEligibleVisas] = useState<string[]>([]);
  const [thumbnailImages, setThumbnailImages] = useState<string[]>([]);
  const [preferredJobRole, setPreferredJobRole] = useState("");
  const [hiringCount, setHiringCount] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [hiringProcess, setHiringProcess] = useState("");
  const [communicationLanguages, setCommunicationLanguages] = useState("");
  const [preferredNationalities, setPreferredNationalities] = useState("");
  const [mainResponsibilities, setMainResponsibilities] = useState("");
  const [requiredQualifications, setRequiredQualifications] = useState("");
  const [preferredQualifications, setPreferredQualifications] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [wantsPreTraining, setWantsPreTraining] = useState<"unset" | "yes" | "no">("unset");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggingThumbnailIndex, setDraggingThumbnailIndex] = useState<number | null>(null);
  const [dragOverThumbnailIndex, setDragOverThumbnailIndex] = useState<number | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [pendingThumbnailIds, setPendingThumbnailIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const thumbnailCount = thumbnailImages.length + pendingThumbnailIds.length;

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
  }, [isAuthenticated, isReady, user]);

  async function handleSubmit() {
    if (!title.trim()) {
      setErrorMessage(t("포지션 제목을 입력해주세요.", "Please enter a position title."));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createMyPartnerPosition({
        title: title.trim(),
        status,
        workType,
        thumbnailImages,
        eligibleVisas,
        preferredJobRole: preferredJobRole.trim() || undefined,
        hiringCount: hiringCount.trim() ? Number(hiringCount) : undefined,
        workingHours: workingHours.trim() || undefined,
        workLocation: workLocation.trim() || undefined,
        startDate: toIsoDateStart(startDate),
        hiringProcess: hiringProcess.trim() || undefined,
        communicationLanguages: toLines(communicationLanguages),
        preferredNationalities: toLines(preferredNationalities),
        mainResponsibilities: mainResponsibilities.trim() || undefined,
        requiredQualifications: requiredQualifications.trim() || undefined,
        preferredQualifications: preferredQualifications.trim() || undefined,
        dressCode: dressCode.trim() || undefined,
        wantsPreTraining: wantsPreTraining === "unset" ? undefined : wantsPreTraining === "yes",
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

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{t("포지션 생성하기", "Create position")}</h1>

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
                <Link href="/profile/company/edit?required=1">{t("기업 정보 입력하러 가기", "Go to company profile")}</Link>
              </Button>
            </div>
          ) : (
            <section className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="position-title">
                  {t("포지션 제목", "Position title")}
                </label>
                <input
                  id="position-title"
                  className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("예: Global Marketing Manager", "e.g., Global Marketing Manager")}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium" htmlFor="position-thumbnails">
                    {t("포지션 썸네일 (최대 5장)", "Position thumbnails (max 5)")}
                  </label>
                  <p className="text-xs text-muted-foreground">{thumbnailCount}/5</p>
                </div>
                <input
                  id="position-thumbnails"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={thumbnailCount >= 5}
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? []);
                    event.currentTarget.value = "";
                    const remainingSlots = Math.max(0, 5 - (thumbnailImages.length + pendingThumbnailIds.length));
                    const targetFiles = files.slice(0, remainingSlots);
                    if (targetFiles.length === 0) return;
                    const pendingIds = targetFiles.map((_, index) => `pending-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`);
                    setPendingThumbnailIds((prev) => [...prev, ...pendingIds]);
                    void (async () => {
                      try {
                        const next = await readFilesAsDataUrls(targetFiles);
                        setThumbnailImages((prev) => [...prev, ...next].slice(0, 5));
                      } catch (error) {
                        setErrorMessage(error instanceof Error ? error.message : t("썸네일 업로드에 실패했습니다.", "Failed to upload thumbnails."));
                      } finally {
                        setPendingThumbnailIds((prev) => prev.filter((id) => !pendingIds.includes(id)));
                      }
                    })();
                  }}
                />
                <label
                  htmlFor="position-thumbnails"
                  className={`flex rounded-xl border border-dashed bg-muted/30 p-4 transition-colors ${
                    thumbnailCount >= 5
                      ? "cursor-not-allowed border-border/60 opacity-60"
                      : "cursor-pointer border-border hover:border-foreground/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-background text-xl font-semibold text-muted-foreground">+</div>
                    <div>
                      <p className="text-sm font-medium">{t("이미지 업로드", "Upload images")}</p>
                      <p className="text-xs text-muted-foreground">{t("JPG, PNG 파일을 최대 5장까지 추가할 수 있어요.", "You can add up to 5 JPG or PNG images.")}</p>
                    </div>
                  </div>
                </label>
                {thumbnailImages.length > 1 ? (
                  <p className="text-xs text-muted-foreground">{t("썸네일을 드래그해서 순서를 바꾸면 첫 번째 이미지가 대표 썸네일로 설정됩니다.", "Drag thumbnails to reorder. The first image is used as the cover thumbnail.")}</p>
                ) : null}
                {thumbnailCount > 0 ? (
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {thumbnailImages.map((src, index) => (
                      <div
                        key={`${src.slice(0, 20)}-${index}`}
                        draggable
                        onDragStart={(event) => {
                          setDraggingThumbnailIndex(index);
                          setDragOverThumbnailIndex(index);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDragOverThumbnailIndex(index);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (draggingThumbnailIndex === null || draggingThumbnailIndex === index) return;
                          setThumbnailImages((prev) => moveImageItem(prev, draggingThumbnailIndex, index));
                          setDraggingThumbnailIndex(null);
                          setDragOverThumbnailIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggingThumbnailIndex(null);
                          setDragOverThumbnailIndex(null);
                        }}
                        className={`group relative overflow-hidden rounded-xl border bg-card transition ${
                          dragOverThumbnailIndex === index ? "border-foreground/70 ring-2 ring-foreground/15" : "border-border"
                        } ${draggingThumbnailIndex === index ? "opacity-70" : ""}`}
                      >
                        <button
                          type="button"
                          className="block w-full"
                          onClick={() => setPreviewThumbnail(src)}
                          aria-label={`${t("썸네일", "Thumbnail")} ${index + 1} ${t("크게 보기", "Open large")}`}
                        >
                          <img src={src} alt={`${t("썸네일", "Thumbnail")} ${index + 1}`} className="aspect-square w-full object-cover" />
                        </button>
                        {index === 0 ? (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55">
                            <p className="font-display px-2 pb-2 pt-1.5 text-center text-xs font-bold tracking-wide text-white">{t("대표 썸네일", "Cover thumbnail")}</p>
                          </div>
                        ) : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="absolute right-2 top-2 z-10 h-7 w-7 rounded-full bg-background/90"
                          onClick={() => setThumbnailImages((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <span className="text-sm leading-none">×</span>
                        </Button>
                      </div>
                    ))}
                    {pendingThumbnailIds.map((id) => (
                      <div
                        key={id}
                        className="relative overflow-hidden rounded-xl border border-border bg-muted/40"
                      >
                        <div className="grid aspect-square w-full place-items-center">
                          <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {isMounted && previewThumbnail
                ? createPortal(
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setPreviewThumbnail(null)}
                  >
                    <div className="relative flex w-full max-w-5xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
                      <img src={previewThumbnail} alt={t("썸네일 전체 보기", "Full thumbnail preview")} className="block max-h-[88dvh] max-w-full rounded-xl bg-black object-contain" />
                      <button
                        type="button"
                        className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium"
                        onClick={() => setPreviewThumbnail(null)}
                      >
                        {t("닫기", "Close")}
                      </button>
                    </div>
                  </div>,
                  document.body
                )
                : null}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-status">
                    {t("공개 상태", "Visibility")}
                  </label>
                  <select
                    id="position-status"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "DRAFT" | "OPEN")}
                  >
                    <option value="OPEN">{t("공개", "Open")}</option>
                    <option value="DRAFT">{t("임시저장", "Draft")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-work-type">
                    {t("근무 형태", "Work type")}
                  </label>
                  <select
                    id="position-work-type"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={workType}
                    onChange={(event) => setWorkType(event.target.value as "On-site" | "Hybrid" | "Remote")}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{t("지원 가능 비자", "Eligible visas")}</p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEligibleVisas(VISA_OPTIONS.map((item) => item.code))}
                    >
                      {t("전체선택", "Select all")}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEligibleVisas([])}>
                      {t("전체해제", "Clear all")}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {VISA_OPTIONS.map((visa) => {
                    const checked = eligibleVisas.includes(visa.code);
                    return (
                      <label key={visa.code} className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(event) => {
                            setEligibleVisas((prev) =>
                              event.target.checked ? [...prev, visa.code] : prev.filter((item) => item !== visa.code)
                            );
                          }}
                        />
                        {checked ? (
                          <CheckSquare className="h-4 w-4 text-foreground" weight="fill" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                        {visa.code} ({locale === "ko" ? visa.ko : visa.en})
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-role">
                    {t("선호 직무", "Preferred role")}
                  </label>
                  <input
                    id="position-role"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={preferredJobRole}
                    onChange={(event) => setPreferredJobRole(event.target.value)}
                    placeholder={t("예: Marketing", "e.g., Marketing")}
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-hiring-count">
                    {t("채용 인원", "Hiring count")}
                  </label>
                  <input
                    id="position-hiring-count"
                    type="number"
                    min={1}
                    max={999}
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={hiringCount}
                    onChange={(event) => setHiringCount(event.target.value)}
                    placeholder={t("예: 2", "e.g., 2")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-working-hours">
                    {t("근무 시간", "Working hours")}
                  </label>
                  <input
                    id="position-working-hours"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={workingHours}
                    onChange={(event) => setWorkingHours(event.target.value)}
                    placeholder={t("예: 주 5일, 09:00-18:00", "e.g., 5 days/week, 09:00-18:00")}
                    maxLength={240}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-work-location">
                    {t("근무 지역", "Work location")}
                  </label>
                  <input
                    id="position-work-location"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={workLocation}
                    onChange={(event) => setWorkLocation(event.target.value)}
                    placeholder={t("예: 서울 강남구", "e.g., Gangnam-gu, Seoul")}
                    maxLength={240}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-start-date">
                    {t("시작일", "Start date")}
                  </label>
                  <input
                    id="position-start-date"
                    type="date"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="position-process">
                  {t("채용 프로세스", "Hiring process")}
                </label>
                <textarea
                  id="position-process"
                  className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={hiringProcess}
                  onChange={(event) => setHiringProcess(event.target.value)}
                  placeholder={t("예: 서류 > 1차 인터뷰 > 최종 인터뷰", "e.g., Resume > 1st interview > Final interview")}
                  maxLength={2000}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-languages">
                    {t("소통 언어 (줄바꿈으로 여러 개 입력)", "Communication languages (one per line)")}
                  </label>
                  <textarea
                    id="position-languages"
                    className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={communicationLanguages}
                    onChange={(event) => setCommunicationLanguages(event.target.value)}
                    placeholder={t("예:\n한국어\n영어", "e.g.\nKorean\nEnglish")}
                    maxLength={2000}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-nationalities">
                    {t("선호 국적 (줄바꿈으로 여러 개 입력)", "Preferred nationalities (one per line)")}
                  </label>
                  <textarea
                    id="position-nationalities"
                    className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={preferredNationalities}
                    onChange={(event) => setPreferredNationalities(event.target.value)}
                    placeholder={t("예:\n국적 무관\n미국", "e.g.\nNo nationality restriction\nUnited States")}
                    maxLength={2000}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="position-main-responsibilities">
                  {t("주요 업무", "Main responsibilities")}
                </label>
                <textarea
                  id="position-main-responsibilities"
                  className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={mainResponsibilities}
                  onChange={(event) => setMainResponsibilities(event.target.value)}
                  maxLength={4000}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="position-required-qualifications">
                  {t("필수 자격", "Required qualifications")}
                </label>
                <textarea
                  id="position-required-qualifications"
                  className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={requiredQualifications}
                  onChange={(event) => setRequiredQualifications(event.target.value)}
                  maxLength={4000}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="position-preferred-qualifications">
                  {t("우대 사항", "Preferred qualifications")}
                </label>
                <textarea
                  id="position-preferred-qualifications"
                  className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={preferredQualifications}
                  onChange={(event) => setPreferredQualifications(event.target.value)}
                  maxLength={4000}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-dress-code">
                    {t("복장", "Dress code")}
                  </label>
                  <input
                    id="position-dress-code"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={dressCode}
                    onChange={(event) => setDressCode(event.target.value)}
                    placeholder={t("예: 자율복장", "e.g., Casual")}
                    maxLength={240}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="position-pretraining">
                    {t("사전 교육 필요 여부", "Pre-training required")}
                  </label>
                  <select
                    id="position-pretraining"
                    className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                    value={wantsPreTraining}
                    onChange={(event) => setWantsPreTraining(event.target.value as "unset" | "yes" | "no")}
                  >
                    <option value="unset">{t("선택 안 함", "Not selected")}</option>
                    <option value="yes">{t("필요", "Required")}</option>
                    <option value="no">{t("불필요", "Not required")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="position-notes">
                  {t("추가 메모", "Additional notes")}
                </label>
                <textarea
                  id="position-notes"
                  className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  value={additionalNotes}
                  onChange={(event) => setAdditionalNotes(event.target.value)}
                  maxLength={4000}
                />
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => router.push("/partner/positions")} disabled={isSubmitting}>
                  {t("취소", "Cancel")}
                </Button>
                <Button variant="dark" onClick={() => void handleSubmit()} disabled={isSubmitting}>
                  {isSubmitting ? t("생성 중...", "Creating...") : t("포지션 생성", "Create position")}
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
