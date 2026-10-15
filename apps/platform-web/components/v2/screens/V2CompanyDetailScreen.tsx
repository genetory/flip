"use client";

// v2 회사 상세 — 기존 회사 상세(CompanyDetailScreen)와 같은 데이터를 v2 모양으로.
// 맨 위 회사 이름·관심 회사 → 회사 소개(사진·소개·자랑·기본 정보) → 채용 중인 포지션(저장) → 회사 소식(있을 때만).
// 회사 목록 API 가 따로 없어 기존처럼 그 회사 공고를 읽고, 회사 정보는 대표 공고 상세에서 가져온다(목록엔 일부 필드가 없다).
import { useEffect, useMemo, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Empty, MastheadSkeleton, Page, Row, Section, SectionSkeleton } from "../ui";
import { companyOf, jobPhotoOf, shortPlace } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useSocialFeed } from "../../../lib/talent/social-feed";
import { useFollowedCompanies, toggleCompanyFollow } from "../../../lib/talent/company-follow";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { notifySavedPosition } from "../../../lib/talent/activity-log";
import { toPositionView } from "../../../lib/talent/positions-adapter";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { parseOfficePhotos } from "../../../lib/image-upload";
import {
  addMyFavoritePosition,
  getMyFavoritePositions,
  getPublicPositionById,
  getPublicPositionsPage,
  removeMyFavoritePosition,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";

/** 회사 규모 — 공고 상세(V2JobDetailScreen)와 같은 표기. */
export function companySizeLabel(t: PlatformT, s: string | null | undefined): string | null {
  switch (s) {
    case "SIZE_1_10":
      return t("1~10명", "1–10", "1~10人", "1–10", "1〜10名", "1–10");
    case "SIZE_UNDER_30":
      return t("30명 미만", "Under 30", "30人以下", "Dưới 30", "30名未満", "<30");
    case "SIZE_UNDER_50":
      return t("50명 미만", "Under 50", "50人以下", "Dưới 50", "50名未満", "<50");
    case "SIZE_OVER_100":
      return t("100명 이상", "100+", "100人以上", "100+", "100名以上", "100+");
    default:
      return null;
  }
}

/** 링크로 열 수 있는 주소면 https 를 붙여 돌려준다(기존 회사 정보 카드와 같은 규칙). */
function toHref(v: string | null | undefined): string | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return `https://${s}`;
  return undefined;
}

