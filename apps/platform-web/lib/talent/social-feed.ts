// 커뮤니티 피드 — Talent·Partner 모두가 글을 쓰는 공용 피드.
// 지금은 localStorage(mock). 추후 서버(community posts)로 교체.
import { useSyncExternalStore } from "react";

export type FeedAuthorRole = "STUDENT" | "OPERATOR" | "PARTNER";

export interface FeedPost {
  id: string;
  authorName: string;
  authorRole: FeedAuthorRole;
  text: string;
  createdAt: number;
}

const KEY = "talent.socialFeed.v1";
const EMPTY: FeedPost[] = [];

const listeners = new Set<() => void>();
let cache: FeedPost[] | null = null;

function read(): FeedPost[] {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as FeedPost[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function emit() {
  cache = null;
  listeners.forEach((l) => l());
}

export function addFeedPost(input: { authorName: string; authorRole: FeedAuthorRole; text: string }): FeedPost | null {
  const text = input.text.trim();
  if (!text) return null;
  const post: FeedPost = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    authorName: input.authorName.trim() || "익명",
    authorRole: input.authorRole,
    text,
    createdAt: Date.now()
  };
  const next = [post, ...read()];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  emit();
  return post;
}

export function removeFeedPost(id: string): void {
  const next = read().filter((p) => p.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  emit();
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

export function useSocialFeed(): FeedPost[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function roleLabel(role: FeedAuthorRole): string {
  return role === "PARTNER" ? "기업" : role === "OPERATOR" ? "운영자" : "학생";
}
