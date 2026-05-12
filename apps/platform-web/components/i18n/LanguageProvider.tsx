"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  DEFAULT_PLATFORM_LOCALE,
  PLATFORM_LOCALES,
  PLATFORM_LOCALE_STORAGE_KEY,
  type PlatformLocale
} from "../../lib/auth-messages";

type LanguageContextValue = {
  locale: PlatformLocale;
  setLocale: (nextLocale: PlatformLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<PlatformLocale>(DEFAULT_PLATFORM_LOCALE);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedLocale = window.localStorage.getItem(PLATFORM_LOCALE_STORAGE_KEY);
    if (storedLocale && (PLATFORM_LOCALES as readonly string[]).includes(storedLocale)) {
      setLocaleState(storedLocale as PlatformLocale);
      document.documentElement.lang = storedLocale;
      return;
    }

    const browserLang = window.navigator.language.toLowerCase();
    const browserLocale: PlatformLocale =
      browserLang.startsWith("ko")
        ? "ko"
        : browserLang.startsWith("zh")
          ? "zh-CN"
          : browserLang.startsWith("vi")
            ? "vi"
            : browserLang.startsWith("ja")
              ? "ja"
              : browserLang.startsWith("id")
                ? "id"
                : "en";
    setLocaleState(browserLocale);
    document.documentElement.lang = browserLocale;
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
