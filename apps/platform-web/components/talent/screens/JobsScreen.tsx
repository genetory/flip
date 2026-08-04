"use client";

// 채용공고 — aply.global 포지션 탐색과 동일한 실 API·기능·검색/필터 동작으로.
// 소스 탭(전체 / Aply 채용) + 저장, 검색(입력→적용+트래킹), 직무 필터(서버), 정렬, 20개 페이징.
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, CircleNotch } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TEmpty, TError, TLoading, TPageHeader } from "../ui/primitives";
import { PositionCard } from "../jobs/PositionCard";
import { InFeedAd } from "../../ads/InFeedAd";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { JobInterestModal } from "../jobs/JobInterestModal";
import { useLanguage } from "../../i18n/LanguageProvider";
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
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { notifySavedPosition } from "../../../lib/talent/activity-log";

const PAGE_SIZE = 20;
type Tab = "all" | "aply" | "interest" | "saved";
type Sort = "latest" | "deadline";

export function JobsScreen() {
  const { locale } = useLanguage();
  const toast = useTalentPopup();
  const interests = useJobInterests();
  const [pickerOpen, setPickerOpen] = useState(false);

  const [tab, setTab] = useState<Tab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  // 외국인 지원 가능(FOREIGNER_FRIENDLY)만 — 한국인/외국인 공고 공용 목록에서 서버 필터로 좁힌다.
  const [foreignerOnly, setForeignerOnly] = useState(false);
  // 소스 탭 → 서버 sourceProviders. Aply 채용 = INTERNAL 만.
  const sourceProviders: PublicPositionListItem["sourceProvider"][] | undefined = tab === "aply" ? ["INTERNAL"] : undefined;
  // 관심 직무(소분류) → 공고 vocabulary(JobCategory)로 변환해야 원티드·CIP가 매칭된다.
  const interestRoles = useMemo(() => jobCategoriesForInterests(interests), [interests]);
  // 관심 직무 탭 → jobRoles 필터.
  const jobRoles = tab === "interest" && interestRoles.length ? interestRoles : undefined;

  const [items, setItems] = useState<PublicPositionListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);

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

  // 목록: 검색/직무/정렬/소스 변경 시 리셋 로드.
  const loadFirst = useCallback(async () => {
    // 관심 직무 탭인데 설정된 직무가 없으면 빈 상태.
    if (tab === "interest" && interests.length === 0) {
      setItems([]);
      setCursor(null);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const providers = tab === "aply" ? (["INTERNAL"] as PublicPositionListItem["sourceProvider"][]) : undefined;
      const roles = tab === "interest" ? interestRoles : undefined;
      const page = await getPublicPositionsPage({ limit: PAGE_SIZE, search: appliedSearch, sort, sourceProviders: providers, jobRoles: roles, foreignerEligible: foreignerOnly, locale });
      setItems(page.items);
      setCursor(page.nextCursor);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [appliedSearch, sort, tab, interestRoles, foreignerOnly, locale]);

  useEffect(() => {
    if (tab === "saved") return;
    void loadFirst();
  }, [loadFirst, tab]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getPublicPositionsPage({ limit: PAGE_SIZE, search: appliedSearch, sort, sourceProviders, jobRoles, foreignerEligible: foreignerOnly, cursor, locale });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      toast.error("공고를 더 불러오지 못했어요");
    } finally {
      setLoadingMore(false);
    }
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
    if (willSave) notifySavedPosition(id);
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
        toast.error("저장에 실패했어요");
      });
  }

  function submitSearch() {
    const next = searchInput.trim();
    setAppliedSearch(next);
    if (next) trackPositionSearch(next);
  }

  const source = tab === "saved" ? savedItems : items;
  const views = useMemo(() => source.map(toPositionView), [source]);

  return (
    <TalentAppShell>
      <TPageHeader title="포지션 탐색" description="나에게 맞는 인턴·신입 공고를 찾아 지원을 시작해요." />

      {/* 소스 탭 — 언더라인 탭 바 */}
      <div className="mb-5 flex gap-6">
        {([
          { key: "all", label: "전체 공고" },
          { key: "aply", label: "APLY CIP" },
          { key: "interest", label: "나의 관심 직무만" },
          { key: "saved", label: "즐겨찾기" }
        ] as { key: Tab; label: string }[]).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={active ? "page" : undefined}
              className={`relative pb-1.5 text-[15px] font-bold transition ${active ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
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
                  <span key={r} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{r}</span>
                ))}
              </div>
              <button type="button" onClick={() => setPickerOpen(true)} className="shrink-0 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#4E5968]">
                수정
              </button>
            </div>
          ) : null}

          {/* 프리미엄 배너 */}
          {banners.length ? (
            <section className="mb-5">
              <h2 className="mb-2.5 text-[15px] font-bold text-[#191F28]">추천 기업</h2>
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
              placeholder="직무, 회사 또는 역량 검색"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
            />
            <button type="button" onClick={submitSearch} className="rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
              검색
            </button>
          </div>

          {/* 외국인 필터(좌) · 정렬(우) */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <ToggleSwitch on={foreignerOnly} onChange={setForeignerOnly} label="외국인도 지원 가능" />
            <div className="flex items-center gap-3.5">
              <SortText on={sort === "latest"} onClick={() => setSort("latest")}>최신순</SortText>
              <SortText on={sort === "deadline"} onClick={() => setSort("deadline")}>마감 임박순</SortText>
            </div>
          </div>

          {status === "loading" ? <TLoading /> : null}
          {status === "error" ? <TError onRetry={loadFirst} /> : null}
          {status === "ready" ? (
            views.length === 0 ? (
              tab === "interest" && interests.length === 0 ? (
                <TEmpty
                  icon="🎯"
                  title="관심 직무를 먼저 설정해주세요"
                  description="관심 직무를 고르면 맞는 공고만 모아서 보여드려요."
                  action={
                    <button type="button" onClick={() => setPickerOpen(true)} className="rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
                      관심 직무 선택
                    </button>
                  }
                />
              ) : (
                <TEmpty title="조건에 맞는 공고가 없어요" description="다른 검색어로 찾아보세요." />
              )
            ) : (
              <div className="flex flex-col gap-3">
                {views.map((v, idx) => (
                  <Fragment key={v.id}>
                    <PositionCard view={v} saved={savedIds.has(v.id)} onToggleSave={toggleSave} onShowCip={() => setCipOpen(true)} />
                    {(idx + 1) % 4 === 0 && idx + 1 < views.length ? <InFeedAd /> : null}
                  </Fragment>
                ))}
                {cursor ? (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#4E5968] transition hover:bg-[#F6F8FB] disabled:opacity-60"
                  >
                    {loadingMore ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
                    {loadingMore ? "불러오는 중…" : "더 보기"}
                  </button>
                ) : null}
              </div>
            )
          ) : null}
        </>
      ) : (
        <>
          {savedStatus === "loading" || savedStatus === "idle" ? <TLoading /> : null}
          {savedStatus === "error" ? <TError onRetry={() => setSavedStatus("idle")} /> : null}
          {savedStatus === "ready" ? (
            views.length === 0 ? (
              <TEmpty title="즐겨찾기한 공고가 없어요" description="관심 있는 공고를 즐겨찾기하면 여기에 모여요." />
            ) : (
              <div className="flex flex-col gap-3">
                {views.map((v) => (
                  <PositionCard key={v.id} view={v} saved={savedIds.has(v.id)} onToggleSave={toggleSave} onShowCip={() => setCipOpen(true)} />
                ))}
              </div>
            )
          ) : null}
        </>
      )}

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
      {pickerOpen ? <JobInterestModal initial={interests} onClose={() => setPickerOpen(false)} /> : null}
    </TalentAppShell>
  );
}

// 정렬 — 뱃지 대신 텍스트 하이라이트(선택 시 진하게)/비하이라이트.
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

function ToggleSwitch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-2">
      <span className={`relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#E5E8EB]"}`}>
        <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition ${on ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
      </span>
      <span className={`text-[13px] transition ${on ? "font-bold text-[#191F28]" : "font-normal text-[#8B95A1]"}`}>{label}</span>
    </button>
  );
}
