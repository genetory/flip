"use client";

// 모의 면접 이용권 — 잔액·상품(서버 GET /members/me/interview-credits), 결제 주문·승인, 결제 창 열기 신호.
// 단위는 '답변 피드백 1개'(이용권 1회 = perSession 개). 피드백·예상 질문 응답에 남은 잔액이 실려 와 바로 반영한다.
// AI 포인트(서버 AI_POINTS_ENABLED)가 켜져 있으면 모의 면접도 포인트로 받는다 — 이 훅은 포인트를 '남은 답변 수'
// (잔액 ÷ 답변 1개 비용)로 바꿔 돌려주고(points 필드에 원래 잔액), 결제 창도 포인트 충전 시트로 연다. 예전 화면의 점검(이용권 < 1 등)이 그대로 맞는다.
import { useEffect, useSyncExternalStore } from "react";
import { authedJsonFetch } from "./member-profile-client";
import { getAiPointsState, openPointsPaywall, setAiPointsBalance, useAiPoints } from "./ai-points";

export type PaymentProvider = "toss" | "payapp" | null;
export type InterviewProduct = { key: string; sessions: number; credits: number; amount: number };
export type InterviewCredits = {
  credits: number;
  perSession: number;
  dailyFreeUsed: boolean;
  paywall: boolean;
  paymentsEnabled: boolean;
  /** 결제 PG — 'payapp'(페이앱: 결제창 주소로 이동) | 'toss'(토스 결제위젯). 옛 API 면 없음(토스로 본다). */
  paymentProvider?: PaymentProvider;
  products: InterviewProduct[];
  logs: { amount: number; reason: string; createdAt: string }[];
  /** 포인트 모드일 때만 — 원래 잔액과 답변 1개 비용. */
  points?: { balance: number; feedbackCost: number; perSetCost: number; questionsCost: number; prepCost: number };
};

let state: InterviewCredits | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function refreshInterviewCredits(): Promise<void> {
  loading = authedJsonFetch<never>("/members/me/interview-credits", { method: "GET" })
    .then((r) => {
      state = r as unknown as InterviewCredits;
      emit();
    })
    .catch(() => undefined)
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** 서버 응답에 실려 온 남은 잔액을 반영. */
export function setInterviewCreditBalance(credits: number | undefined): void {
  // 포인트 모드 — 잔액은 응답의 aiPoints 로 따로 들어온다(lib/ai-points).
  if (getAiPointsState()?.enabled) return;
  if (typeof credits !== "number" || !state) return;
  state = { ...state, credits };
  emit();
}

export function useInterviewCredits(enabled = true): InterviewCredits | null {
  const pts = useAiPoints(enabled);
  const pointsMode = Boolean(pts?.enabled);
  useEffect(() => {
    // 포인트 모드면 이용권 상태는 필요 없다(포인트 상태를 아직 모를 땐 예전처럼 불러 둔다).
    if (enabled && pts && !pts.enabled && !state && !loading) void refreshInterviewCredits();
  }, [enabled, pts]);
  const legacy = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => null
  );
  if (!pts) return null;
  if (!pointsMode) return legacy;
  const feedbackCost = pts.costs.interview_feedback ?? 0;
  return {
    credits: feedbackCost > 0 ? Math.floor(pts.balance / feedbackCost) : 0,
    perSession: pts.perSet,
    dailyFreeUsed: pts.dailyFreeUsed,
    paywall: feedbackCost > 0,
    paymentsEnabled: pts.paymentsEnabled,
    paymentProvider: pts.paymentProvider,
    products: [],
    logs: [],
    points: { balance: pts.balance, feedbackCost, perSetCost: feedbackCost * pts.perSet, questionsCost: pts.costs.interview_questions ?? 0, prepCost: pts.costs.interview_prep ?? 0 }
  };
}

