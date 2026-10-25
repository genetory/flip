"use client";

// v2 내 활동 — 기존 내 활동 상세(ActivityDetailScreen)와 같은 데이터를 v2 모양으로. 설정의 숫자 칸·활동 알림에서 들어온다.
// 유형: following-companies(관심 회사) · favorite-positions(저장한 공고) · following-users(팔로우한 사람) · favorite-feed(저장한 글).
// 모르는 유형은 기존처럼 팔로우한 사람으로.
import { useEffect, useMemo, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Empty, Masthead, Page, Row, RowsSkeleton } from "../ui";
import { JobLine, companySizeLabel } from "./V2CompanyDetailScreen";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useFollowedCompanies, unfollowCompanyName } from "../../../lib/talent/company-follow";
import { useFollowing, parseAuthorKey, unfollowAuthor, type FeedAuthor } from "../../../lib/talent/social-graph";
import { useSocialFeed, type FeedAuthorRole } from "../../../lib/talent/social-feed";
import { useFeedBookmarks, toggleFeedBookmark } from "../../../lib/talent/feed-bookmarks";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { getMyFavoritePositions, getPublicPositionsPage, removeMyFavoritePosition, type PublicPositionListItem } from "../../../lib/member-profile-client";

export type V2ActivityType = "following-users" | "following-companies" | "favorite-positions" | "favorite-feed";
const TYPES: V2ActivityType[] = ["following-users", "following-companies", "favorite-positions", "favorite-feed"];

function titleOf(t: PlatformT, type: V2ActivityType): string {
  switch (type) {
    case "following-companies":
      return t("관심 회사", "Followed companies", "关注的公司", "Công ty theo dõi", "関心企業", "Perusahaan diikuti");
    case "favorite-positions":
      return t("저장한 공고", "Saved jobs", "收藏的职位", "Tin đã lưu", "保存した求人", "Lowongan tersimpan");
    case "favorite-feed":
      return t("저장한 글", "Saved posts", "收藏的动态", "Bài đã lưu", "保存した投稿", "Postingan tersimpan");
    default:
      return t("팔로우한 사람", "Following", "关注的人", "Đang theo dõi", "フォロー中", "Yang diikuti");
  }
}

function emptyOf(t: PlatformT, type: V2ActivityType): string {
  switch (type) {
    case "following-companies":
      return t("아직 관심 회사가 없어요. 회사 상세에서 [관심 추가]를 눌러 보세요.", "No followed companies yet. Tap Follow on a company page.", "还没有关注的公司。在公司详情页点击「关注」。", "Chưa theo dõi công ty nào. Nhấn Theo dõi ở trang công ty.", "まだ関心企業がありません。企業ページで[関心追加]を押してみましょう。", "Belum ada. Ketuk Ikuti di halaman perusahaan.");
    case "favorite-positions":
      return t("포지션 탐색에서 저장한 공고가 여기 모여요.", "Jobs you save while browsing appear here.", "浏览职位时收藏的职位会汇集在这里。", "Tin bạn lưu khi tìm việc sẽ ở đây.", "求人探しで保存した求人がここに集まります。", "Lowongan yang kamu simpan muncul di sini.");
    case "favorite-feed":
      return t("피드에서 저장한 글이 여기 모여요.", "Posts you save from the feed appear here.", "你在动态中收藏的帖子会汇集在这里。", "Bài bạn lưu từ bảng tin sẽ ở đây.", "フィードで保存した投稿がここに集まります。", "Postingan yang kamu simpan muncul di sini.");
    default:
      return t("피드에서 관심 있는 사람을 팔로우해 보세요.", "Follow people you're interested in from the feed.", "在动态中关注你感兴趣的人。", "Theo dõi người bạn quan tâm từ bảng tin.", "フィードで気になる人をフォローしてみましょう。", "Ikuti orang yang kamu minati dari feed.");
  }
}

