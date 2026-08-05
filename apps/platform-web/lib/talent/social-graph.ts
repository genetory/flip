// 소셜 그래프 — 피드에서 다른 사용자를 팔로우하고, 팔로잉한 사람의 글만 모아본다.
// 지금은 localStorage(mock): 이 기기의 "나"가 나가는(follow) 엣지만 저장한다.
// 추후 서버(팔로우 관계 테이블)로 교체하면 팔로워 수 등이 전역으로 집계된다.
import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setFollows, snapshotFollows, subscribeDocs, syncUser } from "./renewal-docs-store";
import { useSocialFeed, type FeedAuthorRole } from "./social-feed";
import { addNotification } from "./notifications";
import { notifyFollowedCompany, notifyFollowedUser } from "./activity-log";
import { talentAppRoutes } from "./app-nav";
import { getPublicPositionsPage } from "../member-profile-client";

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

const EMPTY: string[] = [];

// 팔로우 목록 = 계정(서버 Resume.content.renewalFollows) 귀속.
function read(): string[] {
  return snapshotFollows() ?? EMPTY;
}

function write(next: string[]): void {
  setFollows(next);
}

export function isFollowing(author: FeedAuthor): boolean {
  return read().includes(authorKey(author));
}

export function followAuthor(author: FeedAuthor): void {
  const key = authorKey(author);
  const list = read();
  if (list.includes(key)) return;
  write([key, ...list]);
  // 내 활동 알림 — 회사(PARTNER)면 관심 회사, 아니면 사용자 팔로우.
  if (author.role === "PARTNER") notifyFollowedCompany(author.name);
  else notifyFollowedUser(author.name);
}

export function unfollowAuthor(author: FeedAuthor): void {
  const key = authorKey(author);
  write(read().filter((k) => k !== key));
}

export function toggleFollow(author: FeedAuthor): void {
  if (isFollowing(author)) unfollowAuthor(author);
  else followAuthor(author);
}

// 내가 팔로잉하는 사람 키 목록(계정 귀속, useSyncExternalStore로 화면 간 동기화).
export function useFollowing(): string[] {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotFollows, () => null) ?? EMPTY;
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

const COMPANY_POS_SEEN_KEY = "talent.notifications.companyPositionsSeen.v1";

// 관심 회사(팔로우한 PARTNER)의 새 포지션을 알림으로 적재.
// 회사별 기준선(본 포지션 id 집합)을 저장해, 새로 팔로우한 회사는 조용히 기준선만 잡고
// 이미 추적 중인 회사에 새 공고가 뜨면 알림한다(팔로우 시 폭주 방지).
export function useFollowCompanyPositionNotifications(): void {
  const following = useFollowing();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const companies = Array.from(
      new Set(
        following
          .map(parseAuthorKey)
          .filter((a): a is FeedAuthor => a?.role === "PARTNER")
          .map((a) => a.name.trim())
          .filter(Boolean)
      )
    );
    if (companies.length === 0) return;

    let alive = true;
    void (async () => {
      let seen: Record<string, string[]>;
      try {
        seen = JSON.parse(window.localStorage.getItem(COMPANY_POS_SEEN_KEY) ?? "{}") as Record<string, string[]>;
      } catch {
        seen = {};
      }
      const next: Record<string, string[]> = {};

      for (const name of companies) {
        const page = await getPublicPositionsPage({ search: name, limit: 100 }).catch(() => null);
        if (!alive) return;
        // 검색은 제목/직무도 매칭하므로 회사명이 정확히 일치하는 공고만.
        const ids = (page?.items ?? [])
          .filter((p) => (p.partnerOrganization?.name || p.sourceCompanyName) === name)
          .map((p) => ({ id: p.id, title: p.title }));

        const prev = seen[name];
        if (prev === undefined) {
          // 새로 추적하는 회사 → 기준선만(알림 X).
          next[name] = ids.map((i) => i.id);
        } else {
          const prevSet = new Set(prev);
          for (const i of ids) {
            if (prevSet.has(i.id)) continue;
            addNotification({
              emoji: "💼",
              title: `${name}의 새 포지션`,
              body: i.title,
              href: `${talentAppRoutes.jobs}/${i.id}`,
              dedupeKey: `companypos:${i.id}`
            });
          }
          // 관심 유지 동안 계속 추적하도록 합집합 저장.
          next[name] = Array.from(new Set([...prev, ...ids.map((i) => i.id)]));
        }
      }
      if (!alive) return;
      window.localStorage.setItem(COMPANY_POS_SEEN_KEY, JSON.stringify(next));
    })();

    return () => {
      alive = false;
    };
  }, [following]);
}
