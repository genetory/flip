"use client";

// 공개 파트너 랜딩(로그인 전, 기업용). 로그인한 파트너는 앱 홈으로 자동 이동.
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, MegaphoneSimple, UsersThree, CalendarCheck } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { partnerRoutes } from "../../lib/partner/app-nav";

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
      <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="APLY 홈" className="flex items-center">
              <Image src="/img_logo.webp" alt="APLY" width={78} height={26} className="h-[22px] w-auto" priority />
            </Link>
            <span className="rounded-md bg-[#EDF1FD] px-1.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">파트너</span>
          </div>
          <Link href="/login" className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[#4E5968] transition hover:text-[#191F28]">로그인</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="py-16 text-center md:py-24">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#0B46E8]">FOR EMPLOYERS</p>
          <h1 className="mx-auto mt-4 max-w-[720px] break-keep text-[32px] font-black leading-[1.18] tracking-[-0.03em] text-[#0B1227] md:text-[44px]">
            좋은 인재를 만나는 채용,<br />APLY에서 시작하세요
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] break-keep text-[15px] leading-relaxed text-[#8B95A1] md:text-[16px]">
            공고 등록부터 지원자 관리, 면접까지 — 채용의 모든 과정을 한 곳에서.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link href="/login" className="inline-flex h-[52px] items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] px-6 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]">
              채용 시작하기 <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
            <Link href="/login" className="inline-flex h-[52px] items-center justify-center rounded-2xl border border-[#E5E8EB] bg-white px-6 text-[15px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
              이미 계정이 있어요 · 로그인
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-24 md:grid-cols-3">
          <Feature icon={<MegaphoneSimple className="h-6 w-6" weight="fill" />} title="공고 등록" desc="채용 공고를 올리고 상태를 관리해요." />
          <Feature icon={<UsersThree className="h-6 w-6" weight="fill" />} title="지원자 관리" desc="지원자의 이력서·자기소개서를 보고 상태를 관리해요." />
          <Feature icon={<CalendarCheck className="h-6 w-6" weight="fill" />} title="면접 진행" desc="메시지와 면접 일정을 한 곳에서 진행해요." />
        </section>
      </main>

      <footer className="border-t border-[#EEF1F5] py-8 text-center text-[12.5px] text-[#B0B8C1]">© APLY</footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-[#EEF1F5] bg-[#FAFBFC] p-7">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0B46E8] shadow-[0_2px_10px_rgba(11,70,232,0.1)]">{icon}</span>
      <h2 className="mt-5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{desc}</p>
    </div>
  );
}
