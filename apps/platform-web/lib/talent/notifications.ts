// 알림 스토어 — 활동 알림을 쌓아둔다(지금은 localStorage mock, 추후 서버 푸시).
// 현재는 "팔로잉한 사람의 새 피드 글" 알림을 여기에 적재한다.
import { useSyncExternalStore } from "react";

export interface Notification {
  id: string;
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
  emoji: string;
  title: string;
  body: string;
  href: string;
  createdAt?: number;
  dedupeKey?: string;
}): void {
  const list = read();
  const id = input.dedupeKey ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (input.dedupeKey && list.some((n) => n.id === id)) return;
  const entry: Notification = {
    id,
    emoji: input.emoji,
    title: input.title,
    body: input.body,
    href: input.href,
    createdAt: input.createdAt ?? Date.now(),
    unread: true
  };
  persist([entry, ...list].sort((a, b) => b.createdAt - a.createdAt));
}

export function markAllNotificationsRead(): void {
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
