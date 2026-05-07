"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import {
  applyMyPosition,
  getMyAppliedPositions,
  getMyPartnerOrganization,
  getPublicPositions,
  type PublicPositionListItem
} from "../../lib/member-profile-client";
import { getPublicPositionStatusBadge } from "../../lib/position-status-meta";
import { ArrowLeft, Briefcase, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";

function inferWorkType(value?: string | null): "On-site" | "Hybrid" | "Remote" {
  const text = (value ?? "").toLowerCase();
  if (text.includes("remote") || text.includes("재택")) return "Remote";
  if (text.includes("hybrid") || text.includes("하이브리드")) return "Hybrid";
  return "On-site";
}

function workTypeLabel(value: string, locale: "ko" | "en") {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "remote") return locale === "ko" ? "원격근무" : "Remote";
  if (normalized === "hybrid") return locale === "ko" ? "혼합근무" : "Hybrid";
  if (normalized === "onsite") return locale === "ko" ? "대면근무" : "On-site";
  return value;
}

function companyHref(partnerOrganizationId?: string | null) {
  if (!partnerOrganizationId?.trim()) return null;
  return `/companies/${encodeURIComponent(partnerOrganizationId.trim())}`;
}

function formatPostedDate(value: string, locale: "ko" | "en") {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return "-";
  const now = Date.now();
  const diffMs = Math.max(0, now - created.getTime());
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return locale === "ko" ? `${Math.max(1, minutes)}분 전` : `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "ko" ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === "ko" ? `${days}일 전` : `${days}d ago`;
  const y = created.getFullYear();
  const m = String(created.getMonth() + 1).padStart(2, "0");
  const d = String(created.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

function getPositionStatusBadge(status: PublicPositionListItem["status"], locale: "ko" | "en") {
  return getPublicPositionStatusBadge(status, locale);
}

function textOrFallback(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function safeStringArray(value: string[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function similarityScore(base: PublicPositionListItem, candidate: PublicPositionListItem) {
  let score = 0;
  if (base.preferredJobRole && candidate.preferredJobRole && base.preferredJobRole === candidate.preferredJobRole) score += 4;
  if (base.workType && candidate.workType && base.workType === candidate.workType) score += 3;
  if (
    base.partnerOrganization?.industry &&
    candidate.partnerOrganization?.industry &&
    base.partnerOrganization.industry === candidate.partnerOrganization.industry
  ) {
    score += 2;
  }
  const baseVisaSet = new Set(safeStringArray(base.eligibleVisas));
  const overlapVisas = safeStringArray(candidate.eligibleVisas).filter((visa) => baseVisaSet.has(visa)).length;
  score += Math.min(2, overlapVisas);
  return score;
}

export function PositionDetailPage({ position }: { position: PublicPositionListItem }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const copy = {
    partnerCompany: isKo ? "파트너 기업" : "Partner company",
    roleTbd: isKo ? "직무 미정" : "Role TBD",
    tbdLocation: isKo ? "협의" : "To be discussed",
    immediate: isKo ? "즉시" : "Immediate",
    noRestriction: isKo ? "무관" : "No restriction",
    noNationalityRestriction: isKo ? "국적 무관" : "No nationality restriction",
    noLanguageRequirement: isKo ? "언어 조건 없음" : "No language requirement",
    noDetails: isKo ? "상세 조건 확인" : "See details",
    infoUnavailable: isKo ? "정보 없음" : "No information",
    loginRequired: isKo ? "로그인한 회원만 지원할 수 있습니다." : "Only signed-in users can apply.",
    studentRequired: isKo ? "파트너 회원, 어드민은 지원하기에 지원할 수 없습니다." : "Partner and admin accounts cannot apply.",
    appliedAdded: isKo ? "지원한 포지션에 추가되었습니다." : "Added to applied positions.",
    applyFailed: isKo ? "지원 처리에 실패했습니다." : "Failed to apply.",
    back: isKo ? "뒤로" : "Back",
    previewAll: isKo ? "썸네일 전체보기" : "Open full image",
    close: isKo ? "닫기" : "Close",
    prevThumbnail: isKo ? "이전 썸네일" : "Previous image",
    nextThumbnail: isKo ? "다음 썸네일" : "Next image",
    coreInfo: isKo ? "핵심 정보" : "Core information",
    workType: isKo ? "근무 형태" : "Work type",
    startDate: isKo ? "공고 시작일" : "Start date",
    workLocation: isKo ? "근무 지역" : "Work location",
    postedAt: isKo ? "등록일" : "Posted",
    requirements: isKo ? "지원 조건" : "Requirements",
    visas: isKo ? "지원 가능 비자" : "Eligible visas",
    languages: isKo ? "소통 언어" : "Languages",
    nationalities: isKo ? "선호 국적" : "Preferred nationalities",
    keywords: isKo ? "주요 키워드" : "Keywords",
    details: isKo ? "상세 안내" : "Details",
    responsibilities: isKo ? "주요 업무" : "Main responsibilities",
    requiredQualifications: isKo ? "필수 자격" : "Required qualifications",
    preferredQualifications: isKo ? "우대 사항" : "Preferred qualifications",
    hiringProcess: isKo ? "채용 프로세스" : "Hiring process",
    notes: isKo ? "추가 메모" : "Additional notes",
    edit: isKo ? "수정하기" : "Edit",
    apply: isKo ? "지원하기" : "Apply",
    applied: isKo ? "지원완료" : "Applied",
    recommendationTitle: isKo ? "혹시 이런 포지션은 어떠세요?" : "You might also like"
  };

  const { user, isAuthenticated } = useAuthSession();
  const [recommendedPositions, setRecommendedPositions] = useState<PublicPositionListItem[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
  const [isThumbnailPreviewOpen, setIsThumbnailPreviewOpen] = useState(false);
  const [appliedPositionIds, setAppliedPositionIds] = useState<string[]>([]);
  const [myPartnerOrganizationId, setMyPartnerOrganizationId] = useState<string | null>(null);
  const inlineGalleryRef = useRef<HTMLDivElement | null>(null);
  const company = position.partnerOrganization?.name?.trim() || copy.partnerCompany;
  const initial = company[0]?.toUpperCase() ?? "P";
  const category = position.preferredJobRole?.trim() || copy.roleTbd;
  const location = position.workLocation?.trim() || position.partnerOrganization?.officeAddress?.trim() || copy.tbdLocation;
  const workType = position.workType ?? inferWorkType(position.workingHours);
  const companyPageHref = companyHref(position.partnerOrganization?.id);
  const startRaw = position.startDate ? new Date(position.startDate) : null;
  const startLabel = startRaw && !Number.isNaN(startRaw.getTime()) ? startRaw.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US") : copy.immediate;
  const postedLabel = formatPostedDate(position.createdAt, locale);
  const thumbnailImages = safeStringArray(position.thumbnailImages);
  const eligibleVisas = safeStringArray(position.eligibleVisas);
  const preferredNationalitiesRaw = safeStringArray(position.preferredNationalities);
  const communicationLanguagesRaw = safeStringArray(position.communicationLanguages);
  const isOwnPartnerPosting = !!myPartnerOrganizationId && position.partnerOrganization?.id === myPartnerOrganizationId;
  const statusBadge = getPositionStatusBadge(position.status, locale);
  const tagItems = [
    ...(position.preferredJobRole ? [position.preferredJobRole] : []),
    ...communicationLanguagesRaw.slice(0, 3),
    ...(position.workingHours ? [position.workingHours] : [])
  ].filter((value, index, array) => array.indexOf(value) === index);
  const visas = eligibleVisas.length ? eligibleVisas : [copy.noRestriction];
  const preferredNationalities = preferredNationalitiesRaw.length ? preferredNationalitiesRaw : [copy.noNationalityRestriction];
  const communicationLanguages = communicationLanguagesRaw.length ? communicationLanguagesRaw : [copy.noLanguageRequirement];

  useEffect(() => {
    setSelectedThumbnailIndex(0);
    setIsThumbnailPreviewOpen(false);
  }, [position.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || user.role !== "STUDENT") {
      setAppliedPositionIds([]);
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const applied = await getMyAppliedPositions();
        if (ignore) return;
        setAppliedPositionIds(applied.map((item) => item.id));
      } catch {
        if (!ignore) setAppliedPositionIds([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.id, user?.role]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "PARTNER") {
      setMyPartnerOrganizationId(null);
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (ignore) return;
        setMyPartnerOrganizationId(org?.id ?? null);
      } catch {
        if (!ignore) setMyPartnerOrganizationId(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    let ignore = false;
    setIsRecommendationsLoading(true);
    void (async () => {
      try {
        const all = await getPublicPositions();
        if (ignore) return;
        const recommended = all
          .filter((item) => item.id !== position.id)
          .map((item) => ({ item, score: similarityScore(position, item) }))
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
          })
          .slice(0, 6)
          .map((entry) => entry.item);
        setRecommendedPositions(recommended);
      } catch {
        if (!ignore) setRecommendedPositions([]);
      } finally {
        if (!ignore) setIsRecommendationsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [position]);

  async function markAsApplied() {
    if (!isAuthenticated || !user?.id) {
      window.alert(copy.loginRequired);
      return;
    }
    if (user.role !== "STUDENT") {
      window.alert(copy.studentRequired);
      return;
    }
    if (appliedPositionIds.includes(position.id)) return;
    try {
      setAppliedPositionIds((prev) => [...prev, position.id]);
      await applyMyPosition(position.id);
      window.alert(copy.appliedAdded);
    } catch (error) {
      setAppliedPositionIds((prev) => prev.filter((id) => id !== position.id));
      window.alert(error instanceof Error ? error.message : copy.applyFailed);
    }
  }

  function moveThumbnail(direction: "left" | "right") {
    if (thumbnailImages.length <= 1) return;
    setSelectedThumbnailIndex((prev) => {
      if (direction === "left") {
        return prev === 0 ? thumbnailImages.length - 1 : prev - 1;
      }
      return prev === thumbnailImages.length - 1 ? 0 : prev + 1;
    });
  }

  function scrollInlineGallery(direction: "left" | "right") {
    const container = inlineGalleryRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.92;
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                router.back();
              }}
            >
              <ArrowLeft />
              {copy.back}
            </Button>
          </div>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-6">
            {thumbnailImages.length > 0 ? (
              <div className="mb-5">
                <div className="relative">
                  <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                  {thumbnailImages.length === 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedThumbnailIndex(0);
                        setIsThumbnailPreviewOpen(true);
                      }}
                      className="block w-full"
                      aria-label={copy.previewAll}
                    >
                      <img
                        src={thumbnailImages[0]}
                        alt={`${company} ${copy.previewAll} 1`}
                        className="aspect-[16/9] w-full rounded-xl object-cover"
                      />
                    </button>
                  ) : (
                    <div className="relative">
                      <div ref={inlineGalleryRef} className="flex gap-2 overflow-x-auto">
                        {thumbnailImages.map((src, index) => (
                          <button
                            key={`${src.slice(0, 20)}-${index}`}
                            type="button"
                            onClick={() => {
                              setSelectedThumbnailIndex(index);
                              setIsThumbnailPreviewOpen(true);
                            }}
                            className="w-[calc(50%-0.25rem)] min-w-[calc(50%-0.25rem)] overflow-hidden rounded-xl"
                            aria-label={`${copy.previewAll} ${index + 1}`}
                          >
                            <img
                              src={src}
                              alt={`${company} ${copy.previewAll} ${index + 1}`}
                              className="aspect-[16/9] w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      {thumbnailImages.length > 2 ? (
                        <>
                          <button
                            type="button"
                            aria-label={copy.prevThumbnail}
                            onClick={() => scrollInlineGallery("left")}
                            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2 text-black shadow-md transition-colors hover:bg-white/90"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            aria-label={copy.nextThumbnail}
                            onClick={() => scrollInlineGallery("right")}
                            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2 text-black shadow-md transition-colors hover:bg-white/90"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}
                  {isThumbnailPreviewOpen ? (
                    <div
                      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                      onClick={() => setIsThumbnailPreviewOpen(false)}
                    >
                      <div className="relative flex w-full max-w-5xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
                        <img
                          src={thumbnailImages[Math.min(selectedThumbnailIndex, thumbnailImages.length - 1)]}
                          alt={`${company} ${copy.previewAll} ${selectedThumbnailIndex + 1}`}
                          className="block max-h-[88dvh] max-w-full rounded-xl bg-black object-contain"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium"
                          onClick={() => setIsThumbnailPreviewOpen(false)}
                        >
                          {copy.close}
                        </button>
                        {thumbnailImages.length > 2 ? (
                          <>
                            <button
                              type="button"
                              aria-label={copy.prevThumbnail}
                              onClick={() => moveThumbnail("left")}
                              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2.5 text-black shadow-md transition-colors hover:bg-white/90"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                              type="button"
                              aria-label={copy.nextThumbnail}
                              onClick={() => moveThumbnail("right")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white p-2.5 text-black shadow-md transition-colors hover:bg-white/90"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="relative mb-5">
                <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
                <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-5xl font-bold text-muted-foreground">
                  {initial}
                </div>
              </div>
            )}

            <div>
              <div className="min-w-0 text-sm text-muted-foreground">
                {companyPageHref ? (
                  <Link href={companyPageHref} className="block truncate font-semibold hover:text-foreground">
                    {company}
                  </Link>
                ) : (
                  <span className="block truncate font-semibold">{company}</span>
                )}
                <p className="mt-1 truncate">{category}</p>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight md:text-3xl">{position.title}</h1>
            </div>

            <div className="mt-8">
              <h2 className="text-base font-semibold">{copy.coreInfo}</h2>
              <div className="mt-4 grid gap-6 text-sm md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.workType}</p>
                    <p className="font-medium">{workTypeLabel(workType, locale)}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.startDate}</p>
                    <p className="font-medium">{startLabel}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.workLocation}</p>
                    <p className="font-medium">{location}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 pb-1">
                    <p className="text-sm font-medium text-muted-foreground">{copy.postedAt}</p>
                    <p className="font-medium">{postedLabel}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-base font-semibold">{copy.requirements}</h2>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  <div className="space-y-5">
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.visas}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {visas.map((item) => (
                          <span key={item} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.languages}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {communicationLanguages.map((item) => (
                          <span key={item} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                  <div className="space-y-5">
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.nationalities}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {preferredNationalities.map((item) => (
                          <span key={item} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                    <article>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.keywords}</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(tagItems.length ? tagItems : [copy.noDetails]).map((tag) => (
                          <span key={tag} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-base font-semibold">{copy.details}</h2>
                <div className="mt-4 space-y-5">
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.responsibilities}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.mainResponsibilities, copy.infoUnavailable)}</p>
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.requiredQualifications}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.requiredQualifications, copy.infoUnavailable)}</p>
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.preferredQualifications}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.preferredQualifications, copy.infoUnavailable)}</p>
                  </section>
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground">{copy.hiringProcess}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7">{textOrFallback(position.hiringProcess, copy.infoUnavailable)}</p>
                  </section>
                  {position.additionalNotes?.trim() ? (
                    <section>
                      <h3 className="text-sm font-medium text-muted-foreground">{copy.notes}</h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-7">{position.additionalNotes}</p>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end">
              {isOwnPartnerPosting ? (
                <Button variant="dark" size="lg" asChild>
                  <Link href={`/positions/${position.id}/edit`}>{copy.edit}</Link>
                </Button>
              ) : (
                <Button
                  variant="dark"
                  size="lg"
                  onClick={markAsApplied}
                  disabled={user?.role === "STUDENT" && appliedPositionIds.includes(position.id)}
                  className={user?.role === "STUDENT" && appliedPositionIds.includes(position.id) ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : undefined}
                >
                  {user?.role === "STUDENT" && appliedPositionIds.includes(position.id) ? copy.applied : copy.apply}
                </Button>
              )}
            </div>

          </section>

          {isRecommendationsLoading ? (
            <section className="mt-10" aria-hidden>
              <div className="mb-4 h-7 w-56 animate-pulse rounded bg-muted" />
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <article key={`recommended-skeleton-${index}`} className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted" />
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="mt-3 h-10 w-full animate-pulse rounded bg-muted" />
                  </article>
                ))}
              </div>
            </section>
          ) : recommendedPositions.length > 0 ? (
            <section className="mt-10">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{copy.recommendationTitle}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recommendedPositions.map((item) => {
                  const itemCompany = item.partnerOrganization?.name?.trim() || copy.partnerCompany;
                  const itemCompanyHref = companyHref(item.partnerOrganization?.id);
                  const itemWorkType = item.workType ?? inferWorkType(item.workingHours);
                  const itemLocation = item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || copy.tbdLocation;
                  const itemJobRole = item.preferredJobRole?.trim() || copy.roleTbd;
                  const itemThumbnailImages = safeStringArray(item.thumbnailImages);
                  const itemIsOwnPartnerPosting = !!myPartnerOrganizationId && item.partnerOrganization?.id === myPartnerOrganizationId;
                  const itemIsApplied = user?.role === "STUDENT" && appliedPositionIds.includes(item.id);
                  return (
                    <article key={item.id} className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-elevated">
                      <Link
                        href={`/positions/${item.id}`}
                        aria-label={`${item.title} ${copy.apply}`}
                        className="absolute inset-0 z-10 rounded-xl"
                      />
                      {itemThumbnailImages[0] ? (
                        <img
                          src={itemThumbnailImages[0]}
                          alt={`${itemCompany} ${isKo ? "썸네일" : "thumbnail"}`}
                          className="block aspect-[16/9] w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
                          {itemCompany[0]?.toUpperCase() ?? "P"}
                        </div>
                      )}
                      <div className="mt-4 text-xs text-muted-foreground">
                        <div className="min-w-0 md:flex md:flex-col md:justify-center">
                          {itemCompanyHref ? (
                            <Link href={itemCompanyHref} className="relative z-20 block truncate font-semibold hover:text-foreground">
                              {itemCompany}
                            </Link>
                          ) : (
                            <p className="truncate font-semibold">{itemCompany}</p>
                          )}
                          <p className="mt-1 truncate">{itemJobRole}</p>
                        </div>
                      </div>
                      <h3 className="mt-1 truncate font-display text-base font-bold leading-tight">{item.title}</h3>
                      <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
                        <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{itemLocation}</span>
                        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(itemWorkType, locale)}</span>
                      </div>
                      <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
                        {itemIsOwnPartnerPosting ? (
                          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
                            <Link href={`/positions/${item.id}/edit`}>{copy.edit}</Link>
                          </Button>
                        ) : (
                          <Button
                            variant="dark"
                            className={`h-10 flex-1 text-sm ${itemIsApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : ""}`}
                            asChild={!itemIsApplied}
                            disabled={itemIsApplied}
                          >
                            {itemIsApplied ? (
                              <span>{copy.applied}</span>
                            ) : (
                              <Link href={`/positions/${item.id}`}>{copy.apply}</Link>
                            )}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
