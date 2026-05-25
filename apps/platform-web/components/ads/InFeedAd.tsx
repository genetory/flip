"use client";

import { useEffect } from "react";
import { ADS_ENABLED } from "../../lib/ads-config";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "";
const SLOT_INFEED = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED?.trim() || "";
const LAYOUT_KEY_INFEED = process.env.NEXT_PUBLIC_ADSENSE_LAYOUT_KEY_INFEED?.trim() || "";
const IS_PROD = process.env.NODE_ENV === "production";

type InFeedAdProps = {
  /**
   * Optional className for the wrapper so the parent feed can size/space the
   * ad correctly (e.g. `col-span-full` inside a grid). Per AdSense guidance
   * the ad container's HEIGHT must remain auto / variable — do not force a
   * fixed height here or the fluid creative will be distorted.
   */
  className?: string;
};

/**
 * Single AdSense in-feed native ad unit. Use the same component multiple
 * times inside the same feed (positions list, community list, etc.) — each
 * `<ins>` triggers its own `adsbygoogle.push({})` to fetch a fresh creative.
 *
 * Renders nothing if AdSense isn't configured. In dev (no client id) it
 * renders a dashed placeholder so the layout slot is visible.
 */
export function InFeedAd({ className }: InFeedAdProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ADS_ENABLED || !ADSENSE_CLIENT || !SLOT_INFEED) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).adsbygoogle.push({});
    } catch {
      // ad failures must never break user flow
    }
  }, []);

  if (!ADS_ENABLED) return null;

  if (!ADSENSE_CLIENT || !SLOT_INFEED) {
    if (IS_PROD) return null;
    return (
      <div
        aria-label="In-feed advertisement placeholder (dev)"
        className={`flex h-24 w-full items-center justify-center rounded-md border border-dashed border-zinc-400 bg-zinc-100 text-xs text-zinc-500 ${
          className ?? ""
        }`}
      >
        in-feed ad slot
      </div>
    );
  }

  return (
    <div className={className} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-format="fluid"
        data-ad-layout-key={LAYOUT_KEY_INFEED}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={SLOT_INFEED}
        {...(IS_PROD ? {} : { "data-adtest": "on" })}
      />
    </div>
  );
}
