"use client";

// APLY PREMIUM 얼리 액세스(/premium) — 한 장으로 스크롤하는 소개 + 신청 폼.
// 글꼴·버튼 모양은 aply.global(v2) 그대로, 색만 어두운 바탕(app/premium/premium.css 의 변수). 상단 메뉴·광고 없음.
// 골드는 GUARANTEE 와 작은 머리글에만.
// 결제는 없다 — 신청만 받고, 런칭 소식은 신청한 이메일로 보낸다. 가격·인턴십 범위는 '예정'으로만 말한다.
// 저장에 실패하면 완료 화면을 보여 주지 않는다(서버가 201 을 줄 때만 완료).
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Briefcase,
  Buildings,
  ChatsCircle,
  CheckCircle,
  Compass,
  FileText,
  Handshake,
  IdentificationCard,
  Microphone,
  PencilSimpleLine,
  UsersThree
} from "@phosphor-icons/react";
import Image from "next/image";
import { AplyFooter } from "../AplyFooter";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { Button, Spinner } from "../v2/ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { usePlatformT } from "../../lib/i18n";
import { setFabInset, clearFabInset } from "../../lib/talent/fab-inset";
import {
  PREMIUM_DEGREES,
  PREMIUM_PLAN_OPTIONS,
  PREMIUM_VISAS,
  graduationOptions,
  tl,
  type L,
  type PremiumPlan
} from "../../lib/premium";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const GOLD = "#C5A878";
const NIGHT = "#121622";

type Plan = {
  code: "START" | "PRO" | "GUARANTEE";
  price: string;
  period: L;
  items: L[];
};

const PLANS: Plan[] = [
  {
    code: "START",
    price: "490,000",
    period: ["4주 취업 준비 기초 완성", "4 weeks · job-search foundations"],
    items: [
      ["1:1 커리어 상담", "1:1 career consultation"],
      ["이력서·자소서 첨삭", "Resume & cover letter review"],
      ["AI 모의 면접", "AI mock interviews"],
      ["취업 로드맵", "Personal job-search roadmap"]
    ]
  },
  {
    code: "PRO",
    price: "1,490,000",
    period: ["8주 취업 집중 준비", "8 weeks · intensive preparation"],
    items: [
      ["START 주요 서비스 포함", "Everything key in START"],
      ["전문가 심화 첨삭", "In-depth expert editing"],
      ["기업 맞춤 지원서", "Company-tailored applications"],
      ["포트폴리오 피드백", "Portfolio feedback"],
      ["현직자 멘토링", "Mentoring from industry professionals"],
      ["실전 모의 면접", "Live mock interviews"],
      ["제휴 기업 추천", "Partner company recommendations"],
      ["전담 매니저", "Dedicated manager"]
    ]
  },
  {
    code: "GUARANTEE",
    price: "2,990,000",
    period: ["인턴십 연계 집중 프로그램", "Internship-linked intensive program"],
    items: [
      ["PRO 주요 서비스 포함", "Everything key in PRO"],
      ["인턴십 적합성 사전 심사", "Internship eligibility pre-screening"],
      ["제휴 기업 매칭", "Partner company matching"],
      ["실제 기업 인턴십 참여 프로그램", "Real company internship program"],
      ["인턴십 진행 및 사후 관리", "Internship support & follow-up"],
      ["취업 전략 상담", "Job strategy consultation"]
    ]
  }
];

const PROBLEMS: { icon: ReactNode; title: L; body: L }[] = [
  {
    icon: <FileText size={24} weight="duotone" />,
    title: ["한국식 이력서·자기소개서", "Korean-style resumes"],
    body: ["형식도, 기업이 보는 기준도 달라 어디서부터 고쳐야 할지 막막해요.", "The format and what employers look for are different — hard to know where to start."]
  },
  {
    icon: <Buildings size={24} weight="duotone" />,
    title: ["외국인 채용 기업 정보", "Who actually hires foreigners"],
    body: ["외국인을 뽑는 회사가 어디인지, 공고만 봐선 알기 어려워요.", "Job posts rarely say whether international candidates are welcome."]
  },
  {
    icon: <Microphone size={24} weight="duotone" />,
    title: ["실전 면접·실무 경험", "Interviews & work experience"],
    body: ["한국어 면접 연습도, 이력서에 쓸 실무 경험도 부족해요.", "Little chance to practice Korean interviews or gain hands-on experience."]
  },
  {
    icon: <IdentificationCard size={24} weight="duotone" />,
    title: ["체류자격과 취업 가능 여부", "Visa & work eligibility"],
    body: ["내 체류자격으로 어떤 일을 할 수 있는지 확신하기 어려워요.", "It's unclear what kind of work your current status allows."]
  }
];

const OFFERS: { icon: ReactNode; title: L; body: L }[] = [
  { icon: <Compass size={22} weight="duotone" />, title: ["1:1 커리어 진단", "1:1 career diagnosis"], body: ["지금 위치와 목표 사이의 거리를 함께 봐요.", "See where you are and how far you are from your goal."] },
  { icon: <PencilSimpleLine size={22} weight="duotone" />, title: ["전문가 이력서·자소서 첨삭", "Expert resume & letter editing"], body: ["한국 기업이 읽는 방식에 맞춰 다듬어요.", "Polished for how Korean companies read applications."] },
  { icon: <ChatsCircle size={22} weight="duotone" />, title: ["실전 면접·현직자 멘토링", "Mock interviews & mentoring"], body: ["실제 면접처럼 연습하고 현직자에게 묻어요.", "Practice like the real thing and ask people in the field."] },
  { icon: <Briefcase size={22} weight="duotone" />, title: ["직무별 포트폴리오 코칭", "Role-specific portfolio coaching"], body: ["직무에 맞는 결과물로 경험을 보여 줘요.", "Show your experience with work that fits the role."] },
  { icon: <Handshake size={22} weight="duotone" />, title: ["제휴 기업 추천·매칭", "Partner company matching"], body: ["외국인 채용에 열려 있는 기업과 이어 드려요.", "Get connected with companies open to international talent."] },
  { icon: <UsersThree size={22} weight="duotone" />, title: ["기업 인턴십 연계", "Internship programs"], body: ["실제 기업에서 일해 보는 경험을 준비해요.", "Prepare for hands-on experience at real companies."] }
];

