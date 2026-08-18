"use client";

// 내 활동 상세 — 계정 설정의 스탯 카드에서 진입. 유형별 목록을 보여준다.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TCard } from "../ui/primitives";
import { FeedPostList } from "../feed/FeedPostList";
import { PositionCard } from "../jobs/PositionCard";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useFollowing, parseAuthorKey, unfollowAuthor, type FeedAuthor } from "../../../lib/talent/social-graph";
import { useFollowedCompanies, unfollowCompanyName } from "../../../lib/talent/company-follow";
import { roleLabel, useSocialFeed } from "../../../lib/talent/social-feed";
import { useFeedBookmarks } from "../../../lib/talent/feed-bookmarks";
import { getMyFavoritePositions, getPublicPositionsPage, removeMyFavoritePosition, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

export type ActivityType = "following-users" | "following-companies" | "favorite-positions" | "favorite-feed";

function titles(t: PlatformT): Record<ActivityType, string> {
  return {
    "following-users": t("팔로우한 사용자", "Following", "关注的人", "Đang theo dõi", "フォロー中のユーザー", "Yang diikuti"),
    "following-companies": t("관심 회사", "Companies", "关注的公司", "Công ty quan tâm", "関心のある会社", "Perusahaan diminati"),
    "favorite-positions": t("즐겨찾기한 포지션", "Saved positions", "收藏的职位", "Vị trí đã lưu", "保存したポジション", "Posisi tersimpan"),
    "favorite-feed": t("즐겨찾기한 피드", "Saved posts", "收藏的动态", "Bài đã lưu", "保存したフィード", "Postingan tersimpan")
  };
}

function empties(t: PlatformT): Record<ActivityType, string> {
  return {
    "following-users": t("피드에서 관심 있는 사람을 팔로우해보세요.", "Follow people you're interested in from the feed.", "在动态中关注你感兴趣的人。", "Theo dõi người bạn quan tâm từ bảng tin.", "フィードで気になる人をフォローしてみましょう。", "Ikuti orang yang kamu minati dari feed."),
    "following-companies": t("피드에서 관심 있는 회사를 팔로우해보세요.", "Follow companies you're interested in from the feed.", "在动态中关注你感兴趣的公司。", "Theo dõi công ty bạn quan tâm từ bảng tin.", "フィードで気になる会社をフォローしてみましょう。", "Ikuti perusahaan yang kamu minati dari feed."),
    "favorite-positions": t("포지션 탐색에서 즐겨찾기한 공고가 여기 모여요.", "Positions you save while browsing appear here.", "你在浏览职位时收藏的招聘会汇集在这里。", "Các vị trí bạn lưu khi tìm sẽ tập hợp ở đây.", "ポジション探しで保存した求人がここに集まります。", "Posisi yang kamu simpan saat menjelajah muncul di sini."),
    "favorite-feed": t("피드에서 즐겨찾기한 글이 여기 모여요.", "Posts you save from the feed appear here.", "你在动态中收藏的帖子汇集在这里。", "Bài bạn lưu từ bảng tin sẽ tập hợp ở đây.", "フィードで保存した投稿がここに集まります。", "Postingan yang kamu simpan dari feed muncul di sini.")
  };
}

export function ActivityDetailScreen({ type }: { type: string }) {
  const tr = usePlatformT();
  const activityTypes: ActivityType[] = ["following-users", "following-companies", "favorite-positions", "favorite-feed"];
  const t = activityTypes.includes(type as ActivityType) ? (type as ActivityType) : "following-users";

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
  const followedCompanies = useFollowedCompanies(); // 서버 관심 회사(이름)
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
      <div className="flex flex-col gap-10">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{titles(tr)[t]}</h1>
        </div>

        {isEmpty ? (
          <TCard className="px-5 py-10 text-center text-[13.5px] text-[#8B95A1]">{empties(tr)[t]}</TCard>
        ) : t === "favorite-feed" ? (
          // 피드와 동일한 UI/UX로 리스팅.
          <FeedPostList posts={bookmarkedPosts} />
        ) : t === "favorite-positions" ? (
          // 채용공고와 동일한 카드 UI/UX로 리스팅.
          <div className="flex flex-col gap-3">
            {favPositions.map((item) => (
              <PositionCard key={item.id} view={toPositionView(item, tr)} saved onToggleSave={unsavePosition} onShowCip={() => setCipOpen(true)} />
            ))}
          </div>
        ) : t === "following-companies" ? (
          // 포지션 아이템과 비슷한 느낌의 회사 카드 리스트.
          <div className="flex flex-col gap-3">
            {followedCompanies.map((name) => <CompanyCard key={name} name={name} />)}
          </div>
        ) : (
          <TCard className="divide-y divide-[#F2F4F6]">
            {followedUsers.map((a) => <AuthorRow key={`${a.role}::${a.name}`} author={a} />)}
          </TCard>
        )}
      </div>

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
    </TalentAppShell>
  );
}

