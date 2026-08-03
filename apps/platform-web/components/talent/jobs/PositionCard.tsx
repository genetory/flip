"use client";

// 실제 포지션을 Talent 톤 카드로 표시. 저장(즐겨찾기) 토글 지원.
import Link from "next/link";
import { MapPin, BookmarkSimple, Buildings } from "@phosphor-icons/react";
import { AplyCipBadgeButton } from "../../positions/AplyCipBadge";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import type { PositionView } from "../../../lib/talent/positions-adapter";

// 자체(내부) 공고는 상세 페이지로, 외부 공고(원티드 등)는 원본 URL을 새 창으로 연다.
function CardLink({ isExternal, href, className, children }: { isExternal: boolean; href: string; className?: string; children: React.ReactNode }) {
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function PositionCard({
  view,
  saved,
  onToggleSave,
  onShowCip
}: {
  view: PositionView;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  onShowCip?: () => void;
}) {
  // 외부 공고 + 원본 URL이 있으면 새 창 연결, 아니면 내부 상세로.
  const isExternal = view.external && !!view.externalUrl;
  const linkHref = isExternal ? view.externalUrl! : `${talentAppRoutes.jobs}/${view.id}`;
  return (
    <div className="relative rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3] hover:shadow-[0_6px_20px_rgba(11,18,39,0.05)]">
      <div className="flex gap-4">
        {/* 왼쪽 정방형 컬럼 — 썸네일 없으면 플레이스홀더 */}
        <CardLink isExternal={isExternal} href={linkHref} className="block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-[#F2F4F6]">
          {view.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={view.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[#C4CAD2]">
              <Buildings className="h-7 w-7" />
            </span>
          )}
        </CardLink>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <CardLink isExternal={isExternal} href={linkHref} className="min-w-0 flex-1">
              {view.isInternal && onShowCip ? (
                <div className="mb-1.5">
                  <AplyCipBadgeButton onClick={onShowCip} size="sm" className="!py-1" />
                </div>
              ) : view.sourceLabel ? (
                // 외부 출처(원티드 등) — CIP 배지와 동일 위치·크기의 뱃지로.
                <div className="mb-1.5">
                  <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#EEF1F5] px-2 py-1 text-[10px] font-bold leading-none text-[#4E5968]">
                    {view.sourceLabel}
                  </span>
                </div>
              ) : null}
              <p className="truncate text-[15px] font-bold text-[#191F28]">{view.title}</p>
              <p className="mt-0.5 truncate text-[13px] text-[#4E5968]">{view.company}</p>
            </CardLink>
            {onToggleSave ? (
              <button
                type="button"
                aria-label={saved ? "저장 취소" : "저장"}
                aria-pressed={saved}
                onClick={() => onToggleSave(view.id)}
                className={`rounded-full p-1.5 transition ${saved ? "text-[#0B46E8]" : "text-[#B0B8C1] hover:text-[#4E5968]"}`}
              >
                <BookmarkSimple className="h-5 w-5" weight={saved ? "fill" : "regular"} />
              </button>
            ) : null}
          </div>

          <div className="mt-2.5 flex items-center gap-x-2.5 overflow-hidden text-[12px] text-[#8B95A1]">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{view.location}</span>
            </span>
            <span className="shrink-0">{view.employmentLabel}</span>
            {view.workTypeLabel ? <span className="shrink-0">{view.workTypeLabel}</span> : null}
            {view.deadlineText ? <span className="shrink-0">{view.deadlineText}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
