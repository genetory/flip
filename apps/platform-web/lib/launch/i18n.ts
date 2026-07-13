import { useLanguage } from "../../components/i18n/LanguageProvider";

// Career Launch 다국어 헬퍼.
// - useLaunchT(): 컴포넌트의 UI 문자열을 t(ko, en, zh, vi, ja, id) 형태로 번역.
//   한국어가 기본이고, 미제공 언어는 영어로 폴백한다.
// - useLoc(): data.ts 같은 곳에서 로케일 키 객체(LT)를 현재 로케일 문자열로 변환.
export type LaunchLocale = "ko" | "en" | "zh-CN" | "vi" | "ja" | "id";

// 로케일별 문자열(정적 데이터 번역용).
export type LT = { ko: string; en: string; "zh-CN": string; vi: string; ja: string; id: string };

export function useLaunchT() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string): string =>
    locale === "en" ? en : locale === "zh-CN" ? zh ?? en : locale === "vi" ? vi ?? en : locale === "ja" ? ja ?? en : locale === "id" ? id ?? en : ko;
}

// LT 객체(또는 이미 문자열)를 현재 로케일 문자열로.
export function useLoc() {
  const { locale } = useLanguage();
  return (t: LT | string): string => (typeof t === "string" ? t : t[locale] ?? t.en ?? t.ko);
}

// 훅 밖(서버·유틸)에서 LT 를 특정 로케일로 변환.
export function locOf(t: LT | string, locale: LaunchLocale): string {
  return typeof t === "string" ? t : t[locale] ?? t.en ?? t.ko;
}
