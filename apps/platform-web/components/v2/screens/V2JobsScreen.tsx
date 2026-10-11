"use client";

// v2 포지션 탐색 — 검색칸 하나, 탭·필터는 칩 한 줄씩, 공고는 사진 달린 목록. 게스트도 본다.
// 저장은 공고 상세에서 한다(목록엔 하트 없음 — 공고 이름이 주인공). 공고 상세는 아직 기존 화면.
import Link from "next/link";
import { Fragment, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Chip, Empty, Masthead, Page, RowsSkeleton, SearchField } from "../ui";
import { companyOf, hasMockInterview, jobPhotoOf, shortPlace } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { getMyFavoritePositions, getPublicPositionsPage, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { trackForeignerPrompt } from "../../../lib/analytics";

type Tab = "all" | "aply" | "interest" | "saved";
const PAGE = 20;
const FOREIGNER_KEY = "aply.v2.jobs.foreigner";
const FOREIGNER_EVENT = "aply:v2-foreigner";

function readForeigner(): string | null {
  try {
    return localStorage.getItem(FOREIGNER_KEY);
  } catch {
    return "unavailable"; // 저장소를 못 쓰면 묻지 않는다(답을 기억 못 해 매번 뜨면 성가시다).
  }
}
function writeForeigner(v: "yes" | "no") {
  try {
    localStorage.setItem(FOREIGNER_KEY, v);
  } catch {
    // 기억만 못 할 뿐 — 이번엔 그대로 적용된다.
  }
  window.dispatchEvent(new Event(FOREIGNER_EVENT));
}
function subscribeForeigner(cb: () => void) {
  window.addEventListener(FOREIGNER_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(FOREIGNER_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

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
  // '혹시 외국인이세요?' — 한국인도 보는 화면이라 먼저 걸러 두지 않고 물어본다. 답은 이 브라우저에만 기억.
  //   yes → 필터를 켜고 다음에도 켠 채로 시작 / no → 다시 묻지 않음(닫기 없이 둘 중 하나로 답한다). 저장소를 못 써도 화면은 그대로 동작.
  const stored = useSyncExternalStore(subscribeForeigner, readForeigner, () => "ssr");
  const [answered, setAnswered] = useState(false);
  const [foreignerToggle, setForeigner] = useState<boolean | null>(null);
  const foreigner = foreignerToggle ?? stored === "yes";
  const askForeigner = stored === null && !answered;
  const answerForeigner = (answer: "yes" | "no") => {
    trackForeignerPrompt(answer);
    writeForeigner(answer === "yes" ? "yes" : "no");
    if (answer === "yes") setForeigner(true);
    setAnswered(true);
  };
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

  // 조건을 바꾸는 동안엔 이전 결과를 흐리게 둔 채 기다린다(스켈레톤으로 갈아끼우면 깜빡인다).
  // 스켈레톤은 처음 들어올 때(아직 아무 결과도 없을 때)만.
  const current = result && result.for === fetchPage ? result : null;
  const refreshing = !!result && !current;
  const items = result?.items ?? null;
  const total = result?.total ?? null;

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
  const hasMore = !refreshing && tab !== "saved" && items !== null && total !== null && items.length < total;

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

      {askForeigner && !foreigner ? (
        <div className="mx-5 mb-4 flex items-center gap-2 rounded-2xl bg-[color:var(--v2-accent-weak)] py-3 pl-4 pr-3">
          <p className="min-w-0 flex-1 text-[14px] leading-[1.5] text-[color:var(--v2-ink-2)]">
            <span className="font-bold text-[color:var(--v2-ink)]">{t("혹시 외국인이세요?", "Are you a foreigner?", "您是外国人吗？", "Bạn là người nước ngoài?", "外国の方ですか？", "Apakah Anda WNA?")}</span>{" "}
            {/* 설명은 PC 에서만 — 모바일은 질문 한 줄로 얇게. */}
            <span className="hidden md:inline">{t("외국인 채용 가능한 공고만 모아 볼 수 있어요.", "See only jobs open to foreigners.", "可以只看招外国人的职位。", "Xem riêng các việc nhận người nước ngoài.", "外国人採用可の求人だけ見られます。", "Lihat lowongan yang terbuka untuk WNA saja.")}</span>
          </p>
          <Button size="sm" onClick={() => answerForeigner("yes")}>{t("네", "Yes", "是", "Có", "はい", "Ya")}</Button>
          <Button size="sm" variant="neutral" onClick={() => answerForeigner("no")}>{t("아니요", "No", "不是", "Không", "いいえ", "Tidak")}</Button>
        </div>
      ) : null}

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
                onClick={() => setForeigner(!foreigner)}
                aria-pressed={foreigner}
                className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-semibold transition ${foreigner ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]"}`}
              >
                {t("외국인 채용 가능", "Open to foreigners", "可招外国人", "Nhận người nước ngoài", "外国人採用可", "Terbuka untuk WNA")}
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

      <ul className={`px-5 transition-opacity duration-150 ${refreshing ? "pointer-events-none opacity-40" : ""}`} aria-busy={refreshing}>
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
              <Link href={`/talent/jobs/${j.id}`} className="flex min-w-0 flex-1 items-start gap-3.5 py-4 transition hover:opacity-70">
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
                        {foreignerOk ? <Tag>{t("외국인 채용 가능", "Open to foreigners", "可招外国人", "Nhận WNA", "外国人採用可", "Terbuka WNA")}</Tag> : null}
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
