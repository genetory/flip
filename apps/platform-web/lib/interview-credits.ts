"use client";

// 모의 면접 이용권 — 잔액·상품(서버 GET /members/me/interview-credits), 결제 주문·승인, 결제 창 열기 신호.
// 단위는 '답변 피드백 1개'(이용권 1회 = perSession 개). 피드백·예상 질문 응답에 남은 잔액이 실려 와 바로 반영한다.
import { useEffect, useSyncExternalStore } from "react";
import { authedJsonFetch } from "./member-profile-client";

export type InterviewProduct = { key: string; sessions: number; credits: number; amount: number };
export type InterviewCredits = {
  credits: number;
  perSession: number;
  dailyFreeUsed: boolean;
  paywall: boolean;
  paymentsEnabled: boolean;
  products: InterviewProduct[];
  logs: { amount: number; reason: string; createdAt: string }[];
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
  if (typeof credits !== "number" || !state) return;
  state = { ...state, credits };
  emit();
}

export function useInterviewCredits(enabled = true): InterviewCredits | null {
  useEffect(() => {
    if (enabled && !state && !loading) void refreshInterviewCredits();
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

// ── 결제 창 열기 신호 — 어디서든 402(이용권 부족)를 받으면 openInterviewPaywall() ──
const paywallListeners = new Set<(reason: string) => void>();
export function openInterviewPaywall(reason = "needed"): void {
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
export async function confirmPayment(input: { paymentKey: string; orderId: string; amount: number }): Promise<{ credits: number; added: number; alreadyDone: boolean }> {
  const r = (await authedJsonFetch<never>("/members/me/payments/confirm", { method: "POST", body: JSON.stringify(input) })) as unknown as { credits: number; added: number; alreadyDone: boolean };
  setInterviewCreditBalance(r.credits);
  return r;
}