function roleOf(t: PlatformT, role: FeedAuthorRole): string {
  return role === "PARTNER" ? t("기업", "Company", "企业", "Doanh nghiệp", "企業", "Perusahaan") : role === "OPERATOR" ? t("운영자", "Operator", "运营者", "Quản trị", "運営者", "Operator") : t("학생", "Student", "学生", "Sinh viên", "学生", "Mahasiswa");
}

export function V2ActivityScreen({ type }: { type: string }) {
  return (
    <V2Shell requireAuth>
      <Activity type={TYPES.includes(type as V2ActivityType) ? (type as V2ActivityType) : "following-users"} />
    </V2Shell>
  );
}

function Activity({ type }: { type: V2ActivityType }) {
  const t = usePlatformT();
  const title = titleOf(t, type);
  return (
    <Page>
      <Masthead eyebrow={t("내 활동", "My activity", "我的活动", "Hoạt động", "マイアクティビティ", "Aktivitas")} title={title} />
      {type === "following-companies" ? (
        <FollowedCompanies t={t} />
      ) : type === "favorite-positions" ? (
        <SavedJobs t={t} />
      ) : type === "favorite-feed" ? (
        <SavedPosts t={t} />
      ) : (
        <FollowedUsers t={t} />
      )}
    </Page>
  );
}

/** 본문 — 머리말 아래 목록(제목은 머리말이 맡는다). */
function Body({ t, count, children }: { t: PlatformT; count?: number; children: React.ReactNode }) {
  return (
    <section className="px-5 pb-7">
      {count ? <p className="text-[14px] font-medium text-[color:var(--v2-muted)]">{t(`${count}개`, `${count} total`, `共 ${count} 个`, `${count} mục`, `${count}件`, `${count} item`)}</p> : null}
      {children}
    </section>
  );
}

// ── 관심 회사 ──

function FollowedCompanies({ t }: { t: PlatformT }) {
  const names = useFollowedCompanies(); // 서버 관심 회사(이름)
  return (
    <Body t={t} count={names.length}>
      {names.length ? names.map((name) => <CompanyLine key={name} t={t} name={name} />) : <Empty>{emptyOf(t, "following-companies")}</Empty>}
      <div className="mt-4">
        <Button variant="neutral" full href="/talent/companies">
          {t("채용 중인 회사 보기", "Browse companies", "查看招聘公司", "Xem công ty", "採用中の企業を見る", "Lihat perusahaan")}
        </Button>
      </div>
    </Body>
  );
}

/** 관심 회사 한 줄 — 그 회사 공고에서 산업·규모·지역·공고 수를 읽는다(기존 화면과 같은 방식). 오른쪽은 관심 해제. */
function CompanyLine({ t, name }: { t: PlatformT; name: string }) {
  const [info, setInfo] = useState<{ count: number; industry?: string; size?: string; location?: string; logo?: string } | null>(null);

  useEffect(() => {
    let alive = true;
    void getPublicPositionsPage({ company: name, limit: 100 })
      .then((page) => {
        if (!alive) return;
        // 서버가 company 필터를 적용하면 그대로, 아니면 화면에서 한 번 더 거른다.
        const mine = page.items.filter((p) => (p.partnerOrganization?.name || p.sourceCompanyName) === name);
        const org = mine.find((p) => p.partnerOrganization)?.partnerOrganization;
        setInfo({
          count: mine.length,
          industry: org?.industry ? partnerIndustryLabel(org.industry) : undefined,
          size: org?.companySize ?? undefined,
          location: (org?.officeAddress || mine.find((p) => p.workLocation)?.workLocation || "").split(" ")[0] || undefined,
          logo: org?.companyLogoImageData || undefined
        });
      })
      .catch(() => alive && setInfo({ count: 0 }));
    return () => {
      alive = false;
    };
  }, [name]);

  const meta = info
    ? [info.industry, companySizeLabel(t, info.size), info.location, t(`채용 중 ${info.count}`, `${info.count} open`, `在招 ${info.count}`, `${info.count} vị trí`, `募集中 ${info.count}`, `${info.count} lowongan`)].filter(Boolean).join(" · ")
    : undefined;

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <Row href={`/talent/company/${encodeURIComponent(name)}`} thumb={{ src: info?.logo, fallback: name }} title={name} meta={meta} />
      </div>
      <Button size="sm" variant="secondary" onClick={() => unfollowCompanyName(name)}>
        {t("관심 해제", "Unfollow", "取消关注", "Bỏ theo dõi", "解除", "Batal")}
      </Button>
    </div>
  );
}

