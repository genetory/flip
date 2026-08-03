"use client";

// 계정 설정 — 프로필 요약, 알림(mock), 계정 관리, 로그아웃.
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CaretRight, SignOut, Buildings } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { TCard, TPageHeader } from "../ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useFollowing, parseAuthorKey, unfollowAuthor, type FeedAuthor } from "../../../lib/talent/social-graph";
import { roleLabel, useSocialFeed } from "../../../lib/talent/social-feed";
import { useFeedBookmarks, toggleFeedBookmark } from "../../../lib/talent/feed-bookmarks";
import { getMyFavoritePositions, type PublicPositionListItem } from "../../../lib/member-profile-client";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// 내 활동 공용 래퍼 — 라벨 + 큰 갯수(스탯). 항목이 있으면 아래에 리스트만.
function ActivitySection({ title, count, children }: { title: string; count: number; children?: ReactNode }) {
  return (
    <TCard className="overflow-hidden">
      <div className="px-5 pb-4 pt-4">
        <p className="text-[12.5px] font-normal text-[#8B95A1]">{title}</p>
        <p className="mt-0.5 text-[24px] font-black tracking-[-0.02em] text-[#191F28]">{count}</p>
      </div>
      {count > 0 ? <div className="divide-y divide-[#F2F4F6]">{children}</div> : null}
    </TCard>
  );
}

function FollowList({ title, authors }: { title: string; authors: FeedAuthor[] }) {
  return (
    <ActivitySection title={title} count={authors.length}>
      {authors.map((a) => (
        <div key={`${a.role}::${a.name}`} className="flex items-center gap-3 px-5 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">{a.name.slice(0, 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-[#191F28]">{a.name}</p>
            <p className="text-[12px] text-[#8B95A1]">{roleLabel(a.role)}</p>
          </div>
          <button type="button" onClick={() => unfollowAuthor(a)} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
            팔로잉
          </button>
        </div>
      ))}
    </ActivitySection>
  );
}

function FavoritePositionsList({ positions }: { positions: PublicPositionListItem[] }) {
  return (
    <ActivitySection title="즐겨찾기한 포지션" count={positions.length}>
      {positions.map((p) => {
        // 자체(내부) 공고는 상세로, 외부는 원본 URL 새 창.
        const isExternal = !(p.sourceProvider === "INTERNAL" && p.sourceKind !== "EXTERNAL") && !!p.sourceUrl;
        const inner = (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[#B0B8C1]"><Buildings className="h-4.5 w-4.5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-[#191F28]">{p.title}</p>
              {p.partnerOrganization?.name ? <p className="truncate text-[12px] text-[#8B95A1]">{p.partnerOrganization.name}</p> : null}
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
          </>
        );
        const cls = "flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#F6F8FB]";
        return isExternal ? (
          <a key={p.id} href={p.sourceUrl!} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
        ) : (
          <Link key={p.id} href={`${talentAppRoutes.jobs}/${p.id}`} className={cls}>{inner}</Link>
        );
      })}
    </ActivitySection>
  );
}

function FavoriteFeedList({ posts }: { posts: { id: string; authorName: string; text: string }[] }) {
  return (
    <ActivitySection title="즐겨찾기한 피드" count={posts.length}>
      {posts.map((p) => (
        <div key={p.id} className="flex items-start gap-3 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-[#8B95A1]">{p.authorName}</p>
            <p className="mt-0.5 line-clamp-2 break-keep text-[13.5px] leading-relaxed text-[#333D4B]">{p.text}</p>
          </div>
          <button type="button" onClick={() => toggleFeedBookmark(p.id)} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
            저장됨
          </button>
        </div>
      ))}
    </ActivitySection>
  );
}

function Item({ label, href, value }: { label: string; href?: string; value?: string }) {
  const inner = (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex-1 text-[14.5px] text-[#191F28]">{label}</span>
      {value ? <span className="text-[13px] text-[#8B95A1]">{value}</span> : null}
      {href ? <CaretRight className="h-4 w-4 text-[#C4CAD2]" /> : null}
    </div>
  );
  if (href) return <Link href={href} className="block transition hover:bg-[#F6F8FB]">{inner}</Link>;
  return inner;
}

export function SettingsScreen() {
  const { user, logout, getAccountUrl } = useAuthSession();
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const following = useFollowing();
  const bookmarks = useFeedBookmarks();
  const feedPosts = useSocialFeed();
  const [favPositions, setFavPositions] = useState<PublicPositionListItem[]>([]);

  const name = user?.realName || user?.name || "나";

  // 팔로우 스토어를 역할로 분리: PARTNER = 관심 회사, 그 외 = 팔로우한 사용자.
  const followedAuthors = following.map(parseAuthorKey).filter((a): a is FeedAuthor => a !== null);
  const followedCompanies = followedAuthors.filter((a) => a.role === "PARTNER");
  const followedUsers = followedAuthors.filter((a) => a.role !== "PARTNER");

  // 즐겨찾기한 포지션(서버) 로드.
  useEffect(() => {
    void getMyFavoritePositions()
      .then((list) => setFavPositions(list))
      .catch(() => setFavPositions([]));
  }, []);

  // 즐겨찾기한 피드 = 북마크 id ∩ 현재 피드 글(최신순 유지).
  const bookmarkedPosts = useMemo(() => {
    const set = new Set(bookmarks);
    return feedPosts.filter((p) => set.has(p.id));
  }, [bookmarks, feedPosts]);

  return (
    <TalentAppShell maxWidth="4xl">
      <TPageHeader title="계정 설정" />

      <div className="flex flex-col gap-4">
        {/* 프로필 요약 */}
        <TCard className="flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px] font-black text-[#0B46E8]">{name.slice(0, 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[#191F28]">{name}</p>
            {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
          </div>
          <Link href={talentAppRoutes.profile} className="rounded-lg bg-[#F2F4F6] px-3 py-2 text-[13px] font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">
            프로필 편집
          </Link>
        </TCard>

        {/* 관심 직무 */}
        <JobInterestCard variant="edit" />

        {/* 내 활동 — 팔로우/관심(SNS 스타일 묶음) */}
        <section>
          <p className="mb-2.5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">내 활동</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <FollowList title="팔로우한 사용자" authors={followedUsers} />
            <FollowList title="관심 회사" authors={followedCompanies} />
            <FavoritePositionsList positions={favPositions} />
            <FavoriteFeedList posts={bookmarkedPosts} />
          </div>
        </section>

        {/* 알림 */}
        <div>
          <p className="mb-2.5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">알림</p>
          <TCard className="divide-y divide-[#F2F4F6]">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">추천 공고 알림</span>
              <Toggle on={pushOn} onChange={setPushOn} label="추천 공고 알림" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">이메일 소식 받기</span>
              <Toggle on={emailOn} onChange={setEmailOn} label="이메일 소식 받기" />
            </div>
          </TCard>
        </div>

        {/* 계정 */}
        <div>
          <p className="mb-2.5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">계정</p>
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label="계정 정보 관리" href={getAccountUrl()} />
            <Item label="개인정보처리방침" href="/legal/privacy" />
            <Item label="이용약관" href="/legal/terms" />
          </TCard>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white py-4 text-[14px] font-semibold text-[#F04452] transition hover:bg-[#FFF5F5]"
        >
          <SignOut className="h-[18px] w-[18px]" /> 로그아웃
        </button>
      </div>
    </TalentAppShell>
  );
}
