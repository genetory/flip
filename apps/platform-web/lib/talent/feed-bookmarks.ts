// 피드 즐겨찾기(북마크) — 공용 피드 글을 저장해 나중에 다시 본다.
// 저장은 계정(서버 Resume.content.renewalBookmarks)에 귀속된다. 글 id 목록만 보관.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setBookmarks, snapshotBookmarks, subscribeDocs, syncUser } from "./renewal-docs-store";
import { notifySavedFeed } from "./activity-log";

const EMPTY: string[] = [];

export function isFeedBookmarked(postId: string): boolean {
  return (snapshotBookmarks() ?? []).includes(postId);
}

export function toggleFeedBookmark(postId: string): void {
  const list = snapshotBookmarks() ?? [];
  if (list.includes(postId)) {
    setBookmarks(list.filter((id) => id !== postId));
  } else {
    setBookmarks([postId, ...list]);
    notifySavedFeed(postId); // 내 활동 알림 — 저장할 때만.
  }
}

export function useFeedBookmarks(): string[] {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotBookmarks, () => null) ?? EMPTY;
}
