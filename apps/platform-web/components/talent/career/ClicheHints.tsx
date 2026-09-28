"use client";

// 상투어 힌트 — 사용자가 직접 쓴 문장에도 AI와 같은 기준을 보여준다.
//
// textarea 안에 밑줄을 그으려면 contenteditable 이나 오버레이가 필요한데, 크기 조절이
// 가능한 textarea + 한국어 줄바꿈에서 정렬이 쉽게 깨진다. 그래서 걸린 표현을 아래에
// 나열하는 방식으로 간다(어디를 고칠지는 표현만 보여도 찾을 수 있다).
import { useMemo, useState } from "react";
import { WarningCircle, CaretDown } from "@phosphor-icons/react";
import { findCliches, findClichePhrases } from "../../../lib/talent/cliche-phrases";
import { usePlatformT } from "../../../lib/i18n";

export function ClicheHints({ text }: { text: string }) {
  const t = usePlatformT();
  const [open, setOpen] = useState(false);
  const hits = useMemo(() => findCliches(text), [text]);
  const phrases = useMemo(() => findClichePhrases(text), [text]);
  if (hits.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl border border-[#FBE7A2] bg-[#FFFBF0] px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <WarningCircle className="h-3.5 w-3.5 shrink-0 text-[#C79A00]" weight="fill" />
        <span className="text-[12px] font-bold text-[#8A6D00]">
          {t("다시 볼 표현","Phrases to revisit","可再斟酌的表达","Cụm nên xem lại","見直したい表現","Frasa perlu ditinjau")} {phrases.length}
        </span>
        <span className="min-w-0 flex-1 break-anywhere text-[11.5px] text-[#A88A2E]">
          {phrases.slice(0, 4).map((p) => `「${p}」`).join(" ")}
          {phrases.length > 4 ? " …" : ""}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-bold text-[#8A6D00] transition hover:text-[#6B5400]"
        >
          {t("어떻게 고치죠?","How to fix","怎么改","Sửa thế nào","どう直す？","Cara perbaiki")}
          <CaretDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
        </button>
      </div>
      {open ? (
        <ul className="mt-2 flex flex-col gap-1.5">
          {hits.map((h) => (
            <li key={h.label} className="text-[12px] leading-[1.6] text-[#6B5400]">
              <span className="font-bold">{h.label}</span> — {h.why}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
