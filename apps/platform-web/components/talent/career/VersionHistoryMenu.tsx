"use client";

// 이전 버전으로 되돌리기 — 누적된 편집을 잘못했을 때의 마지막 안전망.
// 스냅샷은 Resume.content 안에 최대 3개, 10분 간격으로만 쌓인다(저장 시 content 전체를
// PATCH 하므로 히스토리가 곧 업로드 용량이다).
import { useState } from "react";
import { ClockCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { usePlatformT } from "../../../lib/i18n";

// 상대 시각 — "3분 전 / 2시간 전 / 3일 전". 정확한 시각은 title 로 준다.
function useRelative() {
  const t = usePlatformT();
  return (ts: number): string => {
    const min = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (min < 60) return `${min}${t("분 전","m ago","分钟前"," phút trước","分前"," mnt lalu")}`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}${t("시간 전","h ago","小时前"," giờ trước","時間前"," jam lalu")}`;
    return `${Math.round(hr / 24)}${t("일 전","d ago","天前"," ngày trước","日前"," hr lalu")}`;
  };
}

export function VersionHistoryMenu({
  versions,
  onRestore
}: {
  versions: { savedAt: number }[];
  onRestore: (savedAt: number) => void;
}) {
  const t = usePlatformT();
  const rel = useRelative();
  const [open, setOpen] = useState(false);
  if (versions.length === 0) return null;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E8EB] bg-white px-2 py-1 text-[11.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
      >
        <ClockCounterClockwise className="h-3.5 w-3.5" weight="bold" />
        {t("이전 버전","History","历史版本","Bản trước","以前の版","Versi lama")}
        <CaretDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
      </button>
      {open ? (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div role="menu" className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-xl border border-[#E5E8EB] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
            <p className="px-3 py-1.5 text-[11px] text-[#8B95A1]">
              {t("되돌리면 현재 내용도 목록에 보관돼요","Restoring keeps the current version too","恢复后当前内容也会保留","Khôi phục vẫn giữ bản hiện tại","復元しても現在の内容は保存されます","Memulihkan tetap menyimpan versi kini")}
            </p>
            {versions.map((v) => (
              <button
                key={v.savedAt}
                type="button"
                role="menuitem"
                onClick={() => { onRestore(v.savedAt); setOpen(false); }}
                title={new Date(v.savedAt).toLocaleString()}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-[#F6F8FB]"
              >
                <span className="text-[13px] font-bold text-[#0B1227]">{rel(v.savedAt)}</span>
                <span className="text-[11.5px] font-bold text-[#0B46E8]">
                  {t("되돌리기","Restore","恢复","Khôi phục","元に戻す","Pulihkan")}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
