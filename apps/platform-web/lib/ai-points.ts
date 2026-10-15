"use client";

// AI 포인트 — 모든 AI 기능(이력서·자소서 에디터, 모의 면접 등)이 같이 쓰는 잔액 하나.
// 서버 GET /members/me/ai-points 가 잔액·적립 규칙·기능별 비용·충전 상품을 준다. enabled=false(서버 AI_POINTS_ENABLED 꺼짐)면
// 화면은 가격·잔액을 숨긴다(지금처럼). AI 응답에 실려 오는 aiPoints.balance 는 authedJsonFetch 가 이벤트로 알려 준다.
// 402 AI_POINTS_REQUIRED 를 받으면 어디서든 openPointsPaywall() → <PointsPaywallHost/> 가 충전 시트를 연다.
import { useEffect, useSyncExternalStore } from "react";
import { authedJsonFetch } from "./member-profile-client";

export type AiPointProduct = { key: string; points: number; bonus: number; total: number; amount: number; badge: "popular" | "best" | null };
export type AiPointLog = { id: string; amount: number; reason: string; createdAt: string };
export type AiPoints = {
  enabled: boolean;
  balance: number;
  won: number;
  daily: { welcome: number; grant: number; cap: number; nextAt: string };
  costs: Record<string, number>;
  perSet: number;
  dailyFreeUsed: boolean;
  paymentsEnabled: boolean;
  refundDays: number;
  products: AiPointProduct[];
  logs: AiPointLog[];
};

/** 잔액이 바뀌었다고 알리는 이벤트(AI 응답의 aiPoints.balance) — member-profile-client 가 쏜다(순환 import 를 피하려고 이벤트로). */
export const AI_POINTS_EVENT = "aply:ai-points";

const DISABLED: AiPoints = { enabled: false, balance: 0, won: 10, daily: { welcome: 0, grant: 0, cap: 0, nextAt: "" }, costs: {}, perSet: 5, dailyFreeUsed: false, paymentsEnabled: false, refundDays: 7, products: [], logs: [] };
let state: AiPoints | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function refreshAiPoints(): Promise<void> {
  loading = authedJsonFetch<never>("/members/me/ai-points", { method: "GET" })
    .then((r) => {
      state = r as unknown as AiPoints;
      emit();
    })
    .catch((e: unknown) => {
      // 옛 API(경로 없음)면 꺼진 것으로 본다 — 가격·잔액을 숨기고 예전 흐름대로. 로그인 전·일시 오류는 다음에 다시 불러온다.
      if (!state && (e as { status?: number })?.status === 404) {
        state = DISABLED;
        emit();
      }
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** 지금 아는 상태(없으면 null) — 훅 밖에서 분기할 때. */
export function getAiPointsState(): AiPoints | null {
  return state;
}

/** 서버 응답에 실려 온 남은 잔액을 반영. */
export function setAiPointsBalance(balance: number | null | undefined): void {
  if (typeof balance !== "number" || !state) return;
  state = { ...state, balance };
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener(AI_POINTS_EVENT, (e) => {
    const b = (e as CustomEvent<{ balance?: number | null }>).detail?.balance;
    if (typeof b === "number") setAiPointsBalance(b);
  });
}

/** AI 포인트 상태 — 처음 쓰는 화면에서 한 번 불러온다. enabled=false 면 null 이 아니라 enabled:false 상태가 온다. */
export function useAiPoints(enabled = true): AiPoints | null {
  useEffect(() => {
    if (enabled && !state && !loading) void refreshAiPoints();
  }, [enabled]);
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => null
  );
}

/** 이 기능 비용(P) — 포인트가 꺼져 있거나 모르면 null(화면에 가격을 보이지 않는다). */
export function useAiCost(feature: string): number | null {
  const p = useAiPoints();
  if (!p?.enabled) return null;
  const c = p.costs[feature];
  return typeof c === "number" && c > 0 ? c : null;
}

/** "1,230P" */
export function formatPoints(n: number): string {
  return `${n.toLocaleString("en-US")}P`;
}

// ── 충전 시트 열기 신호 ──
const paywallListeners = new Set<(reason: string) => void>();
export function openPointsPaywall(reason = "needed"): void {
  paywallListeners.forEach((l) => l(reason));
}
export function onPointsPaywall(cb: (reason: string) => void): () => void {
  paywallListeners.add(cb);
  return () => paywallListeners.delete(cb);
}

/** 서버가 포인트가 모자라다고 답했나(402 AI_POINTS_REQUIRED). */
export function isPointsError(e: unknown): boolean {
  const x = e as { status?: number; code?: string } | null;
  return x?.status === 402 && (x.code === "AI_POINTS_REQUIRED" || x.code === undefined);
}
