import { useLanguage } from "../components/i18n/LanguageProvider";
import type { PlatformLocale } from "./auth-messages";

// 플랫폼 공용 다국어 헬퍼 — 어느 화면(talent·partner 등)에서든 UI 문자열을
// t(ko, en, zh, vi, ja, id) 형태로 번역. 한국어가 기본이고 미제공 언어는 영어 폴백.
export type PlatformT = (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string;

export function pickLocale(locale: PlatformLocale, ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string): string {
  switch (locale) {
    case "en":
      return en;
    case "zh-CN":
      return zh ?? en;
    case "vi":
      return vi ?? en;
    case "ja":
      return ja ?? en;
    case "id":
      return id ?? en;
    default:
      return ko;
  }
}

export function usePlatformT(): PlatformT {
  const { locale } = useLanguage();
  return (ko, en, zh, vi, ja, id) => pickLocale(locale, ko, en, zh, vi, ja, id);
}
