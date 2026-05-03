"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { paperlogy } from "../../lib/fonts";
import { useLanguage } from "../i18n/LanguageProvider";

export const CoverSection = () => {
  const { locale } = useLanguage();
  const t = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0.5);
  const [hasScrolled, setHasScrolled] = useState(false);
  const frameRef = useRef<number | null>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.min(1, Math.max(0, raw));
      setProgress(clamped);
      tickingRef.current = false;
    };

    const requestTick = () => {
      setHasScrolled(true);
      if (tickingRef.current) return;
      tickingRef.current = true;
      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    return () => {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Start from neutral offset to avoid first-paint jump on refresh/hydration.
  const imageOffset = hasScrolled ? (progress - 0.5) * 36 : 0;
  const contentOffset = hasScrolled ? (0.5 - progress) * 22 : 0;

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden">
      <div style={{ transform: `translate3d(0, ${imageOffset}px, 0)` }}>
        <Image
          src="/img_hero_white.webp"
          alt="Aply hero cover"
          width={1659}
          height={1079}
          priority
          className="h-auto w-full"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-[10vh] text-center" style={{ transform: `translate3d(0, ${contentOffset}px, 0)` }}>
        <div className="animate-fade-up w-full max-w-[760px] will-change-transform">
          <Image
            src="/img_logo.webp"
            alt="Aply logo"
            width={320}
            height={90}
            className="mx-auto h-auto w-[18vw] min-w-[72px] max-w-[190px]"
            priority
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
              className="inline-flex h-11 shrink-0 items-center rounded-xl bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d]"
            >
              {t("검색", "Search")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
