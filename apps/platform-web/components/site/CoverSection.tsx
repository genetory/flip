"use client";

import Image from "next/image";
import Link from "next/link";
import { paperlogy } from "../../lib/fonts";
import { useLanguage } from "../i18n/LanguageProvider";

export const CoverSection = () => {
  const { locale } = useLanguage();
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);

  return (
    <section className="relative w-full overflow-hidden">
      <div>
        <Image
          src="/img_hero_white.webp"
          alt="Aply hero cover"
          width={1659}
          height={1079}
          preload
          fetchPriority="high"
          quality={70}
          className="h-auto w-full"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-[10vh] text-center">
        <div className="animate-fade-up w-full max-w-[760px] will-change-transform">
          <Image
            src="/img_logo.webp"
            alt="Aply logo"
            width={320}
            height={90}
            className="mx-auto h-auto w-[18vw] min-w-[72px] max-w-[190px]"
            loading="eager"
            fetchPriority="high"
            quality={80}
            sizes="(max-width: 768px) 96px, 190px"
          />
          <p className={`${paperlogy.className} mt-[0.6vw] text-[clamp(0.65rem,1.1vw,1.3rem)] font-semibold uppercase leading-[1.15] tracking-[0.08em] text-[#0B46E8] drop-shadow-sm`}>
            APPLY YOUR NEXT MOVE.
          </p>
          <div className="mx-auto mt-8 flex w-full max-w-[640px] items-center gap-2 rounded-2xl border border-slate-200 bg-white/96 p-2 shadow-[0_14px_30px_-20px_rgba(15,23,42,0.4)] backdrop-blur">
            <input
              type="text"
              className="h-11 flex-1 rounded-xl bg-transparent px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              placeholder={t("직무, 기업, 스킬로 검색", "Search roles, companies, or skills")}
              aria-label={t("직무, 기업, 스킬 검색", "Search roles, companies, or skills")}
            />
            <Link
              href="/positions"
              className="inline-flex h-11 shrink-0 items-center rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {t("검색", "Search")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
