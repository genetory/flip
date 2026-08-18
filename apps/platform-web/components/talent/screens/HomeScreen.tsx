"use client";

// 홈 = 간단하게. 피처드 배너 + 인사 + 취업 준비 가이드 + 추천 공고.
// 실제 관리(이력서/자소서 등)는 내 커리어에서. 디자인은 Toss 톤(흰 배경·소프트 카드·블루 액센트·여백).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretRight, ArrowClockwise, ArrowRight, X, Buildings } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { PositionCard } from "../jobs/PositionCard";
import { ApplyReadinessBanner } from "../ApplyReadinessBanner";
import { useApplyReadiness } from "../../../lib/talent/apply-readiness";
import { useOnboardingSeen, markOnboardingSeen } from "../../../lib/talent/onboarding-state";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { FeedCard } from "../career/FeedCard";
import { CareerFunnelCards } from "../career/CareerFunnelCards";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useCareerFeed } from "../../../lib/talent/career-feed";
import { useCareerHistorySync } from "../../../lib/talent/useCareerHistorySync";
import { careerGuides, featuredBanners, pickRandomTip, type CareerGuide } from "../../../lib/talent/home-content";
import {
  getPublicPositionsPage,
  getMyFavoritePositions,
  addMyFavoritePosition,
  removeMyFavoritePosition,
  getCompanySummaries
} from "../../../lib/member-profile-client";
import { toPositionView, type PositionView } from "../../../lib/talent/positions-adapter";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { useDailyStep } from "../../../lib/talent/daily-step";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useTimeGreeting } from "../../../lib/time-greeting";
import { notifySavedPosition } from "../../../lib/talent/activity-log";
export function HomeScreen() {
  return (
    <TalentAppShell>
      <HomeContent />
    </TalentAppShell>
  );
}

function HomeContent() {
  return (
    <div className="flex flex-col gap-10">
      <FeaturedBanners />
      <GreetingHeader />
      <WelcomeOnboardingCard />
      <ApplyReadinessBanner variant="card" />
      <DeadlineReminder />
      <HomeCareerHistory />
      <GuideSection />
      <TodayTip />
      <RecommendedJobs />
      <HomeCompanies />
    </div>
  );
}

/* 첫 실행 웰컴 — 아직 아무것도 시작 안 한 신규 유저에게 온보딩을 안내(계정에 저장) */
function WelcomeOnboardingCard() {
  const t = usePlatformT();
  const seen = useOnboardingSeen();
  const { loaded, pct } = useApplyReadiness();
  const [hidden, setHidden] = useState(false);
  // 로드 완료 + 아직 안 봄 + 시작 전(준비도 0%) 신규 유저에게만.
  if (!loaded || seen || hidden || pct > 0) return null;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B46E8] to-[#3A6BF0] p-5 text-white">
      <button
        type="button"
        aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
        onClick={() => {
          markOnboardingSeen();
          setHidden(true);
        }}
        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/80">WELCOME</p>
      <h2 className="mt-1.5 break-keep text-[19px] font-black leading-[1.3] tracking-[-0.02em]">{t("3분이면 취업 준비를 시작할 수 있어요", "Start your job prep in just 3 minutes", "3分钟即可开始求职准备", "Bắt đầu chuẩn bị xin việc chỉ trong 3 phút", "3分で就活準備を始められます", "Mulai persiapan kerja hanya dalam 3 menit")}</h2>
      <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-white/85">{t("몇 가지만 알려주시면 나에게 딱 맞는 첫 단계로 안내해드릴게요.", "Tell us a few things and we'll guide you to the perfect first step.", "只需告诉我们几件事，我们就会为您指引最合适的第一步。", "Chỉ cần cho chúng tôi biết vài điều, chúng tôi sẽ hướng dẫn bạn bước đầu tiên phù hợp nhất.", "いくつか教えていただければ、あなたにぴったりの第一歩をご案内します。", "Beri tahu kami beberapa hal dan kami akan memandu Anda ke langkah pertama yang tepat.")}</p>
      <Link
        href={talentAppRoutes.onboarding}
        className="mt-4 inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F5F8FF]"
      >
        {t("시작하기", "Get started", "开始", "Bắt đầu", "始める", "Mulai")} <ArrowRight className="h-4 w-4" weight="bold" />
      </Link>
    </section>
  );
}

