"use client";

// 커리어 기록 카드 — 노티피케이션 스타일(제목 + 내용 2줄). 홈/내 커리어 공용.
import Link from "next/link";
import { CaretRight, Trash } from "@phosphor-icons/react";
import { SECTION_META } from "../../../lib/talent/career-chat";
import { formatRelativeTime, type FeedEntry } from "../../../lib/talent/career-feed";
import { talentAppRoutes } from "../../../lib/talent/app-nav";

// 목적격 조사(을/를) — 한글 받침 여부로.
function withObjectParticle(word: string): string {
  const ch = word.charCodeAt(word.length - 1);
  const isHangul = ch >= 0xac00 && ch <= 0xd7a3;
  if (!isHangul) return `${word}을`;
  const hasBatchim = (ch - 0xac00) % 28 !== 0;
  return `${word}${hasBatchim ? "을" : "를"}`;
}

export function FeedCard({ entry, onDelete }: { entry: FeedEntry; onDelete?: (id: string) => void }) {
  const meta = SECTION_META[entry.section];
  const emoji = entry.emoji ?? meta.emoji;
  const rawLabel = entry.label ?? meta.label;
  const base = rawLabel.includes("·") ? (rawLabel.split("·").pop() ?? rawLabel).trim() : rawLabel;
  const title = `${withObjectParticle(base)} 업데이트했어요!`;
  const href = entry.href ?? talentAppRoutes.career;

  return (
    <div className="relative">
      <Link href={href} className="flex items-start gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[18px]" aria-hidden>{emoji}</span>
        <div className={`min-w-0 flex-1 ${onDelete ? "pr-7" : ""}`}>
          <p className="truncate text-[14px] font-bold text-[#191F28]">{title}</p>
          <p className="mt-0.5 break-keep text-[13px] leading-relaxed text-[#4E5968] line-clamp-2">{entry.text}</p>
          <p className="mt-1 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(entry.createdAt)}</p>
        </div>
        {onDelete ? null : <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />}
      </Link>
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          aria-label="기록 삭제"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-[#C4CAD2] transition hover:bg-[#F2F4F6] hover:text-[#F04452]"
        >
          <Trash className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
