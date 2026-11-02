"use client";

// APLY PARTNERS 기업 제휴(/premium-partners) — 기업·채용 담당자에게 보여 주는 한 장 제안서 + 제휴 문의(사전 수요조사) 폼.
// /premium(학생용)과 같은 어두운 셸·움직임(fx.tsx)을 쓴다. 학생용 상품 가격은 기업에 보여 주지 않는다.
// 직업소개 요건·비용 구조는 검토 중이라 '협의'로만 말하고, 프로젝트 협력형은 근로계약 인턴십과 나눠 적는다.
// 저장에 실패하면 완료 화면을 보여 주지 않는다(서버가 201 을 줄 때만 완료).
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Briefcase,
  Buildings,
  ChartLineUp,
  ChatsCircle,
  CheckCircle,
  ClipboardText,
  Compass,
  GraduationCap,
  Handshake,
  IdentificationCard,
  Lightbulb,
  MagnifyingGlass,
  Plant,
  Sparkle,
  UserCheck,
  UsersThree
} from "@phosphor-icons/react";
import { Button, Spinner } from "../v2/ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { usePlatformT } from "../../lib/i18n";
import { setFabInset, clearFabInset } from "../../lib/talent/fab-inset";
import { tl, type L } from "../../lib/premium";
import {
  PARTNER_CONVERSION_OPTIONS,
  PARTNER_DURATION_OPTIONS,
  PARTNER_FOREIGN_OPTIONS,
  PARTNER_HEADCOUNT_OPTIONS,
  PARTNER_HIRING_OPTIONS,
  PARTNER_MODEL_OPTIONS,
  PARTNER_SIZE_OPTIONS
} from "../../lib/premium-partners";
import {
  ChoiceGroup,
  Confetti,
  Eyebrow,
  Field,
  Heading,
  MultiChoice,
  PremiumShell,
  Reveal,
  SplitText,
  Stars,
  Timeline,
  Wrap,
  fieldCls,
  parallaxMove,
  tiltLeave,
  tiltMove,
  NIGHT
} from "./fx";

// 웹3 네온 — 시안·바이올렛·마젠타(app/premium/premium.css .pm-web3 와 같은 값)
const CYAN = "#3EE7FF";
const VIOLET = "#8B5CFF";
const VIOLET_SOFT = "#B49CFF";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const HERO_PILLS: { icon: ReactNode; label: L }[] = [
  { icon: <GraduationCap size={16} weight="duotone" />, label: ["사전 교육", "Pre-training"] },
  { icon: <ClipboardText size={16} weight="duotone" />, label: ["직무 역량 확인", "Skill checks"] },
  { icon: <UserCheck size={16} weight="duotone" />, label: ["인턴십 후보자 추천", "Internship candidates"] }
];

const ABOUT: { icon: ReactNode; title: L; body: L }[] = [
  { icon: <Sparkle size={22} weight="duotone" />, title: ["AI 이력서·자기소개서", "AI resumes & cover letters"], body: ["한국 기업이 읽는 방식에 맞춰 지원 서류를 준비해요.", "Application documents prepared the way Korean companies read them."] },
  { icon: <ChatsCircle size={22} weight="duotone" />, title: ["모의 면접·커리어 진단", "Mock interviews & diagnosis"], body: ["직무별 면접 연습과 피드백으로 실전을 준비해요.", "Role-specific interview practice with feedback."] },
  { icon: <GraduationCap size={22} weight="duotone" />, title: ["취업 준비 프로그램", "Career programs"], body: ["주차별 과제로 직무 이해와 지원 준비를 함께해요.", "Weekly tasks that build role understanding and readiness."] }
];

const BENEFITS: { pain: L; value: L; icon: ReactNode }[] = [
  { icon: <MagnifyingGlass size={20} weight="duotone" />, pain: ["인턴 채용에 시간과 비용이 들어요", "Hiring interns takes time and money"], value: ["사전 교육을 받은 후보자를 추천해요", "We refer pre-trained candidates"] },
  { icon: <ClipboardText size={20} weight="duotone" />, pain: ["지원자의 역량을 판단하기 어려워요", "It's hard to judge applicants' skills"], value: ["이력서·포트폴리오·역량 자료를 함께 드려요", "Resumes, portfolios and skill materials included"] },
  { icon: <UsersThree size={20} weight="duotone" />, pain: ["외국인 인재 채용 정보가 부족해요", "Little information on hiring international talent"], value: ["글로벌 인재 후보군을 만날 수 있어요", "Access to a global talent pool"] },
  { icon: <Handshake size={20} weight="duotone" />, pain: ["인턴십 운영이 부담스러워요", "Running internships feels like a burden"], value: ["지원자 소통과 참여 과정을 함께 챙겨요", "We support candidate communication and participation"] },
  { icon: <ChartLineUp size={20} weight="duotone" />, pain: ["정규직 채용 전에 검증이 필요해요", "You need to validate before full-time hiring"], value: ["인턴십으로 서로 맞는지 먼저 확인해요", "Check mutual fit through an internship first"] }
];

const MODELS: { code: string; icon: ReactNode; title: L; tag: L; company: L[]; aply: L[]; gold?: boolean }[] = [
  {
    code: "REFERRAL",
    icon: <UserCheck size={24} weight="duotone" />,
    title: ["인재 추천형", "Talent referral"],
    tag: ["가볍게 시작", "Easy start"],
    company: [["추천 후보자 검토", "Review referred candidates"], ["면접 진행", "Interview"]],
    aply: [["사전 역량 확인", "Pre-check skills"], ["직무에 맞는 후보자 추천", "Refer matching candidates"]]
  },
  {
    code: "INTERNSHIP",
    icon: <Briefcase size={24} weight="duotone" />,
    title: ["인턴십 채용형", "Internship hiring"],
    tag: ["기업이 직접 채용", "Direct hire"],
    company: [["인턴 선발", "Select interns"], ["근로계약 체결", "Sign employment contracts"], ["실무 지도", "On-the-job mentoring"]],
    aply: [["인턴십 후보자 발굴", "Source internship candidates"], ["매칭 지원", "Matching support"], ["참여 과정 지원", "Participation support"]],
    gold: true
  },
  {
    code: "PROJECT",
    icon: <Lightbulb size={24} weight="duotone" />,
    title: ["프로젝트 협력형", "Project collaboration"],
    tag: ["근로계약 없이", "No employment contract"],
    company: [["실제 기업 과제 제공", "Provide a real company brief"], ["결과물 피드백", "Give feedback on results"]],
    aply: [["학생 교육", "Train students"], ["프로젝트 운영", "Run the project"]]
  }
];

