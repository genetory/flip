"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useLanguage } from "../i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";

// resume-maker 상단 바 우측 언어 스위처 — aply.global 헤더와 동일하게 locale 을 바꾼다.
// 선택 즉시 useLanguage().setLocale 로 저장되어 모든 i18n 사전에 반영된다.

const EMOJI: Record<PlatformLocale, string> = {
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
  "zh-CN": "简体中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa Indonesia"
};

export function ResumeMakerLanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return (
    <div className="relative">
      <CaretDown
        className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as PlatformLocale)}
        aria-label="Language"
        className="h-9 w-auto appearance-none truncate rounded-lg bg-transparent pl-2 pr-7 text-xs font-medium text-foreground transition hover:bg-muted focus-visible:outline-none"
      >
        {PLATFORM_LOCALES.map((value) => (
          <option key={value} value={value}>
            {EMOJI[value]} {NAME[value]}
          </option>
        ))}
      </select>
    </div>
  );
}
