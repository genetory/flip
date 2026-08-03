"use client";

// 내 활동 상세 — 계정 설정의 스탯 카드에서 진입. 유형별 목록을 보여준다.
import { useEffect, useMemo, useState } from "react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TCard } from "../ui/primitives";
import { FeedPostList } from "../feed/FeedPostList";
import { PositionCard } from "../jobs/PositionCard";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useFollowing, parseAuthorKey, unfollowAuthor, type FeedAuthor } from "../../../lib/talent/social-graph";
import { roleLabel, useSocialFeed } from "../../../lib/talent/social-feed";
import { useFeedBookmarks } from "../../../lib/talent/feed-bookmarks";
import { getMyFavoritePositions, removeMyFavoritePosition, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";

export type ActivityType = "following-users" | "following-companies" | "favorite-positions" | "favorite-feed";

const TITLES: Record<ActivityType, string> = {
  "following-users": "팔로우한 사용자",
  "following-companies": "관심 회사",
  "favorite-positions": "즐겨찾기한 포지션",
  "favorite-feed": "즐겨찾기한 피드"
};

const EMPTY: Record<ActivityType, string> = {
  "following-users": "피드에서 관심 있는 사람을 팔로우해보세요.",
  "following-companies": "피드에서 관심 있는 회사를 팔로우해보세요.",
  "favorite-positions": "포지션 탐색에서 즐겨찾기한 공고가 여기 모여요.",
  "favorite-feed": "피드에서 즐겨찾기한 글이 여기 모여요."
};

export function ActivityDetailScreen({ type }: { type: string }) {
  const t = (Object.keys(TITLES) as ActivityType[]).includes(type as ActivityType) ? (type as ActivityType) : "following-users";

  const { locale } = useLanguage();
  const following = useFollowing();
  const bookmarks = useFeedBookmarks();
  const feedPosts = useSocialFeed();
  const [favPositions, setFavPositions] = useState<PublicPositionListItem[]>([]);
  const [cipOpen, setCipOpen] = useState(false);

  useEffect(() => {
    void getMyFavoritePositions()
      .then((list) => setFavPositions(list))
      .catch(() => setFavPositions([]));
  }, []);

  // 즐겨찾기 해제 — 목록에서 제거 + 서버 반영.
  function unsavePosition(id: string) {
    setFavPositions((prev) => prev.filter((p) => p.id !== id));
    void removeMyFavoritePosition(id).catch(() => {});
  }

  const followedAuthors = useMemo(
    () => following.map(parseAuthorKey).filter((a): a is FeedAuthor => a !== null),
    [following]
  );
  const followedUsers = followedAuthors.filter((a) => a.role !== "PARTNER");
  const followedCompanies = followedAuthors.filter((a) => a.role === "PARTNER");
  const bookmarkedPosts = useMemo(() => {
    const set = new Set(bookmarks);
    return feedPosts.filter((p) => set.has(p.id));
  }, [bookmarks, feedPosts]);

  const isEmpty =
    (t === "following-users" && followedUsers.length === 0) ||
    (t === "following-companies" && followedCompanies.length === 0) ||
    (t === "favorite-positions" && favPositions.length === 0) ||
    (t === "favorite-feed" && bookmarkedPosts.length === 0);

  return (
    <TalentAppShell maxWidth="4xl">
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{TITLES[t]}</h1>
        </div>

        {isEmpty ? (
          <TCard className="px-5 py-10 text-center text-[13.5px] text-[#8B95A1]">{EMPTY[t]}</TCard>
        ) : t === "favorite-feed" ? (
          // 피드와 동일한 UI/UX로 리스팅.
          <FeedPostList posts={bookmarkedPosts} />
        ) : t === "favorite-positions" ? (
          // 채용공고와 동일한 카드 UI/UX로 리스팅.
          <div className="flex flex-col gap-3">
            {favPositions.map((item) => (
              <PositionCard key={item.id} view={toPositionView(item)} saved onToggleSave={unsavePosition} onShowCip={() => setCipOpen(true)} />
            ))}
          </div>
        ) : (
          <TCard className="divide-y divide-[#F2F4F6]">
            {t === "following-users" && followedUsers.map((a) => <AuthorRow key={`${a.role}::${a.name}`} author={a} />)}
            {t === "following-companies" && followedCompanies.map((a) => <AuthorRow key={`${a.role}::${a.name}`} author={a} />)}
          </TCard>
        )}
      </div>

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
    </TalentAppShell>
  );
}

function AuthorRow({ author }: { author: FeedAuthor }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">{author.name.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-[#191F28]">{author.name}</p>
        <p className="text-[12px] text-[#8B95A1]">{roleLabel(author.role)}</p>
      </div>
      <button type="button" onClick={() => unfollowAuthor(author)} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
        팔로잉
      </button>
    </div>
  );
}

