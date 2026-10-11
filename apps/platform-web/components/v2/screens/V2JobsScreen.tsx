"use client";

// v2 포지션 탐색 — 검색칸 하나, 탭·필터는 칩 한 줄씩, 공고는 사진 달린 목록. 게스트도 본다.
// 저장은 공고 상세에서 한다(목록엔 하트 없음 — 공고 이름이 주인공). 공고 상세는 아직 기존 화면.
import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Chip, Empty, Masthead, Page, RowsSkeleton, SearchField } from "../ui";
import { companyOf, hasMockInterview, jobPhotoOf, shortPlace } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { getMyFavoritePositions, getPublicPositionsPage, type PublicPositionListItem } from "../../../lib/member-profile-client";

type Tab = "all" | "aply" | "interest" | "saved";
const PAGE = 20;

function empLabel(t: PlatformT, e: PublicPositionListItem["employmentType"]): string {
  if (e === "FULL_TIME") return t("정규직", "Full-time", "全职", "Toàn thời gian", "正社員", "Penuh waktu");
  if (e === "INTERN" || e === "UNPAID_INTERN") return t("인턴", "Intern", "实习", "Thực tập", "インターン", "Magang");
  return t("파트타임", "Part-time", "兼职", "Bán thời gian", "パート", "Paruh waktu");
}

export function V2JobsScreen() {
  return (
    <V2Shell>
      <Jobs />
    </V2Shell>
  );
}

