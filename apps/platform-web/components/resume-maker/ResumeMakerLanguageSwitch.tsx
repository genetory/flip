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
    // 보이는 표시는 직접 그리고(모바일=이모지만, 데스크탑=이모지+이름), 네이티브 select 는
    // 투명하게 위에 겹쳐 상호작용만 담당한다. 너비는 내용에 맞춰 가변(inline-flex).
    <div className="relative inline-flex h-9 items-center rounded-lg transition hover:bg-[#F2F4F6]">
      <span className="pointer-events-none inline-flex items-center gap-1.5 pl-2 pr-6 text-xs font-medium text-foreground">
        <span className="text-[15px] leading-none">{EMOJI[locale]}</span>
        <span className="hidden sm:inline">{NAME[locale]}</span>
      </span>
      <CaretDown
        className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as PlatformLocale)}
        aria-label="Language"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none"
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
