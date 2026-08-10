"use client";

// 공개 파트너 랜딩(로그인 전, 기업용). 로그인한 파트너는 앱 홈으로 자동 이동.
// Talent 랜딩과 동일한 멀티섹션 구성(히어로+고민+가치+이용방법+CTA) + Reveal 모션.
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { partnerRoutes } from "../../lib/partner/app-nav";
import { Reveal } from "../site/Reveal";
import { TalentSectionHeader } from "../talent/TalentSectionHeader";
import { TalentButton } from "../talent/TalentButton";

const SIGNUP_HREF = "/partner/signup";
const LOGIN_HREF = "/partner/login";

// 히어로 미리보기 — 채용 파이프라인.
const PIPELINE: { label: string; count: number; state: "done" | "doing" | "todo" }[] = [
  { label: "지원 완료", count: 12, state: "done" },
  { label: "서류 검토", count: 5, state: "doing" },
  { label: "면접 진행", count: 3, state: "doing" },
  { label: "최종 합격", count: 1, state: "todo" }
];

const CONCERNS = [
  "공고를 올려도 지원자가 잘 안 와요.",
  "지원자 이력서를 일일이 정리하기 번거로워요.",
  "외국인 채용은 비자부터 막막해요.",
  "면접 조율이 메일·전화로 흩어져요."
];

const VALUES: { icon: string; title: string; desc: string }[] = [
  { icon: "📝", title: "AI 공고 작성", desc: "핵심만 입력하면 AI가 매력적인 공고 초안을 만들어요." },
  { icon: "👥", title: "지원자 관리", desc: "지원자를 단계별로 관리하고 메시지·면접 제안까지 한 곳에서." },
  { icon: "🔍", title: "인재 검색", desc: "자연어로 원하는 인재를 찾고 먼저 연결을 제안해요." },
  { icon: "🎤", title: "모의 면접 결과", desc: "지원자의 모의 면접 연습 결과까지 참고해 판단해요." },
  { icon: "🪪", title: "외국인 채용", desc: "비자 유형별 공고와 안내로 글로벌 인재를 만나요." },
  { icon: "📅", title: "면접 진행", desc: "메시지와 면접 일정을 한 곳에서 조율해요." }
];

const STEPS: { no: string; title: string; desc: string }[] = [
  { no: "01", title: "회사·공고 등록", desc: "회사 정보와 채용 공고를 올려요. AI가 초안을 도와줘요." },
  { no: "02", title: "지원자 관리", desc: "지원자를 검토하고 단계별로 관리해요." },
  { no: "03", title: "면접·채용", desc: "면접을 제안하고 좋은 인재를 채용해요." }
];

export function PartnerLandingPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated && (user?.role === "PARTNER" || user?.role === "OPERATOR")) {
      router.replace(partnerRoutes.home);
    }
  }, [isReady, isAuthenticated, user?.role, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="APLY 홈" className="flex items-center">
              <Image src="/img_logo.webp" alt="APLY" width={72} height={24} className="h-5 w-auto" priority />
            </Link>
            <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">파트너</span>
          </div>
          <Link href={LOGIN_HREF} className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[#4E5968] transition hover:text-[#191F28]">로그인</Link>
        </div>
      </header>

      <main>
        <Hero />
        <ConcernSection />
        <ValueSection />
        <StepSection />
        <FinalCta />
      </main>

      <footer className="border-t border-[#EEF1F5] py-8 text-center text-[12.5px] text-[#B0B8C1]">© 2026 APLY</footer>
    </div>
  );
}

/* 1. 히어로 */
function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-3xl px-5 pb-4 pt-14 text-center md:pt-20">
        <Reveal>
          <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-4 py-2 text-[13.5px] font-bold text-[#4E5968]">
            기업 채용을 위한 서비스
          </span>
        </Reveal>
        <Reveal delayMs={80}>
          <h1 className="mt-8 text-[34px] font-black leading-[1.12] tracking-[-0.04em] text-[#0B1227] md:text-[52px]">
            <span className="block">좋은 인재를 만나는 채용,</span>
            <span className="block">APLY에서 시작하세요</span>
          </h1>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="mx-auto mt-7 max-w-lg break-keep text-[17px] leading-[1.6] text-[#4E5968] md:text-[20px]">
            공고 등록부터 지원자 관리, 면접까지 — 채용의 모든 과정을 한 곳에서.
          </p>
        </Reveal>
        <Reveal delayMs={240}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TalentButton href={SIGNUP_HREF} variant="primary" size="lg" aria-label="채용 시작하기">
              채용 시작하기
            </TalentButton>
            <TalentButton href={LOGIN_HREF} variant="secondary" size="lg" aria-label="로그인">
              이미 계정이 있어요 · 로그인
            </TalentButton>
          </div>
          <p className="mt-5 text-[14px] text-[#8B95A1]">가입은 무료 · 몇 분이면 첫 공고를 올릴 수 있어요.</p>
        </Reveal>
      </div>

      {/* 중앙 미리보기 카드 — 채용 파이프라인 */}
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-8 md:pb-16">
        <Reveal delayMs={200} y="lg">
          <PipelinePreview />
        </Reveal>
      </div>
    </section>
  );
}