function Jobs() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const interests = useJobInterests();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [foreigner, setForeigner] = useState(false);
  const [sort, setSort] = useState<"latest" | "deadline">("latest");
  // 결과는 '어떤 조건으로 받은 것인지'와 함께 둔다 — 조건이 바뀌면 새 결과가 올 때까지 스켈레톤을 보이게.
  const [result, setResult] = useState<{ for: unknown; items: PublicPositionListItem[]; total: number | null } | null>(null);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);

  // 입력이 멈추면 검색(0.35초).
  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);


  const fetchPage = useCallback(
    async (p: number): Promise<{ items: PublicPositionListItem[]; total: number | null }> => {
      if (tab === "saved") {
        const list = isAuthenticated ? await getMyFavoritePositions() : [];
        const q = search.toLowerCase();
        const matched = q ? list.filter((j) => `${j.title} ${companyOf(j)}`.toLowerCase().includes(q)) : list;
        // 저장한 공고는 서버 정렬이 없어 여기서 — 마감 임박순이면 마감일 빠른 것부터(상시 채용은 뒤로).
        const due = (j: PublicPositionListItem) => (j.sourceDeadlineDate && !j.sourceDeadlineRolling ? new Date(j.sourceDeadlineDate).getTime() : Infinity);
        const filtered = sort === "deadline" ? [...matched].sort((a, b) => due(a) - due(b)) : matched;
        return { items: filtered, total: filtered.length };
      }
      if (tab === "interest" && !interests.length) return { items: [], total: 0 };
      const res = await getPublicPositionsPage({
        page: p,
        limit: PAGE,
        search: search || undefined,
        sourceProviders: tab === "aply" ? ["INTERNAL"] : undefined,
        jobRoles: tab === "interest" ? jobCategoriesForInterests(interests) : undefined,
        sort,
        foreignerEligible: foreigner || undefined,
        locale
      });
      return { items: res.items, total: res.total ?? null };
    },
    [tab, search, interests, sort, foreigner, locale, isAuthenticated]
  );

  useEffect(() => {
    let alive = true;
    fetchPage(1)
      .then((r) => {
        if (!alive) return;
        setResult({ for: fetchPage, items: r.items, total: r.total });
        setPage(1);
      })
      .catch(() => alive && setResult({ for: fetchPage, items: [], total: 0 }));
    return () => {
      alive = false;
    };
  }, [fetchPage]);

  const current = result && result.for === fetchPage ? result : null;
  const items = current?.items ?? null;
  const total = current?.total ?? null;

  const loadMore = () => {
    if (more || !current) return;
    setMore(true);
    fetchPage(page + 1)
      .then((r) => {
        setResult((prev) => (prev && prev.for === fetchPage ? { ...prev, items: [...prev.items, ...r.items] } : prev));
        setPage(page + 1);
      })
      .finally(() => setMore(false));
  };

  const tabs: [Tab, string][] = [
    ["all", t("전체", "All", "全部", "Tất cả", "すべて", "Semua")],
    ["aply", "Aply ONLY"],
    ["interest", t("관심 직무", "My interests", "感兴趣", "Quan tâm", "関心職種", "Minatku")],
    ["saved", t("저장한 공고", "Saved", "已收藏", "Đã lưu", "保存済み", "Tersimpan")]
  ];
  const hasMore = tab !== "saved" && items !== null && total !== null && items.length < total;

  return (
    <Page>
      <Masthead
        eyebrow={t("포지션 탐색", "Jobs", "职位", "Việc làm", "求人", "Lowongan")}
        title={t("한국에서 일할 곳을 찾아보세요", "Find where you'll work in Korea", "寻找在韩国的工作", "Tìm nơi làm việc tại Hàn Quốc", "韓国で働く場所を探しましょう", "Temukan tempat kerja di Korea")}
        lede={
          total != null && tab !== "saved"
            ? // 숫자만 굵은 먹색 — 문장은 언어마다 어순이 달라 {n} 자리에 끼워 넣는다.
              t("지금 {n}개 공고가 있어요", "{n} jobs right now", "目前有 {n} 个职位", "Hiện có {n} việc làm", "いま{n}件の求人", "{n} lowongan saat ini")
                .split("{n}")
                .flatMap((part, i) => (i === 0 ? [part] : [<b key={i} className="font-bold text-[color:var(--v2-ink)]">{total.toLocaleString()}</b>, part]))
            : undefined
        }
      />

      <div className="px-5">
        <SearchField value={query} onChange={setQuery} placeholder={t("직무, 회사 또는 역량 검색", "Search roles, companies, skills", "搜索职位、公司或技能", "Tìm vị trí, công ty, kỹ năng", "職種・会社・スキルで検索", "Cari peran, perusahaan, keahlian")} />
      </div>
      {/* 탭 칩 줄 — 전체 · Aply ONLY · [외국인 채용 토글] · 관심 직무 · 저장한 공고. 넘치면 가로로 넘긴다.
          외국인 채용은 탭이 아니라 켜고 끄는 거름망 — 켜면 연파랑(고른 탭의 먹색과 구분). 저장한 공고 탭에선 숨김. */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(([k, label]) => (
          <Fragment key={k}>
            <Chip active={tab === k} onClick={() => setTab(k)}>
              {label}
            </Chip>
            {k === "aply" && tab !== "saved" ? (
              <button
                type="button"
                onClick={() => setForeigner((v) => !v)}
                aria-pressed={foreigner}
                className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-semibold transition ${foreigner ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]"}`}
              >
                {t("외국인 채용", "Hires foreigners", "招外国人", "Tuyển người nước ngoài", "外国人採用", "Terima WNA")}
              </button>
            ) : null}
          </Fragment>
        ))}
      </div>

      {/* 목록 머리 — 왼쪽 개수, 오른쪽 정렬. 필터 바로 아래라 구분선 없이 여백만. */}
      <div className="mt-5 flex items-center justify-between px-5">
        <p className="text-[14px] font-medium text-[color:var(--v2-faint)]">
          {items ? t(`${(total ?? items.length).toLocaleString()}개`, `${(total ?? items.length).toLocaleString()} jobs`, `${(total ?? items.length).toLocaleString()} 个`, `${(total ?? items.length).toLocaleString()} tin`, `${(total ?? items.length).toLocaleString()}件`, `${(total ?? items.length).toLocaleString()} lowongan`) : ""}
        </p>
        <div className="flex items-center gap-3 text-[14px]">
          {(
            [
              ["latest", t("최신순", "Newest", "最新", "Mới nhất", "新着順", "Terbaru")],
              ["deadline", t("마감 임박순", "Closing soon", "即将截止", "Sắp hết hạn", "締切が近い順", "Segera tutup")]
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setSort(k)} aria-pressed={sort === k} className={sort === k ? "font-bold text-[color:var(--v2-ink)]" : "font-medium text-[color:var(--v2-faint)] hover:text-[color:var(--v2-ink-3)]"}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="px-5">
        {items === null ? (
          <RowsSkeleton count={6} />
        ) : items.length === 0 ? (
          <Empty>
            {tab === "interest" && !interests.length
              ? t("관심 직무를 고르면 맞는 공고만 모아 볼 수 있어요.", "Pick job interests to see matching jobs.", "选择感兴趣的职位即可查看匹配职位。", "Chọn nghề quan tâm để xem việc phù hợp.", "関心職種を選ぶと合う求人だけ見られます。", "Pilih minat untuk melihat lowongan yang cocok.")
              : tab === "saved"
                ? t("저장한 공고가 없어요. 공고 상세에서 저장할 수 있어요.", "No saved jobs. You can save one from its detail page.", "没有收藏的职位。可在职位详情中收藏。", "Chưa lưu tin nào. Có thể lưu ở trang chi tiết.", "保存した求人はありません。求人詳細から保存できます。", "Belum ada yang disimpan. Simpan dari halaman detail.")
                : t("조건에 맞는 공고가 없어요. 필터를 줄여 보세요.", "No jobs match. Try fewer filters.", "没有符合条件的职位，试着减少筛选。", "Không có việc phù hợp. Hãy bớt bộ lọc.", "条件に合う求人がありません。絞り込みを減らしてみてください。", "Tidak ada yang cocok. Kurangi filter.")}
          </Empty>
        ) : (
          items.map((j) => (
            <li key={j.id} className="flex items-center gap-3.5 border-b border-[color:var(--v2-line)] last:border-b-0">
              <Link href={`/talent/jobs/${j.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 py-4 transition hover:opacity-70">
                {jobPhotoOf(j) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 외부 공고 이미지·data URL 이 섞여 next/image 로 못 받는다.
                  <img src={jobPhotoOf(j)!} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl bg-[color:var(--v2-band)] object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-band)] text-[18px] font-bold text-[color:var(--v2-faint)]">{(companyOf(j) || j.title).slice(0, 1)}</span>
                )}
                <span className="min-w-0 flex-1">
                  {/* 표시 칩 — 공고 이름 위에. 모의 면접은 바로 해 볼 수 있다는 뜻이라 파란 칩으로. */}
                  {(() => {
                    const foreignerOk = (j.eligibleVisas ?? []).includes("FOREIGNER_FRIENDLY");
                    const aply = j.sourceProvider === "INTERNAL";
                    const mock = hasMockInterview(j);
                    return foreignerOk || aply || mock ? (
                      <span className="mb-1.5 flex flex-wrap gap-1.5">
                        {aply ? <Tag>Aply ONLY</Tag> : null}
                        {foreignerOk ? <Tag>{t("외국인 채용", "Hires foreigners", "招外国人", "Tuyển WNA", "外国人採用", "Terima WNA")}</Tag> : null}
                        {mock ? <Tag tone="accent">{t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara")}</Tag> : null}
                      </span>
                    ) : null;
                  })()}
                  <span className="line-clamp-2 text-[17px] font-bold leading-[1.4] tracking-[-0.01em] text-[color:var(--v2-ink)]">{j.title}</span>
                  <span className="mt-1 block truncate text-[13px] text-[color:var(--v2-faint)]">{[companyOf(j), shortPlace(j.workLocation), empLabel(t, j.employmentType)].filter(Boolean).join(" · ")}</span>
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
      {more ? (
        <div className="px-5">
          <RowsSkeleton count={3} />
        </div>
      ) : null}
      {hasMore && !more ? (
        <div className="px-5 pt-4">
          <Button variant="neutral" full onClick={loadMore} disabled={more}>
            {t("더 보기", "Load more", "加载更多", "Xem thêm", "もっと見る", "Muat lagi")}
          </Button>
        </div>
      ) : null}
    </Page>
  );
}

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" }) {
  return <span className={`rounded-md px-2.5 py-0.5 text-[12px] font-semibold ${tone === "accent" ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>{children}</span>;
}