/** 저장(북마크) 토글 — 목록 줄 오른쪽 40px 칸. */
export function SaveToggle({ t, saved, onToggle }: { t: PlatformT; saved: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "保存解除", "Batal simpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-[color:var(--v2-band)]"
    >
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${saved ? "text-[color:var(--v2-accent)]" : "text-[color:var(--v2-faint)]"}`} fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M6 3.5h12a1 1 0 0 1 1 1v16l-7-4.5-7 4.5v-16a1 1 0 0 1 1-1Z" />
      </svg>
    </button>
  );
}

/** 공고 한 줄 + 저장 — 누르면 v2 공고 상세로. 버튼이 링크 안에 들어가지 않게 옆에 둔다. */
export function JobLine({ t, item, saved, onToggleSave }: { t: PlatformT; item: PublicPositionListItem; saved: boolean; onToggleSave: (id: string) => void }) {
  const view = toPositionView(item, t);
  const company = companyOf(item) || view.company;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <Row
          href={`/talent/jobs/${item.id}`}
          thumb={{ src: jobPhotoOf(item), fallback: company || item.title }}
          title={item.title}
          meta={[company, shortPlace(item.workLocation), view.employmentLabel, view.deadlineText].filter(Boolean).join(" · ") || undefined}
        />
      </div>
      <SaveToggle t={t} saved={saved} onToggle={() => onToggleSave(item.id)} />
    </div>
  );
}

export function V2CompanyDetailScreen({ name }: { name: string }) {
  return (
    <V2Shell requireAuth>
      <CompanyDetail name={name} />
    </V2Shell>
  );
}

function CompanyDetail({ name }: { name: string }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const allPosts = useSocialFeed();
  const followed = useFollowedCompanies().includes(name);
  const [positions, setPositions] = useState<PublicPositionListItem[]>([]);
  const [companyItem, setCompanyItem] = useState<PublicPositionListItem | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    // 불러오는 중 표시는 처음(초기값)과 [다시 시도]에서만 — 언어가 바뀌면 지금 내용을 둔 채 새로 받는다.
    void getPublicPositionsPage({ company: name, limit: 100, locale })
      .then(async (page) => {
        if (!alive) return;
        // 서버가 company 필터를 적용하면 그대로, 아니면 화면에서 한 번 더 거른다(기존 화면과 같은 안전 필터).
        const mine = page.items.filter((p) => (p.partnerOrganization?.name || p.sourceCompanyName) === name);
        setPositions(mine);
        setStatus("ready");
        // 회사 정보는 사무실 사진 등이 다 있는 대표 공고 상세에서.
        const rep = mine.find((p) => p.partnerOrganization) ?? mine[0];
        if (rep) {
          const full = await getPublicPositionById(rep.id, { locale }).catch(() => null);
          if (alive) setCompanyItem(full ?? rep);
        }
      })
      .catch(() => alive && setStatus("error"));
    void getMyFavoritePositions()
      .then((list) => alive && setSavedIds(new Set(list.map((p) => p.id))))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [name, locale, reload]);

  // 회사가 피드에 남긴 글 — 기존 화면과 같은 기준(기업 글쓴이 이름이 회사 이름).
  const companyPosts = useMemo(() => allPosts.filter((p) => p.authorRole === "PARTNER" && p.authorName === name), [allPosts, name]);

  function toggleSave(id: string) {
    const willSave = !savedIds.has(id);
    const flip = (on: boolean) =>
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    flip(willSave);
    if (willSave) notifySavedPosition(t, id, positions.find((p) => p.id === id)?.title);
    (willSave ? addMyFavoritePosition(id) : removeMyFavoritePosition(id)).catch(() => flip(!willSave)); // 실패하면 되돌린다
  }

  const org = companyItem?.partnerOrganization ?? null;
  const logo = org?.companyLogoImageData || null;
  const photos = parseOfficePhotos(org?.officePhotoImageData ?? null).slice(0, 4);
  const metaLine = [org?.industry ? partnerIndustryLabel(org.industry) : null, companySizeLabel(t, org?.companySize), shortPlace(org?.officeAddress)].filter(Boolean).join(" · ");
  const info = org
    ? ([
        [t("기업 규모", "Size", "企业规模", "Quy mô", "企業規模", "Ukuran"), companySizeLabel(t, org.companySize) ?? org.companySize, undefined],
        [t("산업", "Industry", "行业", "Ngành", "業界", "Industri"), org.industry ? partnerIndustryLabel(org.industry) : null, undefined],
        [t("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat"), org.officeAddress, undefined],
        [t("웹사이트", "Website", "网站", "Website", "サイト", "Situs"), org.website, toHref(org.website)],
        [t("SNS", "Social", "社交媒体", "MXH", "SNS", "Sosial"), org.socialMedia, toHref(org.socialMedia)]
      ].filter((x) => !!x[1]?.trim()) as [string, string, string | undefined][])
    : [];

  if (status === "loading") {
    return (
      <Page>
        <MastheadSkeleton action={false} />
        <SectionSkeleton rows={2} thumb={false} />
        <SectionSkeleton rows={3} />
      </Page>
    );
  }

  return (
    <Page>
      {/* 맨 위 — 로고 · 회사 이름 · 한 줄 정보 · 관심 회사 */}
      <header className="px-5 pb-8 pt-8 md:pt-12">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[color:var(--v2-band)] text-[24px] font-bold text-[color:var(--v2-faint)]">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- 회사 로고는 data URL 이라 next/image 로 못 받는다.
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{name.slice(0, 1)}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[24px] font-bold leading-[1.35] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[28px]">{name}</h1>
            <p className="mt-0.5 truncate text-[15px] text-[color:var(--v2-muted)]">
              {metaLine || t(`채용 중 ${positions.length}`, `${positions.length} open`, `在招 ${positions.length}`, `${positions.length} vị trí`, `募集中 ${positions.length}`, `${positions.length} lowongan`)}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Button full variant={followed ? "secondary" : "neutral"} onClick={() => toggleCompanyFollow(name, t)}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill={followed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
            </svg>
            {followed ? t("관심 회사", "Following", "已关注", "Đang theo dõi", "関心企業", "Diikuti") : t("관심 추가", "Follow", "关注", "Theo dõi", "関心追加", "Ikuti")}
          </Button>
        </div>
      </header>

      {status === "error" ? (
        <Section title={t("회사 정보", "Company", "公司信息", "Công ty", "企業情報", "Perusahaan")}>
          <Empty>{t("불러오지 못했어요. 잠시 후 다시 해 주세요.", "Couldn't load. Please try again.", "加载失败，请稍后再试。", "Không tải được. Thử lại sau.", "読み込めませんでした。", "Gagal memuat. Coba lagi.")}</Empty>
          <div className="flex justify-center">
            <Button variant="neutral" size="sm" onClick={() => {
                setStatus("loading");
                setReload((n) => n + 1);
              }}>
              {t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}
            </Button>
          </div>
        </Section>
      ) : (
        <>
          {/* 회사 소개 — 공고 상세의 회사 카드와 같은 내용 + 기본 정보 */}
          {org ? (
            <Section title={t("회사 소개", "About", "公司简介", "Giới thiệu", "会社紹介", "Tentang")}>
              {photos.length ? (
                <div className={`grid gap-2 ${photos.length > 1 ? "grid-cols-2" : ""}`}>
                  {photos.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element -- 사무실 사진은 data URL 이라 next/image 로 못 받는다.
                    <img key={`${i}-${src.slice(0, 24)}`} src={src} alt="" className={`w-full rounded-xl bg-[color:var(--v2-band)] object-cover ${photos.length > 1 ? "aspect-[4/3]" : "aspect-[16/9]"}`} />
                  ))}
                </div>
              ) : null}
              {org.description?.trim() ? <p className={`whitespace-pre-wrap text-[16px] leading-[1.75] text-[color:var(--v2-ink-2)] ${photos.length ? "mt-5" : ""}`}>{org.description}</p> : null}
              {org.strengths?.trim() ? (
                <div className="mt-5 rounded-2xl bg-[color:var(--v2-fill)] p-4">
                  <p className="text-[15px] font-bold text-[color:var(--v2-ink-2)]">{t("이 회사의 자랑", "Why work here", "公司亮点", "Điểm nổi bật", "この会社の魅力", "Keunggulan")}</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">{org.strengths}</p>
                </div>
              ) : null}
              {info.length ? (
                <dl className="mt-5 flex flex-col">
                  {info.map(([label, value, href]) => (
                    <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                      <dt className="shrink-0 text-[15px] text-[color:var(--v2-faint)]">{label}</dt>
                      <dd className="min-w-0 text-right text-[15px] font-medium text-[color:var(--v2-ink-2)]">
                        {href ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-[color:var(--v2-accent)] hover:opacity-70">
                            {value}
                          </a>
                        ) : (
                          <span className="break-words">{value}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </Section>
          ) : null}

          {/* 채용 중인 포지션 */}
          <Section title={t("지금 채용 중", "Hiring now", "正在招聘", "Đang tuyển", "募集中", "Sedang merekrut")} aside={<span className="text-[14px] text-[color:var(--v2-muted)]">{positions.length}</span>}>
            {positions.length ? (
              positions.map((item) => <JobLine key={item.id} t={t} item={item} saved={savedIds.has(item.id)} onToggleSave={toggleSave} />)
            ) : (
              <Empty>{t("진행 중인 포지션이 없어요. 새 포지션이 열리면 알려 드릴게요.", "No open positions. We'll let you know when one opens.", "暂无进行中的职位，有新职位时会通知你。", "Chưa có vị trí. Sẽ báo khi có vị trí mới.", "募集中のポジションはありません。新しく開いたらお知らせします。", "Belum ada posisi. Kami kabari saat ada.")}</Empty>
            )}
          </Section>

          {/* 회사 소식 — 회사가 피드에 남긴 글(있을 때만) */}
          {companyPosts.length ? (
            <Section title={t("회사 소식", "News", "公司动态", "Tin tức", "お知らせ", "Kabar")}>
              <div className="flex flex-col gap-2">
                {companyPosts.map((p) => (
                  <article key={p.id} className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
                    <p className="text-[13px] text-[color:var(--v2-faint)]">{formatRelativeTime(p.createdAt, undefined, t)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-2)]">{p.text}</p>
                  </article>
                ))}
              </div>
            </Section>
          ) : null}
        </>
      )}
    </Page>
  );
}