// ── 저장한 공고 ──

function SavedJobs({ t }: { t: PlatformT }) {
  const [list, setList] = useState<PublicPositionListItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    getMyFavoritePositions()
      .then((l) => alive && setList(l))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, []);

  // 저장 해제 — 목록에서 빼고 서버에 반영(기존 화면과 같다).
  const unsave = (id: string) => {
    setList((prev) => (prev ?? []).filter((p) => p.id !== id));
    void removeMyFavoritePosition(id).catch(() => {});
  };

  return (
    <Body t={t} count={list?.length}>
      {list === null ? (
        <RowsSkeleton count={4} />
      ) : list.length ? (
        list.map((item) => <JobLine key={item.id} t={t} item={item} saved onToggleSave={unsave} />)
      ) : (
        <>
          <Empty>{emptyOf(t, "favorite-positions")}</Empty>
          <Button variant="neutral" full href="/talent/jobs">
            {t("포지션 탐색", "Browse jobs", "浏览职位", "Tìm việc", "求人を探す", "Cari lowongan")}
          </Button>
        </>
      )}
    </Body>
  );
}

// ── 팔로우한 사람 ──

function FollowedUsers({ t }: { t: PlatformT }) {
  const following = useFollowing();
  const users = useMemo(() => following.map(parseAuthorKey).filter((a): a is FeedAuthor => a !== null && a.role !== "PARTNER"), [following]);
  return (
    <Body t={t} count={users.length}>
      {users.length ? (
        users.map((a) => (
          <div key={`${a.role}::${a.name}`} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Row lead={a.name.slice(0, 1)} title={a.name} meta={roleOf(t, a.role)} />
            </div>
            <Button size="sm" variant="neutral" onClick={() => unfollowAuthor(a)}>
              {t("팔로잉", "Following", "已关注", "Đang theo dõi", "フォロー中", "Diikuti")}
            </Button>
          </div>
        ))
      ) : (
        <Empty>{emptyOf(t, "following-users")}</Empty>
      )}
    </Body>
  );
}

// ── 저장한 글 ──

function SavedPosts({ t }: { t: PlatformT }) {
  const bookmarks = useFeedBookmarks();
  const posts = useSocialFeed();
  const saved = useMemo(() => {
    const set = new Set(bookmarks);
    return posts.filter((p) => set.has(p.id));
  }, [bookmarks, posts]);
  return (
    <Body t={t} count={saved.length}>
      {saved.length ? (
        <div className="flex flex-col gap-2">
          {saved.map((p) => (
            <article key={p.id} className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[color:var(--v2-ink)]">
                  {p.authorName}
                  <span className="ml-1.5 text-[13px] font-medium text-[color:var(--v2-faint)]">
                    {roleOf(t, p.authorRole)} · {formatRelativeTime(p.createdAt, undefined, t)}
                  </span>
                </p>
                <Button size="sm" variant="white" onClick={() => toggleFeedBookmark(p.id, t)}>
                  {t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "解除", "Batal")}
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-2)]">{p.text}</p>
            </article>
          ))}
        </div>
      ) : (
        <Empty>{emptyOf(t, "favorite-feed")}</Empty>
      )}
    </Body>
  );
}
