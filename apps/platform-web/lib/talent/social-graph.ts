// 소셜 그래프 — 피드에서 다른 사용자를 팔로우하고, 팔로잉한 사람의 글만 모아본다.
// 지금은 localStorage(mock): 이 기기의 "나"가 나가는(follow) 엣지만 저장한다.
// 추후 서버(팔로우 관계 테이블)로 교체하면 팔로워 수 등이 전역으로 집계된다.
import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { useSocialFeed, type FeedAuthorRole } from "./social-feed";
import { addNotification } from "./notifications";
import { talentAppRoutes } from "./app-nav";

export interface FeedAuthor {
  name: string;
  role: FeedAuthorRole;
}

// 글쓴이 식별 키 — 안정적인 유저 ID가 없는 mock이라 역할+이름으로 대체.
export function authorKey(author: FeedAuthor): string {
  return `${author.role}::${author.name.trim()}`;
}

// authorKey 문자열 → FeedAuthor. 형식이 아니면 null.
export function parseAuthorKey(key: string): FeedAuthor | null {
  const idx = key.indexOf("::");
  if (idx < 0) return null;
  const role = key.slice(0, idx) as FeedAuthorRole;
  const name = key.slice(idx + 2);
  if (!name) return null;
  return { name, role };
}

const KEY = "talent.following.v1";
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

export function isFollowing(author: FeedAuthor): boolean {
  return read().includes(authorKey(author));
}

export function followAuthor(author: FeedAuthor): void {
  const key = authorKey(author);
  const list = read();
  if (list.includes(key)) return;
  write([key, ...list]);
}

export function unfollowAuthor(author: FeedAuthor): void {
  const key = authorKey(author);
  write(read().filter((k) => k !== key));
}

export function toggleFollow(author: FeedAuthor): void {
  if (isFollowing(author)) unfollowAuthor(author);
  else followAuthor(author);
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

// 내가 팔로잉하는 사람 키 목록(useSyncExternalStore로 화면 간 동기화).
export function useFollowing(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

const WATERMARK_KEY = "talent.notifications.feedWatermark.v1";

// 팔로잉한 사람이 새 글을 올리면 알림으로 적재. 앱 셸에 마운트해 백그라운드로 감시한다.
// 기준선(watermark) 이후 생성된 글만 알림 처리해 최초 로드·과거 글 폭주를 막는다.
export function useFollowFeedNotifications(me: FeedAuthor | null): void {
  const posts = useSocialFeed();
  const following = useFollowing();
  const meKey = me ? authorKey(me) : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(WATERMARK_KEY);
    const watermark = stored !== null ? Number(stored) : NaN;

    // 최초 실행: 기존 글을 알림으로 쏟지 않도록 현재 최대 시각으로 기준선만 세운다.
    if (!Number.isFinite(watermark)) {
      const maxTs = posts.reduce((m, p) => Math.max(m, p.createdAt), 0);
      window.localStorage.setItem(WATERMARK_KEY, String(maxTs));
      return;
    }

    const followSet = new Set(following);
    let newMax = watermark;
    for (const p of posts) {
      if (p.createdAt <= watermark) continue;
      newMax = Math.max(newMax, p.createdAt);
      const key = authorKey({ name: p.authorName, role: p.authorRole });
      if (key === meKey) continue; // 내 글은 알림 X
      if (!followSet.has(key)) continue; // 팔로잉 안 한 사람 X
      addNotification({
        emoji: "💬",
        title: `${p.authorName}님이 새 글을 남겼어요`,
        body: p.text,
        href: talentAppRoutes.feed,
        createdAt: p.createdAt,
        dedupeKey: `feedpost:${p.id}`
      });
    }
    if (newMax > watermark) window.localStorage.setItem(WATERMARK_KEY, String(newMax));
  }, [posts, following, meKey]);
}
