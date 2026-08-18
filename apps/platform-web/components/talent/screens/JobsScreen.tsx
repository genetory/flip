"use client";

// 채용공고 — aply.global 포지션 탐색과 동일한 실 API·기능·검색/필터 동작으로.
// 소스 탭(전체 / Aply 채용) + 저장, 검색(입력→적용+트래킹), 직무 필터(서버), 정렬, 20개 페이징.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, CaretLeft, CaretRight, CaretDown, Check, X } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { useLoginGate } from "../app/LoginRequiredModal";
import { TEmpty, TError, TListSkeleton, TPageHeader } from "../ui/primitives";
import { PositionCard } from "../jobs/PositionCard";
import { ApplyReadinessBanner } from "../ApplyReadinessBanner";
import { InFeedAd } from "../../ads/InFeedAd";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { JobInterestModal } from "../jobs/JobInterestModal";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT } from "../../../lib/i18n";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { trackPositionSearch } from "../../../lib/analytics";
import {
  getPublicPositionsPage,
  getMyFavoritePositions,
  addMyFavoritePosition,
  removeMyFavoritePosition,
  getPublicPremiumPositionBanners,
  type PublicPositionListItem,
  type PublicPremiumPositionBannerItem
} from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { notifySavedPosition } from "../../../lib/talent/activity-log";

const PAGE_SIZE = 20;
type Tab = "all" | "aply" | "interest" | "saved";
type Sort = "latest" | "deadline";
type EmploymentType = "FULL_TIME" | "INTERN" | "PART_TIME";
// 지역 필터(시·도) — 서버 LOCATION_ALIASES와 키 동일.
const REGIONS = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"] as const;

