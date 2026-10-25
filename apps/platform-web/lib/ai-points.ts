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
  /** 결제 PG — 'payapp' | 'toss' | null(결제 꺼짐). 옛 API 면 없음(토스로 본다). */
  paymentProvider?: "toss" | "payapp" | null;
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

// ── 쓰기 전 확인 ──
/** 이 포인트 이상이면 쓰기 전에 한 번 묻는다(파일 가져오기·예상 질문·모의 면접 세트 등). */
export const CONFIRM_FROM = 30;
export type PointsConfirmRequest = { cost: number; label: string; resolve: (ok: boolean) => void };
const confirmListeners = new Set<(r: PointsConfirmRequest) => void>();
export function onPointsConfirm(cb: (r: PointsConfirmRequest) => void): () => void {
  confirmListeners.add(cb);
  return () => confirmListeners.delete(cb);
}
/**
 * 포인트를 쓰기 전 관문 — 꺼져 있거나 비용이 0이면 통과, 잔액이 모자라면 충전 창을 열고 막는다,
 * CONFIRM_FROM 이상이면 확인 창(취소하면 막음), 그 아래는 바로 통과. 상태를 아직 못 불러왔으면 통과(서버가 402 로 막는다).
 */
export async function spendGate(cost: number, label: string): Promise<boolean> {
  const p = getAiPointsState();
  if (!p?.enabled || !cost || cost <= 0) return true;
  if (p.balance < cost) {
    openPointsPaywall("needed");
    return false;
  }
  if (cost < CONFIRM_FROM || confirmListeners.size === 0) return true;
  return new Promise<boolean>((resolve) => confirmListeners.forEach((l) => l({ cost, label, resolve })));
}

// ── 포인트 코드(쿠폰·리딤·이벤트 코드) ──
export type RedeemError = "invalid" | "expired" | "already" | "group" | "exhausted" | "busy" | "unknown";
/** 코드를 등록해 포인트를 충전 — 성공하면 잔액·내역을 다시 불러온다. 실패는 사유 키로 돌려준다(화면이 6개 언어로 띄운다). */
export async function redeemPointCode(code: string): Promise<{ ok: true; points: number } | { ok: false; error: RedeemError }> {
  try {
    const r = (await authedJsonFetch<never>("/members/me/ai-points/redeem", { method: "POST", body: JSON.stringify({ code }) })) as unknown as { points?: number; tickets?: number; balance?: number };
    setAiPointsBalance(r.balance);
    void refreshAiPoints();
    return { ok: true, points: r.points ?? r.tickets ?? 0 };
  } catch (e) {
    const x = e as { status?: number; code?: string };
    const map: Record<string, RedeemError> = { COUPON_INVALID: "invalid", COUPON_EXPIRED: "expired", COUPON_ALREADY: "already", COUPON_GROUP_USED: "group", COUPON_EXHAUSTED: "exhausted" };
    return { ok: false, error: (x.code && map[x.code]) || (x.status === 429 ? "busy" : "unknown") };
  }
}
