"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { UserCircle } from "@phosphor-icons/react/dist/ssr";
import { paperlogy } from "../../lib/fonts";

const AVATAR_SQUIRCLE_CLIP_ID = "cases-avatar-squircle-clip";
const AVATAR_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const AVATAR_SQUIRCLE_STYLE = {
  clipPath: `url(#${AVATAR_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${AVATAR_SQUIRCLE_CLIP_ID})`
} as const;

function formatAnimatedStat(value: string, progress: number) {
  if (value.endsWith("+")) {
    const target = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
    const current = Math.floor(target * progress);
    return `${current.toLocaleString()}+`;
  }

  if (value.includes("/5.0")) {
    const target = Number.parseFloat(value.split("/")[0]);
    const current = (target * progress).toFixed(1);
    return `${current}/5.0`;
  }

  const numeric = Number(value.replace(/,/g, ""));
  if (Number.isFinite(numeric)) {
    return Math.floor(numeric * progress).toLocaleString();
  }

  return value;
}

export const Cases = () => {
  const { locale } = useLanguage();
  const messages = getSiteMessages(locale);
  const copy = messages.cases;
  const testimonialsCopy = messages.testimonials;
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [didAnimate, setDidAnimate] = useState(false);

  useEffect(() => {
    const node = statsRef.current;
    if (!node || didAnimate) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setDidAnimate(true);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [didAnimate]);

  useEffect(() => {
    if (!didAnimate) return;
    const duration = 1400;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [didAnimate]);

  return (
    <>
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={AVATAR_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={AVATAR_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
      <section className="bg-[#1D4ED8] py-24 md:py-32">
        <div className="container">
          <div className="mx-auto mb-10 max-w-3xl text-center text-primary-foreground">
            <p className="mb-2 text-sm font-semibold text-primary-foreground/75">{copy.resultsEyebrow}</p>
            <h2 className={`${paperlogy.className} text-3xl font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
              {copy.resultsTitle}
              <br />
              <span className="mt-3 inline-block">{copy.resultsSubtitle}</span>
            </h2>
          </div>

          <div ref={statsRef} className="grid grid-cols-2 gap-6 p-2 text-primary-foreground md:grid-cols-4 md:gap-8">
            {copy.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-5xl font-extrabold leading-none tracking-[-0.02em] text-primary-foreground md:text-7xl">
                  {formatAnimatedStat(stat.value, progress)}
                </p>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-primary-foreground/75 md:mt-7 md:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cases" className="bg-background py-20">
        <div className="container">
          <div className="mb-10">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">{copy.sectionLabel}</p>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {copy.cards.map((item) => (
              <article key={item.title} className="flex flex-col rounded-2xl border border-border bg-card px-8 py-6 shadow-card">
                <span className="mb-4 inline-block w-fit rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.tag}
                </span>
                <h3 className="mb-3 font-display text-lg font-semibold leading-tight">{item.title}</h3>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">"{item.quote}"</p>
                <p className="text-xs font-medium text-muted-foreground">— {item.by}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="bg-background pb-24">
        <div className="container">
          <div className="mb-10">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">{testimonialsCopy.sectionLabel}</p>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{testimonialsCopy.title}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonialsCopy.items.map((item) => (
              <article
                key={item.by}
                className="flex h-full flex-col rounded-2xl border border-border bg-card px-8 py-6 shadow-card"
              >
                <p className="mb-5 flex-1 text-sm font-normal leading-relaxed text-muted-foreground">"{item.quote}"</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-muted/30 text-muted-foreground" style={AVATAR_SQUIRCLE_STYLE}>
                    <UserCircle className="h-7 w-7" weight="duotone" />
                  </span>
                  <p className="text-xs font-medium text-muted-foreground">— {item.by}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
