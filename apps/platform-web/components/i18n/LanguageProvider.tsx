"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  PLATFORM_LOCALES,
  PLATFORM_LOCALE_STORAGE_KEY,
  type PlatformLocale
} from "../../lib/auth-messages";

type LanguageContextValue = {
  locale: PlatformLocale;
  setLocale: (nextLocale: PlatformLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// 기본 언어는 항상 한국어. 브라우저/서버 로케일로 자동 전환하지 않고, 사용자가
// 명시적으로 고른 값(localStorage)만 반영한다.
const DEFAULT_LOCALE: PlatformLocale = "ko";

export function LanguageProvider({
  children,
  // 하위호환용(더는 자동 적용하지 않음 — 기본 한국어).
  initialLocale: _initialLocale
}: {
  children: React.ReactNode;
  initialLocale?: PlatformLocale;
}) {
  const [locale, setLocaleState] = useState<PlatformLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 사용자가 직접 고른 언어만 반영. 없으면 기본(한국어) 유지.
    const storedLocale = window.localStorage.getItem(PLATFORM_LOCALE_STORAGE_KEY);
    if (storedLocale && (PLATFORM_LOCALES as readonly string[]).includes(storedLocale)) {
      setLocaleState(storedLocale as PlatformLocale);
      document.documentElement.lang = storedLocale;
    } else {
      document.documentElement.lang = DEFAULT_LOCALE;
    }
  }, []);

  function setLocale(nextLocale: PlatformLocale) {
    setLocaleState(nextLocale);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PLATFORM_LOCALE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
  }

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
