// 피드 즐겨찾기(북마크) — 공용 피드 글을 저장해 나중에 다시 본다.
// 지금은 localStorage(mock). 저장하는 것은 글 id 목록.
import { useSyncExternalStore } from "react";

const KEY = "talent.feedBookmarks.v1";
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  cache = null;
  listeners.forEach((l) => l());
}

export function isFeedBookmarked(postId: string): boolean {
  return read().includes(postId);
}

export function toggleFeedBookmark(postId: string): void {
  const list = read();
  if (list.includes(postId)) write(list.filter((id) => id !== postId));
  else write([postId, ...list]);
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

export function useFeedBookmarks(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
