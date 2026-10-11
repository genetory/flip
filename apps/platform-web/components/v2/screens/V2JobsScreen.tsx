"use client";

// v2 포지션 탐색 — 검색칸 하나, 탭·필터는 칩 한 줄씩, 공고는 사진 달린 목록. 게스트도 본다.
// 저장(하트)은 로그인 필요 — 기존 로그인 유도 팝업(useLoginGate)을 쓴다. 공고 상세는 아직 기존 화면.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import { V2Shell } from "../V2Shell";
import { Chip, Empty, Masthead, Page, SearchField } from "../ui";
import { companyOf, jobPhotoOf, shortPlace } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { useLoginGate } from "../../talent/app/LoginRequiredModal";
import { addMyFavoritePosition, getMyFavoritePositions, getPublicPositionsPage, removeMyFavoritePosition, type PublicPositionListItem } from "../../../lib/member-profile-client";

type Tab = "all" | "aply" | "interest" | "saved";
type Emp = "FULL_TIME" | "INTERN";
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
  const { ensure, modal: loginModal } = useLoginGate();
  const interests = useJobInterests();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [foreigner, setForeigner] = useState(false);
  const [emp, setEmp] = useState<Emp[]>([]);
  const [locs, setLocs] = useState<string[]>([]);
  const [items, setItems] = useState<PublicPositionListItem[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // 입력이 멈추면 검색(0.35초).
  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyFavoritePositions()
      .then((l) => setSaved(new Set(l.map((p) => p.id))))
      .catch(() => {});
  }, [isAuthenticated]);

  const fetchPage = useCallback(
    async (p: number): Promise<{ items: PublicPositionListItem[]; total: number | null }> => {
      if (tab === "saved") {
        const list = isAuthenticated ? await getMyFavoritePositions() : [];
        const q = search.toLowerCase();
        const filtered = q ? list.filter((j) => `${j.title} ${companyOf(j)}`.toLowerCase().includes(q)) : list;
        return { items: filtered, total: filtered.length };
      }
      if (tab === "interest" && !interests.length) return { items: [], total: 0 };
      const res = await getPublicPositionsPage({
        page: p,
        limit: PAGE,
        search: search || undefined,
        sourceProviders: tab === "aply" ? ["INTERNAL"] : undefined,
        jobRoles: tab === "interest" ? jobCategoriesForInterests(interests) : undefined,
        employmentTypes: emp.length ? (emp.flatMap((e) => (e === "INTERN" ? ["INTERN", "UNPAID_INTERN"] : [e])) as PublicPositionListItem["employmentType"][]) : undefined,
        locations: locs.length ? locs : undefined,
        foreignerEligible: foreigner || undefined,
        locale
      });
      return { items: res.items, total: res.total ?? null };
    },
    [tab, search, interests, emp, locs, foreigner, locale, isAuthenticated]
  );

  useEffect(() => {
    let alive = true;
    fetchPage(1)
      .then((r) => {
        if (!alive) return;
        setItems(r.items);
        setTotal(r.total);
        setPage(1);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [fetchPage]);

  const loadMore = () => {
    if (more) return;
    setMore(true);
    fetchPage(page + 1)
      .then((r) => {
        setItems((prev) => [...(prev ?? []), ...r.items]);
        setPage(page + 1);
      })
      .finally(() => setMore(false));
  };

  const toggleSave = (id: string) =>
    ensure(() => {
      const on = !saved.has(id);
      setSaved((s) => {
        const n = new Set(s);
        if (on) n.add(id);
        else n.delete(id);
        return n;
      });
      (on ? addMyFavoritePosition(id) : removeMyFavoritePosition(id)).catch(() =>
        setSaved((s) => {
          const n = new Set(s);
          if (on) n.delete(id);
          else n.add(id);
          return n;
        })
      );
    });

  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
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
        lede={total != null && tab !== "saved" ? t(`지금 ${total.toLocaleString()}개 공고가 있어요`, `${total.toLocaleString()} jobs right now`, `目前有 ${total.toLocaleString()} 个职位`, `Hiện có ${total.toLocaleString()} việc làm`, `いま${total.toLocaleString()}件の求人`, `${total.toLocaleString()} lowongan saat ini`) : undefined}
      />

      <div className="px-5">
        <SearchField value={query} onChange={setQuery} placeholder={t("직무, 회사 또는 역량 검색", "Search roles, companies, skills", "搜索职位、公司或技能", "Tìm vị trí, công ty, kỹ năng", "職種・会社・スキルで検索", "Cari peran, perusahaan, keahlian")} />
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(([k, label]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>
            {label}
          </Chip>
        ))}
      </div>
      {tab !== "saved" ? (
        <div className="mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip on={foreigner} onClick={() => setForeigner((v) => !v)}>🌏 {t("외국인 지원", "Foreigners OK", "外国人可", "Nhận người nước ngoài", "外国人可", "Terbuka WNA")}</FilterChip>
          <FilterChip on={emp.includes("FULL_TIME")} onClick={() => setEmp((l) => toggle(l, "FULL_TIME"))}>{t("정규직", "Full-time", "全职", "Toàn thời gian", "正社員", "Penuh waktu")}</FilterChip>
          <FilterChip on={emp.includes("INTERN")} onClick={() => setEmp((l) => toggle(l, "INTERN"))}>{t("인턴", "Intern", "实习", "Thực tập", "インターン", "Magang")}</FilterChip>
          <FilterChip on={locs.includes("서울")} onClick={() => setLocs((l) => toggle(l, "서울"))}>{t("서울", "Seoul", "首尔", "Seoul", "ソウル", "Seoul")}</FilterChip>
          <FilterChip on={locs.includes("경기")} onClick={() => setLocs((l) => toggle(l, "경기"))}>{t("경기", "Gyeonggi", "京畿", "Gyeonggi", "京畿", "Gyeonggi")}</FilterChip>
        </div>
      ) : null}

      <div className="mt-4 h-3 bg-[color:var(--v2-band)] md:mx-5 md:h-px md:bg-[color:var(--v2-line)]" aria-hidden />

      <ul className="px-5">
        {items === null ? null : items.length === 0 ? (
          <Empty>
            {tab === "interest" && !interests.length
              ? t("관심 직무를 고르면 맞는 공고만 모아 볼 수 있어요.", "Pick job interests to see matching jobs.", "选择感兴趣的职位即可查看匹配职位。", "Chọn nghề quan tâm để xem việc phù hợp.", "関心職種を選ぶと合う求人だけ見られます。", "Pilih minat untuk melihat lowongan yang cocok.")
              : tab === "saved"
                ? t("저장한 공고가 없어요. 마음에 드는 공고에 하트를 눌러 보세요.", "No saved jobs. Tap the heart on a job you like.", "没有收藏的职位。为喜欢的职位点亮爱心吧。", "Chưa lưu tin nào. Nhấn tim ở tin bạn thích.", "保存した求人はありません。気になる求人のハートを押しましょう。", "Belum ada yang disimpan. Ketuk hati di lowongan yang disukai.")
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
                  <span className="line-clamp-2 text-[16px] font-semibold leading-[1.45] text-[color:var(--v2-ink)]">{j.title}</span>
                  <span className="mt-0.5 block truncate text-[14px] text-[color:var(--v2-faint)]">{[companyOf(j), shortPlace(j.workLocation), empLabel(t, j.employmentType)].filter(Boolean).join(" · ")}</span>
                  {(j.eligibleVisas ?? []).includes("FOREIGNER_FRIENDLY") || j.sourceProvider === "INTERNAL" ? (
                    <span className="mt-1.5 flex gap-1.5">
                      {j.sourceProvider === "INTERNAL" ? <Tag>Aply ONLY</Tag> : null}
                      {(j.eligibleVisas ?? []).includes("FOREIGNER_FRIENDLY") ? <Tag>{t("외국인 지원", "Foreigners OK", "外国人可", "Nhận WNA", "外国人可", "Terbuka WNA")}</Tag> : null}
                    </span>
                  ) : null}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => toggleSave(j.id)}
                aria-pressed={saved.has(j.id)}
                aria-label={saved.has(j.id) ? t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "保存を解除", "Batal simpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-[color:var(--v2-band)]"
              >
                <Heart className={`h-[22px] w-[22px] ${saved.has(j.id) ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-faint)]"}`} weight={saved.has(j.id) ? "fill" : "regular"} />
              </button>
            </li>
          ))
        )}
      </ul>
      {hasMore ? (
        <div className="px-5 pt-4">
          <button type="button" onClick={loadMore} disabled={more} className="h-12 w-full rounded-2xl bg-[color:var(--v2-band)] text-[15px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)] disabled:opacity-50">
            {more ? t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…") : t("더 보기", "Load more", "加载更多", "Xem thêm", "もっと見る", "Muat lagi")}
          </button>
        </div>
      ) : null}
      {loginModal}
    </Page>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[14px] font-semibold transition ${on ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "border-[color:var(--v2-line)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-band)]"}`}
    >
      {children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-[color:var(--v2-band)] px-1.5 py-0.5 text-[12px] font-semibold text-[color:var(--v2-ink-3)]">{children}</span>;
}
