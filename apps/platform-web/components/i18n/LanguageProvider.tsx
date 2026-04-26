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
    if (storedLocale === "ko" || storedLocale === "en") {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale;
      return;
    }

    const browserLocale = window.navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
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
