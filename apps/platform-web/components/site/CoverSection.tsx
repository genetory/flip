"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Target } from "@phosphor-icons/react";
import { paperlogy } from "../../lib/fonts";
import { MATCHING_QUEST_ENABLED } from "../../lib/feature-flags";
import { usePlatformT } from "../../lib/i18n";

export const CoverSection = () => {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const t = usePlatformT();

  function submitSearch() {
    const q = searchInput.trim();
    router.push(q.length > 0 ? `/positions?q=${encodeURIComponent(q)}` : "/positions");
  }

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative aspect-[1659/1240] w-full sm:aspect-[1659/1180] md:aspect-[1659/1079]">
        <Image
          src="/img_hero_white.webp"
          alt="Aply hero cover"
          width={1659}
          height={1079}
          preload
          fetchPriority="high"
          quality={70}
          className="h-full w-full object-contain object-bottom"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-[7%] text-center sm:pt-[8%] md:pt-[10vh]">
        <div className="animate-fade-up w-full max-w-[760px] will-change-transform">
          <Image
            src="/img_logo.webp"
            alt="Aply logo"
            width={320}
            height={90}
            className="mx-auto h-auto w-[22%] min-w-[88px] max-w-[190px]"
            loading="eager"
            fetchPriority="high"
            quality={80}
            sizes="(max-width: 768px) 96px, 190px"
          />
          <p className={`${paperlogy.className} mt-[1.1%] text-[clamp(0.65rem,1.1vw,1.3rem)] font-semibold uppercase leading-[1.15] tracking-[0.08em] text-[#0B46E8] drop-shadow-sm`}>
            APPLY YOUR NEXT MOVE.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
            role="search"
            className="mx-auto mt-[2.2%] flex w-full max-w-[640px] items-center gap-2 rounded-2xl border border-slate-200 bg-white/96 p-2 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.4)] backdrop-blur"
          >
            <input
              type="search"
              className="h-10 flex-1 rounded-xl bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 md:h-11"
              placeholder={t("직무, 기업, 스킬로 검색", "Search roles, companies, or skills", "搜索岗位、企业或技能", "Tìm vị trí, công ty hoặc kỹ năng", "職種・企業・スキルで検索", "Cari posisi, perusahaan, atau keahlian")}
              aria-label={t("직무, 기업, 스킬 검색", "Search roles, companies, or skills", "搜索岗位、企业或技能", "Tìm vị trí, công ty hoặc kỹ năng", "職種・企業・スキルで検索", "Cari posisi, perusahaan, atau keahlian")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:h-11"
            >
              {t("검색", "Search", "搜索", "Tìm kiếm", "検索", "Cari")}
            </button>
          </form>
          {MATCHING_QUEST_ENABLED ? (
            <div className="mt-[3.2%] flex justify-center">
              <Link
                href="/matching-probability"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/96 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#0B46E8]/60 hover:text-[#0B46E8] md:text-sm"
              >
                <Target className="h-4 w-4 flex-none" weight="bold" aria-hidden />
                {t("내 한국 취업 모험 시작하기", "Start my Korea job quest", "开始我的韩国求职冒险", "Bắt đầu hành trình tìm việc Hàn Quốc", "韓国就職の冒険を始める", "Mulai petualangan karier di Korea")}
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