function PipelinePreview() {
  const total = PIPELINE[0]?.count ?? 0;
  return (
    <div className="rounded-3xl border border-[#EEF1F5] bg-white p-6 shadow-[0_10px_32px_rgba(11,18,39,0.07)]">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-[#4E5968]">프론트엔드 개발자 · 채용 현황</p>
        <span className="text-[13px] font-bold text-[#0B46E8]">지원 {total}명</span>
      </div>
      <ul className="mt-5 flex flex-col gap-3.5">
        {PIPELINE.map((s) => {
          const dot = s.state === "done" ? "bg-[#12B76A]" : s.state === "doing" ? "bg-[#0B46E8]" : "bg-[#D7DCE3]";
          const text = s.state === "todo" ? "text-[#8B95A1]" : "text-[#191F28]";
          return (
            <li key={s.label} className="flex items-center gap-3.5">
              <span className={`h-3 w-3 rounded-full ${dot}`} />
              <span className={`text-[15px] ${text}`}>{s.label}</span>
              <span className="ml-auto text-[13px] font-bold text-[#4E5968]">{s.count}명</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* 2. 기업의 고민 */
function ConcernSection() {
  return (
    <section className="bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={"채용, 이런 고민\n있으셨나요?"} />
        </Reveal>
        <div className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-3.5 sm:grid-cols-2">
          {CONCERNS.map((c, i) => (
            <Reveal key={c} delayMs={i * 80}>
              <div className="h-full rounded-2xl border border-[#EEF1F5] bg-white px-7 py-6 text-[16px] leading-relaxed text-[#4E5968]">“{c}”</div>
            </Reveal>
          ))}
        </div>
        <Reveal delayMs={120}>
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="whitespace-pre-line break-keep text-[24px] font-black leading-[1.4] tracking-[-0.03em] text-[#0B1227] md:text-[34px]">
              {"채용의 처음부터 끝까지,\nAPLY가 함께합니다."}
            </p>
            <p className="mx-auto mt-6 max-w-xl break-keep text-[16px] leading-[1.7] text-[#4E5968] md:text-[18px]">
              공고 작성부터 지원자 관리, 인재 검색, 면접까지 한 흐름으로 이어져요.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 3. 제공하는 가치 */
function ValueSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title="채용에 필요한 모든 것" />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((card, i) => (
            <Reveal key={card.title} delayMs={(i % 3) * 90}>
              <div className="h-full rounded-3xl border border-[#EEF1F5] bg-white p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[28px]" aria-hidden>
                  {card.icon}
                </span>
                <p className="mt-6 text-[19px] font-bold text-[#191F28]">{card.title}</p>
                <p className="mt-2.5 break-keep text-[15px] leading-[1.6] text-[#4E5968]">{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4. 이용 방법 */
function StepSection() {
  return (
    <section className="bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title="세 걸음이면 충분해요" />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delayMs={i * 90}>
              <div className="h-full rounded-3xl border border-[#EEF1F5] bg-white p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B46E8] text-[18px] font-black text-white">
                  {s.no}
                </span>
                <p className="mt-6 text-[19px] font-bold text-[#191F28]">{s.title}</p>
                <p className="mt-2.5 break-keep text-[15px] leading-[1.6] text-[#4E5968]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 5. 마지막 CTA */
function FinalCta() {
  return (
    <section className="bg-[#0B46E8]">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:py-24">
        <Reveal y="lg">
          <p className="whitespace-pre-line text-[30px] font-black leading-[1.25] tracking-[-0.035em] text-white md:text-[46px]">
            {"좋은 인재,\n지금 만나보세요"}
          </p>
          <p className="mx-auto mt-6 max-w-md break-keep text-[16px] leading-[1.65] text-white/75 md:text-[18px]">
            가입하고 첫 공고를 올리는 데 몇 분이면 충분해요.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href={SIGNUP_HREF}
              aria-label="채용 시작하기"
              className="inline-flex h-[56px] items-center justify-center gap-1.5 rounded-xl bg-white px-8 text-[16px] font-bold text-[#0B46E8] transition hover:bg-[#F2F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B46E8]"
            >
              채용 시작하기 <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
