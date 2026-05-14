"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { readConsent, writeConsent } from "../../lib/cookie-consent";

type Copy = {
  heading: string;
  body: string;
  manage: string;
  acceptAll: string;
  rejectAll: string;
  save: string;
  essentialLabel: string;
  essentialDesc: string;
  analyticsLabel: string;
  analyticsDesc: string;
  advertisingLabel: string;
  advertisingDesc: string;
  required: string;
  privacyLink: string;
};

const copyByLocale: Record<string, Copy> = {
  ko: {
    heading: "쿠키 사용 안내",
    body: "Aply는 더 나은 서비스 제공을 위해 쿠키를 사용합니다. 필수 쿠키 외 분석·광고 쿠키는 동의 시에만 활성화됩니다.",
    manage: "설정",
    acceptAll: "전체 허용",
    rejectAll: "필수만 허용",
    save: "선택 저장",
    essentialLabel: "필수",
    essentialDesc: "로그인 세션, 보안 기능 등 서비스 이용에 반드시 필요한 쿠키",
    analyticsLabel: "분석",
    analyticsDesc: "Google Analytics 등을 통한 익명 사용 통계 수집",
    advertisingLabel: "광고",
    advertisingDesc: "Google AdSense를 통한 광고 노출 및 효과 측정",
    required: "항상 사용",
    privacyLink: "자세히 보기"
  },
  en: {
    heading: "We use cookies",
    body: "Aply uses cookies to deliver a better experience. Analytics and advertising cookies are activated only with your consent.",
    manage: "Manage",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    save: "Save selection",
    essentialLabel: "Essential",
    essentialDesc: "Required for login, security, and core site features.",
    analyticsLabel: "Analytics",
    analyticsDesc: "Anonymous usage stats via tools like Google Analytics.",
    advertisingLabel: "Advertising",
    advertisingDesc: "Google AdSense ad delivery and performance measurement.",
    required: "Always on",
    privacyLink: "Learn more"
  }
};

function pickCopy(locale: string): Copy {
  return copyByLocale[locale] ?? copyByLocale.en ?? copyByLocale.ko;
}

type ConsentDraft = { analytics: boolean; advertising: boolean };

export function CookieConsentBanner() {
  const { locale } = useLanguage();
  const copy = pickCopy(locale);

  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [draft, setDraft] = useState<ConsentDraft>({ analytics: true, advertising: true });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const decide = (consent: ConsentDraft) => {
    writeConsent(consent);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-elevated md:p-5">
        <header className="mb-2">
          <h2 className="text-sm font-semibold text-foreground">{copy.heading}</h2>
        </header>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {copy.body}{" "}
          <a href="/legal/privacy" className="text-primary underline">
            {copy.privacyLink}
          </a>
        </p>

        {showDetails ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
            <ConsentRow
              title={copy.essentialLabel}
              description={copy.essentialDesc}
              checked
              disabled
              hint={copy.required}
            />
            <ConsentRow
              title={copy.analyticsLabel}
              description={copy.analyticsDesc}
              checked={draft.analytics}
              onChange={(value) => setDraft((prev) => ({ ...prev, analytics: value }))}
            />
            <ConsentRow
              title={copy.advertisingLabel}
              description={copy.advertisingDesc}
              checked={draft.advertising}
              onChange={(value) => setDraft((prev) => ({ ...prev, advertising: value }))}
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {!showDetails ? (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {copy.manage}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => decide({ analytics: false, advertising: false })}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-muted"
          >
            {copy.rejectAll}
          </button>
          {showDetails ? (
            <button
              type="button"
              onClick={() => decide(draft)}
              className="inline-flex h-9 items-center justify-center rounded-md bg-foreground/10 px-3 text-xs font-medium text-foreground hover:bg-foreground/15"
            >
              {copy.save}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => decide({ analytics: true, advertising: true })}
            className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            {copy.acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  hint
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-foreground"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {hint ? <span className="text-[11px] text-muted-foreground">({hint})</span> : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
