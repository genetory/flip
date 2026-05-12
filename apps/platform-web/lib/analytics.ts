import { sendGAEvent } from "@next/third-parties/google";

/**
 * Thin wrapper around `@next/third-parties/google.sendGAEvent` that is safe to
 * call from anywhere (SSR / lib helpers / event handlers). Becomes a no-op when
 * GA is disabled (no Measurement ID configured) or when `window`/gtag isn't
 * available yet — silently dropped events are preferable to runtime errors in
 * production.
 */
function safeSendEvent(name: string, params: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) return;
    sendGAEvent("event", name, params);
  } catch {
    // analytics failure must never break user flow
  }
}

// ---- auth ----

export type SignupMethod = "email" | "naver" | "google" | "kakao";

export function trackSignUp(method: SignupMethod) {
  safeSendEvent("sign_up", { method });
}

export function trackLogin(method: SignupMethod) {
  safeSendEvent("login", { method });
}

export function trackEmailVerified() {
  safeSendEvent("email_verified", {});
}

export function trackAccountDeleted() {
  safeSendEvent("account_deleted", {});
}

// ---- positions ----

export function trackPositionSearch(query: string) {
  if (!query.trim()) return;
  safeSendEvent("search", { search_term: query.trim().slice(0, 120) });
}

export function trackPositionView(positionId: string, source: string) {
  safeSendEvent("view_position", { position_id: positionId, source });
}

export function trackPositionApply(positionId: string, source: string) {
  safeSendEvent("apply_position", { position_id: positionId, source });
}

export function trackPositionFavorite(positionId: string, source: string, isFavorite: boolean) {
  safeSendEvent("favorite_position", { position_id: positionId, source, is_favorite: isFavorite });
}

export function trackExternalPositionClick(positionId: string, source: string) {
  safeSendEvent("click_external_position", { position_id: positionId, source });
}

// ---- AI matching ----

export function trackAiAnalysisStart() {
  safeSendEvent("start_ai_analysis", {});
}

export function trackAiAnalysisCompleted(score: number) {
  safeSendEvent("complete_ai_analysis", { score });
}