const STEPS: { title: L; body: L }[] = [
  { title: ["얼리 액세스 신청", "Apply for early access"], body: ["아래 폼을 채워 주세요. 2분이면 돼요.", "Fill out the form below — takes about 2 minutes."] },
  { title: ["커리어·체류자격 확인", "Career & visa check"], body: ["보내 주신 정보로 지금 상황을 살펴봐요.", "We review your situation from what you share."] },
  { title: ["프로그램 적합성 검토", "Program fit review"], body: ["어떤 프로그램이 맞을지 함께 검토해요.", "We look at which program fits you best."] },
  { title: ["우선 상담·런칭 안내", "Priority consultation & launch news"], body: ["런칭 소식을 이메일로 가장 먼저 보내 드려요.", "You'll be the first to hear about the launch by email."] }
];

const VISAS: { code: string; body: L }[] = [
  { code: "D-2", body: ["유학 중 — 취업 준비 중심으로 설계해요.", "Studying — focused on job-search preparation."] },
  { code: "D-10", body: ["구직 중 — 구직·인턴십 참여 요건을 함께 검토해요.", "Job seeking — we review requirements for job search and internships."] },
  { code: "F 계열", body: ["세부 체류자격별 활동 범위를 검토해요.", "We review the activities your specific F status allows."] },
  { code: "E-7 등", body: ["허가된 직무·사업장 조건을 검토해요.", "We review the permitted role and workplace conditions."] }
];

const FAQS: { q: L; a: L }[] = [
  { q: ["얼리 액세스 신청에 비용이 드나요?", "Does applying for early access cost anything?"], a: ["아니요. 신청만으로는 결제가 일어나지 않아요. 프로그램 참여 여부는 런칭 후 직접 정하시면 돼요.", "No. Applying doesn't charge you anything. You decide whether to join after launch."] },
  { q: ["신청하면 반드시 프로그램에 참여해야 하나요?", "Do I have to join a program if I apply?"], a: ["아니요. 신청은 런칭 소식과 우선 상담을 받기 위한 것이고, 참여 의무는 없어요.", "No. Applying gets you launch news and priority consultation — there's no obligation."] },
  { q: ["인턴십이 모두에게 보장되나요?", "Is an internship guaranteed for everyone?"], a: ["아니요. GUARANTEE 프로그램의 인턴십 연계 범위와 조건은 기업 제휴와 법률 검토를 마친 뒤 확정해 안내할 예정이에요. 체류자격과 적합성 심사 결과에 따라 참여가 어려울 수 있어요.", "No. The scope and conditions of internship placement in GUARANTEE will be confirmed after partner agreements and legal review. Participation may not be possible depending on your visa and screening results."] },
  { q: ["졸업 전에도 신청할 수 있나요?", "Can I apply before graduating?"], a: ["네. 재학 중이라면 졸업 시기에 맞춰 준비 일정을 함께 잡아요.", "Yes. If you're still studying, we'll plan around your graduation date."] },
  { q: ["취업 가능한 체류자격이 없어도 신청할 수 있나요?", "Can I apply without a work-eligible visa?"], a: ["네, 신청은 할 수 있어요. 다만 실제 취업·인턴십 가능 여부는 체류자격과 개별 상황에 따라 달라서 상담 때 함께 확인해요.", "Yes, you can apply. Whether you can actually work or intern depends on your visa and situation — we'll check that together."] },
  { q: ["프로그램 가격은 확정인가요?", "Are the prices final?"], a: ["아니요. 지금 보이는 가격은 출시를 검토 중인 예정 가격이에요. 확정 가격은 런칭 때 이메일로 먼저 알려 드려요.", "No. The prices shown are planned prices under review. Final prices will be shared by email at launch."] }
];

/** 화면에 들어오는지 — 한 번 보이면 true 로 남는다. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown] as const;
}

/** 화면에 들어올 때 흐림이 걷히며 떠오르게 — delay(ms)로 차례대로. 움직임 줄이기 설정이면 그대로 보인다. */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, shown] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`transition-[opacity,transform,filter] duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${shown ? "translate-y-0 scale-100 opacity-100 blur-0" : "translate-y-8 scale-[0.98] opacity-0 blur-[6px]"} motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:blur-0 motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}

/** 마우스를 따라오는 카드 빛(.pm-spot) — 위치만 CSS 변수로 넘긴다. */
function spotMove(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
}

const MARQUEE: L[] = [
  ["1:1 커리어 진단", "1:1 Career diagnosis"],
  ["이력서·자소서 첨삭", "Resume editing"],
  ["실전 모의 면접", "Live mock interviews"],
  ["현직자 멘토링", "Industry mentoring"],
  ["포트폴리오 코칭", "Portfolio coaching"],
  ["제휴 기업 매칭", "Company matching"],
  ["인턴십 연계", "Internship programs"],
  ["체류자격 검토", "Visa review"]
];

function Wrap({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-[1080px] scroll-mt-24 px-5 py-14 md:py-20 ${className}`}>
      {children}
    </section>
  );
}

function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <p className={`text-[13px] font-bold tracking-[0.14em] ${dark ? "text-white/60" : "text-[color:var(--v2-accent)]"}`}>{children}</p>;
}

function Heading({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <h2 className={`mt-2 whitespace-pre-line text-[26px] font-bold leading-[1.35] tracking-[-0.02em] md:text-[34px] ${dark ? "text-white" : "text-[color:var(--v2-ink)]"}`}>
      {children}
    </h2>
  );
}

