// 알림 스토어 — 알림함(벨) 표시용. 서버 알림(지원상태·면접·메시지·새 포지션)을
// 앱 진입 시 하이드레이트하고(useServerNotificationSync), 팔로우·내 활동 등 클라이언트
// 유래 알림도 함께 적재한다. localStorage 는 표시 캐시로만 쓴다.
import { useSyncExternalStore } from "react";
import { markAllServerNotificationsRead } from "../member-profile-client";

// 활동(내가 한 행동) vs 소식(팔로잉 새 글·회사 새 공고).
export type NotificationKind = "activity" | "update";

export interface Notification {
  id: string;
  kind: NotificationKind;
  emoji: string;
  title: string;
  body: string;
  href: string;
  createdAt: number;
  unread: boolean;
}

const KEY = "talent.notifications.v1";
const EMPTY: Notification[] = [];
const MAX = 100;

const listeners = new Set<() => void>();
let cache: Notification[] | null = null;

function read(): Notification[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Notification[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(next: Notification[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
  } catch {
    /* noop */
  }
  cache = null;
  listeners.forEach((l) => l());
}

// dedupeKey 로 같은 알림 중복 적재를 막는다(예: 같은 피드 글).
export function addNotification(input: {
  kind?: NotificationKind;
  emoji: string;
  title: string;
  body: string;
  href: string;
  createdAt?: number;
  dedupeKey?: string;
  unread?: boolean;
}): void {
  const list = read();
  const id = input.dedupeKey ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (input.dedupeKey && list.some((n) => n.id === id)) return;
  const entry: Notification = {
    id,
    kind: input.kind ?? "update",
    emoji: input.emoji,
    title: input.title,
    body: input.body,
    href: input.href,
    createdAt: input.createdAt ?? Date.now(),
    unread: input.unread ?? true
  };
  persist([entry, ...list].sort((a, b) => b.createdAt - a.createdAt));
}

// 계정 전환 시 알림함 비우기(다른 계정 알림 잔존 방지).
export function resetNotifications(): void {
  persist([]);
}

export function markAllNotificationsRead(): void {
  // 서버 알림도 읽음 처리(벨 카운트 동기화).
  void markAllServerNotificationsRead().catch(() => {});
  const list = read();
  if (!list.some((n) => n.unread)) return;
  persist(list.map((n) => ({ ...n, unread: false })));
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useNotifications(): Notification[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useUnreadNotificationCount(): number {
  return useNotifications().filter((n) => n.unread).length;
}
