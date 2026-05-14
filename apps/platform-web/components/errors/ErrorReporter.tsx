"use client";

import { useEffect } from "react";

/**
 * Forwards unhandled browser errors + promise rejections to the API's
 * /errors/client endpoint, which in turn posts them to Discord. Stays
 * lightweight on purpose: no buffering, no retries, no source map upload.
 * Loaded once via the root layout.
 */
export function ErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
    if (!apiBase) return;

    const endpoint = `${apiBase.replace(/\/$/, "")}/errors/client`;

    function send(payload: { message: string; stack?: string; url?: string }) {
      try {
        const body = JSON.stringify({
          ...payload,
          url: payload.url ?? (typeof window !== "undefined" ? window.location.href : undefined),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined
        });
        // Prefer sendBeacon for navigation-safe delivery; fall back to fetch
        // with keepalive when sendBeacon isn't available (older browsers).
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([body], { type: "application/json" });
          const ok = navigator.sendBeacon(endpoint, blob);
          if (ok) return;
        }
        void fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {});
      } catch {
        // never let error reporting itself throw and recurse
      }
    }

    const noisePatterns = [
      /ResizeObserver loop/i,
      /^Script error\.?$/i,
      /^Load failed$/i,
      /AbortError/i,
      /The operation was aborted/i,
      /ChunkLoadError/i,
      /Non-Error promise rejection captured/i
    ];

    function onError(event: ErrorEvent) {
      const message = (event.message || "").trim();
      if (!message || message === "Unknown error") return;
      if (noisePatterns.some((re) => re.test(message))) return;
      send({
        message: message.slice(0, 500),
        stack: event.error instanceof Error ? event.error.stack ?? undefined : undefined,
        url: event.filename || undefined
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      // Skip empty/null/undefined reasons — these are almost always third-party
      // script noise (AdSense iframes, analytics beacons, browser extensions)
      // that we cannot act on and that just spam our Discord channel.
      if (reason == null) return;
      if (typeof reason === "object" && !(reason instanceof Error)) {
        try {
          if (Object.keys(reason as Record<string, unknown>).length === 0) return;
        } catch {
          // ignore introspection failures
        }
      }

      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : (() => {
                try {
                  return JSON.stringify(reason).slice(0, 300);
                } catch {
                  return "";
                }
              })();

      const normalized = (message || "").trim();
      if (!normalized) return; // no actionable info, drop
      if (noisePatterns.some((re) => re.test(normalized))) return;

      send({
        message: `unhandledRejection: ${normalized}`.slice(0, 500),
        stack: reason instanceof Error ? reason.stack ?? undefined : undefined
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
