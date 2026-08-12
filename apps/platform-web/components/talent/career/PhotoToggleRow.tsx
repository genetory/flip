"use client";

// 이력서·자기소개서에 프로필 사진 표시 여부 토글 — 공용.
import { usePlatformT } from "../../../lib/i18n";

export function PhotoToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  const t = usePlatformT();
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#191F28]">{label}</p>
        <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("기본은 표시 안 함 · 원하면 켜세요", "Off by default · turn on if you like", "默认不显示 · 需要时开启", "Mặc định tắt · bật nếu muốn", "既定は非表示 · 必要ならオン", "Default nonaktif · aktifkan bila mau")}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