// 포지션 카드와 비슷한 톤의 회사 카드 — 좌측 썸네일/아바타 + 이름 + 간단 정보(산업·규모·지역·포지션 수) + 관심 토글.
function companySizeLabel(t: PlatformT, size: string): string | undefined {
  const map: Record<string, string> = {
    SIZE_1_10: t("1~10인", "1–10", "1~10人", "1–10 người", "1~10人", "1–10 orang"),
    SIZE_UNDER_30: t("30인 이하", "Under 30", "30人以下", "Dưới 30 người", "30人以下", "Di bawah 30"),
    SIZE_UNDER_50: t("50인 이하", "Under 50", "50人以下", "Dưới 50 người", "50人以下", "Di bawah 50"),
    SIZE_OVER_100: t("100인 이상", "100+", "100人以上", "Trên 100 người", "100人以上", "100+ orang")
  };
  return map[size];
}

function CompanyCard({ name }: { name: string }) {
  const t = usePlatformT();
  const [info, setInfo] = useState<{ count: number; industry?: string; size?: string; location?: string; logo?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    void getPublicPositionsPage({ company: name, limit: 100 })
      .then((page) => {
        if (!alive) return;
        // 서버가 company 필터를 적용(배포 후)하면 no-op, 미배포면 클라 안전 필터.
        const mine = page.items.filter((p) => (p.partnerOrganization?.name || p.sourceCompanyName) === name);
        const org = mine.find((p) => p.partnerOrganization)?.partnerOrganization;
        const location = (org?.officeAddress || mine.find((p) => p.workLocation)?.workLocation || "").split(" ")[0] || undefined;
        setInfo({
          count: mine.length,
          industry: org?.industry ? partnerIndustryLabel(org.industry) : undefined,
          size: org?.companySize ? companySizeLabel(t, org.companySize) ?? undefined : undefined,
          location,
          logo: org?.companyLogoImageData || undefined
        });
      })
      .catch(() => alive && setInfo({ count: 0 }));
    return () => {
      alive = false;
    };
  }, [name]);

  const line1 = [info?.industry, info?.size, info?.location].filter(Boolean).join(" · ") || t("기업", "Company", "企业", "Công ty", "企業", "Perusahaan");
  const interested = 1; // 관심 목록에 있으므로 내가 팔로우 중. 서버 연동 시 전역 집계.

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:shadow-[0_6px_20px_rgba(11,18,39,0.05)]">
      <div className="flex items-center gap-4">
        <Link href={`/talent/company/${encodeURIComponent(name)}`} className="flex min-w-0 flex-1 items-center gap-4">
          {info?.logo ? (
            <span className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={info.logo} alt="" className="h-full w-full object-cover" />
            </span>
          ) : (
            <span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px] font-black text-[#0B46E8]">{name.slice(0, 1)}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-[#191F28]">{name}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{line1}</p>
            <p className="truncate text-[12.5px] text-[#8B95A1]">{t("포지션", "Positions", "职位", "Vị trí", "ポジション", "Posisi")} <span className="font-bold text-[#191F28]">{info?.count ?? 0}</span></p>
            <p className="truncate text-[12.5px] text-[#8B95A1]">{t("관심", "Interested", "关注", "Quan tâm", "関心", "Diminati")} <span className="font-bold text-[#191F28]">{interested}</span></p>
          </div>
        </Link>
        <button type="button" onClick={() => unfollowCompanyName(name)} className="shrink-0 rounded-xl bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]">
          {t("관심 회사", "Following", "已关注", "Đang theo dõi", "フォロー中", "Diikuti")}
        </button>
      </div>
    </div>
  );
}

function AuthorRow({ author }: { author: FeedAuthor }) {
  const t = usePlatformT();
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">{author.name.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-[#191F28]">{author.name}</p>
        <p className="text-[12px] text-[#8B95A1]">{roleLabel(author.role)}</p>
      </div>
      <button type="button" onClick={() => unfollowAuthor(author)} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
        {t("팔로잉", "Following", "已关注", "Đang theo dõi", "フォロー中", "Diikuti")}
      </button>
    </div>
  );
}