const ROLES_LIST: L[] = [
  ["마케팅", "Marketing"],
  ["해외 영업", "Global sales"],
  ["IT 개발", "Software"],
  ["디자인", "Design"],
  ["데이터 분석", "Data"],
  ["통번역", "Translation"],
  ["경영 지원", "Operations"]
];

const SELECTION: L[] = [
  ["사전 교육", "Pre-training"],
  ["역량 확인", "Skill check"],
  ["후보자 추천", "Referral"],
  ["기업 면접", "Interview"],
  ["선발", "Selection"]
];

const APLY_ROLE: L[] = [
  ["후보자 발굴과 사전 교육", "Sourcing and pre-training candidates"],
  ["이력서·포트폴리오·역량 자료 정리", "Preparing resumes, portfolios and skill materials"],
  ["후보자 추천과 면접 일정 조율", "Referrals and interview scheduling"],
  ["인턴십 중 지원자 소통·참여 지원", "Candidate communication during the internship"],
  ["인턴십 이후 사후 관리", "Follow-up after the internship"]
];
const COMPANY_ROLE: L[] = [
  ["후보자 검토와 면접", "Reviewing and interviewing candidates"],
  ["최종 선발 결정", "Final selection"],
  ["근로계약 체결과 급여 지급", "Employment contract and pay"],
  ["실무 지도와 평가", "On-the-job mentoring and evaluation"],
  ["정규직 전환 검토(선택)", "Full-time conversion review (optional)"]
];

const STEPS: { title: L; body: L }[] = [
  { title: ["기업 정보 등록", "Share company info"], body: ["아래 문의 폼에 회사와 인턴십 수요를 남겨 주세요.", "Tell us about your company and internship needs below."] },
  { title: ["수요 확인", "Needs check"], body: ["담당자가 연락드려 직무·인원·조건을 확인해요.", "We'll reach out to confirm roles, headcount and conditions."] },
  { title: ["협력 조건 협의", "Agree on terms"], body: ["제휴 방식과 운영 방법을 함께 정해요.", "We agree on the partnership model and how it runs."] },
  { title: ["후보자 추천·시작", "Referrals & kickoff"], body: ["맞는 후보자를 추천하고 인턴십을 시작해요.", "We refer candidates and kick off the internship."] }
];

const MARQUEE: L[] = [
  ["글로벌 인재", "Global talent"],
  ["사전 교육", "Pre-training"],
  ["직무 역량 확인", "Skill checks"],
  ["포트폴리오", "Portfolios"],
  ["인턴십 매칭", "Internship matching"],
  ["운영 지원", "Operations support"],
  ["체류자격 확인", "Visa checks"],
  ["정규직 전환 검토", "Full-time conversion"]
];

const FAQS: { q: L; a: L }[] = [
  {
    q: ["제휴하는 데 비용이 드나요?", "Is there a cost to partner?"],
    a: ["지금은 기업 수요를 확인하는 단계라 문의만으로는 비용이 생기지 않아요. 초기 파일럿 제휴 조건은 미팅에서 함께 정해요.", "We're currently confirming company needs, so submitting an inquiry costs nothing. Pilot partnership terms are agreed together in a meeting."]
  },
  {
    q: ["외국인 채용 경험이 없어도 괜찮나요?", "We've never hired international talent. Is that okay?"],
    a: ["네. 후보자의 체류자격별로 필요한 요건을 어플라이가 함께 확인해요.", "Yes. We check the requirements for each candidate's visa status with you."]
  },
  {
    q: ["근로계약은 누가 맺나요?", "Who signs the employment contract?"],
    a: ["인턴십 채용형에서는 기업이 인턴과 직접 근로계약을 맺고 급여와 실무 지도를 맡아요. 어플라이는 후보자 발굴·매칭과 참여 과정을 지원해요.", "In internship hiring, your company contracts the intern directly and handles pay and mentoring. Aply supports sourcing, matching and participation."]
  },
  {
    q: ["D-2 유학생도 인턴으로 일할 수 있나요?", "Can D-2 students work as interns?"],
    a: ["가능한 경우가 있지만, 근무를 시작하기 전에 시간제취업 허가 등 필요한 절차를 거쳐야 할 수 있어요. 학생·기업과 함께 미리 확인해요.", "Sometimes, but they may need a part-time work permit or other approvals before starting. We check this in advance with the student and your company."]
  },
  {
    q: ["정규직 전환을 꼭 해야 하나요?", "Do we have to convert interns to full-time?"],
    a: ["아니요. 전환 여부는 기업이 정해요. 인턴십은 서로 맞는지 먼저 확인하는 기회예요.", "No. Conversion is your decision. The internship is a chance to check mutual fit first."]
  },
  {
    q: ["프로젝트 협력형은 인턴십과 무엇이 다른가요?", "How is project collaboration different from an internship?"],
    a: ["근로계약 없이 실제 기업 과제와 피드백만 주시는 방식이에요. 학생 교육과 프로젝트 운영은 어플라이가 맡아요.", "You provide a real brief and feedback without an employment contract. Aply trains the students and runs the project."]
  }
];

export function PartnersScreen() {
  return (
    <PremiumShell variant="web3">
      <Partners />
    </PremiumShell>
  );
}

