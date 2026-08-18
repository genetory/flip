"use client";

// GNB 우측 끝 언어 선택기 — 국기 이모지로 현재 언어 표시, 클릭 시 드롭다운.
// 기본 한국어. 선택은 LanguageProvider(localStorage)에 저장돼 전 화면에 반영된다.
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";

const FLAG: Record<PlatformLocale, string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  "zh-CN": "🇨🇳",
  vi: "🇻🇳",
  ja: "🇯🇵",
  id: "🇮🇩"
};
const NAME: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa Indonesia"
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${NAME[locale]} · Language`}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-2xl text-[19px] leading-none transition hover:bg-[#F6F8FB]"
      >
        <span aria-hidden>{FLAG[locale] ?? "🌐"}</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-[60] w-44 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white py-1 shadow-[0_10px_32px_rgba(11,18,39,0.14)]">
          {PLATFORM_LOCALES.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13.5px] transition hover:bg-[#F6F8FB] ${active ? "font-bold text-[#0B46E8]" : "font-medium text-[#4E5968]"}`}
              >
                <span className="text-[16px] leading-none" aria-hidden>{FLAG[l]}</span>
                {NAME[l]}
                {active ? <span className="ml-auto text-[#0B46E8]">✓</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
