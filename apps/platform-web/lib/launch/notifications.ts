// Career Launch 전용 알림 스토어 — talent/partner 알림과 완전히 분리(자체 localStorage 키).
// 서버 알림에 연동하지 않고, 대시보드가 프로그램 상태(주차 열림·세미나·결과물)에서
// 파생 알림을 멱등(dedupeKey)으로 적재한다. 파일럿 범위라 클라이언트 유래만 담는다.
import { useSyncExternalStore } from "react";

export interface LaunchNotification {
  id: string;
  emoji: string;
  title: string;
  body: string;
  href: string;
  createdAt: number;
  unread: boolean;
}

const KEY = "launch.notifications.v1";
const EMPTY: LaunchNotification[] = [];
const MAX = 60;

const listeners = new Set<() => void>();
let cache: LaunchNotification[] | null = null;

function read(): LaunchNotification[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as LaunchNotification[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(next: LaunchNotification[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
  } catch {
    /* noop */
  }
  cache = null;
  listeners.forEach((l) => l());
}

// dedupeKey 로 같은 알림(같은 주차·세미나·결과물) 중복 적재를 막는다.
export function addLaunchNotification(input: {
  emoji: string;
  title: string;
  body: string;
  href: string;
  createdAt?: number;
  dedupeKey: string;
  unread?: boolean;
}): void {
  const list = read();
  if (list.some((n) => n.id === input.dedupeKey)) return;
  const entry: LaunchNotification = {
    id: input.dedupeKey,
    emoji: input.emoji,
    title: input.title,
    body: input.body,
    href: input.href,
    createdAt: input.createdAt ?? Date.now(),
    unread: input.unread ?? true
  };
  persist([entry, ...list].sort((a, b) => b.createdAt - a.createdAt));
}

// 계정 전환 시 비우기(다른 학생 알림 잔존 방지).
export function resetLaunchNotifications(): void {
  persist([]);
}

// 알림함 소유자(로그인 userId)를 localStorage에 저장 → 서버 재하이드레이트가 없는
// career-launch에서 '계정이 실제로 바뀔 때만' 초기화(새로고침으로 날아가지 않게).
const OWNER_KEY = "launch.notifications.owner.v1";
export function ensureLaunchNotificationsOwner(userId: string | null): void {
  if (typeof window === "undefined") return;
  const cur = userId ?? "";
  let prev: string | null = null;
  try {
    prev = window.localStorage.getItem(OWNER_KEY);
  } catch {
    return;
  }
  if (prev === cur) return;
  try {
    window.localStorage.setItem(OWNER_KEY, cur);
  } catch {
    /* noop */
  }
  if (prev !== null) resetLaunchNotifications(); // 소유자 변경 시에만(최초 1회는 유지)
}

export function markLaunchNotificationRead(id: string): void {
  const list = read();
  if (!list.some((n) => n.id === id && n.unread)) return;
  persist(list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
}

export function markAllLaunchNotificationsRead(): void {
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

export function useLaunchNotifications(): LaunchNotification[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useUnreadLaunchCount(): number {
  return useLaunchNotifications().filter((n) => n.unread).length;
}
