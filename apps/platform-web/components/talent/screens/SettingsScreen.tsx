"use client";

// 내 프로필 — 프로필 허브. 프로필 요약 + 내 커리어(이력서·자소서) + 관심 직무 +
// 지원 현황 + 내 활동 + 알림 + 계정. 각 섹션은 관련 상세 화면으로 이어진다.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CaretRight, SealCheck, SignOut, PencilSimple } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { CareerFunnelCards } from "../career/CareerFunnelCards";
import { TCard } from "../ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useFollowing, parseAuthorKey, type FeedAuthor } from "../../../lib/talent/social-graph";
import { useFollowedCompanies } from "../../../lib/talent/company-follow";
import { useSocialFeed } from "../../../lib/talent/social-feed";
import { useFeedBookmarks } from "../../../lib/talent/feed-bookmarks";
import { getMyFavoritePositions, type PublicPositionListItem } from "../../../lib/member-profile-client";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// 섹션 헤더 — 타이틀.
function SectionHeader({ title }: { title: string }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</p>;
}

// 섹션 하단 더 보기 버튼 — 홈 포지션 리스트 하단 버튼과 동일한 스타일.
function MoreLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="mt-3 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
      {label} <CaretRight className="h-4 w-4" weight="bold" />
    </Link>
  );
}

// 스탯 카드 — 라벨 + 큰 갯수. 누르면 관련 상세 목록으로.
function StatCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-[#EEF1F5] bg-white px-5 py-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-normal text-[#8B95A1]">{title}</p>
        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
      </div>
      <p className="mt-0.5 text-[24px] font-black tracking-[-0.02em] text-[#191F28]">{count}</p>
    </Link>
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
  const emailVerified = Boolean(user?.emailVerified);

  // 사용자 팔로우는 social-graph(클라), 관심 회사는 서버(company-follow).
  const followedAuthors = following.map(parseAuthorKey).filter((a): a is FeedAuthor => a !== null);
  const followedUsers = followedAuthors.filter((a) => a.role !== "PARTNER");
  const followedCompanies = useFollowedCompanies();

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
      <div className="flex flex-col gap-12">
        {/* 기본 정보 */}
        <section>
          <SectionHeader title="기본 정보" />
          <div className="rounded-3xl bg-[#F5F8FF] p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
              {name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</p>
                {emailVerified ? (
                  <SealCheck className="h-[18px] w-[18px] shrink-0 text-[#0B46E8]" weight="fill" aria-label="이메일 인증됨" />
                ) : (
                  <span className="shrink-0 rounded-md bg-[#FFF3E6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">인증 안됨</span>
                )}
              </div>
              {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
            </div>
            <Link
              href={talentAppRoutes.profile}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] shadow-[0_2px_10px_rgba(11,18,39,0.06)] transition hover:text-[#0B46E8]"
            >
              <PencilSimple className="h-4 w-4" /> 프로필 편집
            </Link>
          </div>
          </div>
        </section>

        {/* 내 활동 — 팔로우/관심(SNS 스타일 묶음). 프로필 카드 바로 아래. */}
        <section>
          <SectionHeader title="내 활동" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="팔로우한 사용자" count={followedUsers.length} href="/talent/activity/following-users" />
            <StatCard title="관심 회사" count={followedCompanies.length} href="/talent/activity/following-companies" />
            <StatCard title="즐겨찾기한 포지션" count={favPositions.length} href="/talent/activity/favorite-positions" />
            <StatCard title="즐겨찾기한 피드" count={bookmarkedPosts.length} href="/talent/activity/favorite-feed" />
          </div>
        </section>

        {/* 내 커리어 — 이력서/자기소개서 (커리어 상세로 연결) */}
        <section>
          <SectionHeader title="내 커리어" />
          <CareerFunnelCards showPreview />
          <MoreLink label="내 커리어 더 보기" href={talentAppRoutes.career} />
        </section>

        {/* 관심 직무 */}
        <section>
          <SectionHeader title="관심 직무" />
          <JobInterestCard variant="edit" />
        </section>

        {/* 알림 */}
        <section>
          <SectionHeader title="알림" />
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
          <MoreLink label="알림함 열기" href={talentAppRoutes.notifications} />
        </section>

        {/* 계정 */}
        <section>
          <SectionHeader title="계정" />
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label="계정 정보 관리" href={getAccountUrl()} />
            <Item label="개인정보처리방침" href="/legal/privacy" />
            <Item label="이용약관" href="/legal/terms" />
          </TCard>
        </section>

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
