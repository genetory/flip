"use client";

// 파트너 앱 공통 카드 프리미티브 — 화면 간 카드 스타일(테두리·패딩·라운드·호버)을 한 곳에서 통일.
import type { ReactNode } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { usePlatformT } from "../../../lib/i18n";

// 콘텐츠(섹션) 카드 — 정적. 기본 패딩 p-5.
export const partnerCard = "rounded-2xl border border-[#EEF1F5] bg-white p-5";
// 클릭 가능한 카드 — 호버 강조. 기본 패딩 p-4.
export const partnerCardLink = "rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]";
// 행(row)을 담는 그룹 컨테이너 — 내부 행은 px-4 py-3.5 + 구분선.
export const partnerListGroup = "flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white";

export function PartnerCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`${partnerCard}${className ? ` ${className}` : ""}`}>{children}</div>;
}

// 리스트 하단 "더 보기" 버튼 — 모든 파트너 리스트에서 동일한 형태.
export function PartnerMoreLink({ href, children, className }: { href: string; children?: ReactNode; className?: string }) {
  const t = usePlatformT();
  return (
    <Link
      href={href}
      className={`flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]${className ? ` ${className}` : ""}`}
    >
      {children ?? t("더 보기", "See more", "查看更多", "Xem thêm", "もっと見る", "Lihat lainnya")} <CaretRight className="h-4 w-4" weight="bold" />
    </Link>
  );
}

// 빈 상태 카드 — 점선 테두리 + 이모지 + 제목/설명.
export function PartnerEmptyCard({ emoji, title, desc }: { emoji: string; title: string; desc?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>{emoji}</span>
      <p className="mt-3 text-[15px] font-bold text-[#191F28]">{title}</p>
      {desc ? <p className="mt-1 text-[13px] text-[#8B95A1]">{desc}</p> : null}
    </div>
  );
}