// ── 결제 창 열기 신호 — 어디서든 402(이용권 부족)를 받으면 openInterviewPaywall() ──
const paywallListeners = new Set<(reason: string) => void>();
export function openInterviewPaywall(reason = "needed"): void {
  if (getAiPointsState()?.enabled) {
    openPointsPaywall(reason);
    return;
  }
  paywallListeners.forEach((l) => l(reason));
}
export function onInterviewPaywall(cb: (reason: string) => void): () => void {
  paywallListeners.add(cb);
  return () => paywallListeners.delete(cb);
}
/** 서버가 이용권이 없다고 답했나(402). */
export function isInterviewPaywallError(e: unknown): boolean {
  return (e as { status?: number })?.status === 402;
}

// ── 결제 ──
export async function createPaymentOrder(productKey: string): Promise<{ orderId: string; orderName: string; amount: number; customerKey: string }> {
  return (await authedJsonFetch<never>("/members/me/payments/orders", { method: "POST", body: JSON.stringify({ productKey }) })) as unknown as { orderId: string; orderName: string; amount: number; customerKey: string };
}
/** 페이앱 결제 요청 — 주문을 만들고 페이앱 결제창 주소를 받는다(그 주소로 이동하면 된다). 결제 확정은 페이앱 통보로 서버가 한다. */
export async function requestPayAppPayment(input: { productKey: string; phone: string; back: string }): Promise<{ orderId: string; payurl: string }> {
  return (await authedJsonFetch<never>("/members/me/payments/payapp/request", { method: "POST", body: JSON.stringify(input) })) as unknown as { orderId: string; payurl: string };
}
/** 주문 상태 — 페이앱 결제 뒤 결과 화면이 확정을 기다리며 묻는다. */
export async function getPaymentStatus(orderId: string): Promise<{ status: "READY" | "DONE" | "FAILED" | "CANCELED" | "PARTIAL_CANCELED"; kind: "points" | "interview"; added: number; balance: number; credits: number }> {
  return (await authedJsonFetch<never>(`/members/me/payments/${encodeURIComponent(orderId)}/status`, { method: "GET" })) as unknown as { status: "READY" | "DONE" | "FAILED" | "CANCELED" | "PARTIAL_CANCELED"; kind: "points" | "interview"; added: number; balance: number; credits: number };
}
/** kind="points" 면 credits·balance 는 AI 포인트 잔액, added 는 충전된 포인트. */
export async function confirmPayment(input: { paymentKey: string; orderId: string; amount: number }): Promise<{ kind?: "points"; credits: number; balance?: number; added: number; alreadyDone: boolean }> {
  const r = (await authedJsonFetch<never>("/members/me/payments/confirm", { method: "POST", body: JSON.stringify(input) })) as unknown as { kind?: "points"; credits: number; balance?: number; added: number; alreadyDone: boolean };
  if (r.kind === "points") setAiPointsBalance(r.balance);
  else setInterviewCreditBalance(r.credits);
  return r;
}

// ── 결제 내역 · 환불 ──
export type MyPayment = { id: string; kind?: "points" | "interview"; orderName: string; amount: number; credits: number; status: "DONE" | "CANCELED" | "PARTIAL_CANCELED"; method: string | null; approvedAt: string | null; canceledAt: string | null; canceledAmount: number | null; refundable: boolean };
export async function getMyPayments(): Promise<{ credits: number; points?: number; refundDays: number; items: MyPayment[] }> {
  return (await authedJsonFetch<never>("/members/me/payments", { method: "GET" })) as unknown as { credits: number; points?: number; refundDays: number; items: MyPayment[] };
}
export async function cancelMyPayment(orderId: string, reason?: string): Promise<{ kind?: "points"; refunded: number; credits: number; balance?: number }> {
  const r = (await authedJsonFetch<never>(`/members/me/payments/${encodeURIComponent(orderId)}/cancel`, { method: "POST", body: JSON.stringify({ reason }) })) as unknown as { kind?: "points"; refunded: number; credits: number; balance?: number };
  if (r.kind === "points") setAiPointsBalance(r.balance);
  else setInterviewCreditBalance(r.credits);
  return r;
}
