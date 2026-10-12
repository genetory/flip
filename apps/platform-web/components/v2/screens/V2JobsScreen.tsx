"use client";

// v2 포지션 탐색 — 검색칸 하나, 탭·필터는 칩 한 줄씩, 공고는 사진 달린 목록. 게스트도 본다.
// 저장은 공고 상세에서 한다(목록엔 하트 없음 — 공고 이름이 주인공). 공고 상세는 아직 기존 화면.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Chip, Empty, Masthead, Page, RowsSkeleton, SearchField, Spinner, Switch } from "../ui";
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
  // ?tab=interest 처럼 다른 화면(내 커리어 '내 스펙에 맞는 공고')에서 탭을 골라 들어올 수 있다.
  const tabParam = useSearchParams()?.get("tab");
  const [tab, setTab] = useState<Tab>(tabParam === "aply" || tabParam === "interest" || tabParam === "saved" ? tabParam : "all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  // '혹시 외국인이세요?' — 한국인도 보는 화면이라 먼저 걸러 두지 않고 물어본다. 답은 이 브라우저에만 기억.
  //   yes → 이번에 필터를 켠다 / no → 그대로. 어느 쪽이든 다시 묻지 않는다(닫기 없이 둘 중 하나로 답한다).
  //   스위치는 늘 꺼진 채로 시작한다 — 한국인도 함께 보는 화면이라 미리 걸러 두지 않는다. 저장소를 못 써도 화면은 그대로 동작.
  const stored = useSyncExternalStore(subscribeForeigner, readForeigner, () => "ssr");
  const [answered, setAnswered] = useState(false);
  const [foreignerToggle, setForeigner] = useState<boolean | null>(null);
  const foreigner = foreignerToggle ?? false;
  const askForeigner = stored === null && !answered;
  const answerForeigner = (answer: "yes" | "no") => {
    trackForeignerPrompt(answer);
    writeForeigner(answer === "yes" ? "yes" : "no");
    if (answer === "yes") setForeigner(true);
    setAnswered(true);
  };
  // 정렬 — 평소엔 최신·마감, 검색 중엔 관련도순을 더하고 기본으로(문장 검색도 서버가 뜻으로 찾아 준다).
  const [baseSort, setBaseSort] = useState<"latest" | "deadline">("latest");
  const [searchSort, setSearchSort] = useState<"relevance" | "latest" | "deadline">("relevance");
  const sort = search ? searchSort : baseSort;
  const setSort = (k: "relevance" | "latest" | "deadline") => (search ? setSearchSort(k) : k !== "relevance" && setBaseSort(k));
  // 결과는 '어떤 조건으로 받은 것인지'와 함께 둔다 — 조건이 바뀌면 새 결과가 올 때까지 스켈레톤을 보이게.
  const [result, setResult] = useState<{ for: unknown; items: PublicPositionListItem[]; total: number | null } | null>(null);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);



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

  // 이번 주 마감 — 목록 정렬과 상관없이 위에 묶어 보여 준다. 탭·외국인 스위치는 따르고, 검색 중·저장 탭에선 숨긴다.
  const [closing, setClosing] = useState<PublicPositionListItem[]>([]);
  useEffect(() => {
    if (tab === "saved" || search || (tab === "interest" && !interests.length)) return;
    let alive = true;
    getPublicPositionsPage({
      page: 1,
      limit: 12,
      sort: "deadline",
      sourceProviders: tab === "aply" ? ["INTERNAL"] : undefined,
      jobRoles: tab === "interest" ? jobCategoriesForInterests(interests) : undefined,
      foreignerEligible: foreigner || undefined,
      locale
    })
      .then((r) => alive && setClosing(r.items.filter((j) => (deadlineOf(j)?.days ?? 99) <= 7).slice(0, 5)))
      .catch(() => alive && setClosing([]));
    return () => {
      alive = false;
    };
  }, [tab, search, interests, foreigner, locale]);
  const showClosing = tab !== "saved" && !search && !(tab === "interest" && !interests.length) && closing.length > 0;

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
  // 머리말 — 외국인·한국인 모두 보는 곳이라 '어디서 일할지'가 아니라 '지금 보고 있는 공고 묶음'을 말한다.
  // 탭·외국인 스위치·검색어에 따라 바뀐다. 숫자만 굵은 먹색({n} 자리에 끼워 넣는다 — 언어마다 어순이 다르다).
  const bold = (tpl: string, n: number | null) =>
    n == null ? undefined : tpl.split("{n}").flatMap((part, i) => (i === 0 ? [part] : [<b key={i} className="font-bold text-[color:var(--v2-ink)]">{n.toLocaleString()}</b>, part]));
  const shownCount = tab === "saved" ? items?.length ?? null : total;
  const countLede = bold(t("{n}개 공고가 있어요", "{n} jobs", "共 {n} 个职位", "{n} việc làm", "{n}件の求人", "{n} lowongan"), shownCount);
  // 찾는 중 — 개수 대신 '찾고 있어요…'(옛 결과는 살짝 흐리게 둔 채). 결과가 오면 바로 바뀐다.
  const searchingLede = (
    <span className="inline-flex items-center gap-1.5 text-[color:var(--v2-muted)]">
      <Spinner className="h-3.5 w-3.5" />
      {t("찾고 있어요…", "Searching…", "正在搜索…", "Đang tìm…", "探しています…", "Mencari…")}
    </span>
  );
  const headingBase: { title: string; lede: React.ReactNode } = (() => {
    const f = foreigner && tab !== "saved";
    // 문장으로 찾으면 제목이 길어져 — 12자 넘으면 제목은 짧게, 검색한 문장은 설명 줄에.
    if (search && search.length > 12)
      return {
        title: t("이런 공고를 찾았어요", "Here's what we found", "为你找到这些职位", "Đây là kết quả cho bạn", "こんな求人が見つかりました", "Ini hasil pencarianmu"),
        lede: (
          <>
            <span className="text-[color:var(--v2-ink-3)]">‘{search}’</span> · {countLede}
          </>
        )
      };
    if (search)
      return {
        title: t(`'${search}' 공고를 찾아봤어요`, `Here's what we found for '${search}'`, `为你找到了“${search}”相关职位`, `Đây là kết quả cho '${search}'`, `「${search}」の求人を探しました`, `Ini hasil untuk '${search}'`),
        lede: countLede
      };
    if (tab === "saved") return { title: t("저장해 둔 공고예요", "Jobs you saved", "这是你收藏的职位", "Những tin bạn đã lưu", "保存しておいた求人です", "Lowongan yang kamu simpan"), lede: countLede };
    if (tab === "aply")
      return {
        title: f
          ? t("외국인도 Aply에서 바로 지원할 수 있어요", "Foreigners can apply right here on Aply", "外国人也能在 Aply 直接投递", "Người nước ngoài cũng ứng tuyển ngay trên Aply", "外国の方もAplyですぐ応募できます", "WNA juga bisa langsung melamar di Aply")
          : t("Aply에서 바로 지원할 수 있어요", "Apply right here on Aply", "在 Aply 就能直接投递", "Ứng tuyển ngay trên Aply", "Aplyですぐ応募できます", "Langsung lamar di Aply"),
        lede: countLede
      };
    if (tab === "interest") {
      return {
        title: f
          ? t("외국인도 지원할 수 있는 관심 직무 공고예요", "Jobs in your interests that welcome foreigners", "外国人也能申请的感兴趣职位", "Việc bạn quan tâm, người nước ngoài cũng ứng tuyển được", "外国の方も応募できる関心職種の求人です", "Lowongan minatmu yang terbuka untuk WNA")
          : t("관심 직무에 맞는 공고예요", "Jobs that match your interests", "这些职位符合你的兴趣", "Việc hợp với nghề bạn quan tâm", "関心職種に合う求人です", "Lowongan yang cocok dengan minatmu"),
        lede: countLede
      };
    }
    return {
      title: f
        ? t("외국인도 지원할 수 있는 공고예요", "Jobs that welcome foreigners", "这些职位外国人也能申请", "Việc người nước ngoài cũng ứng tuyển được", "外国の方も応募できる求人です", "Lowongan yang terbuka untuk WNA")
        : t("지금 채용 중인 공고를 모았어요", "Here are the jobs hiring now", "为你整理了正在招聘的职位", "Tổng hợp việc đang tuyển cho bạn", "いま募集中の求人を集めました", "Ini lowongan yang sedang dibuka"),
      lede: countLede
    };
  })();
  // 검색 결과를 기다리는 동안 제목이 '찾았어요'로 먼저 바뀌면 어색하다 — 검색이면 '찾고 있어요', 필터 변경이면 제목 그대로.
  const heading = refreshing
    ? search
      ? { title: t("공고를 찾고 있어요", "Looking for jobs…", "正在为你找职位", "Đang tìm việc cho bạn", "求人を探しています", "Sedang mencari lowongan"), lede: searchingLede }
      : { ...headingBase, lede: searchingLede }
    : headingBase;

  // 스위치는 '켜면 이것만 본다'는 뜻이라 '만'을 붙인다(공고 위 칩은 공고의 특징이라 '가능'까지만).
  const foreignerLabel = t("외국인 채용 가능만", "Foreigner-friendly only", "只看可招外国人", "Chỉ việc nhận WNA", "外国人採用可のみ", "Hanya terbuka WNA");
  const hasMore = !refreshing && tab !== "saved" && items !== null && total !== null && items.length < total;

  return (
    <Page>
      <Masthead eyebrow={t("포지션 탐색", "Jobs", "职位", "Việc làm", "求人", "Lowongan")} title={heading.title} lede={heading.lede} />

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
        <SearchField
          value={query}
          onChange={setQuery}
          onSubmit={() => setSearch(query.trim())}
          onClear={() => {
            setQuery("");
            setSearch("");
          }}
          busy={refreshing}
          submitLabel={t("검색", "Search", "搜索", "Tìm", "検索", "Cari")}
          clearLabel={t("지우기", "Clear", "清除", "Xóa", "クリア", "Hapus")}
          placeholder={t("찾는 일을 편하게 적어 보세요", "Tell us what job you're looking for", "说说你想找什么工作", "Bạn muốn tìm việc gì? Cứ gõ thoải mái", "探している仕事を気軽に書いてください", "Ceritakan pekerjaan yang kamu cari")} />
      </div>
      {/* 탭 칩 줄 — 왼쪽 탭(넘치면 가로로 넘김), 오른쪽 끝에 '외국인 채용 가능' 스위치.
          스위치는 탭이 아니라 켜고 끄는 거름망이라 모양을 다르게 해 구분한다. 저장한 공고 탭에선 숨김. */}
      <div className="mt-4 flex items-center gap-3 px-5">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map(([k, label]) => (
            <Chip key={k} active={tab === k} onClick={() => setTab(k)}>
              {k === "aply" ? (
                // 'Aply' 글자 대신 로고 — 고르면 칩이 먹색이라 로고를 흰색으로 바꿔 보이게.
                // 대문자 ONLY·로고(p·y 꼬리)는 위로 떠 보여 0.5px 내려 눈으로 가운데를 맞춘다(박스는 이미 가운데).
                <span className="inline-flex translate-y-[0.5px] items-center gap-1.5" aria-label="Aply ONLY">
                  {/* eslint-disable-next-line @next/next/no-img-element -- 작은 로고 한 장, 크기 고정 */}
                  <img src="/img_logo.webp" alt="" className={`h-5 w-auto ${tab === k ? "brightness-0 invert" : ""}`} />
                  <span aria-hidden>ONLY</span>
                </span>
              ) : (
                label
              )}
            </Chip>
          ))}
        </div>
        {/* PC — 탭 줄 오른쪽. 모바일은 탭이 좁아지므로 목록 머리 왼쪽으로(아래). */}
        {tab !== "saved" ? (
          <span className="hidden md:inline-flex">
            <Switch on={foreigner} onChange={setForeigner} label={foreignerLabel} />
          </span>
        ) : null}
      </div>

      {showClosing ? (
        <section className="mt-6" aria-label={t("이번 주 마감", "Closing this week", "本周截止", "Hết hạn tuần này", "今週締切", "Tutup minggu ini")}>
          <h2 className="px-5 text-[17px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">
            {t("이번 주에 마감돼요", "Closing this week", "本周截止", "Hết hạn trong tuần này", "今週締め切られます", "Tutup minggu ini")}
          </h2>
          {/* scroll-px — 넘김 멈춤 위치도 본문 좌우 여백(20px)에 맞춘다(없으면 첫 카드가 화면 끝에 붙는다). */}
          <div className="mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {closing.map((j) => {
              const due = deadlineOf(j)!;
              return (
                <Link key={j.id} href={`/talent/jobs/${j.id}`} className="flex w-[230px] shrink-0 snap-start flex-col rounded-2xl bg-[color:var(--v2-band)] p-3 transition hover:bg-[color:var(--v2-line)]">
                  {/* 썸네일 — 목록과 같은 사진(썸네일 → 사무실 사진 → 로고), 없으면 회사 첫 글자. */}
                  {jobPhotoOf(j) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 외부 공고 이미지·data URL 이 섞여 next/image 로 못 받는다.
                    <img src={jobPhotoOf(j)!} alt="" loading="lazy" className="h-[112px] w-full rounded-xl bg-white object-cover" />
                  ) : (
                    <span className="flex h-[112px] w-full items-center justify-center rounded-xl bg-white text-[24px] font-bold text-[color:var(--v2-faint)]">{(companyOf(j) || j.title).slice(0, 1)}</span>
                  )}
                  <span className="mt-3 px-1 text-[13px] font-bold text-[color:var(--v2-attention)]">
                    {due.days === 0 ? t("오늘 마감", "Closes today", "今天截止", "Hết hạn hôm nay", "本日締切", "Tutup hari ini") : `D-${due.days}`}
                  </span>
                  <span className="mt-1 line-clamp-2 px-1 text-[16px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{j.title}</span>
                  <span className="mt-auto truncate px-1 pb-1 pt-2 text-[13px] text-[color:var(--v2-faint)]">{companyOf(j)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 목록 머리 — 왼쪽 개수, 오른쪽 정렬. 필터 바로 아래라 구분선 없이 여백만. */}
      <div className="mt-5 flex items-center justify-between px-5">
        {tab !== "saved" ? (
          <span className="md:hidden">
            <Switch on={foreigner} onChange={setForeigner} label={foreignerLabel} />
          </span>
        ) : null}
        <p className={`text-[14px] font-medium text-[color:var(--v2-faint)] ${tab !== "saved" ? "hidden md:block" : ""}`}>
          {refreshing ? t("찾는 중…", "Searching…", "搜索中…", "Đang tìm…", "検索中…", "Mencari…") : items ? t(`${(total ?? items.length).toLocaleString()}개`, `${(total ?? items.length).toLocaleString()} jobs`, `${(total ?? items.length).toLocaleString()} 个`, `${(total ?? items.length).toLocaleString()} tin`, `${(total ?? items.length).toLocaleString()}件`, `${(total ?? items.length).toLocaleString()} lowongan`) : ""}
        </p>
        <div className="flex items-center gap-3 text-[14px]">
          {(
            [
              ...(search ? ([["relevance", t("관련도순", "Relevance", "相关度", "Liên quan", "関連順", "Relevan")]] as const) : []),
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

      <ul className={`px-5 transition-opacity duration-200 ${refreshing ? "pointer-events-none opacity-60" : ""}`} aria-busy={refreshing}>
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
                  {/* 위 줄 — 왼쪽 표시 칩, 오른쪽 끝 마감. 모의 면접은 바로 해 볼 수 있다는 뜻이라 파란 칩.
                      마감은 날짜가 있을 때만(상시 채용·지난 것은 표시 안 함): 늘 D-n — 7일 안이면 빨강, 그 뒤는 회색. */}
                  {(() => {
                    const foreignerOk = (j.eligibleVisas ?? []).includes("FOREIGNER_FRIENDLY");
                    const aply = j.sourceProvider === "INTERNAL";
                    const mock = hasMockInterview(j);
                    const due = deadlineOf(j);
                    return foreignerOk || aply || mock || due ? (
                      <span className="mb-1.5 flex items-center gap-2">
                        <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                          {aply ? <Tag>Aply ONLY</Tag> : null}
                          {foreignerOk ? <Tag>{t("외국인 채용 가능", "Open to foreigners", "可招外国人", "Nhận WNA", "外国人採用可", "Terbuka WNA")}</Tag> : null}
                          {mock ? <Tag tone="accent">{t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara")}</Tag> : null}
                        </span>
                        {due ? (
                          <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${due.days <= 7 ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-faint)]"}`}>
                            {due.days === 0 ? t("오늘 마감", "Closes today", "今天截止", "Hết hạn hôm nay", "本日締切", "Tutup hari ini") : `D-${due.days}`}
                          </span>
                        ) : null}
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

/** 마감 — 날짜가 있고 아직 안 지났을 때만. 상시 채용은 null. */
function deadlineOf(j: PublicPositionListItem): { days: number; date: Date } | null {
  if (j.sourceDeadlineRolling || !j.sourceDeadlineDate) return null;
  const date = new Date(j.sourceDeadlineDate.slice(0, 10));
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  return days >= 0 ? { days, date } : null;
}

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" }) {
  return <span className={`rounded-md px-2.5 py-0.5 text-[12px] font-semibold ${tone === "accent" ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>{children}</span>;
}
