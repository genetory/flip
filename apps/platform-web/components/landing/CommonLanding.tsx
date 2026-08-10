"use client";

// 공통 랜딩(로그인 전) — 구직자·기업 공용 진입. 로그인 후 역할로 자동 분기.
// 스크롤 없는 단일 화면: 인사 문구 + 대상별 진입 카드 2개로 끝.
// 토스 스타일 진입 모션: 로드 시 부드러운 페이드+슬라이드업(expo-out, 스태거).
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, Buildings, Sparkle, Globe, IdentificationCard, type Icon } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { AplyFooter } from "../AplyFooter";

// 진입 애니메이션 래퍼 — 마운트 시 한 번 리빌(단일 화면이라 전부 초기 노출).
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      style={{
        transitionProperty: "transform, opacity",
        transitionDuration: "620ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        transform: shown ? "translateY(0)" : "translateY(18px)",
        opacity: shown ? 1 : 0
      }}
      className={className}
    >
      {children}
    </div>
  );
}

const CARDS: { icon: ReactNode; tag: string; title: string; desc: string; cta: string; href: string }[] = [
  {
    icon: <GraduationCap className="h-6 w-6" weight="fill" />,
    tag: "구직자",
    title: "첫 이력서부터 첫 지원까지",
    desc: "경험을 정리해 이력서·자기소개서를 만들고,\n나에게 맞는 공고를 찾아 지원해요.",
    cta: "취업 준비 시작하기",
    href: "/talent"
  },
  {
    icon: <Buildings className="h-6 w-6" weight="fill" />,
    tag: "파트너",
    title: "좋은 인재를 만나는 채용",
    desc: "공고를 올리고 지원자를 관리하고,\n면접 제안까지 한 곳에서 진행해요.",
    cta: "채용 시작하기",
    href: "/partner"
  }
];

const CHIPS: { icon: Icon; label: string }[] = [
  { icon: Globe, label: "외국인 지원 OK" },
  { icon: Sparkle, label: "AI 서류 코칭" },
  { icon: IdentificationCard, label: "비자별 공고" }
];

export function CommonLanding() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();

  // 이미 로그인한 사용자는 역할별 앱으로.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    router.replace(user?.role === "PARTNER" ? "/partner" : "/talent/home");
  }, [isReady, isAuthenticated, user?.role, router]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-[#191F28]">
      {/* 본문 — 화면 중앙에 로고 + 인사 + 진입 카드 2개 (상단 GNB 없음) */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10">
        {/* 배경 — 상단 그라데이션 + 아주 느리게 부유하는 블롭으로 깊이감 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-[#F4F7FF] via-[#FAFBFF] to-white" />
          <div className="landing-blob-a absolute -top-28 left-[10%] h-[380px] w-[380px] rounded-full bg-[#0B46E8]/[0.08] blur-[100px]" />
          <div className="landing-blob-b absolute -bottom-32 right-[8%] h-[440px] w-[440px] rounded-full bg-[#5B86F5]/[0.10] blur-[120px]" />
        </div>
        <div className="relative w-full max-w-4xl">
          <div className="text-center">
            <Reveal>
              <Image src="/img_logo.webp" alt="APLY" width={84} height={28} className="mx-auto h-6 w-auto" priority />
            </Reveal>
            <Reveal delay={60}>
              <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-[#E4EDFB] bg-white/70 px-3.5 py-1.5 text-[12px] font-bold text-[#0B46E8] shadow-[0_1px_8px_rgba(11,70,232,0.06)]">
                <Sparkle className="h-3.5 w-3.5" weight="fill" /> 처음이라도 괜찮아요, APLY
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mx-auto mt-6 max-w-[680px] break-keep text-[33px] font-black leading-[1.14] tracking-[-0.035em] text-[#0B1227] md:text-[50px]">
                구직자와 기업을 잇는<br />
                <span className="bg-gradient-to-r from-[#0B46E8] to-[#5B86F5] bg-clip-text text-transparent">첫 취업 플랫폼</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-[520px] break-keep text-[15px] leading-relaxed text-[#8B95A1] md:text-[16px]">
                어느 쪽이신지 골라 시작해보세요.
              </p>
            </Reveal>
          </div>

          <div className="mt-11 grid gap-4 md:grid-cols-2">
            {CARDS.map((c, i) => (
              <Reveal key={c.tag} delay={240 + i * 90}>
                <AudienceCard {...c} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={440}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
              {CHIPS.map((c) => {
                const CIcon = c.icon;
                return (
                  <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full border border-[#EEF1F5] bg-white/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#4E5968] shadow-[0_1px_6px_rgba(11,18,39,0.04)] backdrop-blur-sm">
                    <CIcon className="h-3.5 w-3.5 text-[#0B46E8]" weight="fill" /> {c.label}
                  </span>
                );
              })}
            </div>
          </Reveal>
        </div>
      </main>

      <AplyFooter />
    </div>
  );
}

function AudienceCard({ icon, tag, title, desc, cta, href }: { icon: ReactNode; tag: string; title: string; desc: string; cta: string; href: string }) {
  return (
    <Link href={href} className="group flex h-full flex-col rounded-3xl border border-[#EEF1F5] bg-[#FAFBFC] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-[#0B46E8]/30 hover:bg-[#F5F8FF] hover:shadow-[0_12px_32px_rgba(11,70,232,0.1)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0B46E8] shadow-[0_2px_10px_rgba(11,70,232,0.1)]">{icon}</span>
      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{tag}</p>
      <h2 className="mt-1.5 break-keep text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[#8B95A1]">{desc}</p>
      <span className="mt-6 inline-flex items-center gap-1 text-[13.5px] font-bold text-[#0B46E8]">
        {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" weight="bold" />
      </span>
    </Link>
  );
}
