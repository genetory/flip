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
import { useSocialFeed } from "../../../lib/talent/social-feed";
import { useFeedBookmarks } from "../../../lib/talent/feed-bookmarks";
import { getMyFavoritePositions, getMyApplications, type PublicPositionListItem, type MyApplication } from "../../../lib/member-profile-client";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

// 섹션 헤더 — 타이틀 + (선택) 우측 액션 링크.
function SectionHeader({ title, action }: { title: string; action?: { label: string; href: string } }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</p>
      {action ? (
        <Link href={action.href} className="inline-flex items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:text-[#0A3ECB]">
          {action.label}
          <CaretRight className="h-3.5 w-3.5" weight="bold" />
        </Link>
      ) : null}
    </div>
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
  const [applications, setApplications] = useState<MyApplication[]>([]);

  const name = user?.realName || user?.name || "나";
  const verified = user?.contactVerified || user?.emailVerified;

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

  // 실제 지원 내역(서버) 로드 — 지원 페이지와 동일한 데이터.
  useEffect(() => {
    void getMyApplications()
      .then((list) => setApplications(list))
      .catch(() => setApplications([]));
  }, []);

  const appCounts = useMemo(
    () => ({
      all: applications.length,
      submitted: applications.filter((a) => a.status === "SUBMITTED").length,
      interview: applications.filter((a) => a.status === "INTERVIEW").length,
      result: applications.filter((a) => a.status === "ACCEPTED" || a.status === "REJECTED").length
    }),
    [applications]
  );

  // 즐겨찾기한 피드 = 북마크 id ∩ 현재 피드 글(최신순 유지).
  const bookmarkedPosts = useMemo(() => {
    const set = new Set(bookmarks);
    return feedPosts.filter((p) => set.has(p.id));
  }, [bookmarks, feedPosts]);

  return (
    <TalentAppShell maxWidth="4xl">
      <div className="flex flex-col gap-10">
        {/* 프로필 히어로 */}
        <div className="rounded-3xl bg-[#F5F8FF] p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
              {name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</p>
                {verified ? <SealCheck className="h-[18px] w-[18px] shrink-0 text-[#0B46E8]" weight="fill" /> : null}
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

        {/* 내 커리어 — 이력서/자기소개서 (커리어 상세로 연결) */}
        <section>
          <SectionHeader title="내 커리어" action={{ label: "커리어 홈", href: talentAppRoutes.career }} />
          <CareerFunnelCards showPreview />
        </section>

        {/* 관심 직무 (자체 헤더) */}
        <JobInterestCard variant="edit" />

        {/* 지원 현황 — 지원 페이지와 동일한 실제 데이터. 카드 클릭 시 해당 탭으로 이동. */}
        <section>
          <SectionHeader title="지원 현황" action={{ label: "전체 보기", href: talentAppRoutes.applications }} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="전체 지원" count={appCounts.all} href={talentAppRoutes.applications} />
            <StatCard title="지원 완료" count={appCounts.submitted} href={`${talentAppRoutes.applications}?tab=submitted`} />
            <StatCard title="면접" count={appCounts.interview} href={`${talentAppRoutes.applications}?tab=interview`} />
            <StatCard title="결과" count={appCounts.result} href={`${talentAppRoutes.applications}?tab=result`} />
          </div>
        </section>

        {/* 내 활동 — 팔로우/관심(SNS 스타일 묶음) */}
        <section>
          <SectionHeader title="내 활동" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="팔로우한 사용자" count={followedUsers.length} href="/talent/activity/following-users" />
            <StatCard title="관심 회사" count={followedCompanies.length} href="/talent/activity/following-companies" />
            <StatCard title="즐겨찾기한 포지션" count={favPositions.length} href="/talent/activity/favorite-positions" />
            <StatCard title="즐겨찾기한 피드" count={bookmarkedPosts.length} href="/talent/activity/favorite-feed" />
          </div>
        </section>

        {/* 알림 */}
        <section>
          <SectionHeader title="알림" action={{ label: "알림함", href: talentAppRoutes.notifications }} />
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