function toggleValue<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function JobsScreen() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const toast = useTalentPopup();
  const interests = useJobInterests();
  const { ensure, modal: loginModal } = useLoginGate(); // 게스트가 저장 시 로그인 유도
  const [pickerOpen, setPickerOpen] = useState(false);

  const [tab, setTab] = useState<Tab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  // 외국인 지원 가능(FOREIGNER_FRIENDLY)만 — 한국인/외국인 공고 공용 목록에서 서버 필터로 좁힌다.
  const [foreignerOnly, setForeignerOnly] = useState(false);
  // 추가 필터 — 고용형태 / 지역(시·도). 드롭다운 다중 선택. (직무 필터는 보류)
  const [empTypes, setEmpTypes] = useState<EmploymentType[]>([]);
  const [locs, setLocs] = useState<string[]>([]);
  const activeFilterCount = empTypes.length + locs.length;
  // 소스 탭 → 서버 sourceProviders. Aply 채용 = INTERNAL 만.
  const sourceProviders: PublicPositionListItem["sourceProvider"][] | undefined = tab === "aply" ? ["INTERNAL"] : undefined;
  // 관심 직무(소분류) → 공고 vocabulary(JobCategory)로 변환해야 원티드·CIP가 매칭된다.
  const interestRoles = useMemo(() => jobCategoriesForInterests(interests), [interests]);
  // 관심 직무 탭 → jobRoles 필터.
  const jobRoles = tab === "interest" && interestRoles.length ? interestRoles : undefined;

  const [items, setItems] = useState<PublicPositionListItem[]>([]);
  const [page, setPage] = useState(1); // 번호 페이징(무한스크롤 대신)
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<PublicPositionListItem[]>([]);
  const [savedStatus, setSavedStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const [banners, setBanners] = useState<PublicPremiumPositionBannerItem[]>([]);
  const [cipOpen, setCipOpen] = useState(false);

  // 저장 목록 + 프리미엄 배너 초기 로드.
  useEffect(() => {
    void getMyFavoritePositions()
      .then((list) => setSavedIds(new Set(list.map((p) => p.id))))
      .catch(() => setSavedIds(new Set()));
    void getPublicPremiumPositionBanners()
      .then((list) => setBanners(list))
      .catch(() => setBanners([]));
  }, []);

  // 목록: 특정 페이지 로드(offset 기반 번호 페이징).
  const load = useCallback(async (p: number) => {
    // 관심 직무 탭인데 설정된 직무가 없으면 빈 상태.
    if (tab === "interest" && interests.length === 0) {
      setItems([]);
      setTotal(0);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const providers = tab === "aply" ? (["INTERNAL"] as PublicPositionListItem["sourceProvider"][]) : undefined;
      const roles = tab === "interest" ? interestRoles : undefined;
      const res = await getPublicPositionsPage({
        page: p,
        limit: PAGE_SIZE,
        search: appliedSearch,
        sort,
        sourceProviders: providers,
        jobRoles: roles,
        employmentTypes: empTypes.length ? empTypes : undefined,
        locations: locs.length ? locs : undefined,
        foreignerEligible: foreignerOnly,
        locale
      });
      setItems(res.items);
      setTotal(res.total ?? res.items.length);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [appliedSearch, sort, tab, interestRoles, empTypes, locs, foreignerOnly, locale, interests.length]);

  // 검색/직무/정렬/소스/탭 변경 → 1페이지부터 다시.
  useEffect(() => {
    if (tab === "saved") return;
    setPage(1);
    void load(1);
  }, [load, tab]);

  // 페이지 이동 — 로드 후 목록 상단으로 스크롤.
  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === page || status === "loading") return;
    setPage(p);
    void load(p);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 저장 탭 진입 시 저장 목록 로드.
  useEffect(() => {
    if (tab !== "saved" || savedStatus !== "idle") return;
    setSavedStatus("loading");
    getMyFavoritePositions()
      .then((list) => {
        setSavedItems(list);
        setSavedIds(new Set(list.map((p) => p.id)));
        setSavedStatus("ready");
      })
      .catch(() => setSavedStatus("error"));
  }, [tab, savedStatus]);

  function toggleSave(id: string) {
    const willSave = !savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(id);
      else next.delete(id);
      return next;
    });
    if (willSave) notifySavedPosition(t, id);
    const req = willSave ? addMyFavoritePosition(id) : removeMyFavoritePosition(id);
    void req
      .then(() => {
        if (!willSave) setSavedItems((prev) => prev.filter((p) => p.id !== id));
      })
      .catch(() => {
        // 롤백
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (willSave) next.delete(id);
          else next.add(id);
          return next;
        });
        toast.error(t("저장에 실패했어요", "Failed to save", "保存失败", "Lưu thất bại", "保存に失敗しました", "Gagal menyimpan"));
      });
  }

  function submitSearch() {
    const next = searchInput.trim();
    setAppliedSearch(next);
    if (next) trackPositionSearch(next);
  }

  const source = tab === "saved" ? savedItems : items;
  const views = useMemo(() => source.map((it) => toPositionView(it, t)), [source, t]);

  return (
    <TalentAppShell allowGuest>
      <TPageHeader title={t("포지션 탐색", "Explore jobs", "职位探索", "Khám phá việc làm", "求人を探す", "Jelajahi lowongan")} description={t("나에게 맞는 인턴·신입 공고를 찾아 지원을 시작해요.", "Find intern and entry-level jobs that fit you and start applying.", "找到适合你的实习和应届职位并开始申请。", "Tìm việc thực tập, mới ra trường phù hợp và bắt đầu ứng tuyển.", "自分に合うインターン・新卒求人を見つけて応募を始めましょう。", "Temukan lowongan magang dan pemula yang cocok, lalu mulai melamar.")} />

      <ApplyReadinessBanner variant="compact" className="mb-5" />

      {/* 소스 탭 — 언더라인 탭 바(모바일 가로 스크롤) */}
      <div className="mb-5 flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {([
          { key: "all", label: t("전체 공고", "All jobs", "全部职位", "Tất cả", "すべて", "Semua") },
          { key: "aply", label: "APLY CIP" },
          { key: "interest", label: t("나의 관심 직무만", "My interests", "我的兴趣", "Sở thích của tôi", "関心職種", "Minat saya") },
          { key: "saved", label: t("즐겨찾기", "Saved", "收藏", "Đã lưu", "保存済み", "Tersimpan") }
        ] as { key: Tab; label: string }[]).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={active ? "page" : undefined}
              className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${active ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
            >
              {t.label}
              {active ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
            </button>
          );
        })}
      </div>

      {tab !== "saved" ? (
        <>
          {/* 관심 직무 요약 · 수정 */}
          {tab === "interest" && interests.length > 0 ? (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3">
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {interests.map((r) => (
                  <span key={r} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{jobTaxonomyLabelOf(t, r)}</span>
                ))}
              </div>
              <button type="button" onClick={() => setPickerOpen(true)} className="shrink-0 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968]">
                {t("수정", "Edit", "编辑", "Sửa", "編集", "Ubah")}
              </button>
            </div>
          ) : null}

          {/* 프리미엄 배너 */}
          {banners.length ? (
            <section className="mb-5">
              <h2 className="mb-2.5 text-[15px] font-bold text-[#191F28]">{t("추천 기업", "Featured companies", "推荐企业", "Công ty nổi bật", "おすすめ企業", "Perusahaan unggulan")}</h2>
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <div className="flex gap-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {banners.map((b) => (
                    <Link
                      key={b.id}
                      href={`${talentAppRoutes.jobs}/${b.positionId}`}
                      className="block w-[240px] shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white transition hover:border-[#D7DCE3]"
                    >
                      <div className="h-[135px] w-full overflow-hidden bg-[#F2F4F6]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.bannerImageUrl} alt={b.bannerTitle} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-4">
                        <p className="line-clamp-2 text-[14px] font-bold leading-tight text-[#191F28]">{b.bannerTitle}</p>
                        {b.bannerSubtitle ? <p className="mt-1 line-clamp-2 text-[12.5px] leading-tight text-[#8B95A1]">{b.bannerSubtitle}</p> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* 검색 */}
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white p-2">
            <MagnifyingGlass className="ml-2 h-5 w-5 shrink-0 text-[#B0B8C1]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder={t("직무, 회사 또는 역량 검색", "Search role, company, or skill", "搜索职位、公司或技能", "Tìm nghề, công ty hoặc kỹ năng", "職種・企業・スキルで検索", "Cari peran, perusahaan, atau keahlian")}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
            />
            <button type="button" onClick={submitSearch} className="rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
              {t("검색", "Search", "搜索", "Tìm", "検索", "Cari")}
            </button>
          </div>

          {/* 외국인 지원 가능 — 별도 토글로 잘 보이게(행 전체 클릭) */}
          <button
            type="button"
            role="switch"
            aria-checked={foreignerOnly}
            onClick={() => setForeignerOnly((v) => !v)}
            className="mb-3 flex w-full items-center justify-between gap-3 rounded-xl bg-[#F2F4F6] px-3.5 py-2.5 text-left"
          >
            <span className="text-[13px] font-bold text-[#191F28]">🌏 {t("외국인 지원 가능만 보기", "Foreigner-eligible only", "仅外国人可申请", "Chỉ dành cho người nước ngoài", "外国人応募可のみ", "Hanya untuk WNA")}</span>
            <ToggleSwitch on={foreignerOnly} />
          </button>

          {/* 드롭다운 필터(좌) · 정렬(우) */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
            <div className="flex items-center gap-2">
              <FilterDropdown
                label={t("고용형태", "Type", "类型", "Loại", "形態", "Tipe")}
                selected={empTypes}
                options={([
                  ["FULL_TIME", t("정규직", "Full-time", "正式", "Toàn thời gian", "正社員", "Penuh waktu")],
                  ["INTERN", t("인턴", "Intern", "实习", "Thực tập", "インターン", "Magang")],
                  ["PART_TIME", t("파트타임", "Part-time", "兼职", "Bán thời gian", "パート", "Paruh waktu")]
                ] as [EmploymentType, string][]).map(([value, label]) => ({ value, label }))}
                onToggle={(v) => setEmpTypes((a) => toggleValue(a, v as EmploymentType))}
              />
              <FilterDropdown
                label={t("지역", "Region", "地区", "Khu vực", "地域", "Wilayah")}
                selected={locs}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
                onToggle={(v) => setLocs((a) => toggleValue(a, v))}
              />
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={() => { setEmpTypes([]); setLocs([]); }}
                  className="flex items-center gap-0.5 text-[12px] font-bold text-[#8B95A1] transition hover:text-[#4E5968]"
                >
                  <X size={13} weight="bold" />
                  {t("초기화", "Reset", "重置", "Đặt lại", "リセット", "Reset")}
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-3.5">
              <SortText on={sort === "latest"} onClick={() => setSort("latest")}>{t("최신순", "Latest", "最新", "Mới nhất", "新着順", "Terbaru")}</SortText>
              <SortText on={sort === "deadline"} onClick={() => setSort("deadline")}>{t("마감 임박순", "Deadline", "临近截止", "Sắp hết hạn", "締切間近", "Tenggat")}</SortText>
            </div>
          </div>

          {status === "loading" ? <TListSkeleton /> : null}
          {status === "error" ? <TError onRetry={() => load(page)} /> : null}
          {status === "ready" ? (
            views.length === 0 ? (
              tab === "interest" && interests.length === 0 ? (
                <TEmpty
                  icon="🎯"
                  title={t("관심 직무를 먼저 설정해주세요", "Set your job interests first", "请先设置兴趣职位", "Hãy đặt sở thích nghề trước", "まず関心職種を設定してください", "Atur minat pekerjaan Anda dulu")}
                  description={t("관심 직무를 고르면 맞는 공고만 모아서 보여드려요.", "Pick your interests and we'll show only matching jobs.", "选择兴趣职位后，只显示匹配的职位。", "Chọn sở thích để chỉ xem việc phù hợp.", "関心職種を選ぶと合う求人だけ表示します。", "Pilih minat, kami tampilkan lowongan yang cocok saja.")}
                  action={
                    <button type="button" onClick={() => setPickerOpen(true)} className="rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
                      {t("관심 직무 선택", "Choose interests", "选择兴趣职位", "Chọn sở thích", "関心職種を選ぶ", "Pilih minat")}
                    </button>
                  }
                />
              ) : (
                <TEmpty title={t("조건에 맞는 공고가 없어요", "No matching jobs", "没有符合条件的职位", "Không có việc phù hợp", "条件に合う求人がありません", "Tidak ada lowongan cocok")} description={t("다른 검색어로 찾아보세요.", "Try a different search.", "换个关键词试试。", "Thử từ khóa khác.", "別のキーワードで探してみてください。", "Coba kata kunci lain.")} />
              )
            ) : (
              <div className="flex flex-col gap-3">
                {views.map((v, idx) => (
                  <Fragment key={v.id}>
                    <PositionCard view={v} saved={savedIds.has(v.id)} onToggleSave={(id) => ensure(() => toggleSave(id))} onShowCip={() => setCipOpen(true)} />
                    {(idx + 1) % 4 === 0 && idx + 1 < views.length ? <InFeedAd /> : null}
                  </Fragment>
                ))}
                {totalPages > 1 ? (
                  <Pagination page={page} totalPages={totalPages} onPage={goToPage} t={t} />
                ) : null}
              </div>
            )
          ) : null}
        </>
      ) : (
        <>
          {savedStatus === "loading" || savedStatus === "idle" ? <TListSkeleton /> : null}
          {savedStatus === "error" ? <TError onRetry={() => setSavedStatus("idle")} /> : null}
          {savedStatus === "ready" ? (
            views.length === 0 ? (
              <TEmpty title={t("즐겨찾기한 공고가 없어요", "No saved jobs", "没有收藏的职位", "Chưa có tin đã lưu", "保存した求人がありません", "Belum ada lowongan tersimpan")} description={t("관심 있는 공고를 즐겨찾기하면 여기에 모여요.", "Save jobs you like and they'll appear here.", "收藏感兴趣的职位后会显示在这里。", "Lưu tin bạn thích, chúng sẽ hiện ở đây.", "気になる求人を保存するとここに集まります。", "Simpan lowongan yang Anda suka, akan muncul di sini.")} />
            ) : (
              <div className="flex flex-col gap-3">
                {views.map((v) => (
                  <PositionCard key={v.id} view={v} saved={savedIds.has(v.id)} onToggleSave={(id) => ensure(() => toggleSave(id))} onShowCip={() => setCipOpen(true)} />
                ))}
              </div>
            )
          ) : null}
        </>
      )}

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
      {pickerOpen ? <JobInterestModal initial={interests} onClose={() => setPickerOpen(false)} /> : null}
      {loginModal}
    </TalentAppShell>
  );
}

// 정렬 — 뱃지 대신 텍스트 하이라이트(선택 시 진하게)/비하이라이트.
// 다중 선택 드롭다운 — 버튼(라벨 + 선택 개수) + 체크박스 팝오버. 바깥 클릭 시 닫힘.
function FilterDropdown({ label, options, selected, onToggle }: { label: string; options: Array<{ value: string; label: string }>; selected: string[]; onToggle: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const count = selected.length;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-[13px] font-bold transition ${count > 0 ? "border-[#0B46E8] bg-[#0B46E8]/[0.06] text-[#0B46E8]" : "border-[#E5E8EB] text-[#4E5968] hover:bg-[#F2F4F6]"}`}
      >
        {label}
        {count > 0 ? <span className="rounded-full bg-[#0B46E8] px-1.5 text-[11px] font-bold text-white">{count}</span> : null}
        <CaretDown size={13} weight="bold" className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-64 w-44 overflow-y-auto rounded-xl border border-[#E5E8EB] bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onToggle(o.value)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#191F28] transition hover:bg-[#F2F4F6]"
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#B0B8C1]"}`}>
                  {on ? <Check size={11} weight="bold" /> : null}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// 시각 전용 스위치(클릭 처리는 감싸는 버튼이 담당).
function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span className={`relative inline-flex h-[24px] w-[42px] shrink-0 items-center rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D1D6DB]"}`}>
      <span className={`inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-sm transition ${on ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
    </span>
  );
}

function SortText({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`text-[13px] transition ${on ? "font-bold text-[#191F28]" : "font-normal text-[#B0B8C1] hover:text-[#8B95A1]"}`}
    >
      {children}
    </button>
  );
}

// 번호 페이징 — 처음/현재±2/끝을 보여주고 나머지는 …로 접는다.
function Pagination({ page, totalPages, onPage, disabled, t }: { page: number; totalPages: number; onPage: (p: number) => void; disabled?: boolean; t: ReturnType<typeof usePlatformT> }) {
  const pages: (number | "ellipsis")[] = [];
  const start = Math.max(2, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  pages.push(1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages - 1) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);

  const navBtn = "flex h-9 w-9 items-center justify-center rounded-lg text-[#4E5968] transition hover:bg-[#F2F4F6] disabled:opacity-35 disabled:hover:bg-transparent";
  return (
    <nav className="mt-2 flex items-center justify-center gap-1" aria-label={t("페이지 이동", "Pagination", "分页", "Phân trang", "ページ移動", "Paginasi")}>
      <button type="button" onClick={() => onPage(page - 1)} disabled={disabled || page <= 1} aria-label={t("이전", "Previous", "上一页", "Trước", "前へ", "Sebelumnya")} className={navBtn}>
        <CaretLeft className="h-4 w-4" weight="bold" />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-[13px] text-[#B0B8C1]">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            disabled={disabled}
            aria-current={p === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded-lg px-2 text-[13px] font-bold tabular-nums transition ${p === page ? "bg-[#0B46E8] text-white" : "text-[#4E5968] hover:bg-[#F2F4F6]"} disabled:opacity-60`}
          >
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => onPage(page + 1)} disabled={disabled || page >= totalPages} aria-label={t("다음", "Next", "下一页", "Sau", "次へ", "Berikutnya")} className={navBtn}>
        <CaretRight className="h-4 w-4" weight="bold" />
      </button>
    </nav>
  );
}

