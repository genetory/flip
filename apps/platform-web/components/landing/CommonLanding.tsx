"use client";

// 공통 랜딩(로그인 전) — 구직자·기업·운영진 공용 진입. 로그인 후 역할로 자동 분기.
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, Buildings } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";

export function CommonLanding() {
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();

  // 이미 로그인한 사용자는 역할별 앱으로.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    router.replace(user?.role === "PARTNER" ? "/partner" : "/talent/home");
  }, [isReady, isAuthenticated, user?.role, router]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" aria-label="APLY 홈" className="flex items-center">
            <Image src="/img_logo.webp" alt="APLY" width={78} height={26} className="h-[22px] w-auto" priority />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href="/login" className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[#4E5968] transition hover:text-[#191F28]">로그인</Link>
            <Link href="/talent/signup" className="rounded-xl bg-[#0B46E8] px-4 py-2 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">무료로 시작하기</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* 히어로 */}
        <section className="py-16 text-center md:py-24">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0B46E8]">APLY</p>
          <h1 className="mx-auto mt-4 max-w-[720px] break-keep text-[32px] font-black leading-[1.18] tracking-[-0.03em] text-[#0B1227] md:text-[44px]">
            구직자와 기업을 잇는<br />첫 취업 플랫폼
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] break-keep text-[15px] leading-relaxed text-[#8B95A1] md:text-[16px]">
            처음이라 막막한 취업 준비도, 좋은 인재를 찾는 채용도 — APLY에서 하나씩.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link href="/talent/signup" className="inline-flex h-[52px] items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] px-6 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]">
              무료로 시작하기 <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
            <Link href="/login" className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-[#E5E8EB] bg-white px-6 text-[15px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
              로그인
            </Link>
          </div>
        </section>

        {/* 대상별 진입 */}
        <section className="grid gap-4 pb-24 md:grid-cols-2">
          <AudienceCard
            icon={<GraduationCap className="h-6 w-6" weight="fill" />}
            tag="구직자"
            title="첫 이력서부터 첫 지원까지"
            desc="경험을 함께 정리해 이력서·자기소개서를 만들고, 나에게 맞는 공고에 지원해요."
            ctaLabel="취업 준비 시작하기"
            href="/talent/signup"
          />
          <AudienceCard
            icon={<Buildings className="h-6 w-6" weight="fill" />}
            tag="기업"
            title="좋은 인재를 만나는 채용"
            desc="공고를 올리고 지원자를 관리하고, 면접까지 한 곳에서 진행해요."
            ctaLabel="채용 시작하기"
            href="/login"
          />
        </section>
      </main>

      <footer className="border-t border-[#EEF1F5] py-8 text-center text-[12.5px] text-[#B0B8C1]">
        © APLY
      </footer>
    </div>
  );
}

function AudienceCard({ icon, tag, title, desc, ctaLabel, href }: { icon: React.ReactNode; tag: string; title: string; desc: string; ctaLabel: string; href: string }) {
  return (
    <Link href={href} className="group flex flex-col rounded-3xl border border-[#EEF1F5] bg-[#FAFBFC] p-7 transition hover:border-[#0B46E8]/30 hover:bg-[#F5F8FF]">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0B46E8] shadow-[0_2px_10px_rgba(11,70,232,0.1)]">{icon}</span>
      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{tag}</p>
      <h2 className="mt-1.5 break-keep text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{desc}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-bold text-[#0B46E8]">
        {ctaLabel} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" weight="bold" />
      </span>
    </Link>
  );
}
