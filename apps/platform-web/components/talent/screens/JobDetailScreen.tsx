"use client";

// 공고 상세 — 포지션 탐색 상세(PositionDetailPage)와 동일한 내용, UI 는 Talent 톤.
// 핵심 정보 / 상세 안내 / 기업 정보 + 저장·지원.
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, BookmarkSimple, ArrowSquareOut, Buildings, LinkSimple, Star, X, Check } from "@phosphor-icons/react";
import { TalentBackButton } from "../TalentBackButton";
import { toggleCompanyFollow, useFollowedCompanies } from "../../../lib/talent/company-follow";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { notifyApplied, notifySavedPosition } from "../../../lib/talent/activity-log";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { TalentAppShell } from "../app/TalentAppShell";
import { TCard, TChip, TError, TLoading } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { AplyCipBadgeButton } from "../../positions/AplyCipBadge";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { parseOfficePhotos } from "../../../lib/image-upload";
import {
  getPublicPositionById,
  getMyFavoritePositions,
  getMyAppliedPositions,
  addMyFavoritePosition,
  removeMyFavoritePosition,
  applyMyPosition,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";

const companySizeLabels: Record<string, string> = {
  SIZE_1_10: "10인 이하",
  SIZE_UNDER_30: "30인 이하",
  SIZE_UNDER_50: "50인 이하",
  SIZE_OVER_100: "100인 이상"
};

const DASH = "정보 없음";
const orDash = (v: string | null | undefined) => (v && v.trim() ? v : DASH);

export function JobDetailScreen({ jobId }: { jobId: string }) {
  const toast = useTalentPopup();
  const { locale } = useLanguage();
  const [item, setItem] = useState<PublicPositionListItem | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [cipOpen, setCipOpen] = useState(false);

  function load() {
    setStatus("loading");
    getPublicPositionById(jobId, { locale })
      .then((it) => {
        setItem(it);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => {
    load();
    void getMyFavoritePositions()
      .then((list) => setSaved(list.some((p) => p.id === jobId)))
      .catch(() => setSaved(false));
    void getMyAppliedPositions()
      .then((list) => setApplied(list.some((p) => p.id === jobId)))
      .catch(() => setApplied(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, locale]);

  function toggleSave() {
    const willSave = !saved;
    setSaved(willSave);
    if (willSave) notifySavedPosition(jobId, view?.title);
    const req = willSave ? addMyFavoritePosition(jobId) : removeMyFavoritePosition(jobId);
    void req.catch(() => {
      setSaved(!willSave);
      toast.error("저장에 실패했어요");
    });
  }

  // 내부(CIP) 공고 실제 지원 — 팝업에서 서류 완성 확인 후 호출.
  function submitApply() {
    if (applied || applying) return;
    setApplying(true);
    applyMyPosition(jobId)
      .then(() => {
        setApplied(true);
        setApplyOpen(false);
        notifyApplied(jobId, view?.title ?? "", view?.company ?? "");
        toast.success("지원이 접수됐어요");
      })
      .catch(() => toast.error("지원에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setApplying(false));
  }

  const view = item ? toPositionView(item) : null;
  const heroImage = item?.thumbnailImages?.[0] || null;

  return (
    <TalentAppShell maxWidth="4xl">
      <TalentBackButton className="mb-4" />

      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && item && view ? (
        <div className="pb-24 md:pb-0">
          {/* 헤더 */}
          <TCard className="overflow-hidden p-0">
            {heroImage ? (
              <div className="h-[240px] w-full overflow-hidden bg-[#F2F4F6] md:h-[340px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                {view.isInternal ? <AplyCipBadgeButton onClick={() => setCipOpen(true)} size="md" className="!py-1.5" /> : null}
                {view.sourceLabel ? <TChip>{view.sourceLabel}</TChip> : null}
              </div>
              <h1 className="mt-3 text-[24px] font-black leading-[1.25] tracking-[-0.02em] text-[#0B1227]">{view.title}</h1>
              <p className="mt-2 text-[15px] font-semibold text-[#4E5968]">
                {view.isInternal && view.company && view.company !== "비공개 기업" ? (
                  <Link href={`/talent/company/${encodeURIComponent(view.company)}`} className="transition hover:text-[#0B46E8] hover:underline">{view.company}</Link>
                ) : (
                  view.company
                )}
                {item.partnerOrganization?.industry ? <span className="font-normal text-[#8B95A1]"> · {partnerIndustryLabel(item.partnerOrganization.industry)}</span> : null}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[#8B95A1]">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {view.location}</span>
                <span>{view.employmentLabel}</span>
                {view.workTypeLabel ? <span>{view.workTypeLabel}</span> : null}
                {view.deadlineText ? <span>마감 {view.deadlineText}</span> : null}
              </div>
            </div>
          </TCard>

          {/* 상단 액션 (데스크톱) */}
          <div className="mt-4 hidden justify-end gap-2 md:flex">
            <TalentButton
              onClick={toggleSave}
              variant={saved ? "soft" : "secondary"}
              size="lg"
              aria-label={saved ? "저장 취소" : "저장"}
              className={saved ? "" : "!border-0 !bg-[#F2F4F6] !text-[#4E5968] hover:!bg-[#E5E8EB]"}
            >
              <BookmarkSimple className="h-4 w-4" weight={saved ? "fill" : "regular"} /> {saved ? "저장됨" : "저장"}
            </TalentButton>
            <ApplyButton view={view} applied={applied} applying={applying} onApply={() => setApplyOpen(true)} />
          </div>

          {/* 핵심 정보 */}
          <TCard className="mt-4 p-6">
            <h2 className="text-[15px] font-bold text-[#191F28]">핵심 정보</h2>
            <div className="mt-3 divide-y divide-[#F2F4F6]">
              <InfoRow label="희망 직무" value={orDash(item.preferredJobRole)} />
              <InfoRow label="희망 인원" value={item.hiringCount ? `${item.hiringCount}명` : DASH} />
              <InfoRow label="근무 시간" value={orDash(item.workingHours)} />
              <InfoRow label="근무 복장" value={orDash(item.dressCode)} />
              <InfoRow label="등록일" value={item.createdAt ? item.createdAt.slice(0, 10) : DASH} />
            </div>
          </TCard>

          {/* 상세 안내 */}
          <TCard className="mt-4 p-6">
            <h2 className="text-[15px] font-bold text-[#191F28]">상세 안내</h2>
            <div className="mt-4 flex flex-col gap-5">
              <DetailBlock title="주요 업무" text={orDash(item.mainResponsibilities)} />
              <DetailBlock title="필수 자격 요건" text={orDash(item.requiredQualifications)} />
              <DetailBlock title="채용 프로세스" text={orDash(item.hiringProcess)} />
            </div>
          </TCard>

          {/* 기업 정보 — 헤더(썸네일·회사명·관심)는 카드 밖 상단 */}
          <div className="mt-6">
            <CompanyHeader item={item} />
          </div>
          <CompanySection item={item} />

          {/* 데스크톱 액션 */}
          <div className="mt-6 hidden justify-end gap-2 md:flex">
            <TalentButton
              onClick={toggleSave}
              variant={saved ? "soft" : "secondary"}
              size="lg"
              aria-label={saved ? "저장 취소" : "저장"}
              className={saved ? "" : "!border-0 !bg-[#F2F4F6] !text-[#4E5968] hover:!bg-[#E5E8EB]"}
            >
              <BookmarkSimple className="h-4 w-4" weight={saved ? "fill" : "regular"} /> {saved ? "저장됨" : "저장"}
            </TalentButton>
            <ApplyButton view={view} applied={applied} applying={applying} onApply={() => setApplyOpen(true)} />
          </div>

          {/* 모바일 하단 고정 CTA */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EEF1F5] bg-white/95 p-3 backdrop-blur md:hidden" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
            <div className="mx-auto flex max-w-4xl items-center gap-2">
              <button
                type="button"
                onClick={toggleSave}
                aria-label={saved ? "저장 취소" : "저장"}
                className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl ${saved ? "bg-[#EDF1FD] text-[#0B46E8]" : "bg-[#F2F4F6] text-[#8B95A1]"}`}
              >
                <BookmarkSimple className="h-5 w-5" weight={saved ? "fill" : "regular"} />
              </button>
              <div className="flex-1">
                <ApplyButton view={view} applied={applied} applying={applying} onApply={() => setApplyOpen(true)} fullWidth />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
      {applyOpen ? <ApplyModal applying={applying} onClose={() => setApplyOpen(false)} onConfirm={submitApply} /> : null}
    </TalentAppShell>
  );
}

// 지원 전 서류 완성도 확인 팝업 — 이력서·자기소개서가 모두 완성돼야 지원 가능.
function ApplyModal({ applying, onClose, onConfirm }: { applying: boolean; onClose: () => void; onConfirm: () => void }) {
  useLockBodyScroll();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const ready = rp >= 100 && cp >= 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-7 pt-7">
          <div>
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">이 공고에 지원할까요?</h2>
            <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">지원 서류(이력서·자기소개서)가 준비됐는지 확인해요.</p>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose} className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 px-7">
          <DocStatus label="이력서" pct={rp} href={talentAppRoutes.resume} />
          <DocStatus label="자기소개서" pct={cp} href={talentAppRoutes.cover} />
        </div>

        {!ready ? (
          <p className="mx-7 mt-4 rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-[#F04452]">
            서류를 완성해야 지원할 수 있어요. 미완성 서류를 마저 채워주세요.
          </p>
        ) : null}

        <div className="px-7 pb-7 pt-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ready || applying}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying ? "지원 중…" : "지원하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocStatus({ label, pct, href }: { label: string; pct: number; href: string }) {
  const done = pct >= 100;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4">
      {done ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]">
          <Check className="h-4 w-4" weight="bold" />
        </span>
      ) : (
        <span className="w-9 shrink-0 text-center text-[14px] font-black text-[#B0B8C1]">{pct}%</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-[#191F28]">{label}</p>
        <p className="text-[12px] text-[#8B95A1]">{done ? "준비됐어요" : pct === 0 ? "아직 시작 전이에요" : "완성도를 채워주세요"}</p>
      </div>
      {!done ? (
        <Link href={href} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
          {pct === 0 ? "만들기" : "완성하기"}
        </Link>
      ) : null}
    </div>
  );
}

function ApplyButton({
  view,
  applied,
  applying,
  onApply,
  fullWidth
}: {
  view: ReturnType<typeof toPositionView>;
  applied: boolean;
  applying: boolean;
  onApply: () => void;
  fullWidth?: boolean;
}) {
  // 외부 공고 → 외부 링크로.
  if (view.external && view.externalUrl) {
    return (
      <TalentButton href={view.externalUrl} external variant="primary" size="lg" fullWidth={fullWidth} aria-label="지원하기">
        지원하기 <ArrowSquareOut className="h-4 w-4" />
      </TalentButton>
    );
  }
  // 내부(CIP) 공고 → 실제 지원(applyMyPosition).
  return (
    <TalentButton
      onClick={onApply}
      disabled={applied || applying}
      variant={applied ? "soft" : "primary"}
      size="lg"
      fullWidth={fullWidth}
      aria-label={applied ? "지원 완료" : "지원하기"}
    >
      {applied ? "지원 완료" : applying ? "지원 중…" : "지원하기"}
    </TalentButton>
  );
}

// 값이 링크(URL/도메인)면 새 탭으로 열 수 있게 href 반환, 아니면 undefined.
function toHref(v: string | null | undefined): string | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return `https://${s}`;
  return undefined;
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[13px] text-[#8B95A1]">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-right text-[13.5px] font-medium text-[#0B46E8] hover:underline">
          {value} <ArrowSquareOut className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <span className="break-keep text-right text-[13.5px] font-medium text-[#191F28]">{value}</span>
      )}
    </div>
  );
}

function DetailBlock({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h3 className="text-[13px] font-bold text-[#8B95A1]">{title}</h3>
      <p className="mt-1.5 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#191F28]">{text}</p>
    </section>
  );
}

// 관심 회사 토글 — 실제 서버(company-follow) 저장. 계정 설정 '관심 회사'와 동일 소스.
function CompanyFollowButton({ name }: { name: string }) {
  const interested = useFollowedCompanies().includes(name);
  return (
    <button
      type="button"
      onClick={() => toggleCompanyFollow(name)}
      aria-pressed={interested}
      className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-[12.5px] font-bold transition ${
        interested ? "bg-[#EDF1FD] text-[#0B46E8] hover:bg-[#E1E9FC]" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
      }`}
    >
      <Star className="h-3.5 w-3.5" weight={interested ? "fill" : "regular"} /> {interested ? "관심 회사" : "관심 추가"}
    </button>
  );
}

// 회사 헤더 — 썸네일 + 회사명 + 관심 회사. 카드 밖 맨 상단에 노출.
// large: 회사 상세 화면용(회사명·썸네일 크게).
export function CompanyHeader({ item, large = false }: { item: PublicPositionListItem; large?: boolean }) {
  const org = item.partnerOrganization;
  if (!org) return null;
  const logo = org.companyLogoImageData || null;
  const box = large ? "h-16 w-16" : "h-14 w-14";
  const nameCls = large ? "text-[24px]" : "text-[18px]";
  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <span className={`${box} shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="h-full w-full object-cover" />
        </span>
      ) : (
        // 로고 없으면 유저 프로필과 동일한 이니셜 플레이스홀더.
        <span className={`flex ${box} shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] ${large ? "text-[24px]" : "text-[20px]"} font-black text-[#0B46E8]`}>{org.name.slice(0, 1)}</span>
      )}
      <Link href={`/talent/company/${encodeURIComponent(org.name)}`} className={`min-w-0 truncate ${nameCls} font-black tracking-[-0.02em] text-[#0B1227] transition hover:text-[#0B46E8] hover:underline`}>
        {org.name}
      </Link>
      <CompanyFollowButton name={org.name} />
    </div>
  );
}

export function CompanySection({ item }: { item: PublicPositionListItem }) {
  const org = item.partnerOrganization;
  if (!org) return null;
  const photos = parseOfficePhotos(org.officePhotoImageData);
  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* 기업 개요 */}
      <TCard className="p-6">
        <div className="flex items-center gap-1.5">
          <Buildings className="h-4 w-4 text-[#4E5968]" />
          <h2 className="text-[15px] font-bold text-[#191F28]">기업 정보</h2>
        </div>

        <div className="mt-4 divide-y divide-[#F2F4F6]">
          <InfoRow label="기업 규모" value={org.companySize ? companySizeLabels[org.companySize] ?? org.companySize : DASH} />
          <InfoRow label="산업" value={org.industry ? partnerIndustryLabel(org.industry) : DASH} />
          <InfoRow label="사무실 주소" value={orDash(org.officeAddress)} />
          <InfoRow label="웹사이트" value={orDash(org.website)} href={toHref(org.website)} />
          <InfoRow label="소셜 미디어" value={orDash(org.socialMedia)} href={toHref(org.socialMedia)} />
        </div>

        {org.website ? (
          <a href={org.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0B46E8] hover:underline">
            <LinkSimple className="h-4 w-4" /> 회사 홈페이지
          </a>
        ) : null}
      </TCard>

      {/* 회사 사진 */}
      {photos.length ? (
        <TCard className="p-6">
          <h2 className="text-[15px] font-bold text-[#191F28]">회사 사진</h2>
          {photos.length === 1 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt="회사 사진" className="h-[200px] w-full object-cover" />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {photos.map((src, i) => (
                <div key={`${i}-${src.slice(0, 24)}`} className="aspect-[4/3] overflow-hidden rounded-xl border border-[#EEF1F5] bg-[#F2F4F6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`회사 사진 ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </TCard>
      ) : null}

      {/* 기업 소개 */}
      {org.description?.trim() ? (
        <TCard className="p-6">
          <h2 className="text-[15px] font-bold text-[#191F28]">기업 소개</h2>
          <p className="mt-3 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#4E5968]">{org.description}</p>
        </TCard>
      ) : null}

      {/* 회사 자랑거리 */}
      {org.strengths?.trim() ? (
        <TCard className="p-6">
          <h2 className="text-[15px] font-bold text-[#191F28]">회사 자랑거리</h2>
          <p className="mt-3 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#4E5968]">{org.strengths}</p>
        </TCard>
      ) : null}
    </div>
  );
}
