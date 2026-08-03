"use client";

// 공고 상세 — 포지션 탐색 상세(PositionDetailPage)와 동일한 내용, UI 는 Talent 톤.
// 핵심 정보 / 상세 안내 / 기업 정보 + 저장·지원.
import { useEffect, useState } from "react";
import { MapPin, BookmarkSimple, ArrowSquareOut, Buildings, LinkSimple, Star } from "@phosphor-icons/react";
import { TalentBackButton } from "../TalentBackButton";
import { toggleFollow, isFollowing, useFollowing, type FeedAuthor } from "../../../lib/talent/social-graph";
import { TalentAppShell } from "../app/TalentAppShell";
import { TCard, TChip, TError, TLoading } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { AplyCipBadgeButton } from "../../positions/AplyCipBadge";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import {
  getPublicPositionById,
  getMyFavoritePositions,
  addMyFavoritePosition,
  removeMyFavoritePosition,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, locale]);

  function toggleSave() {
    const willSave = !saved;
    setSaved(willSave);
    const req = willSave ? addMyFavoritePosition(jobId) : removeMyFavoritePosition(jobId);
    void req.catch(() => {
      setSaved(!willSave);
      toast.error("저장에 실패했어요");
    });
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
                {view.company}
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
            <ApplyButton view={view} />
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

          {/* 기업 정보 */}
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
            <ApplyButton view={view} />
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
                <ApplyButton view={view} fullWidth />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
    </TalentAppShell>
  );
}

function ApplyButton({ view, fullWidth }: { view: ReturnType<typeof toPositionView>; fullWidth?: boolean }) {
  // 외부 공고 → 외부 링크로, Aply(내부) 공고 → 실제 지원 페이지(/positions/[id])로.
  if (view.external && view.externalUrl) {
    return (
      <TalentButton href={view.externalUrl} external variant="primary" size="lg" fullWidth={fullWidth} aria-label="지원하기">
        지원하기 <ArrowSquareOut className="h-4 w-4" />
      </TalentButton>
    );
  }
  return (
    <TalentButton href={`/positions/${view.id}`} variant="primary" size="lg" fullWidth={fullWidth} aria-label="지원하기">
      지원하기
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

// 관심 회사 토글 — 파트너(회사) 팔로우로 관리(계정 설정 '관심 회사'와 동일 스토어).
function CompanyFollowButton({ name }: { name: string }) {
  const company: FeedAuthor = { name, role: "PARTNER" };
  const following = useFollowing();
  void following; // 토글 시 리렌더 트리거용 구독
  const interested = isFollowing(company);
  return (
    <button
      type="button"
      onClick={() => toggleFollow(company)}
      aria-pressed={interested}
      className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-[12.5px] font-bold transition ${
        interested ? "bg-[#EDF1FD] text-[#0B46E8] hover:bg-[#E1E9FC]" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
      }`}
    >
      <Star className="h-3.5 w-3.5" weight={interested ? "fill" : "regular"} /> {interested ? "관심 회사" : "관심 추가"}
    </button>
  );
}

function CompanySection({ item }: { item: PublicPositionListItem }) {
  const org = item.partnerOrganization;
  if (!org) return null;
  const logo = org.companyLogoImageData || null;
  const office = org.officePhotoImageData || null;
  return (
    <TCard className="mt-4 p-6">
      <div className="flex items-center gap-1.5">
        <Buildings className="h-4 w-4 text-[#4E5968]" />
        <h2 className="text-[15px] font-bold text-[#191F28]">기업 정보</h2>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {logo ? (
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="h-full w-full object-contain" />
          </span>
        ) : (
          // 로고 없으면 유저 프로필과 동일한 이니셜 플레이스홀더.
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[18px] font-black text-[#0B46E8]">{org.name.slice(0, 1)}</span>
        )}
        <p className="min-w-0 truncate text-[16px] font-bold text-[#191F28]">{org.name}</p>
        <CompanyFollowButton name={org.name} />
      </div>

      <div className="mt-4 divide-y divide-[#F2F4F6]">
        <InfoRow label="기업 규모" value={org.companySize ? companySizeLabels[org.companySize] ?? org.companySize : DASH} />
        <InfoRow label="산업" value={org.industry ? partnerIndustryLabel(org.industry) : DASH} />
        <InfoRow label="사무실 주소" value={orDash(org.officeAddress)} />
        <InfoRow label="웹사이트" value={orDash(org.website)} href={toHref(org.website)} />
        <InfoRow label="소셜 미디어" value={orDash(org.socialMedia)} href={toHref(org.socialMedia)} />
      </div>

      {office ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={office} alt="사무실 사진" className="h-[180px] w-full object-cover" />
        </div>
      ) : null}

      {org.description?.trim() ? (
        <section className="mt-5">
          <h3 className="text-[13px] font-bold text-[#8B95A1]">기업 소개</h3>
          <p className="mt-1.5 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#4E5968]">{org.description}</p>
        </section>
      ) : null}

      {org.strengths?.trim() ? (
        <section className="mt-5">
          <h3 className="text-[13px] font-bold text-[#8B95A1]">회사 자랑거리</h3>
          <p className="mt-1.5 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#4E5968]">{org.strengths}</p>
        </section>
      ) : null}

      {org.website ? (
        <a href={org.website} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0B46E8] hover:underline">
          <LinkSimple className="h-4 w-4" /> 회사 홈페이지
        </a>
      ) : null}
    </TCard>
  );
}
