"use client";

// 홈 = 간단하게. 피처드 배너 + 인사 + 취업 준비 가이드 + 추천 공고.
// 실제 관리(이력서/자소서 등)는 내 커리어에서. 디자인은 Toss 톤(흰 배경·소프트 카드·블루 액센트·여백).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretRight, ArrowClockwise, ArrowRight, X } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TLoading, TError } from "../ui/primitives";
import { PositionCard } from "../jobs/PositionCard";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { CareerChatEntry } from "../career/CareerChatEntry";
import { FeedCard } from "../career/FeedCard";
import { CareerFunnelCards } from "../career/CareerFunnelCards";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useCareerFeed } from "../../../lib/talent/career-feed";
import { useCareerHistorySync } from "../../../lib/talent/useCareerHistorySync";
import { careerGuides, featuredBanners, pickRandomTip, type CareerGuide } from "../../../lib/talent/home-content";
import {
  getPublicPositionsPage,
  getMyFavoritePositions,
  addMyFavoritePosition,
  removeMyFavoritePosition
} from "../../../lib/member-profile-client";
import { toPositionView, type PositionView } from "../../../lib/talent/positions-adapter";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { isFollowing, useFollowing } from "../../../lib/talent/social-graph";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import type { TalentSnapshot } from "../../../lib/talent/types";

export function HomeScreen() {
  const { snapshot, status, reload } = useTalentSnapshot();
  return (
    <TalentAppShell>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? <HomeContent snapshot={snapshot} /> : null}
    </TalentAppShell>
  );
}

function HomeContent({ snapshot }: { snapshot: TalentSnapshot }) {
  return (
    <div className="flex flex-col gap-8">
      <FeaturedBanners />
      <GreetingHeader snapshot={snapshot} />
      <TodayTip />
      <CareerChatEntry />
      <HomeCareerHistory />
      <GuideSection />
      <RecommendedJobs />
      <HomeCompanies />
    </div>
  );
}

const COMPANY_SIZE_LABELS: Record<string, string> = {
  SIZE_1_10: "1~10인",
  SIZE_UNDER_30: "30인 이하",
  SIZE_UNDER_50: "50인 이하",
  SIZE_OVER_100: "100인 이상"
};

type HomeCompany = { name: string; industry?: string; size?: string; location?: string; logo?: string; count: number };