export function PremiumScreen() {
  return (
    <div className="v2 premium-dark relative overflow-x-clip">
      {/* 첫 화면 뒤 오로라·격자 — 로고 줄까지 덮도록 맨 위에서 */}
      <div aria-hidden className="pm-aurora bottom-auto h-[920px]">
        <span className="a" />
        <span className="b" />
        <span className="c" />
      </div>
      <div aria-hidden className="pm-grid bottom-auto h-[920px]" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 pt-5 md:px-8 md:pt-7">
        <Link href="/" aria-label="Aply">
          <Image src="/img_logo.webp" alt="Aply" width={96} height={30} className="h-6 w-auto brightness-0 invert md:h-7" priority />
        </Link>
        <LanguageSwitcher />
      </div>
      <Premium />
      <AplyFooter tone="dark" />
    </div>
  );
}

function Premium() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [plan, setPlan] = useState<PremiumPlan | "">("");
  const [done, setDone] = useState(false);

  const goApply = (p?: PremiumPlan) => {
    if (p) setPlan(p);
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 모바일 하단 고정 신청 버튼 — 첫 화면을 지나고, 신청 폼이 보이기 전까지만.
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const form = document.getElementById("apply");
      const past = window.scrollY > 480;
      const formTop = form ? form.getBoundingClientRect().top : Infinity;
      setSticky(past && formTop > window.innerHeight * 0.6 && !done);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [done]);
  useEffect(() => {
    const apply = () => (sticky && window.innerWidth <= 767 ? setFabInset("premium", 76) : clearFabInset("premium"));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      clearFabInset("premium");
    };
  }, [sticky]);

  return (
    <div className="overflow-x-clip">
      {/* 01 — Hero */}
      <div className="relative">
        <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[1fr_380px]">
          <div className="max-w-[680px]">
            <p className="pm-enter inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-bold tracking-[0.16em] backdrop-blur" style={{ color: GOLD, animationDelay: "60ms" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" style={{ background: GOLD }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: GOLD }} />
              </span>
              APLY PREMIUM · EARLY ACCESS
            </p>
            <p className="pm-enter mt-6 text-[17px] font-semibold text-white/70 md:text-[19px]" style={{ animationDelay: "180ms" }}>
              Your Career Deserves More.
            </p>
            <h1 className="mt-2 text-[34px] font-bold leading-[1.25] tracking-[-0.03em] text-white md:text-[54px]">
              <span className="pm-enter block" style={{ animationDelay: "300ms" }}>{t("취업 준비를 넘어,", "Beyond job prep,")}</span>
              <span className="pm-enter block" style={{ animationDelay: "440ms" }}>
                <span className="pm-sheen">{t("첫 커리어 경험까지.", "to your first career.")}</span>
              </span>
            </h1>
            <p className="pm-enter mt-5 text-[16px] leading-[1.7] text-white/70 md:text-[18px]" style={{ animationDelay: "580ms" }}>
              {t(
                "이력서 첨삭부터 실전 면접, 기업 매칭과 인턴십 연계까지. 한국에서의 커리어를 위한 프리미엄 프로그램을 준비하고 있어요.",
                "From resume editing and live interviews to company matching and internships — a premium program for your career in Korea is on the way."
              )}
            </p>
            <div className="pm-enter mt-8 flex flex-wrap gap-2.5" style={{ animationDelay: "720ms" }}>
              <span className="pm-shine">
                <Button onClick={() => goApply()}>{t("얼리 액세스 신청하기", "Apply for early access")}</Button>
              </span>
              <button
                type="button"
                onClick={() => document.getElementById("programs")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 text-[16px] font-semibold text-white backdrop-blur transition hover:bg-white/10 active:scale-[0.98]"
              >
                {t("프로그램 살펴보기", "See programs")}
              </button>
            </div>
            <p className="pm-enter mt-4 flex items-center gap-1.5 text-[14px] text-white/55" style={{ animationDelay: "860ms" }}>
              <CheckCircle size={16} weight="fill" style={{ color: GOLD }} />
              {t("신청만으로는 결제가 일어나지 않아요. 런칭 소식은 이메일로 보내 드려요.", "Applying doesn't charge you. We'll email you when we launch.")}
            </p>
          </div>
          {/* PC 오른쪽 — 프로그램 흐름을 떠다니는 유리 카드로 */}
          <div aria-hidden className="relative hidden h-[400px] lg:block">
            {[
              { icon: <Compass size={20} weight="duotone" />, title: t("1:1 커리어 진단", "1:1 Career diagnosis"), sub: t("지금 위치와 목표 확인", "Where you are, where to go"), cls: "left-0 top-2", delay: 900, float: "0s" },
              { icon: <ChatsCircle size={20} weight="duotone" />, title: t("실전 모의 면접", "Live mock interviews"), sub: t("현직자 피드백", "Feedback from professionals"), cls: "right-0 top-[132px]", delay: 1050, float: "-2s" },
              { icon: <Handshake size={20} weight="duotone" />, title: t("기업 매칭·인턴십 연계", "Matching & internships"), sub: t("제휴 기업과 연결", "Connected with partners"), cls: "left-6 top-[268px]", delay: 1200, float: "-4s", gold: true }
            ].map((c) => (
              <div key={c.title} className={`pm-enter absolute ${c.cls}`} style={{ animationDelay: `${c.delay}ms` }}>
                <div className="pm-float w-[300px] rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md" style={{ animationDelay: c.float }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={c.gold ? { background: "rgba(197,168,120,0.16)", color: GOLD } : { background: "rgba(100,139,255,0.16)", color: "#8FAAFF" }}>
                      {c.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white">{c.title}</p>
                      <p className="text-[13px] text-white/55">{c.sub}</p>
                    </div>
                    <CheckCircle size={20} weight="fill" className="ml-auto shrink-0" style={{ color: c.gold ? GOLD : "#648BFF" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 흐르는 키워드 띠 */}
      <div aria-hidden className="pm-marquee-mask overflow-hidden border-y border-white/[0.06] py-5">
        <div className="pm-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {MARQUEE.map((m, i) => (
                <span key={i} className="flex items-center whitespace-nowrap px-6 text-[15px] font-semibold text-white/45 md:text-[17px]">
                  <span className="mr-6 h-1.5 w-1.5 rounded-full" style={{ background: i % 3 === 2 ? GOLD : "#648BFF" }} />
                  {tl(locale, m)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 02 — Why */}
      <Wrap>
        <Reveal>
          <Eyebrow>WHY APLY PREMIUM</Eyebrow>
          <Heading>{t("준비는 충분히 했는데,\n기회는 왜 이렇게 멀까요?", "You've prepared so much.\nWhy does opportunity feel so far?")}</Heading>
        </Reveal>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {PROBLEMS.map((p, i) => (
            <Reveal key={i} delay={i * 90} className="h-full">
              <div onMouseMove={spotMove} className="pm-spot h-full rounded-2xl border border-white/[0.06] bg-[color:var(--v2-band)] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--premium-elevated)] text-[color:var(--v2-ink-3)]">{p.icon}</span>
                <p className="mt-4 text-[18px] font-bold text-[color:var(--v2-ink)]">{tl(locale, p.title)}</p>
                <p className="mt-1.5 text-[15px] leading-[1.65] text-[color:var(--v2-ink-3)]">{tl(locale, p.body)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* 03 — What we offer */}
      <div className="bg-[color:var(--v2-fill)]">
        <Wrap>
          <Reveal>
            <Eyebrow>WHAT WE OFFER</Eyebrow>
            <Heading>{t("준비부터 기회까지,\n당신의 커리어를 함께합니다.", "From preparation to opportunity,\nwe're with you.")}</Heading>
          </Reveal>
          <div className="mt-8 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERS.map((o, i) => (
              <Reveal key={i} delay={(i % 3) * 110}>
                <div className="group flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)] transition duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">{o.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{tl(locale, o.title)}</p>
                    <p className="mt-1 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{tl(locale, o.body)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </div>

      {/* 04 — Programs */}
      <Wrap id="programs">
        <Reveal>
          <Eyebrow>PROGRAMS</Eyebrow>
          <Heading>Choose Your Next Step.</Heading>
          <p className="mt-3 text-[15px] text-[color:var(--v2-muted)]">
            {t("아래 가격은 출시를 검토 중인 예정 가격이에요. 확정 가격은 런칭 때 알려 드려요.", "Prices below are planned and still under review. Final prices will be announced at launch.")}
          </p>
        </Reveal>
        <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <PlanCard key={p.code} plan={p} delay={i * 140} onApply={() => goApply(p.code)} />
          ))}
        </div>
        <p className="mt-5 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
          {t(
            "* GUARANTEE 의 인턴십 연계는 모든 분께 인턴십을 보장한다는 뜻이 아니에요. 실제 범위와 조건은 기업 제휴와 법률 검토를 마친 뒤 확정해 안내해요.",
            "* GUARANTEE does not promise an internship for everyone. The actual scope and conditions will be confirmed after partner agreements and legal review."
          )}
        </p>
      </Wrap>

      {/* 05 — How it works */}
      <div className="bg-[color:var(--v2-fill)]">
        <Wrap>
          <Reveal>
            <Eyebrow>HOW IT WORKS</Eyebrow>
            <Heading>Your Journey Starts Here.</Heading>
          </Reveal>
          <Timeline locale={locale} />
        </Wrap>
      </div>

      {/* 06 — Visa & eligibility */}
      <Wrap>
        <Reveal>
          <Eyebrow>VISA & ELIGIBILITY</Eyebrow>
          <Heading>{t("당신의 상황에 맞는\n커리어 경로를 찾습니다.", "We find the career path\nthat fits your situation.")}</Heading>
        </Reveal>
        <div className="mt-8 divide-y divide-[color:var(--v2-line)] rounded-2xl border border-[color:var(--v2-line)]">
          {VISAS.map((v, i) => (
            <Reveal key={v.code} delay={i * 90}>
            <div className="flex items-start gap-4 px-5 py-4 transition hover:bg-white/[0.03] md:items-center md:px-6">
              <span className="inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center rounded-lg bg-[color:var(--v2-band)] px-2.5 text-[14px] font-bold text-[color:var(--v2-ink-2)]">
                {v.code === "F 계열" ? t("F 계열", "F series") : v.code === "E-7 등" ? t("E-7 등", "E-7 etc.") : v.code}
              </span>
              <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{tl(locale, v.body)}</p>
            </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
          {t(
            "* 체류자격만으로 실제 취업·인턴십 가능 여부가 정해지지는 않아요. 개별 상황과 관련 법령에 따라 달라질 수 있어 상담 때 함께 확인해요.",
            "* Your visa type alone doesn't determine whether you can work or intern. It depends on your situation and applicable law — we'll check together."
          )}
        </p>
      </Wrap>

      {/* 07 — Application */}
      <div className="bg-[color:var(--v2-fill)]">
        <Wrap id="apply">
          <div className="mx-auto max-w-[640px]">
            <Eyebrow>EARLY ACCESS</Eyebrow>
            <Heading>Be First. Go Further.</Heading>
            <p className="mt-3 text-[16px] leading-[1.65] text-[color:var(--v2-ink-3)]">
              {t("APLY PREMIUM의 첫 번째 기회를 가장 먼저 만나 보세요. 런칭 소식은 이메일로 보내 드려요.", "Be the first to meet APLY PREMIUM. We'll email you the launch news.")}
            </p>
            <div className="mt-8">
              {done ? <Done /> : <ApplyForm plan={plan} setPlan={setPlan} onDone={() => setDone(true)} />}
            </div>
          </div>
        </Wrap>
      </div>

      {/* 08 — FAQ */}
      <Wrap>
        <Eyebrow>FAQ</Eyebrow>
        <Heading>{t("자주 묻는 질문", "Frequently asked questions")}</Heading>
        <div className="mt-6 divide-y divide-[color:var(--v2-line)] border-y border-[color:var(--v2-line)]">
          {FAQS.map((f, i) => (
            <details key={i} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-[color:var(--v2-ink)] [&::-webkit-details-marker]:hidden">
                {tl(locale, f.q)}
                <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-[color:var(--v2-faint)] transition group-open:rotate-180">
                  <path d="M3.5 6 8 10.5 12.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className="pb-5 text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">{tl(locale, f.a)}</p>
            </details>
          ))}
        </div>
      </Wrap>

      {/* 09 — Final CTA */}
      <div className="px-3 pb-10 md:px-5">
        <Reveal>
        <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-[28px] border border-[color:var(--v2-line)] px-6 py-14 text-center md:py-20" style={{ background: NIGHT }}>
          <div aria-hidden className="pm-aurora">
            <span className="a" />
            <span className="b" />
          </div>
          <div aria-hidden className="pm-grid" />
          <div className="relative">
          <p className="text-[12px] font-bold tracking-[0.18em]" style={{ color: GOLD }}>APLY PREMIUM</p>
          <p className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.02em] text-white md:text-[44px]">Your Next Chapter <span className="pm-sheen">Starts Here.</span></p>
          <p className="mt-3 text-[16px] text-white/65 md:text-[18px]">{t("한국에서의 다음 커리어, 어플라이와 함께 준비하세요.", "Prepare your next career in Korea with Aply.")}</p>
          <div className="mt-8">
            <span className="pm-shine">
              <Button onClick={() => goApply()}>{t("얼리 액세스 신청하기", "Apply for early access")}</Button>
            </span>
          </div>
          </div>
        </div>
        </Reveal>
      </div>

      {/* 모바일 하단 고정 신청 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--v2-line)] bg-[#090b12]/95 px-4 pt-3 backdrop-blur transition-transform duration-300 md:hidden ${sticky ? "translate-y-0" : "translate-y-full"}`}
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        aria-hidden={!sticky}
      >
        <Button full onClick={() => goApply()}>{t("얼리 액세스 신청하기", "Apply for early access")}</Button>
      </div>
      {/* PC 오른쪽 아래 고정 신청 */}
      <div className={`fixed bottom-6 right-24 z-30 hidden transition-all duration-300 md:block ${sticky ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`} aria-hidden={!sticky}>
        <button
          type="button"
          tabIndex={sticky ? 0 : -1}
          onClick={() => goApply()}
          className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition hover:opacity-90"
          style={{ background: NIGHT }}
        >
          <span className="mr-2 h-2 w-2 rounded-full" style={{ background: GOLD }} />
          {t("얼리 액세스 신청하기", "Apply for early access")}
        </button>
      </div>
    </div>
  );
}

function Timeline({ locale }: { locale: Parameters<typeof tl>[0] }) {
  const [ref, shown] = useInView<HTMLOListElement>();
  return (
    <ol ref={ref} className="relative mt-10 grid gap-8 md:grid-cols-4 md:gap-5">
      <span aria-hidden className="absolute bottom-3 left-[19px] top-3 w-px bg-[color:var(--v2-line)] md:bottom-auto md:left-5 md:right-5 md:top-5 md:h-px md:w-auto" />
      {/* 보이면 파란 선이 위에서 아래로(PC 는 왼쪽에서 오른쪽으로) 그려진다 */}
      <span
        aria-hidden
        className={`absolute bottom-3 left-[19px] top-3 w-px origin-top bg-gradient-to-b from-[#648BFF] to-[#C5A878] transition-transform duration-[1600ms] ease-out md:bottom-auto md:left-5 md:right-5 md:top-5 md:h-px md:w-auto md:origin-left md:bg-gradient-to-r ${shown ? "scale-100" : "scale-y-0 md:scale-x-0 md:scale-y-100"} motion-reduce:scale-100 motion-reduce:transition-none`}
      />
      {STEPS.map((st, i) => (
        <li key={i} className="relative flex gap-4 md:block">
          <span
            style={{ transitionDelay: shown ? `${250 + i * 320}ms` : "0ms" }}
            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--v2-accent)] text-[15px] font-bold text-white ring-4 ring-[color:var(--v2-fill)] transition duration-500 ${shown ? "scale-100 opacity-100" : "scale-50 opacity-0"} motion-reduce:scale-100 motion-reduce:opacity-100`}
          >
            {i + 1}
          </span>
          <div style={{ transitionDelay: shown ? `${350 + i * 320}ms` : "0ms" }} className={`min-w-0 transition duration-700 md:mt-4 ${shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"} motion-reduce:translate-y-0 motion-reduce:opacity-100`}>
            <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{tl(locale, st.title)}</p>
            <p className="mt-1 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{tl(locale, st.body)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PlanCard({ plan, onApply, delay }: { plan: Plan; onApply: () => void; delay: number }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const gold = plan.code === "GUARANTEE";
  const popular = plan.code === "PRO";
  return (
    <Reveal className="h-full" delay={delay}>
      <div className={`h-full transition duration-300 hover:-translate-y-1.5 ${gold ? "pm-gold-ring" : ""}`}>
      <div
        onMouseMove={spotMove}
        className={`pm-spot relative flex h-full flex-col rounded-3xl p-7 ${gold ? "pm-spot-gold" : ""} ${popular ? "pm-glow" : ""} ${
          gold ? "text-white" : popular ? "border-2 border-[color:var(--v2-accent)] bg-[color:var(--v2-band)]" : "border border-[color:var(--v2-line)] bg-[color:var(--v2-band)]"
        }`}
        style={gold ? { background: "linear-gradient(160deg, #23262E 0%, #12141B 70%)" } : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-bold tracking-[0.12em]" style={gold ? { color: GOLD } : undefined}>
            <span className={gold ? "" : "text-[color:var(--v2-ink)]"}>{plan.code}</span>
          </p>
          {popular ? (
            <span className="rounded-full bg-[color:var(--v2-accent)] px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-white">MOST POPULAR</span>
          ) : null}
        </div>
        <p className={`mt-2 text-[15px] ${gold ? "text-white/70" : "text-[color:var(--v2-ink-3)]"}`}>{tl(locale, plan.period)}</p>
        <div className="mt-5 flex items-baseline gap-1">
          <span className={`text-[32px] font-bold tracking-[-0.02em] ${gold ? "text-white" : "text-[color:var(--v2-ink)]"}`}>{plan.price}</span>
          <span className={`text-[16px] font-semibold ${gold ? "text-white/70" : "text-[color:var(--v2-ink-3)]"}`}>{t("원", "KRW")}</span>
        </div>
        <p className={`mt-1 text-[12px] ${gold ? "text-white/50" : "text-[color:var(--v2-faint)]"}`}>{t("예정 가격 · 출시 검토 중", "Planned price · under review")}</p>
        <ul className={`mt-6 flex-1 space-y-2.5 border-t pt-6 ${gold ? "border-white/10" : "border-[color:var(--v2-line)]"}`}>
          {plan.items.map((it, i) => (
            <li key={i} className={`flex items-start gap-2 text-[15px] leading-[1.5] ${gold ? "text-white/85" : "text-[color:var(--v2-ink-2)]"}`}>
              <CheckCircle size={18} weight="fill" className="mt-[1px] shrink-0" style={{ color: gold ? GOLD : "var(--v2-accent)" }} />
              {tl(locale, it)}
            </li>
          ))}
        </ul>
        {gold ? (
          <p className="mt-5 text-[12px] leading-[1.55] text-white/50">
            {t("인턴십 연계 범위는 기업 제휴·법률 검토 후 확정돼요.", "Internship scope will be confirmed after partner agreements and legal review.")}
          </p>
        ) : null}
        <div className="mt-6">
          {gold ? (
            <span className="pm-shine w-full">
            <button
              type="button"
              onClick={onApply}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl text-[16px] font-semibold transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: GOLD, color: NIGHT }}
            >
              {t("얼리 신청하기", "Apply early")}
            </button>
            </span>
          ) : (
            <Button full variant={popular ? "primary" : "secondary"} onClick={onApply}>
              {t("얼리 신청하기", "Apply early")}
            </Button>
          )}
        </div>
      </div>
      </div>
    </Reveal>
  );
}

function Done() {
  const t = usePlatformT();
  return (
    <div className="rounded-3xl bg-[color:var(--v2-band)] p-8 text-center" role="status">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]">
        <CheckCircle size={30} weight="fill" />
      </span>
      <p className="mt-5 text-[22px] font-bold text-[color:var(--v2-ink)]">{t("신청이 접수됐어요", "You're on the list")}</p>
      <p className="mt-2 text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">
        {t("런칭 소식과 우선 상담 안내를 이메일로 가장 먼저 보내 드릴게요.", "We'll email you first with launch news and priority consultation details.")}
      </p>
      <div className="mt-6">
        <Button variant="secondary" href="/talent/home">{t("어플라이 둘러보기", "Explore Aply")}</Button>
      </div>
    </div>
  );
}

type FormState = {
  nationality: string;
  degreeLevel: string;
  visaStatus: string;
  graduationPeriod: string;
  desiredRole: string;
  phoneOrMessenger: string;
  careerChallenge: string;
  additionalRequests: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
  website: string;
};

const EMPTY: FormState = {
  nationality: "",
  degreeLevel: "",
  visaStatus: "",
  graduationPeriod: "",
  desiredRole: "",
  phoneOrMessenger: "",
  careerChallenge: "",
  additionalRequests: "",
  privacyConsent: false,
  marketingConsent: false,
  website: ""
};

const fieldCls =
  "h-12 w-full rounded-xl border border-[color:var(--v2-line)] bg-[color:var(--premium-elevated)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none transition placeholder:text-[color:var(--v2-disabled)] focus:border-[color:var(--v2-accent)] aria-[invalid=true]:border-[color:var(--v2-attention)]";

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: ReactNode }) {
  const t = usePlatformT();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-2)]">
        {label}
        {required ? <span className="ml-1 text-[color:var(--v2-accent)]">*</span> : <span className="ml-1.5 font-normal text-[color:var(--v2-faint)]">{t("선택", "Optional")}</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-[color:var(--v2-attention)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChoiceGroup({ id, value, onChange, options, invalid }: { id: string; value: string; onChange: (v: string) => void; options: { code: string; label: string }[]; invalid?: boolean }) {
  return (
    <div id={id} role="radiogroup" aria-invalid={invalid || undefined} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o.code;
        return (
          <button
            key={o.code}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.code)}
            className={`h-11 rounded-xl border px-4 text-[15px] font-semibold transition ${
              on
                ? "border-[color:var(--v2-accent)] bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]"
                : `bg-[color:var(--premium-elevated)] text-[color:var(--v2-ink-3)] hover:bg-white/10 ${invalid ? "border-[color:var(--v2-attention)]" : "border-[color:var(--v2-line)]"}`
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ApplyForm({ plan, setPlan, onDone }: { plan: PremiumPlan | ""; setPlan: (p: PremiumPlan) => void; onDone: () => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { user } = useAuthSession();
  const [f, setF] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "name" | "email" | "interestedPlan", string>>>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  // 로그인돼 있으면 이름·이메일을 미리 채운다 — 손대기 전(null)엔 계정 값을 보여 준다.
  const [nameIn, setNameIn] = useState<string | null>(null);
  const [emailIn, setEmailIn] = useState<string | null>(null);
  const name = nameIn ?? user?.name ?? "";
  const email = emailIn ?? user?.email ?? "";

  const grads = useMemo(() => graduationOptions(), []);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const required = t("입력해 주세요", "Required");
  const choose = t("골라 주세요", "Please choose one");

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = required;
    if (!email.trim()) e.email = required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = t("이메일 형식을 확인해 주세요", "Check the email format");
    if (!f.nationality.trim()) e.nationality = required;
    if (!f.degreeLevel) e.degreeLevel = choose;
    if (!f.visaStatus) e.visaStatus = choose;
    if (!f.graduationPeriod) e.graduationPeriod = choose;
    if (!f.desiredRole.trim()) e.desiredRole = required;
    if (!plan) e.interestedPlan = choose;
    if (!f.privacyConsent) e.privacyConsent = t("개인정보 수집·이용에 동의해 주세요", "Please agree to the collection and use of personal data");
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(`pf-${first}`)?.focus();
      document.getElementById(`pf-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch(`${API}/public/premium-early-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          nationality: f.nationality.trim(),
          degreeLevel: f.degreeLevel,
          visaStatus: f.visaStatus,
          graduationPeriod: f.graduationPeriod,
          desiredRole: f.desiredRole.trim(),
          interestedPlan: plan,
          phoneOrMessenger: f.phoneOrMessenger.trim() || undefined,
          careerChallenge: f.careerChallenge.trim() || undefined,
          additionalRequests: f.additionalRequests.trim() || undefined,
          privacyConsent: true,
          marketingConsent: f.marketingConsent,
          website: f.website || undefined,
          elapsedMs: Date.now() - openedAt.current,
          utmSource: params.get("utm_source") ?? undefined,
          utmMedium: params.get("utm_medium") ?? undefined,
          utmCampaign: params.get("utm_campaign") ?? undefined,
          referrer: document.referrer ? document.referrer.slice(0, 500) : undefined,
          locale
        })
      });
      // 저장이 확인될 때(201)만 완료 — 그 밖엔 폼을 그대로 두고 이유를 보여 준다.
      if (res.status === 201) {
        onDone();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { code?: string };
      if (res.status === 409 || body.code === "DUPLICATE") {
        setServerError(t("이미 이 이메일로 신청하셨어요. 런칭 소식을 이메일로 보내 드릴게요.", "You've already applied with this email. We'll email you at launch."));
      } else if (res.status === 429) {
        setServerError(t("잠시 후 다시 시도해 주세요.", "Please try again in a moment."));
      } else if (res.status === 400) {
        setServerError(t("입력한 내용을 다시 확인해 주세요.", "Please check what you entered."));
      } else {
        setServerError(t("신청을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", "We couldn't save your application. Please try again shortly."));
      }
    } catch {
      setServerError(t("연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.", "Connection problem. Please try again shortly."));
    } finally {
      setSending(false);
    }
  };

  const inv = (k: keyof typeof errors) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `pf-${k}-error` } : {});

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl border border-[color:var(--v2-line)] bg-[color:var(--v2-band)] p-5 sm:p-8">
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="pf-name" label={t("이름", "Name")} required error={errors.name}>
            <input id="pf-name" autoComplete="name" value={name} onChange={(e) => {
              setNameIn(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }} maxLength={80} className={fieldCls} {...inv("name")} />
          </Field>
          <Field id="pf-email" label={t("이메일", "Email")} required error={errors.email}>
            <input id="pf-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => {
              setEmailIn(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }} maxLength={254} placeholder="name@example.com" className={fieldCls} {...inv("email")} />
          </Field>
          <Field id="pf-nationality" label={t("국적", "Nationality")} required error={errors.nationality}>
            <input id="pf-nationality" autoComplete="country-name" value={f.nationality} onChange={(e) => set("nationality", e.target.value)} maxLength={80} placeholder={t("예: 베트남", "e.g. Vietnam")} className={fieldCls} {...inv("nationality")} />
          </Field>
          <Field id="pf-desiredRole" label={t("희망 직무", "Desired role")} required error={errors.desiredRole}>
            <input id="pf-desiredRole" value={f.desiredRole} onChange={(e) => set("desiredRole", e.target.value)} maxLength={120} placeholder={t("예: 해외 영업, 마케팅", "e.g. Global sales, Marketing")} className={fieldCls} {...inv("desiredRole")} />
          </Field>
        </div>

        <Field id="pf-degreeLevel" label={t("학위 과정", "Degree")} required error={errors.degreeLevel}>
          <ChoiceGroup id="pf-degreeLevel" value={f.degreeLevel} onChange={(v) => set("degreeLevel", v)} invalid={!!errors.degreeLevel} options={PREMIUM_DEGREES.map((d) => ({ code: d.code, label: tl(locale, d.label) }))} />
        </Field>
        <Field id="pf-visaStatus" label={t("현재 체류자격", "Current visa")} required error={errors.visaStatus}>
          <ChoiceGroup id="pf-visaStatus" value={f.visaStatus} onChange={(v) => set("visaStatus", v)} invalid={!!errors.visaStatus} options={PREMIUM_VISAS.map((d) => ({ code: d.code, label: tl(locale, d.label) }))} />
        </Field>
        <Field id="pf-graduationPeriod" label={t("졸업 시기", "Graduation")} required error={errors.graduationPeriod}>
          <select id="pf-graduationPeriod" value={f.graduationPeriod} onChange={(e) => set("graduationPeriod", e.target.value)} className={`${fieldCls} appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 6 8 10.5 12.5 6' fill='none' stroke='%238b95a1' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")" }} {...inv("graduationPeriod")}>
            <option value="">{t("골라 주세요", "Select")}</option>
            {grads.map((g) => (
              <option key={g.code} value={g.code}>
                {tl(locale, g.label)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="pf-interestedPlan" label={t("관심 상품", "Program of interest")} required error={errors.interestedPlan}>
          <ChoiceGroup
            id="pf-interestedPlan"
            value={plan}
            onChange={(v) => {
              setPlan(v as PremiumPlan);
              setErrors((prev) => ({ ...prev, interestedPlan: undefined }));
            }}
            invalid={!!errors.interestedPlan}
            options={PREMIUM_PLAN_OPTIONS.map((p) => ({ code: p.code, label: tl(locale, p.label) }))}
          />
        </Field>

        <div className="border-t border-[color:var(--v2-line)] pt-5">
          <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t("더 알려 주시면 상담이 빨라져요", "Tell us more for a faster consultation")}</p>
        </div>
        <Field id="pf-phoneOrMessenger" label={t("전화번호 또는 메신저 ID", "Phone or messenger ID")}>
          <input id="pf-phoneOrMessenger" autoComplete="tel" value={f.phoneOrMessenger} onChange={(e) => set("phoneOrMessenger", e.target.value)} maxLength={120} placeholder={t("예: 010-1234-5678, 카카오톡 aply", "e.g. +82 10-1234-5678, WhatsApp, KakaoTalk ID")} className={fieldCls} />
        </Field>
        <Field id="pf-careerChallenge" label={t("가장 어려운 취업 준비 문제", "Your biggest job-search challenge")}>
          <textarea id="pf-careerChallenge" value={f.careerChallenge} onChange={(e) => set("careerChallenge", e.target.value)} maxLength={2000} rows={3} className={`${fieldCls} h-auto py-3 leading-[1.6]`} />
        </Field>
        <Field id="pf-additionalRequests" label={t("추가로 원하는 서비스", "Anything else you'd like")}>
          <textarea id="pf-additionalRequests" value={f.additionalRequests} onChange={(e) => set("additionalRequests", e.target.value)} maxLength={2000} rows={3} className={`${fieldCls} h-auto py-3 leading-[1.6]`} />
        </Field>

        {/* 봇 막기 — 사람에겐 보이지 않는 칸 */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="pf-website">Website</label>
          <input id="pf-website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
        </div>

        <div className="rounded-2xl bg-[color:var(--premium-elevated)] p-4 text-[13px] leading-[1.7] text-[color:var(--v2-ink-3)]">
          <p className="font-semibold text-[color:var(--v2-ink-2)]">{t("개인정보 수집·이용 안내", "Personal data notice")}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
            <li>{t("목적: 얼리 액세스 신청 접수, 런칭 소식 이메일 안내, 프로그램 적합성 검토와 상담 연락", "Purpose: processing your application, emailing launch news, reviewing program fit and contacting you for consultation")}</li>
            <li>{t("항목(필수): 이름, 이메일, 국적, 학위 과정, 체류자격, 졸업 시기, 희망 직무, 관심 상품", "Required: name, email, nationality, degree, visa status, graduation, desired role, program of interest")}</li>
            <li>{t("항목(선택): 전화번호·메신저 ID, 취업 준비 고민, 추가 요청", "Optional: phone/messenger ID, job-search challenge, additional requests")}</li>
            <li>{t("보유 기간: 신청일로부터 1년 또는 동의 철회 시까지(먼저 오는 때) 보관 후 파기", "Retention: 1 year from application or until you withdraw consent, whichever comes first")}</li>
            <li>{t("동의를 거부할 수 있지만, 거부하면 신청할 수 없어요.", "You may refuse, but then we can't process your application.")}</li>
          </ul>
          <Link href="/legal/privacy" target="_blank" className="mt-1.5 inline-block font-semibold text-[color:var(--v2-accent)] underline-offset-2 hover:underline">
            {t("개인정보 처리방침 전문 보기", "Read the full privacy policy")}
          </Link>
        </div>

        <div className="grid gap-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input id="pf-privacyConsent" type="checkbox" checked={f.privacyConsent} onChange={(e) => set("privacyConsent", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[color:var(--v2-accent)]" {...inv("privacyConsent")} />
            <span className="text-[15px] text-[color:var(--v2-ink-2)]">
              <span className="font-semibold text-[color:var(--v2-accent)]">[{t("필수", "Required")}]</span> {t("개인정보 수집·이용에 동의해요", "I agree to the collection and use of my personal data")}
            </span>
          </label>
          {errors.privacyConsent ? (
            <p id="pf-privacyConsent-error" className="-mt-1 pl-8 text-[13px] text-[color:var(--v2-attention)]">
              {errors.privacyConsent}
            </p>
          ) : null}
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={f.marketingConsent} onChange={(e) => set("marketingConsent", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[color:var(--v2-accent)]" />
            <span className="text-[15px] text-[color:var(--v2-ink-2)]">
              <span className="font-semibold text-[color:var(--v2-faint)]">[{t("선택", "Optional")}]</span>{" "}
              {t("이벤트·혜택 등 마케팅 정보를 이메일로 받을게요. 언제든 그만 받을 수 있어요.", "Send me marketing emails about events and offers. I can unsubscribe anytime.")}
            </span>
          </label>
        </div>

        {serverError ? (
          <p role="alert" className="rounded-xl bg-[color:var(--v2-attention-weak)] px-4 py-3 text-[14px] font-semibold text-[color:var(--v2-attention)]">
            {serverError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={sending}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--v2-accent)] text-[17px] font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
        >
          {sending ? <Spinner /> : null}
          {sending ? t("보내는 중…", "Sending…") : t("얼리 액세스 신청하기", "Apply for early access")}
        </button>
        <p className="text-center text-[13px] text-[color:var(--v2-faint)]">
          {t("신청만으로는 결제가 일어나지 않아요.", "Applying doesn't charge you anything.")}
        </p>
      </div>
    </form>
  );
}