function Partners() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [models, setModels] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const goApply = (model?: string) => {
    if (model) setModels((prev) => (prev.includes(model) ? prev : [...prev, model]));
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 하단 고정 문의 버튼 — 첫 화면을 지나고, 문의 폼이 보이기 전까지만.
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const form = document.getElementById("apply");
      const formTop = form ? form.getBoundingClientRect().top : Infinity;
      setSticky(window.scrollY > 480 && formTop > window.innerHeight * 0.6 && !done);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [done]);
  useEffect(() => {
    const apply = () => (sticky && window.innerWidth <= 767 ? setFabInset("premium-partners", 76) : clearFabInset("premium-partners"));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      clearFabInset("premium-partners");
    };
  }, [sticky]);

  const cta = t("제휴 문의하기", "Partner with us");

  return (
    <div>
      {/* 01 — Hero */}
      <div className="group/hero relative" onMouseMove={parallaxMove}>
        <div aria-hidden className="pm-floor" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100" style={{ background: "radial-gradient(520px circle at var(--cx, 50%) var(--cy, 50%), rgba(62,231,255,0.10), transparent 60%)" }} />
        <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[1fr_400px]">
          <div className="max-w-[700px]">
            <p className="pm-enter pm-mono inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-bold tracking-[0.12em] backdrop-blur" style={{ color: CYAN, animationDelay: "60ms" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" style={{ background: CYAN }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: CYAN }} />
              </span>
              APLY PARTNERS · PARTNERSHIP PROPOSAL
            </p>
            <p className="pm-enter mt-6 text-[17px] font-semibold text-white/70 md:text-[19px]" style={{ animationDelay: "180ms" }}>
              Build Your Next Team with APLY.
            </p>
            <h1 className="mt-2 text-[34px] font-bold leading-[1.25] tracking-[-0.03em] text-white md:text-[54px]">
              <SplitText text={t("글로벌 인재와 기업을", "Connecting global talent")} start={280} step={45} />
              <span className="pm-rise-mask">
                <span className="pm-rise is-on" style={{ animationDelay: "900ms" }}>
                  <span className="pm-sheen">{t("연결하는 새로운 방법.", "and companies, differently.")}</span>
                </span>
              </span>
            </h1>
            <p className="pm-enter mt-5 text-[16px] leading-[1.7] text-white/70 md:text-[18px]" style={{ animationDelay: "1050ms" }}>
              {t(
                "어플라이가 글로벌 인재의 취업 준비를 지원하고, 기업이 적합한 인턴십 후보자를 만날 수 있도록 돕습니다.",
                "Aply prepares global talent for the Korean job market and helps companies meet the right internship candidates."
              )}
            </p>
            <div className="pm-enter mt-6 flex flex-wrap gap-2" style={{ animationDelay: "1150ms" }}>
              {HERO_PILLS.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[14px] font-semibold text-white/80">
                  <span style={{ color: i === 2 ? CYAN : VIOLET_SOFT }}>{p.icon}</span>
                  {tl(locale, p.label)}
                </span>
              ))}
            </div>
            <div className="pm-enter mt-8 flex flex-wrap gap-2.5" style={{ animationDelay: "1250ms" }}>
              <span className="pm-shine">
                <Button onClick={() => goApply()}>{cta}</Button>
              </span>
              <button
                type="button"
                onClick={() => document.getElementById("models")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 text-[16px] font-semibold text-white backdrop-blur transition hover:bg-white/10 active:scale-[0.98]"
              >
                {t("협력 방식 보기", "See partnership models")}
              </button>
            </div>
          </div>
          {/* PC 오른쪽 — 인재가 기업에 닿기까지를 떠다니는 유리 카드로 */}
          <div aria-hidden className="relative hidden h-[420px] lg:block" style={{ transform: "translate3d(calc(var(--mx, 0) * -22px), calc(var(--my, 0) * -16px), 0)", transition: "transform 0.4s ease-out" }}>
            <div className="pm-orb">
              <span className="halo" />
              <span className="core" />
              <span className="ring" />
              <span className="ring r2" />
            </div>
            <div className="pm-orbit left-1/2 top-1/2 -ml-[220px] -mt-[220px] h-[440px] w-[440px]" style={{ ["--d" as string]: "30s" }}>
              <i style={{ background: CYAN, boxShadow: `0 0 14px ${CYAN}` }} />
            </div>
            <div className="pm-orbit left-1/2 top-1/2 -ml-[150px] -mt-[150px] h-[300px] w-[300px]" style={{ ["--d" as string]: "20s", animationDirection: "reverse" }}>
              <i style={{ background: VIOLET, boxShadow: `0 0 14px ${VIOLET}` }} />
            </div>
            {[
              { icon: <GraduationCap size={20} weight="duotone" />, title: t("사전 교육 완료", "Pre-training done"), sub: t("직무 이해·지원 서류 준비", "Role basics & documents"), cls: "left-0 top-2", delay: 1400, float: "0s" },
              { icon: <ClipboardText size={20} weight="duotone" />, title: t("직무 역량 확인", "Skills checked"), sub: t("이력서·포트폴리오·과제", "Resume, portfolio, tasks"), cls: "right-0 top-[140px]", delay: 1550, float: "-2s" },
              { icon: <Buildings size={20} weight="duotone" />, title: t("기업에 후보자 추천", "Referred to your team"), sub: t("면접부터는 기업이 직접", "You interview and decide"), cls: "left-6 top-[282px]", delay: 1700, float: "-4s", gold: true }
            ].map((c) => (
              <div key={c.title} className={`pm-enter absolute ${c.cls}`} style={{ animationDelay: `${c.delay}ms` }}>
                <div className="pm-float pm-glass w-[310px] rounded-2xl !bg-[#0e0b1d]/80 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]" style={{ animationDelay: c.float }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={c.gold ? { background: "rgba(62,231,255,0.16)", color: CYAN } : { background: "rgba(139,92,255,0.16)", color: VIOLET_SOFT }}>
                      {c.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-white">{c.title}</p>
                      <p className="text-[13px] text-white/55">{c.sub}</p>
                    </div>
                    <CheckCircle size={20} weight="fill" className="ml-auto shrink-0" style={{ color: c.gold ? CYAN : VIOLET }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 흐르는 키워드 띠 */}
      <div aria-hidden className="pm-marquee-mask space-y-3 overflow-hidden border-y border-white/[0.06] py-5">
        {[false, true].map((rev) => (
          <div key={String(rev)} className="pm-marquee" style={rev ? { animationDirection: "reverse", animationDuration: "46s" } : undefined}>
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center">
                {(rev ? [...MARQUEE].reverse() : MARQUEE).map((m, i) => (
                  <span key={i} className={`flex items-center whitespace-nowrap px-6 font-semibold ${rev ? "text-[14px] text-white/25 md:text-[15px]" : "text-[15px] text-white/50 md:text-[18px]"}`}>
                    <span className="mr-6 h-1.5 w-1.5 rounded-full" style={{ background: i % 3 === 2 ? CYAN : VIOLET }} />
                    {tl(locale, m)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 01 — About */}
      <Wrap>
        <Reveal>
          <Eyebrow>[01] ABOUT_APLY</Eyebrow>
        </Reveal>
        <Heading>{t("한국 취업을 준비하는\n글로벌 인재의 커리어 플랫폼", "The career platform for\nglobal talent in Korea")}</Heading>
        <Reveal delay={120}>
          <p className="mt-4 max-w-[640px] text-[16px] leading-[1.7] text-[color:var(--v2-ink-3)]">
            {t(
              "어플라이는 한국에서 일하고 싶은 외국인 인재가 지원 서류부터 면접까지 한국 기업의 기준에 맞춰 준비하도록 돕고 있어요.",
              "Aply helps international talent who want to work in Korea prepare everything from documents to interviews to Korean company standards."
            )}
          </p>
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {ABOUT.map((a, i) => (
            <Reveal key={i} delay={i * 110} className="h-full">
              <div onMouseMove={tiltMove} onMouseLeave={tiltLeave} className="pm-spot h-full rounded-2xl pm-glass p-6 transition-[transform,border-color] duration-300 ease-out hover:border-white/15">
                <span aria-hidden className="pm-scan" />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]">{a.icon}</span>
                <p className="mt-4 text-[18px] font-bold text-[color:var(--v2-ink)]">{tl(locale, a.title)}</p>
                <p className="mt-1.5 text-[15px] leading-[1.65] text-[color:var(--v2-ink-3)]">{tl(locale, a.body)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Wrap>

      {/* 02 — Benefits */}
      <div className="bg-[color:var(--v2-fill)]">
        <Wrap>
          <Reveal>
            <Eyebrow>[02] WHY_PARTNER</Eyebrow>
          </Reveal>
          <Heading>{t("어플라이와 협력하면\n우리 회사에 무엇이 좋을까요?", "What does partnering with\nAply do for your company?")}</Heading>
          <div className="mt-8 grid gap-3">
            {BENEFITS.map((b, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group grid items-center gap-3 rounded-2xl pm-glass p-5 transition hover:border-white/15 md:grid-cols-[1fr_auto_1.2fr] md:gap-6 md:px-7">
                  <p className="flex items-center gap-3 text-[15px] text-[color:var(--v2-muted)] md:text-[16px]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[color:var(--v2-faint)]">{b.icon}</span>
                    {tl(locale, b.pain)}
                  </p>
                  <span aria-hidden className="hidden h-px w-16 bg-gradient-to-r from-white/10 to-[#3EE7FF] transition-all duration-500 group-hover:w-24 md:block" />
                  <p className="flex items-center gap-2 text-[16px] font-bold text-[color:var(--v2-ink)] md:text-[17px]">
                    <CheckCircle size={20} weight="fill" className="shrink-0 text-[color:var(--v2-accent)]" />
                    {tl(locale, b.value)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <figure className="relative mt-10 overflow-hidden rounded-3xl border border-[#3EE7FF]/25 px-6 py-10 text-center md:px-12 md:py-14" style={{ background: "linear-gradient(160deg, #15102B 0%, #0A0815 70%)" }}>
              <Stars count={18} />
              <blockquote className="relative text-[20px] font-bold leading-[1.5] text-white md:text-[26px]">
                {t("“어플라이와 함께 글로벌 인재를 만나 보세요.", "“Meet global talent with Aply.")}
                <br />
                <span className="pm-sheen">{t("인재 탐색부터 인턴십 운영 지원까지 함께합니다.”", "From sourcing to running the internship, we're with you.”")}</span>
              </blockquote>
            </figure>
          </Reveal>
        </Wrap>
      </div>

      {/* 03 — Partnership models */}
      <Wrap id="models">
        <Reveal>
          <Eyebrow>[03] PARTNERSHIP_MODELS</Eyebrow>
        </Reveal>
        <Heading>{t("우리 회사에 맞는 방식으로\n시작하세요.", "Start in the way\nthat fits your company.")}</Heading>
        <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-3">
          {MODELS.map((m, i) => (
            <Reveal key={m.code} delay={i * 140} className="h-full">
              <div onMouseMove={tiltMove} onMouseLeave={tiltLeave} className={`h-full transition-transform duration-300 ease-out will-change-transform ${m.gold ? "pm-gold-ring" : ""}`}>
                <div
                  className={`pm-spot relative flex h-full flex-col rounded-3xl p-7 ${m.gold ? "pm-spot-gold" : "pm-glass"}`}
                  style={m.gold ? { background: "linear-gradient(160deg, #1B1533 0%, #0C0A18 70%)" } : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={m.gold ? { background: "rgba(62,231,255,0.16)", color: CYAN } : { background: "rgba(139,92,255,0.14)", color: VIOLET_SOFT }}>
                      {m.icon}
                    </span>
                    <span className="rounded-full border px-2.5 py-1 text-[12px] font-semibold" style={m.gold ? { borderColor: `${CYAN}66`, color: "#A5F3FF" } : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                      {tl(locale, m.tag)}
                    </span>
                  </div>
                  <p className="mt-5 text-[22px] font-bold text-white">{tl(locale, m.title)}</p>
                  <div className="mt-5 flex-1 space-y-5 border-t border-white/10 pt-5">
                    <div>
                      <p className="text-[12px] font-bold tracking-[0.12em] text-white/45">{t("기업 참여", "YOUR TEAM")}</p>
                      <ul className="mt-2 space-y-1.5">
                        {m.company.map((c, k) => (
                          <li key={k} className="flex items-start gap-2 text-[15px] text-white/85">
                            <Buildings size={16} weight="duotone" className="mt-[3px] shrink-0 text-white/40" />
                            {tl(locale, c)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[12px] font-bold tracking-[0.12em]" style={{ color: m.gold ? CYAN : VIOLET_SOFT }}>{t("어플라이 역할", "APLY")}</p>
                      <ul className="mt-2 space-y-1.5">
                        {m.aply.map((c, k) => (
                          <li key={k} className="flex items-start gap-2 text-[15px] text-white/85">
                            <CheckCircle size={16} weight="fill" className="mt-[3px] shrink-0" style={{ color: m.gold ? CYAN : VIOLET }} />
                            {tl(locale, c)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6">
                    {m.gold ? (
                      <span className="pm-shine w-full">
                        <button
                          type="button"
                          onClick={() => goApply(m.code)}
                          className="inline-flex h-12 w-full items-center justify-center rounded-xl text-[16px] font-semibold transition hover:opacity-90 active:scale-[0.98]"

                        >
                          {t("이 방식으로 문의하기", "Inquire about this")}
                        </button>
                      </span>
                    ) : (
                      <Button full variant="secondary" onClick={() => goApply(m.code)}>
                        {t("이 방식으로 문의하기", "Inquire about this")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-5 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
          {t(
            "* 프로젝트 협력형은 근로계약을 맺는 인턴십과 다른 방식이에요. 후보자 추천 서비스의 세부 조건과 비용 구조는 관련 법령 요건을 확인한 뒤 협의해 정해요.",
            "* Project collaboration is separate from internships with employment contracts. Details and costs of candidate referral are agreed after reviewing applicable legal requirements."
          )}
        </p>
      </Wrap>

      {/* 04 — Internship program */}
      <div className="bg-[color:var(--v2-fill)]">
        <Wrap>
          <Reveal>
            <Eyebrow>[04] INTERNSHIP_PROGRAM</Eyebrow>
          </Reveal>
          <Heading>{t("필요한 직무와 기간에 맞춰\n함께 설계해요.", "Designed around\nyour roles and timeline.")}</Heading>
          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            <Reveal className="h-full">
              <div className="h-full rounded-2xl pm-glass p-6">
                <p className="flex items-center gap-2 text-[15px] font-bold text-white">
                  <Briefcase size={20} weight="duotone" className="text-[#B49CFF]" />
                  {t("대상 직무", "Roles")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ROLES_LIST.map((r, i) => (
                    <span key={i} className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-[14px] font-semibold text-white/80">
                      {tl(locale, r)}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-[14px] text-[color:var(--v2-muted)]">{t("이 밖의 직무도 문의해 주세요.", "Other roles are welcome too.")}</p>
              </div>
            </Reveal>
            <Reveal delay={120} className="h-full">
              <div className="h-full rounded-2xl pm-glass p-6">
                <p className="flex items-center gap-2 text-[15px] font-bold text-white">
                  <Plant size={20} weight="duotone" className="text-[#B49CFF]" />
                  {t("인턴십 기간", "Duration")}
                </p>
                <div className="mt-4 flex items-end gap-3">
                  {[
                    { w: "4", h: "h-10" },
                    { w: "8", h: "h-16" },
                    { w: "12", h: "h-24" }
                  ].map((d) => (
                    <div key={d.w} className="flex flex-1 flex-col items-center gap-2">
                      <div className={`w-full rounded-lg bg-gradient-to-t from-[#8B5CFF]/30 via-[#8B5CFF]/60 to-[#3EE7FF]/80 ${d.h}`} />
                      <span className="text-[14px] font-bold text-white/85">{t(`${d.w}주`, `${d.w} wks`)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[14px] text-[color:var(--v2-muted)]">{t("기업 사정에 맞춰 협의해요.", "Flexible to your needs.")}</p>
              </div>
            </Reveal>
            <Reveal delay={240} className="h-full">
              <div className="h-full rounded-2xl pm-glass p-6">
                <p className="flex items-center gap-2 text-[15px] font-bold text-white">
                  <Compass size={20} weight="duotone" className="text-[#B49CFF]" />
                  {t("선발·운영 방식", "Selection")}
                </p>
                <ol className="mt-4 space-y-2">
                  {SELECTION.map((st, i) => (
                    <li key={i} className="flex items-center gap-3 text-[15px] text-white/85">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={i >= 3 ? { background: "rgba(62,231,255,0.18)", color: CYAN } : { background: "rgba(139,92,255,0.18)", color: VIOLET_SOFT }}>
                        {i + 1}
                      </span>
                      {tl(locale, st)}
                      {i >= 3 ? <span className="ml-auto text-[12px] text-white/40">{t("기업", "You")}</span> : <span className="ml-auto text-[12px] text-white/40">APLY</span>}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </Wrap>
      </div>

      {/* 05 — Roles */}
      <Wrap>
        <Reveal>
          <Eyebrow>[05] ROLES</Eyebrow>
        </Reveal>
        <Heading>{t("누가 무엇을 하는지\n처음부터 분명하게.", "Clear roles\nfrom day one.")}</Heading>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { title: "APLY", items: APLY_ROLE, color: VIOLET, icon: <Sparkle size={22} weight="duotone" /> },
            { title: t("기업", "YOUR COMPANY"), items: COMPANY_ROLE, color: CYAN, icon: <Buildings size={22} weight="duotone" /> }
          ].map((col, ci) => (
            <Reveal key={ci} delay={ci * 140} className="h-full">
              <div className="h-full rounded-3xl pm-glass p-7">
                <p className="flex items-center gap-2.5 text-[18px] font-bold tracking-[0.06em]" style={{ color: col.color }}>
                  {col.icon}
                  {col.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {col.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-3 text-[16px] text-white/85">
                      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: col.color }} />
                      {tl(locale, it)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-[14px] leading-[1.65] text-[color:var(--v2-ink-3)]">
            <IdentificationCard size={20} weight="duotone" className="mt-[1px] shrink-0" style={{ color: CYAN }} />
            {t(
              "기업이 인턴을 직접 고용하는 경우, D-2 유학생은 근무를 시작하기 전에 필요한 허가를 받아야 할 수 있어요. 후보자의 체류자격 요건은 어플라이가 함께 확인해요.",
              "If your company hires an intern directly, D-2 students may need permission before starting work. Aply checks each candidate's visa requirements with you."
            )}
          </p>
        </Reveal>
      </Wrap>

      {/* 06 — Next steps */}
      <div className="bg-[color:var(--v2-fill)]">
        <Wrap>
          <Reveal>
            <Eyebrow>[06] NEXT_STEPS</Eyebrow>
          </Reveal>
          <Heading>{t("제휴는 이렇게 진행돼요.", "How partnering works.")}</Heading>
          <Timeline steps={STEPS} />
        </Wrap>
      </div>

      {/* 07 — 문의 폼 */}
      <Wrap id="apply">
        <div className="mx-auto max-w-[720px]">
          <Eyebrow>[07] PARTNERSHIP_INQUIRY</Eyebrow>
          <Heading>{"Let's Build Together."}</Heading>
          <p className="mt-3 text-[16px] leading-[1.65] text-[color:var(--v2-ink-3)]">
            {t(
              "회사와 인턴십 수요를 알려 주시면 담당자가 확인 후 연락드려요. 아직 정해지지 않은 항목은 '미정'으로 골라 주세요.",
              "Tell us about your company and internship needs, and we'll get back to you. Choose “Not sure” for anything undecided."
            )}
          </p>
          <div className="mt-8">{done ? <Done /> : <InquiryForm models={models} setModels={setModels} onDone={() => setDone(true)} />}</div>
        </div>
      </Wrap>

      {/* 08 — FAQ */}
      <div className="bg-[color:var(--v2-fill)]">
        <Wrap>
          <Eyebrow>[08] FAQ</Eyebrow>
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
      </div>

      {/* 09 — Final CTA */}
      <div className="px-3 pb-10 pt-10 md:px-5">
        <Reveal>
          <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-[28px] border border-[color:var(--v2-line)] px-6 py-14 text-center md:py-20" style={{ background: NIGHT }}>
            <div aria-hidden className="pm-aurora">
              <span className="a" />
              <span className="b" />
            </div>
            <div aria-hidden className="pm-grid" />
            <Stars count={28} />
            <div className="relative">
              <p className="text-[12px] font-bold tracking-[0.18em]" style={{ color: CYAN }}>APLY PARTNERS</p>
              <p className="mt-4 text-[28px] font-bold leading-[1.3] tracking-[-0.02em] text-white md:text-[44px]">
                Your Next Hire <span className="pm-sheen">Could Be Global.</span>
              </p>
              <p className="mt-3 text-[16px] text-white/65 md:text-[18px]">{t("글로벌 인재와 함께할 다음 팀, 어플라이와 시작하세요.", "Build your next global team with Aply.")}</p>
              <div className="mt-8">
                <span className="pm-shine">
                  <Button onClick={() => goApply()}>{cta}</Button>
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* 모바일 하단 고정 문의 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--v2-line)] bg-[#090b12]/95 px-4 pt-3 backdrop-blur transition-transform duration-300 md:hidden ${sticky ? "translate-y-0" : "translate-y-full"}`}
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        aria-hidden={!sticky}
      >
        <Button full onClick={() => goApply()}>{cta}</Button>
      </div>
      {/* PC 오른쪽 아래 고정 문의 */}
      <div className={`fixed bottom-6 right-24 z-30 hidden transition-all duration-300 md:block ${sticky ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`} aria-hidden={!sticky}>
        <button
          type="button"
          tabIndex={sticky ? 0 : -1}
          onClick={() => goApply()}
          className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition hover:opacity-90"
          style={{ background: NIGHT }}
        >
          <span className="mr-2 h-2 w-2 rounded-full" style={{ background: CYAN }} />
          {cta}
        </button>
      </div>
    </div>
  );
}

function Done() {
  const t = usePlatformT();
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[color:var(--v2-band)] p-8 text-center" role="status">
      <Confetti />
      <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]">
        <span aria-hidden className="pm-ring-pop" />
        <CheckCircle size={30} weight="fill" />
      </span>
      <p className="mt-5 text-[22px] font-bold text-[color:var(--v2-ink)]">{t("제휴 문의를 받았어요", "Thanks — we got your inquiry")}</p>
      <p className="mt-2 text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">
        {t("담당자가 내용을 확인한 뒤 남겨 주신 연락처로 연락드릴게요.", "Our team will review it and contact you shortly.")}
      </p>
    </div>
  );
}

type FormState = {
  companyName: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  companySize: string;
  industry: string;
  hiringPlan: string;
  roles: string;
  headcount: string;
  duration: string;
  workConditions: string;
  foreignHiring: string;
  conversion: string;
  message: string;
  privacyConsent: boolean;
  marketingConsent: boolean;
  homepage: string;
};

const EMPTY: FormState = {
  companyName: "",
  contactName: "",
  contactTitle: "",
  email: "",
  phone: "",
  website: "",
  companySize: "",
  industry: "",
  hiringPlan: "",
  roles: "",
  headcount: "",
  duration: "",
  workConditions: "",
  foreignHiring: "",
  conversion: "",
  message: "",
  privacyConsent: false,
  marketingConsent: false,
  homepage: ""
};

type ErrKey = keyof FormState | "partnershipModels";

function InquiryForm({ models, setModels, onDone }: { models: string[]; setModels: (v: string[]) => void; onDone: () => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { user } = useAuthSession();
  const [f, setF] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<ErrKey, string>>>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  // 로그인돼 있으면 담당자 이메일을 미리 보여 준다 — 손대기 전엔 계정 값.
  const [emailTouched, setEmailTouched] = useState(false);
  const email = emailTouched ? f.email : f.email || user?.email || "";

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };
  const opts = (list: { code: string; label: L }[]) => list.map((o) => ({ code: o.code, label: tl(locale, o.label) }));
  const required = t("입력해 주세요", "Required");
  const choose = t("골라 주세요", "Please choose one");

  const validate = () => {
    const e: Partial<Record<ErrKey, string>> = {};
    if (!f.companyName.trim()) e.companyName = required;
    if (!f.contactName.trim()) e.contactName = required;
    if (!email.trim()) e.email = required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = t("이메일 형식을 확인해 주세요", "Check the email format");
    if (!f.companySize) e.companySize = choose;
    if (!models.length) e.partnershipModels = t("하나 이상 골라 주세요", "Choose at least one");
    if (!f.hiringPlan) e.hiringPlan = choose;
    if (!f.roles.trim()) e.roles = required;
    if (!f.headcount) e.headcount = choose;
    if (!f.duration) e.duration = choose;
    if (!f.foreignHiring) e.foreignHiring = choose;
    if (!f.conversion) e.conversion = choose;
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
      document.getElementById(`pp-${first}`)?.focus();
      document.getElementById(`pp-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch(`${API}/public/premium-partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: f.companyName.trim(),
          contactName: f.contactName.trim(),
          contactTitle: f.contactTitle.trim() || undefined,
          email: email.trim(),
          phone: f.phone.trim() || undefined,
          website: f.website.trim() || undefined,
          companySize: f.companySize,
          industry: f.industry.trim() || undefined,
          partnershipModels: models,
          hiringPlan: f.hiringPlan,
          roles: f.roles.trim(),
          headcount: f.headcount,
          duration: f.duration,
          workConditions: f.workConditions.trim() || undefined,
          foreignHiring: f.foreignHiring,
          conversion: f.conversion,
          message: f.message.trim() || undefined,
          privacyConsent: true,
          marketingConsent: f.marketingConsent,
          homepage: f.homepage || undefined,
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
        setServerError(t("이미 이 이메일로 문의를 받았어요. 담당자가 곧 연락드릴게요.", "We already have an inquiry from this email. We'll be in touch soon."));
      } else if (res.status === 429) {
        setServerError(t("잠시 후 다시 시도해 주세요.", "Please try again in a moment."));
      } else if (res.status === 400) {
        setServerError(t("입력한 내용을 다시 확인해 주세요.", "Please check what you entered."));
      } else {
        setServerError(t("문의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.", "We couldn't save your inquiry. Please try again shortly."));
      }
    } catch {
      setServerError(t("연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.", "Connection problem. Please try again shortly."));
    } finally {
      setSending(false);
    }
  };

  const inv = (k: ErrKey) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `pp-${k}-error` } : {});
  const section = (n: string, title: string) => (
    <div className="flex items-center gap-3 border-t border-[color:var(--v2-line)] pt-6 first:border-t-0 first:pt-0">
      <span className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: "rgba(139,92,255,0.16)", color: VIOLET_SOFT }}>
        {n}
      </span>
      <p className="text-[16px] font-bold text-[color:var(--v2-ink)]">{title}</p>
    </div>
  );

  return (
    <div className="pm-blue-ring">
      <form onSubmit={submit} noValidate className="rounded-[calc(1.5rem-1px)] bg-[color:var(--v2-band)] p-5 sm:p-8">
        <div className="grid gap-5">
          {section("1", t("회사·담당자", "Company & contact"))}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="pp-companyName" label={t("회사 이름", "Company")} required error={errors.companyName}>
              <input id="pp-companyName" autoComplete="organization" value={f.companyName} onChange={(e) => set("companyName", e.target.value)} maxLength={120} className={fieldCls} {...inv("companyName")} />
            </Field>
            <Field id="pp-industry" label={t("업종", "Industry")}>
              <input id="pp-industry" value={f.industry} onChange={(e) => set("industry", e.target.value)} maxLength={120} placeholder={t("예: 이커머스, 제조, IT 서비스", "e.g. E-commerce, Manufacturing")} className={fieldCls} />
            </Field>
            <Field id="pp-contactName" label={t("담당자 이름", "Contact name")} required error={errors.contactName}>
              <input id="pp-contactName" autoComplete="name" value={f.contactName} onChange={(e) => set("contactName", e.target.value)} maxLength={80} className={fieldCls} {...inv("contactName")} />
            </Field>
            <Field id="pp-contactTitle" label={t("직책·부서", "Title / team")}>
              <input id="pp-contactTitle" autoComplete="organization-title" value={f.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} maxLength={80} placeholder={t("예: 인사팀 매니저", "e.g. HR Manager")} className={fieldCls} />
            </Field>
            <Field id="pp-email" label={t("업무 이메일", "Work email")} required error={errors.email}>
              <input
                id="pp-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmailTouched(true);
                  set("email", e.target.value);
                }}
                maxLength={254}
                placeholder="name@company.com"
                className={fieldCls}
                {...inv("email")}
              />
            </Field>
            <Field id="pp-phone" label={t("연락처", "Phone")}>
              <input id="pp-phone" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} placeholder="02-1234-5678" className={fieldCls} />
            </Field>
          </div>
          <Field id="pp-website" label={t("회사 웹사이트", "Company website")}>
            <input id="pp-website" type="url" inputMode="url" autoComplete="url" value={f.website} onChange={(e) => set("website", e.target.value)} maxLength={300} placeholder="https://" className={fieldCls} />
          </Field>
          <Field id="pp-companySize" label={t("회사 규모(임직원)", "Company size")} required error={errors.companySize}>
            <ChoiceGroup id="pp-companySize" value={f.companySize} onChange={(v) => set("companySize", v)} invalid={!!errors.companySize} options={opts(PARTNER_SIZE_OPTIONS)} />
          </Field>

          {section("2", t("인턴십 수요", "Internship needs"))}
          <Field id="pp-partnershipModels" label={t("관심 있는 제휴 방식(여러 개 선택)", "Partnership models (choose any)")} required error={errors.partnershipModels}>
            <MultiChoice
              id="pp-partnershipModels"
              value={models}
              onChange={(v) => {
                setModels(v);
                setErrors((prev) => ({ ...prev, partnershipModels: undefined }));
              }}
              invalid={!!errors.partnershipModels}
              options={opts(PARTNER_MODEL_OPTIONS)}
            />
          </Field>
          <Field id="pp-hiringPlan" label={t("인턴십 인력 채용 계획이 있나요?", "Do you plan to hire interns?")} required error={errors.hiringPlan}>
            <ChoiceGroup id="pp-hiringPlan" value={f.hiringPlan} onChange={(v) => set("hiringPlan", v)} invalid={!!errors.hiringPlan} options={opts(PARTNER_HIRING_OPTIONS)} />
          </Field>
          <Field id="pp-roles" label={t("어떤 직무의 인력이 필요한가요?", "Which roles do you need?")} required error={errors.roles}>
            <input id="pp-roles" value={f.roles} onChange={(e) => set("roles", e.target.value)} maxLength={300} placeholder={t("예: 해외 마케팅 1명, 프론트엔드 개발 1명", "e.g. 1 global marketer, 1 frontend developer")} className={fieldCls} {...inv("roles")} />
          </Field>
          <Field id="pp-headcount" label={t("몇 명까지 받을 수 있나요?", "How many interns can you host?")} required error={errors.headcount}>
            <ChoiceGroup id="pp-headcount" value={f.headcount} onChange={(v) => set("headcount", v)} invalid={!!errors.headcount} options={opts(PARTNER_HEADCOUNT_OPTIONS)} />
          </Field>
          <Field id="pp-duration" label={t("가능한 근무 기간은?", "Possible duration?")} required error={errors.duration}>
            <ChoiceGroup id="pp-duration" value={f.duration} onChange={(v) => set("duration", v)} invalid={!!errors.duration} options={opts(PARTNER_DURATION_OPTIONS)} />
          </Field>
          <Field id="pp-workConditions" label={t("급여·근무 조건", "Pay & working conditions")}>
            <textarea id="pp-workConditions" value={f.workConditions} onChange={(e) => set("workConditions", e.target.value)} maxLength={1000} rows={3} placeholder={t("예: 월 OOO만 원, 주 5일, 서울 강남(하이브리드)", "e.g. monthly pay, 5 days/week, Seoul (hybrid)")} className={`${fieldCls} h-auto py-3 leading-[1.6]`} />
          </Field>
          <Field id="pp-foreignHiring" label={t("외국인 인재 채용이 가능한가요?", "Can you hire international talent?")} required error={errors.foreignHiring}>
            <ChoiceGroup id="pp-foreignHiring" value={f.foreignHiring} onChange={(v) => set("foreignHiring", v)} invalid={!!errors.foreignHiring} options={opts(PARTNER_FOREIGN_OPTIONS)} />
          </Field>
          <Field id="pp-conversion" label={t("정규직 전환을 검토할 수 있나요?", "Could interns be considered for full-time roles?")} required error={errors.conversion}>
            <ChoiceGroup id="pp-conversion" value={f.conversion} onChange={(v) => set("conversion", v)} invalid={!!errors.conversion} options={opts(PARTNER_CONVERSION_OPTIONS)} />
          </Field>

          {section("3", t("더 하실 말씀", "Anything else"))}
          <Field id="pp-message" label={t("궁금한 점이나 요청 사항", "Questions or requests")}>
            <textarea id="pp-message" value={f.message} onChange={(e) => set("message", e.target.value)} maxLength={3000} rows={4} className={`${fieldCls} h-auto py-3 leading-[1.6]`} />
          </Field>

          {/* 봇 막기 — 사람에겐 보이지 않는 칸 */}
          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="pp-homepage">Homepage</label>
            <input id="pp-homepage" tabIndex={-1} autoComplete="off" value={f.homepage} onChange={(e) => set("homepage", e.target.value)} />
          </div>

          <div className="rounded-2xl bg-[color:var(--premium-elevated)] p-4 text-[13px] leading-[1.7] text-[color:var(--v2-ink-3)]">
            <p className="font-semibold text-[color:var(--v2-ink-2)]">{t("개인정보 수집·이용 안내", "Personal data notice")}</p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              <li>{t("목적: 기업 제휴 문의 접수, 인턴십 수요 확인, 제휴 상담 연락", "Purpose: processing your inquiry, confirming internship needs and contacting you about a partnership")}</li>
              <li>{t("항목(필수): 회사 이름, 회사 규모, 담당자 이름, 업무 이메일, 인턴십 수요 응답", "Required: company name and size, contact name, work email, internship needs")}</li>
              <li>{t("항목(선택): 업종, 직책·부서, 연락처, 웹사이트, 급여·근무 조건, 요청 사항", "Optional: industry, title, phone, website, pay and conditions, requests")}</li>
              <li>{t("보유 기간: 문의일로부터 1년 또는 동의 철회 시까지(먼저 오는 때) 보관 후 파기", "Retention: 1 year from inquiry or until you withdraw consent, whichever comes first")}</li>
              <li>{t("동의를 거부할 수 있지만, 거부하면 문의를 접수할 수 없어요.", "You may refuse, but then we can't process your inquiry.")}</li>
            </ul>
            <Link href="/legal/privacy" target="_blank" className="mt-1.5 inline-block font-semibold text-[color:var(--v2-accent)] underline-offset-2 hover:underline">
              {t("개인정보 처리방침 전문 보기", "Read the full privacy policy")}
            </Link>
          </div>

          <div className="grid gap-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input id="pp-privacyConsent" type="checkbox" checked={f.privacyConsent} onChange={(e) => set("privacyConsent", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[color:var(--v2-accent)]" {...inv("privacyConsent")} />
              <span className="text-[15px] text-[color:var(--v2-ink-2)]">
                <span className="font-semibold text-[color:var(--v2-accent)]">[{t("필수", "Required")}]</span> {t("개인정보 수집·이용에 동의해요", "I agree to the collection and use of my personal data")}
              </span>
            </label>
            {errors.privacyConsent ? (
              <p id="pp-privacyConsent-error" className="-mt-1 pl-8 text-[13px] text-[color:var(--v2-attention)]">
                {errors.privacyConsent}
              </p>
            ) : null}
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={f.marketingConsent} onChange={(e) => set("marketingConsent", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[color:var(--v2-accent)]" />
              <span className="text-[15px] text-[color:var(--v2-ink-2)]">
                <span className="font-semibold text-[color:var(--v2-faint)]">[{t("선택", "Optional")}]</span>{" "}
                {t("채용 행사·인재 소식 등 마케팅 정보를 이메일로 받을게요. 언제든 그만 받을 수 있어요.", "Send me marketing emails about hiring events and talent news. I can unsubscribe anytime.")}
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
            className="pm-cta inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--v2-accent)] text-[17px] font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            {sending ? <Spinner /> : null}
            {sending ? t("보내는 중…", "Sending…") : t("제휴 문의 보내기", "Send inquiry")}
          </button>
        </div>
      </form>
    </div>
  );
}
