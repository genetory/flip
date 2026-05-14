// Cookie consent storage + Google Consent Mode v2 helpers.
// Categories follow PIPA / GDPR conventions: essential always on, analytics
// and advertising are user-controlled. Persisted in localStorage so the
// banner only shows on first visit (per device).

export const CONSENT_STORAGE_KEY = "aply_cookie_consent_v1";

export type CookieConsent = {
  essential: true; // always granted, kept here for completeness
  analytics: boolean;
  advertising: boolean;
  /** ISO timestamp the user made their choice (for audit / re-prompting). */
  decidedAt: string;
};

export function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (typeof parsed?.decidedAt !== "string") return null;
    return {
      essential: true,
      analytics: !!parsed.analytics,
      advertising: !!parsed.advertising,
      decidedAt: parsed.decidedAt
    };
  } catch {
    return null;
  }
}

export function writeConsent(consent: Omit<CookieConsent, "essential" | "decidedAt">) {
  if (typeof window === "undefined") return;
  const payload: CookieConsent = {
    essential: true,
    analytics: consent.analytics,
    advertising: consent.advertising,
    decidedAt: new Date().toISOString()
  };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  applyConsentToGtag(payload);
  // Allow other tabs / listeners (e.g., a future settings page) to react.
  window.dispatchEvent(new CustomEvent("aply:consent-updated", { detail: payload }));
}

/**
 * Push the user's consent state into Google Consent Mode v2. Safe to call
 * before or after the GA script has loaded — gtag.js is buffered via the
 * dataLayer until the script initialises.
 */
export function applyConsentToGtag(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  }
  gtag("consent", "update", {
    ad_storage: consent.advertising ? "granted" : "denied",
    ad_user_data: consent.advertising ? "granted" : "denied",
    ad_personalization: consent.advertising ? "granted" : "denied",
    analytics_storage: consent.analytics ? "granted" : "denied"
  });
}
