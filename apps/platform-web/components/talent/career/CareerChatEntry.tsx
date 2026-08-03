"use client";

// 내 커리어 채팅 진입 — 홈/내 커리어에서 공유. 한 줄 남기면 이력서로 이어지는 퍼널.
import Link from "next/link";
import { Sparkle, PaperPlaneTilt } from "@phosphor-icons/react";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { careerChatStarters } from "../../../lib/talent/home-content";

export function CareerChatEntry() {
  return (
    <section className="overflow-hidden rounded-[24px] bg-[#0B46E8] p-6 md:p-7">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold text-white">
        <Sparkle className="h-3.5 w-3.5" weight="fill" /> AI 커리어 노트
      </span>
      <h2 className="mt-4 whitespace-pre-line text-[20px] font-black leading-[1.35] tracking-[-0.02em] text-white md:text-[22px]">
        오늘 있었던 일,{"\n"}편하게 한 줄만 남겨보세요
      </h2>
      <p className="mt-2 break-keep text-[13.5px] leading-[1.6] text-white/85">
        자격증·프로젝트·알바… 무엇이든 적으면 AI가 이력서와 프로필에 알아서 정리해드려요.
      </p>

      {/* 입력처럼 보이는 진입 버튼 → 채팅으로 */}
      <Link
        href={talentAppRoutes.chat}
        className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition hover:bg-[#F5F8FF]"
      >
        <span className="flex-1 truncate text-[14px] text-[#8B95A1]">예) 오늘 데이터 분석 프로젝트를 끝냈어요</span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B46E8] text-white">
          <PaperPlaneTilt className="h-[18px] w-[18px]" weight="fill" />
        </span>
      </Link>

      {/* 예시 스타터 칩 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {careerChatStarters.map((s) => (
          <Link
            key={s.label}
            href={`${talentAppRoutes.chat}?prompt=${encodeURIComponent(s.prompt)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-white/20"
          >
            <span aria-hidden>{s.emoji}</span> {s.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