/* 마감 임박 — 저장(즐겨찾기)한 공고 중 7일 내 마감되는 공고 리마인드 */
type DeadlineItem = { id: string; title: string; company: string; thumb: string | null; days: number };
function DeadlineReminder() {
  const t = usePlatformT();
  const [items, setItems] = useState<DeadlineItem[]>([]);
  useEffect(() => {
    void getMyFavoritePositions()
      .then((list) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const soon = list
          .map((p): DeadlineItem | null => {
            if (p.sourceDeadlineRolling || !p.sourceDeadlineDate) return null;
            const d = new Date(p.sourceDeadlineDate.slice(0, 10));
            if (Number.isNaN(d.getTime())) return null;
            const days = Math.ceil((d.getTime() - today) / 86_400_000);
            if (days < 0 || days > 7) return null;
            return {
              id: p.id,
              title: p.title,
              company: p.partnerOrganization?.name || p.sourceCompanyName || t("비공개 기업", "Undisclosed company", "未公开企业", "Công ty ẩn danh", "非公開企業", "Perusahaan dirahasiakan"),
              thumb: p.thumbnailImages?.[0] ?? null,
              days
            };
          })
          .filter((x): x is DeadlineItem => x !== null)
          .sort((a, b) => a.days - b.days)
          .slice(0, 3);
        setItems(soon);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("마감이 다가와요", "Deadlines are near", "截止日期临近", "Hạn chót đang đến gần", "締め切りが近づいています", "Tenggat sudah dekat")}</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{t("저장한 공고 중 곧 마감되는 공고예요. 놓치지 마세요.", "These saved jobs are closing soon. Don't miss out.", "这些收藏的职位即将截止，别错过。", "Những tin đã lưu này sắp hết hạn. Đừng bỏ lỡ.", "保存した求人がまもなく締め切りです。お見逃しなく。", "Lowongan tersimpan ini segera ditutup. Jangan lewatkan.")}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((it) => {
          const urgent = it.days <= 2;
          return (
            <Link
              key={it.id}
              href={`${talentAppRoutes.jobs}/${it.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-3.5 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F2F4F6]">
                {it.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Buildings className="h-6 w-6 text-[#C4CAD2]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-[#191F28]">{it.title}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{it.company}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${urgent ? "bg-[#FDECEE] text-[#F04452]" : "bg-[#FFF3E6] text-[#E8890C]"}`}
              >
                {it.days === 0 ? t("오늘 마감", "Due today", "今天截止", "Hết hạn hôm nay", "本日締切", "Tutup hari ini") : `D-${it.days}`}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function companySizeLabel(t: PlatformT, size: string): string | undefined {
  switch (size) {
    case "SIZE_1_10":
      return t("1~10인", "1–10", "1~10人", "1–10 người", "1~10人", "1–10 orang");
    case "SIZE_UNDER_30":
      return t("30인 이하", "≤30", "30人以下", "≤30 người", "30人以下", "≤30 orang");
    case "SIZE_UNDER_50":
      return t("50인 이하", "≤50", "50人以下", "≤50 người", "50人以下", "≤50 orang");
    case "SIZE_OVER_100":
      return t("100인 이상", "100+", "100人以上", "100+ người", "100人以上", "100+ orang");
    default:
      return undefined;
  }
}

type HomeCompany = { id: string; name: string; industry?: string; size?: string; location?: string; logo?: string; count: number };

/* 이런 회사는 어때요 — 채용 중인 회사 중 랜덤 3개 */
function HomeCompanies() {
  const t = usePlatformT();
  const [companies, setCompanies] = useState<HomeCompany[]>([]);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    void getPublicPositionsPage({ limit: 100, sourceProviders: ["INTERNAL"] })
      .then((page) => {
        if (!alive) return;
        const map = new Map<string, HomeCompany>();
        for (const p of page.items) {
          const org = p.partnerOrganization;
          if (!org?.name || !org.id) continue;
          const e = map.get(org.name) ?? {
            id: org.id,
            name: org.name,
            industry: org.industry ? partnerIndustryLabel(org.industry) : undefined,
            size: org.companySize ? companySizeLabel(t, org.companySize) : undefined,
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
        const picked = all.slice(0, 3);
        setCompanies(picked);
        // 회사 소개 LLM 요약(캐시) 로드.
        void getCompanySummaries(picked.map((c) => c.id))
          .then((s) => {
            if (alive) setSummaries(s);
          })
          .catch(() => {});
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
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("이런 회사는 어때요?", "How about these companies?", "看看这些公司如何？", "Còn những công ty này thì sao?", "こんな会社はいかがですか？", "Bagaimana dengan perusahaan ini?")}</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{t("지금 채용 중인 회사를 만나보세요.", "Meet companies hiring right now.", "认识正在招聘的公司。", "Gặp gỡ các công ty đang tuyển dụng.", "今採用中の会社に出会いましょう。", "Temui perusahaan yang sedang merekrut.")}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {companies.map((c) => (
          <Link
            key={c.name}
            href={`/talent/company/${encodeURIComponent(c.name)}`}
            className="flex items-start gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]"
          >
            {c.logo ? (
              <span className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo} alt="" className="h-full w-full object-cover" />
              </span>
            ) : (
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[19px] font-black text-[#0B46E8]">{c.name.slice(0, 1)}</span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[14.5px] font-bold text-[#191F28]">{c.name}</p>
                <span className="shrink-0 text-[11.5px] font-bold text-[#0B46E8]">{t("포지션", "Positions", "职位", "Vị trí", "ポジション", "Posisi")} {c.count}</span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{[c.industry, c.size, c.location].filter(Boolean).join(" · ") || t("기업", "Company", "企业", "Công ty", "企業", "Perusahaan")}</p>
              {summaries[c.id] ? (
                <p className="mt-1.5 line-clamp-2 break-keep text-[12.5px] leading-relaxed text-[#5A6473]">{summaries[c.id]}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* 최상단 피처드 배너 — 광고·이벤트 (무한 루프 캐러셀 + 페이지 도트 + 자동 넘김) */
function FeaturedBanners() {
  const t = usePlatformT();
  const banners = featuredBanners(t);
  const ref = useRef<HTMLDivElement>(null);
  const settleRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const n = banners.length;
  const loop = n > 1;
  // 무한 루프: 양끝에 클론(마지막·처음) 추가. 실제 슬라이드는 인덱스 1..n.
  const slides = loop ? [banners[n - 1], ...banners, banners[0]] : banners;

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
              className="relative flex h-[210px] w-full flex-col justify-center overflow-hidden rounded-2xl px-6 text-white md:h-[280px] md:px-8"
              style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}
            >
              <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" aria-hidden />
              <span className="pointer-events-none absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-white/5" aria-hidden />
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt="" aria-hidden className="pointer-events-none absolute bottom-0 right-1 h-[94%] max-w-[48%] object-contain object-bottom md:right-3" />
              ) : null}
              <div className="relative z-10" style={{ maxWidth: b.image ? "60%" : undefined }}>
                <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11.5px] font-bold">{b.tag}</span>
                <p className="mt-2 whitespace-pre-line text-[18px] font-black leading-[1.3] tracking-[-0.02em] md:text-[22px]">{b.title}</p>
                <p className="mt-1 text-[12.5px] text-white/85 md:text-[13.5px]">{b.subtitle}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
      {loop ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={t(`${i + 1}번째 배너로`, `Go to banner ${i + 1}`, `跳转到第 ${i + 1} 个横幅`, `Đến banner ${i + 1}`, `${i + 1}番目のバナーへ`, `Ke banner ke-${i + 1}`)}
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
function GreetingHeader() {
  const t = usePlatformT();
  const { user } = useAuthSession();
  const greeting = useTimeGreeting();
  const name = user?.realName || user?.name || t("나", "me", "我", "tôi", "私", "saya");
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const { streak } = useDailyStep();
  // 실제 이력서·자소서 상태로 현재 단계를 도출.
  const stageLabel = !resume
    ? t("커리어 시작 단계", "Getting started", "起步阶段", "Bắt đầu sự nghiệp", "キャリア開始", "Tahap awal")
    : resumeCompleteness(resume) < 100
      ? t("이력서 작성 단계", "Writing your resume", "撰写简历中", "Đang viết CV", "履歴書作成中", "Menulis resume")
      : !cover || coverCompleteness(cover) < 100
        ? t("자기소개서 작성 단계", "Writing your cover letter", "撰写自我介绍中", "Đang viết thư xin việc", "自己PR作成中", "Menulis surat lamaran")
        : t("지원 준비 완료", "Ready to apply", "准备就绪", "Sẵn sàng ứng tuyển", "応募準備完了", "Siap melamar");
  const rp = resume ? resumeCompleteness(resume) : 0;
  const cp = cover ? coverCompleteness(cover) : 0;
  const cta = !resume
    ? { label: t("이력서 만들기", "Create resume", "创建简历", "Tạo CV", "履歴書を作成", "Buat resume"), href: talentAppRoutes.resume }
    : rp < 100
      ? { label: t("이력서 이어쓰기", "Continue resume", "继续写简历", "Viết tiếp CV", "履歴書を続ける", "Lanjutkan resume"), href: talentAppRoutes.resume }
      : !cover || cp < 100
        ? { label: t("자기소개서 쓰기", "Write cover letter", "写自我介绍", "Viết thư xin việc", "自己PRを書く", "Tulis surat lamaran"), href: talentAppRoutes.cover }
        : { label: t("공고 둘러보기", "Browse jobs", "浏览职位", "Xem tin tuyển dụng", "求人を見る", "Jelajahi lowongan"), href: talentAppRoutes.jobs };
  return (
    <div className="flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#0B46E8]">{stageLabel}</p>
          {streak > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11.5px] font-bold text-[#4E5968] shadow-[0_1px_4px_rgba(11,18,39,0.05)]">🔥 {t(`${streak}일 연속`, `${streak}-day streak`, `连续 ${streak} 天`, `${streak} ngày liên tục`, `${streak}日連続`, `${streak} hari beruntun`)}</span>
          ) : null}
        </div>
        <p className="mt-2 text-[13px] font-bold text-[#4E5968]">{greeting} 👋</p>
        <h1 className="mt-1 break-keep text-[22px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{t(`${name}님, 오늘도 한 걸음 나아가요`, `${name}, take another step forward today`, `${name}，今天也向前迈进一步`, `${name}, hôm nay hãy tiến thêm một bước`, `${name}さん、今日も一歩前進しましょう`, `${name}, ambil satu langkah maju lagi hari ini`)}</h1>
        <p className="mt-1.5 break-keep text-[13.5px] text-[#8B95A1]">{t("오늘도 한 걸음씩, 취업에 가까워지고 있어요.", "Step by step, you're getting closer to your job.", "一步一步，你正离理想工作越来越近。", "Từng bước một, bạn đang tiến gần hơn đến công việc.", "一歩ずつ、就職に近づいています。", "Selangkah demi selangkah, Anda makin dekat dengan pekerjaan.")}</p>
        <Link href={cta.href} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
          {cta.label} <ArrowRight className="h-4 w-4" weight="bold" />
        </Link>
      </div>
      <div className="relative hidden aspect-square w-[140px] shrink-0 self-center sm:block md:w-[190px]" aria-hidden>
        <Image src="/img_home_hero.webp" alt="" fill sizes="190px" className="object-contain" />
      </div>
    </div>
  );
}

/* 오늘의 팁 — 랜덤, 우측 새로고침으로 다른 팁 */
function TodayTip() {
  const t = usePlatformT();
  const [tip, setTip] = useState(() => pickRandomTip(t));
  function refresh() {
    setTip((prev) => {
      let next = pickRandomTip(t);
      for (let i = 0; i < 6 && next === prev; i++) next = pickRandomTip(t);
      return next;
    });
  }
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("오늘은 이런 팁 어때요?", "How about today's tip?", "今天来看看这个建议？", "Mẹo hôm nay thì sao?", "今日はこんなヒントはいかが？", "Bagaimana dengan tips hari ini?")}</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{t("매일 하나씩, 취업에 도움되는 이야기를 골라봤어요.", "One a day — handy tips for your job search.", "每天一条，为你精选求职小贴士。", "Mỗi ngày một mẹo hữu ích cho việc tìm việc.", "毎日ひとつ、就活に役立つ話を選びました。", "Satu per hari, tips berguna untuk pencarian kerja Anda.")}</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-[#F5F6F8] px-4 py-4">
        <span className="text-[19px] leading-none" aria-hidden>💡</span>
        <p className="flex-1 break-keep text-[15px] font-bold leading-relaxed text-[#191F28]">{`"${tip}"`}</p>
        <button
          type="button"
          onClick={refresh}
          aria-label={t("다른 팁 보기", "See another tip", "看其他建议", "Xem mẹo khác", "別のヒントを見る", "Lihat tips lain")}
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
  const t = usePlatformT();
  useCareerHistorySync();
  const feed = useCareerFeed();
  const recent = feed.slice(0, 3);
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("내 커리어가 쌓이고 있어요", "Your career is building up", "你的职业经历正在积累", "Sự nghiệp của bạn đang tích lũy", "あなたのキャリアが積み上がっています", "Karier Anda sedang terbangun")}</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{t("남긴 기록이 이력서·자기소개서로 정리돼요.", "Your notes become your resume and cover letter.", "你的记录会整理成简历和自我介绍。", "Ghi chú của bạn trở thành CV và thư xin việc.", "残した記録が履歴書・自己PRにまとまります。", "Catatan Anda menjadi resume dan surat lamaran.")}</p>
      </div>

      {/* 이력서 / 자기소개서 */}
      <CareerFunnelCards showPreview />

      {recent.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {recent.map((e) => (
            <FeedCard key={e.id} entry={e} />
          ))}
        </div>
      ) : (
        <Link href={talentAppRoutes.career} className="flex items-center gap-3 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] px-5 py-6 transition hover:border-[#0B46E8]/40">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[18px]" aria-hidden>📝</span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#191F28]">{t("아직 커리어 기록이 없어요", "No career records yet", "还没有职业记录", "Chưa có ghi chép sự nghiệp", "まだキャリア記録がありません", "Belum ada catatan karier")}</p>
            <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("이력서·자기소개서를 만들면 여기에 쌓여요.", "Create a resume or cover letter and it'll show up here.", "创建简历或自我介绍后会显示在这里。", "Tạo CV hoặc thư xin việc và nó sẽ hiện ở đây.", "履歴書・自己PRを作るとここに溜まります。", "Buat resume atau surat lamaran, akan muncul di sini.")}</p>
          </div>
        </Link>
      )}

      <Link href={talentAppRoutes.career} className="mt-1 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
        {t("내 커리어 더 보기", "See more of my career", "查看更多我的职业记录", "Xem thêm sự nghiệp của tôi", "マイキャリアをもっと見る", "Lihat karier saya lainnya")} <CaretRight className="h-4 w-4" weight="bold" />
      </Link>
    </section>
  );
}

/* 취업 준비 가이드 — 카드 누르면 가이드 팝업 */
function GuideSection() {
  const t = usePlatformT();
  const [active, setActive] = useState<CareerGuide | null>(null);
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("취업 준비, 이렇게 시작해봐요", "Start your job prep like this", "求职准备，这样开始吧", "Chuẩn bị xin việc, hãy bắt đầu thế này", "就活準備、こう始めましょう", "Mulai persiapan kerja seperti ini")}</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{t("처음이라도 막막하지 않게 하나씩 알려드려요.", "New to this? We'll walk you through it step by step.", "即使是新手也不迷茫，我们一步步教你。", "Người mới cũng không lo, chúng tôi hướng dẫn từng bước.", "初めてでも迷わないよう、ひとつずつご案内します。", "Baru pertama kali? Kami pandu langkah demi langkah.")}</p>
      </div>
      <div className="-mx-4 overflow-x-auto md:mx-0">
        <div className="flex gap-3 pb-1 pl-4 md:pl-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {careerGuides(t).map((g) => (
            <button
              key={g.title}
              type="button"
              onClick={() => setActive(g)}
              className="flex w-[220px] shrink-0 flex-col rounded-2xl border border-[#EEF1F5] bg-white p-5 text-left transition hover:border-[#D7DCE3] hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[22px]" aria-hidden>{g.emoji}</span>
              <p className="mt-4 min-h-[40px] whitespace-pre-line break-keep text-[14.5px] font-bold leading-snug text-[#191F28]">{g.title}</p>
              <p className="mt-1.5 line-clamp-2 min-h-[40px] break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{g.desc}</p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8]">{t("자세히", "Details", "详情", "Chi tiết", "詳しく", "Detail")} <CaretRight className="h-3.5 w-3.5" /></span>
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
export function GuideModal({ guide, onClose }: { guide: CareerGuide; onClose: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
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
          <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} onClick={onClose} className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
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
              {guide.ctaLabel ?? t("바로 시작하기", "Start now", "立即开始", "Bắt đầu ngay", "今すぐ始める", "Mulai sekarang")} <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* 나에게 맞는 공고 — 채용공고와 동일한 카드(저장·CIP) 5개 + 더 보기 → 채용공고 */
function RecommendedJobs() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const toast = useTalentPopup();
  const interests = useJobInterests();
  const [jobs, setJobs] = useState<{ view: PositionView; matched: boolean }[]>([]);
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

      // 관심 직무가 있으면 '매칭' 페이지(맞춤)와 '최신' 페이지(보충)를 구분해 근거를 태깅한다.
      const matchedPages = jobRoles ? [await load({ jobRoles, internalOnly: true }), await load({ jobRoles })] : [];
      const fillerPages = [await load({ internalOnly: true }), await load({})];
      if (!alive) return;

      const seen = new Set<string>();
      const merged: { view: PositionView; matched: boolean }[] = [];
      const collect = (pages: (Awaited<ReturnType<typeof load>>)[], matched: boolean) => {
        for (const page of pages) {
          for (const it of page?.items ?? []) {
            if (seen.has(it.id) || merged.length >= 5) continue;
            seen.add(it.id);
            merged.push({ view: toPositionView(it, t), matched });
          }
        }
      };
      collect(matchedPages, true);
      collect(fillerPages, false);
      setJobs(merged.slice(0, 5));
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
    if (willSave) notifySavedPosition(t, id);
    const req = willSave ? addMyFavoritePosition(id) : removeMyFavoritePosition(id);
    void req.catch(() => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(id);
        else next.add(id);
        return next;
      });
      toast.error(t("저장에 실패했어요", "Failed to save", "保存失败", "Lưu thất bại", "保存に失敗しました", "Gagal menyimpan"));
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-[#F5F8FF] p-6">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("나에게 딱 맞는 공고예요", "Jobs that fit you", "最适合你的职位", "Việc làm phù hợp với bạn", "あなたにぴったりの求人", "Lowongan yang cocok untuk Anda")}</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{jobs.some((j) => j.matched) ? t("관심 직무를 바탕으로 골라봤어요.", "Picked based on your job interests.", "根据你的兴趣职位为你精选。", "Chọn dựa trên nghề bạn quan tâm.", "関心のある職種をもとに選びました。", "Dipilih berdasarkan minat pekerjaan Anda.") : t("지금 올라온 공고를 골라봤어요. 관심 직무를 설정하면 더 잘 맞춰드려요.", "Here are the latest jobs. Set your interests for better matches.", "为你精选了最新职位。设置兴趣职位可获得更精准推荐。", "Đây là các tin mới nhất. Đặt sở thích để khớp tốt hơn.", "最新の求人を選びました。関心職種を設定するとより合います。", "Ini lowongan terbaru. Atur minat untuk hasil lebih cocok.")}</p>
      </div>

      {/* 관심 직무 카드(공용) */}
      <JobInterestCard />

      {jobs.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {jobs.map(({ view, matched }) => (
              <div key={view.id} className="flex flex-col gap-1.5">
                {matched ? (
                  <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#EDF1FD] px-2 py-1 text-[10.5px] font-bold text-[#0B46E8]">✨ {t("관심 직무 맞춤", "Interest match", "兴趣匹配", "Khớp sở thích", "関心マッチ", "Cocok minat")}</span>
                ) : null}
                <PositionCard view={view} saved={savedIds.has(view.id)} onToggleSave={toggleSave} onShowCip={() => setCipOpen(true)} />
              </div>
            ))}
          </div>
          <Link href={talentAppRoutes.jobs} className="mt-1 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
            {t("포지션 탐색 더 보기", "Explore more jobs", "浏览更多职位", "Xem thêm việc làm", "求人をもっと見る", "Jelajahi lebih banyak")} <CaretRight className="h-4 w-4" weight="bold" />
          </Link>
        </>
      ) : (
        <div className="rounded-2xl border border-[#EEF1F5] bg-white px-5 py-6 text-center">
          <p className="text-[13.5px] text-[#8B95A1]">{t("표시할 공고가 없어요.", "No jobs to show.", "没有可显示的职位。", "Không có tin nào để hiển thị.", "表示する求人がありません。", "Tidak ada lowongan untuk ditampilkan.")}</p>
        </div>
      )}

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
    </section>
  );
}
