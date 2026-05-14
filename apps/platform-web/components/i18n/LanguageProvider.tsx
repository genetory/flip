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
  resolveLocaleFromAcceptLanguage,
  type PlatformLocale
} from "../../lib/auth-messages";

type LanguageContextValue = {
  locale: PlatformLocale;
  setLocale: (nextLocale: PlatformLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLocale
}: {
  children: React.ReactNode;
  /**
   * Locale resolved from the server (typically Accept-Language). Used as the
   * starting value so SSR and the first client render agree, avoiding a flash
   * of the default English when the visitor actually wants another language.
   */
  initialLocale?: PlatformLocale;
}) {
  const [locale, setLocaleState] = useState<PlatformLocale>(initialLocale ?? DEFAULT_PLATFORM_LOCALE);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Stored preference (explicit user choice) wins over server-detected locale.
    const storedLocale = window.localStorage.getItem(PLATFORM_LOCALE_STORAGE_KEY);
    if (storedLocale && (PLATFORM_LOCALES as readonly string[]).includes(storedLocale)) {
      setLocaleState(storedLocale as PlatformLocale);
      document.documentElement.lang = storedLocale;
      return;
    }

    // Otherwise stick with the server-resolved initialLocale (no flash). If
    // SSR didn't pass one (e.g. legacy callers), fall back to navigator.
    if (initialLocale) {
      document.documentElement.lang = initialLocale;
      return;
    }
    const browserLocale = resolveLocaleFromAcceptLanguage(window.navigator.language);
    setLocaleState(browserLocale);
    document.documentElement.lang = browserLocale;
  }, [initialLocale]);

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
