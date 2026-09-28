"use client";

// AI가 텍스트를 고친 직후 뜨는 검토 바 — 무엇이 바뀌었는지 보고 되돌릴 수 있게 한다.
//
// 이게 없으면 다듬기가 원문을 그대로 덮어써서, 포인트를 쓴 결과가 마음에 안 들 때
// 복구할 방법이 없다(사용자가 원문을 기억하지 못하면 영구 손실).
import { useMemo, useState } from "react";
import { ArrowCounterClockwise, Check, CaretDown } from "@phosphor-icons/react";
import { diffWords, diffStats } from "../../../lib/talent/text-diff";
import { usePlatformT } from "../../../lib/i18n";

export function AiRevisionBar({
  before,
  after,
  onUndo,
  onAccept,
  title
}: {
  before: string;
  after: string;
  onUndo: () => void;
  onAccept: () => void;
  title?: string; // 기본은 '다듬었어요'. 빈 항목에 새로 쓴 경우는 '작성했어요'로 넘긴다.
}) {
  const t = usePlatformT();
  const [open, setOpen] = useState(false);
  const parts = useMemo(() => diffWords(before, after), [before, after]);
  const { added, removed } = useMemo(() => diffStats(parts), [parts]);

  return (
    <div className="mt-2 rounded-xl border border-[#D7E3FF] bg-[#F5F8FF] px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[12px] font-bold text-[#0B46E8]">
          {title ?? t("AI가 다듬었어요","Polished by AI","AI 已润色","AI đã chỉnh","AIが整えました","Dipoles AI")}
        </span>
        <span className="text-[11.5px] tabular-nums text-[#8B95A1]">
          +{added} / −{removed}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-[#4E5968] transition hover:text-[#0B1227]"
        >
          {t("비교","Compare","对比","So sánh","比較","Banding")}
          <CaretDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11.5px] font-bold text-[#4E5968] ring-1 ring-[#E5E8EB] transition hover:text-[#F04452]"
        >
          <ArrowCounterClockwise className="h-3.5 w-3.5" weight="bold" />
          {t("되돌리기","Undo","撤销","Hoàn tác","元に戻す","Batalkan")}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex items-center gap-1 rounded-lg bg-[#0B46E8] px-2 py-1 text-[11.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
        >
          <Check className="h-3.5 w-3.5" weight="bold" />
          {t("적용","Keep","保留","Giữ","採用","Simpan")}
        </button>
      </div>
      {open ? (
        <p className="mt-2 max-h-[240px] overflow-y-auto whitespace-pre-wrap break-keep rounded-lg bg-white p-2.5 text-[13px] leading-[1.75] text-[#4E5968]">
          {parts.map((p, i) =>
            p.type === "same" ? (
              <span key={i}>{p.text}</span>
            ) : p.type === "add" ? (
              <span key={i} className="rounded bg-[#E7F8EF] text-[#00854A]">{p.text}</span>
            ) : (
              <span key={i} className="rounded bg-[#FDECEE] text-[#C7303C] line-through">{p.text}</span>
            )
          )}
        </p>
      ) : null}
    </div>
  );
}