/* 이런 회사는 어때요 — 채용 중인 회사 중 랜덤 3개 */
function HomeCompanies() {
  const following = useFollowing();
  void following; // 관심 수 리렌더 트리거
  const [companies, setCompanies] = useState<HomeCompany[]>([]);

  useEffect(() => {
    let alive = true;
    void getPublicPositionsPage({ limit: 100, sourceProviders: ["INTERNAL"] })
      .then((page) => {
        if (!alive) return;
        const map = new Map<string, HomeCompany>();
        for (const p of page.items) {
          const org = p.partnerOrganization;
          if (!org?.name) continue;
          const e = map.get(org.name) ?? {
            name: org.name,
            industry: org.industry ? partnerIndustryLabel(org.industry) : undefined,
            size: org.companySize ? COMPANY_SIZE_LABELS[org.companySize] ?? undefined : undefined,
            location: (org.officeAddress || p.workLocation || "").split(" ")[0] || undefined,
            logo: org.companyLogoImageData || undefined,
            count: 0
          };
          e.count += 1;
          map.set(org.name, e);
        }
        const all = Array.from(map.values());
        // 랜덤 셔플 후 3개.
        for (let i = all.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [all[i], all[j]] = [all[j], all[i]];
        }
        setCompanies(all.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!companies.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">이런 회사는 어때요?</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">지금 채용 중인 회사를 만나보세요.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {companies.map((c) => (
          <Link
            key={c.name}
            href={`/talent/company/${encodeURIComponent(c.name)}`}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 text-center transition hover:border-[#D7DCE3] hover:shadow-[0_6px_20px_rgba(11,18,39,0.05)]"
          >
            {c.logo ? (
              <span className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt="" className="h-full w-full object-cover" />
              </span>
            ) : (
              <span className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px] font-black text-[#0B46E8]">{c.name.slice(0, 1)}</span>
            )}
            <div className="w-full min-w-0">
              <p className="truncate text-[13.5px] font-bold text-[#191F28]">{c.name}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-[#8B95A1]">{[c.industry, c.size, c.location].filter(Boolean).join(" · ") || "기업"}</p>
              <p className="truncate text-[11.5px] text-[#8B95A1]">포지션 <span className="font-bold text-[#191F28]">{c.count}</span>개</p>
              <p className="truncate text-[11.5px] text-[#8B95A1]">관심 <span className="font-bold text-[#191F28]">{isFollowing({ name: c.name, role: "PARTNER" }) ? 1 : 0}</span>명</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* 최상단 피처드 배너 — 광고·이벤트 (무한 루프 캐러셀 + 페이지 도트 + 자동 넘김) */
function FeaturedBanners() {
  const ref = useRef<HTMLDivElement>(null);
  const settleRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const n = featuredBanners.length;
  const loop = n > 1;
  // 무한 루프: 양끝에 클론(마지막·처음) 추가. 실제 슬라이드는 인덱스 1..n.
  const slides = loop ? [featuredBanners[n - 1], ...featuredBanners, featuredBanners[0]] : featuredBanners;

  // 시작 위치를 첫 실제 슬라이드(index 1)로.
  useEffect(() => {
    const el = ref.current;
    if (!el || !loop) return;
    el.scrollLeft = el.clientWidth;
    return () => {
      if (settleRef.current) window.clearTimeout(settleRef.current);
    };
  }, [loop]);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);

    // 도트는 매 프레임 갱신(클론 → 실제 인덱스 매핑).
    if (!loop) {
      setActive(idx);
    } else {
      setActive(idx === 0 ? n - 1 : idx === slides.length - 1 ? 0 : idx - 1);
    }

    // 경계 점프는 스크롤이 멈춘 뒤에만(깜빡임 방지).
    if (!loop) return;
    if (settleRef.current) window.clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(() => {
      const cur = ref.current;
      if (!cur) return;
      const cw = cur.clientWidth || 1;
      const i = Math.round(cur.scrollLeft / cw);
      if (i === 0) cur.scrollTo({ left: n * cw, behavior: "auto" });
      else if (i === slides.length - 1) cur.scrollTo({ left: cw, behavior: "auto" });
    }, 140);
  }

  function goTo(realIndex: number) {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: (loop ? realIndex + 1 : realIndex) * el.clientWidth, behavior: "smooth" });
  }

  if (n === 0) return null;
  return (
    <div>
      <div ref={ref} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((b, i) => (
          <div key={`${b.id}-${i}`} className="w-full min-w-full snap-center px-1.5 md:px-2">
            <Link
              href={b.href}
              className="relative flex h-[210px] w-full flex-col justify-center overflow-hidden rounded-2xl bg-[#111111] px-6 text-white md:h-[280px] md:px-8"
            >
              <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" aria-hidden />
              <span className="pointer-events-none absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-white/5" aria-hidden />
              <span className="relative inline-flex w-fit items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11.5px] font-bold">{b.tag}</span>
              <p className="relative mt-2 whitespace-pre-line text-[18px] font-black leading-[1.3] tracking-[-0.02em] md:text-[22px]">{b.title}</p>
              <p className="relative mt-1 text-[12.5px] text-white/85 md:text-[13.5px]">{b.subtitle}</p>
            </Link>
          </div>
        ))}
      </div>
      {loop ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {featuredBanners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`${i + 1}번째 배너로`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all ${active === i ? "w-5 bg-[#0B46E8]" : "w-1.5 bg-[#D7DCE3]"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* 인사 */
function GreetingHeader({ snapshot }: { snapshot: TalentSnapshot }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[18px] font-black text-[#0B46E8]">
        {snapshot.greetingName.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <p className="text-[13px] text-[#8B95A1]">{snapshot.stageLabel}</p>
        <h1 className="text-[21px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[24px]">{snapshot.greetingName}님, 안녕하세요 👋</h1>
      </div>
    </div>
  );
}

/* 오늘의 팁 — 랜덤, 우측 새로고침으로 다른 팁 */
function TodayTip() {
  const [tip, setTip] = useState(() => pickRandomTip());
  function refresh() {
    setTip((prev) => {
      let next = pickRandomTip();
      for (let i = 0; i < 6 && next === prev; i++) next = pickRandomTip();
      return next;
    });
  }
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">오늘은 이런 팁 어때요?</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">매일 하나씩, 취업에 도움되는 이야기를 골라봤어요.</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-[#F5F6F8] px-4 py-4">
        <span className="text-[19px] leading-none" aria-hidden>💡</span>
        <p className="flex-1 break-keep text-[15px] font-bold leading-relaxed text-[#191F28]">{`"${tip}"`}</p>
        <button
          type="button"
          onClick={refresh}
          aria-label="다른 팁 보기"
          className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8B95A1] transition hover:bg-white hover:text-[#4E5968]"
        >
          <ArrowClockwise className="h-[19px] w-[19px]" />
        </button>
      </div>
    </section>
  );
}

/* 내 커리어 — 최근 커리어 기록 3개 */
function HomeCareerHistory() {
  useCareerHistorySync();
  const feed = useCareerFeed();
  const recent = feed.slice(0, 3);
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">내 커리어가 쌓이고 있어요</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">남긴 기록이 이력서·자기소개서로 정리돼요.</p>
      </div>

      {/* 이력서 / 자기소개서 */}
      <CareerFunnelCards />

      {recent.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {recent.map((e) => (
            <FeedCard key={e.id} entry={e} />
          ))}
        </div>
      ) : (
        <Link href={talentAppRoutes.chat} className="flex items-center gap-3 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] px-5 py-6 transition hover:border-[#0B46E8]/40">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[18px]" aria-hidden>📝</span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#191F28]">아직 커리어 기록이 없어요</p>
            <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">AI 커리어 노트에 한 줄 남기면 여기에 쌓여요.</p>
          </div>
        </Link>
      )}

      <Link href={talentAppRoutes.career} className="mt-1 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
        내 커리어 더 보기 <CaretRight className="h-4 w-4" weight="bold" />
      </Link>
    </section>
  );
}

/* 취업 준비 가이드 — 카드 누르면 가이드 팝업 */
function GuideSection() {
  const [active, setActive] = useState<CareerGuide | null>(null);
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">취업 준비, 이렇게 시작해봐요</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">처음이라도 막막하지 않게 하나씩 알려드려요.</p>
      </div>
      <div className="-mx-4 overflow-x-auto md:mx-0">
        <div className="flex gap-3 pb-1 pl-4 md:pl-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {careerGuides.map((g) => (
            <button
              key={g.title}
              type="button"
              onClick={() => setActive(g)}
              className="flex w-[220px] shrink-0 flex-col rounded-2xl border border-[#EEF1F5] bg-white p-5 text-left transition hover:border-[#D7DCE3] hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[22px]" aria-hidden>{g.emoji}</span>
              <p className="mt-4 min-h-[40px] whitespace-pre-line break-keep text-[14.5px] font-bold leading-snug text-[#191F28]">{g.title}</p>
              <p className="mt-1.5 line-clamp-2 min-h-[40px] break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{g.desc}</p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8]">자세히 <CaretRight className="h-3.5 w-3.5" /></span>
            </button>
          ))}
          {/* 우측 패딩용 트레일링 스페이서(gap 상쇄) */}
          <span aria-hidden className="-ml-3 w-4 shrink-0 md:hidden" />
        </div>
      </div>
      {active ? <GuideModal guide={active} onClose={() => setActive(null)} /> : null}
    </section>
  );
}

/* 가이드 팝업 */
function GuideModal({ guide, onClose }: { guide: CareerGuide; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[82vh] w-full max-w-[440px] flex-col overflow-hidden rounded-3xl bg-white" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 px-7 pt-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[22px]" aria-hidden>{guide.emoji}</span>
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{guide.title.replace(/\n/g, " ")}</h2>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose} className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="flex flex-col gap-5">
            {guide.body.map((b) => (
              <div key={b.heading}>
                <p className="text-[14.5px] font-bold text-[#191F28]">{b.heading}</p>
                <p className="mt-1.5 break-keep text-[13.5px] leading-[1.7] text-[#4E5968]">{b.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {guide.href ? (
          <div className="border-t border-[#F2F4F6] p-4">
            <Link
              href={guide.href}
              onClick={onClose}
              className="flex h-[48px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]"
            >
              {guide.ctaLabel ?? "바로 시작하기"} <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* 나에게 맞는 공고 — 채용공고와 동일한 카드(저장·CIP) 5개 + 더 보기 → 채용공고 */
function RecommendedJobs() {
  const { locale } = useLanguage();
  const toast = useTalentPopup();
  const interests = useJobInterests();
  const [jobs, setJobs] = useState<PositionView[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cipOpen, setCipOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    // 관심 직무(소분류) → 공고 vocabulary(JobCategory)로 변환해야 원티드·CIP가 매칭된다.
    const roles = jobCategoriesForInterests(interests);
    const jobRoles = roles.length ? roles : undefined;
    // 우선순위: (직무 선택 시) 관심 직무 매칭 → 부족하면 최신 공고로 채움. 각 단계 APLY CIP(INTERNAL) 최우선.
    void (async () => {
      const load = (opts: { jobRoles?: string[]; internalOnly?: boolean }) =>
        getPublicPositionsPage({ limit: 5, jobRoles: opts.jobRoles, sourceProviders: opts.internalOnly ? ["INTERNAL"] : undefined, locale }).catch(() => null);

      const pages = [
        await load({ jobRoles, internalOnly: true }), // 매칭 CIP
        await load({ jobRoles }) // 매칭 전체
      ];
      // 직무가 선택됐는데 5개를 못 채우면 최신 공고로 보충.
      if (jobRoles) {
        pages.push(await load({ internalOnly: true })); // 최신 CIP
        pages.push(await load({})); // 최신 전체
      }
      if (!alive) return;

      const seen = new Set<string>();
      const merged: PositionView[] = [];
      for (const page of pages) {
        for (const it of page?.items ?? []) {
          if (seen.has(it.id)) continue;
          seen.add(it.id);
          merged.push(toPositionView(it));
          if (merged.length >= 5) break;
        }
        if (merged.length >= 5) break;
      }
      setJobs(merged);
    })();
    void getMyFavoritePositions()
      .then((list) => {
        if (alive) setSavedIds(new Set(list.map((p) => p.id)));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [locale, interests]);

  function toggleSave(id: string) {
    const willSave = !savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(id);
      else next.delete(id);
      return next;
    });
    const req = willSave ? addMyFavoritePosition(id) : removeMyFavoritePosition(id);
    void req.catch(() => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(id);
        else next.add(id);
        return next;
      });
      toast.error("저장에 실패했어요");
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">나에게 딱 맞는 공고예요</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">관심 직무를 바탕으로 골라봤어요.</p>
      </div>

      {/* 관심 직무 카드(공용) */}
      <JobInterestCard />

      {jobs.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {jobs.map((view) => (
              <PositionCard key={view.id} view={view} saved={savedIds.has(view.id)} onToggleSave={toggleSave} onShowCip={() => setCipOpen(true)} />
            ))}
          </div>
          <Link href={talentAppRoutes.jobs} className="mt-1 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
            포지션 탐색 더 보기 <CaretRight className="h-4 w-4" weight="bold" />
          </Link>
        </>
      ) : (
        <div className="rounded-2xl border border-[#EEF1F5] bg-white px-5 py-6 text-center">
          <p className="text-[13.5px] text-[#8B95A1]">표시할 공고가 없어요.</p>
        </div>
      )}

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
    </section>
  );
}
