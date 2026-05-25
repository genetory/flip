"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ADS_ENABLED } from "../../lib/ads-config";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "";
const SLOT_LEFT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_LEFT?.trim() || "";
const SLOT_RIGHT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_RIGHT?.trim() || "";

// Pages that should NOT show sidebar ads. Update this list if a section's UX
// would suffer from ads (dashboards, auth flows, settings, billing, etc.).
const EXCLUDED_PREFIXES: RegExp[] = [
  /^\/$/,
  /^\/dashboard(\/|$)/,
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
  /^\/auth(\/|$)/,
  /^\/account(\/|$)/,
  /^\/verify-email(\/|$)/
];

function shouldShowAds(pathname: string) {
  return !EXCLUDED_PREFIXES.some((re) => re.test(pathname));
}

const IS_PROD = process.env.NODE_ENV === "production";

function AdUnit({ slot, side }: { slot: string; side: "left" | "right" }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // adsbygoogle is injected by the AdSense script loaded in app/layout.tsx
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle.push({});
    } catch {
      // ad failures must never break user flow
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      // Responsive ad: container width is fixed (so we leave room next to the
      // centered content), but height is auto so AdSense can serve whatever
      // creative best fits. data-full-width-responsive lets AdSense scale the
      // ad to fill the 200px width.
      className={`fixed top-24 z-10 hidden w-[200px] min-[1500px]:block ${side === "left" ? "left-4" : "right-4"}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        // In non-production builds, ask AdSense to serve test ads so we don't
        // accidentally rack up invalid impressions during local dev.
        {...(IS_PROD ? {} : { "data-adtest": "on" })}
      />
    </aside>
  );
}

// Dev fallback: when no AdSense client ID is configured (typical for fresh
// local checkouts), still render a labelled placeholder so the layout can be
// verified without an AdSense account.
function DevPlaceholder({ side }: { side: "left" | "right" }) {
  return (
    <aside
      aria-label="Advertisement placeholder (dev)"
      className={`fixed top-24 z-10 hidden w-[200px] min-[1500px]:flex h-[600px] items-center justify-center rounded-md border border-dashed border-zinc-400 bg-zinc-100 text-xs text-zinc-500 ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      ad slot ({side}, responsive)
    </aside>
  );
}

export function SidebarAds() {
  const pathname = usePathname() ?? "/";
  if (!ADS_ENABLED) return null;
  if (!shouldShowAds(pathname)) return null;
  if (!ADSENSE_CLIENT) {
    if (IS_PROD) return null;
    return (
      <>
        <DevPlaceholder side="left" />
        <DevPlaceholder side="right" />
      </>
    );
  }
  return (
    <>
      {SLOT_LEFT ? <AdUnit slot={SLOT_LEFT} side="left" /> : null}
      {SLOT_RIGHT ? <AdUnit slot={SLOT_RIGHT} side="right" /> : null}
    </>
  );
}
