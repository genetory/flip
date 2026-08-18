"use client";

// 실제 포지션을 Talent 톤 카드로 표시. 저장(즐겨찾기) 토글 지원.
import Link from "next/link";
import { MapPin, BookmarkSimple, Buildings } from "@phosphor-icons/react";
import { AplyCipBadgeButton } from "../../positions/AplyCipBadge";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { usePlatformT } from "../../../lib/i18n";
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
  const t = usePlatformT();
  // 외부 공고도 상세 JD를 수집하므로 카드 클릭은 항상 내부 상세 페이지로 이동한다(CIP와 동일).
  // 원티드 원문 지원은 상세 페이지의 '지원하기' 버튼에서만 새 창으로 연결.
  const linkHref = `${talentAppRoutes.jobs}/${view.id}`;
  return (
    <div className="group relative rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3] hover:shadow-[0_6px_20px_rgba(11,18,39,0.05)]">
      {/* 카드 전체 클릭 → 상세(내부) 또는 원본(외부). 저장·CIP·회사명은 z-10로 위에 둬 각자 동작. */}
      <CardLink isExternal={false} href={linkHref} className="absolute inset-0 z-0 rounded-2xl">
        <span className="sr-only">{view.title}</span>
      </CardLink>
      <div className="pointer-events-none flex gap-4">
        {/* 왼쪽 정방형 컬럼 — 썸네일 없으면 플레이스홀더 */}
        <div className="block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-[#F2F4F6]">
          {view.thumbnail ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={view.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[#C4CAD2]">
              <Buildings className="h-7 w-7" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {(view.isInternal && onShowCip) || view.sourceLabel || view.foreignerOk || view.hasMockInterview ? (
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {view.isInternal && onShowCip ? (
                    <span className="pointer-events-auto relative z-10 inline-flex">
                      <AplyCipBadgeButton onClick={onShowCip} size="sm" className="!py-1" />
                    </span>
                  ) : view.sourceLabel ? (
                    // 외부 출처(원티드 등) — CIP 배지와 동일 위치·크기의 뱃지로.
                    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#EEF1F5] px-2 py-1 text-[10px] font-bold leading-none text-[#4E5968]">
                      {view.sourceLabel}
                    </span>
                  ) : null}
                  {/* 외국인 지원 가능 — 모의면접 뱃지 왼쪽. 원티드와 동일한 UX(텍스트 pill). */}
                  {view.foreignerOk ? (
                    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#E7F8EF] px-2 py-1 text-[10px] font-bold leading-none text-[#0A9B59]">
                      {t("외국인 지원 가능", "Open to foreigners", "外国人可申请", "Người nước ngoài có thể ứng tuyển", "外国人応募可", "Terbuka untuk WNA")}
                    </span>
                  ) : null}
                  {/* 회사가 모의 면접을 등록한 공고 — 카드 탭 시 상세에서 시작. */}
                  {view.hasMockInterview ? (
                    <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#EDF1FD] px-2 py-1 text-[10px] font-bold leading-none text-[#0B46E8]">
                      {t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Simulasi")}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <p className="truncate text-[15px] font-bold text-[#191F28]">{view.title}</p>
              {/* 회사명 터치 → 회사 상세(내부 공고, 실명 회사만). */}
              {view.isInternal && view.company && !view.isUndisclosedCompany ? (
                <Link href={`/talent/company/${encodeURIComponent(view.company)}`} className="pointer-events-auto relative z-10 mt-0.5 inline-block max-w-full truncate align-top text-[13px] text-[#4E5968] transition hover:text-[#0B46E8] hover:underline">
                  {view.company}
                </Link>
              ) : (
                <p className="mt-0.5 truncate text-[13px] text-[#4E5968]">{view.company}</p>
              )}
            </div>
            {onToggleSave ? (
              <button
                type="button"
                aria-label={saved ? t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "保存を解除", "Batal simpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
                aria-pressed={saved}
                onClick={() => onToggleSave(view.id)}
                className={`pointer-events-auto relative z-10 -m-1 rounded-full p-2.5 transition ${saved ? "text-[#0B46E8]" : "text-[#B0B8C1] hover:text-[#4E5968]"}`}
              >
                <BookmarkSimple className="h-5 w-5" weight={saved ? "fill" : "regular"} />
              </button>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#8B95A1]">
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
