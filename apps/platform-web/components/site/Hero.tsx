"use client";

import { Button } from "../ui/button";
import Link from "next/link";
import { CheckCircle2, MapPin, Briefcase } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { paperlogy } from "../../lib/fonts";

const AVATAR_SQUIRCLE_CLIP_ID = "hero-avatar-squircle-clip";
const AVATAR_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const AVATAR_SQUIRCLE_STYLE = {
  clipPath: `url(#${AVATAR_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${AVATAR_SQUIRCLE_CLIP_ID})`
} as const;

export const Hero = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).hero;

  return (
    <section className="relative overflow-hidden bg-white md:h-[calc(100svh-4rem)]">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={AVATAR_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={AVATAR_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
      <div className="container grid max-w-[1200px] items-center gap-10 py-12 md:h-full md:grid-cols-[1.05fr_1fr] md:py-8">
        <div className="space-y-9">
          <h1 className={`${paperlogy.className} slide-in-left text-3xl font-black uppercase leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-5xl`} style={{ animationDelay: "40ms" }}>
            <span className="block">{copy.titleTop}</span>
            <span className="mt-3 inline-block -rotate-[1.2deg] rounded-2xl bg-[#b7ff5a] px-5 py-2.5 text-[#0B1227] shadow-[0_16px_34px_-18px_rgba(30,64,175,0.35)] md:px-7 md:py-3">
              {copy.titleAccent}
            </span>
          </h1>
          <p className="slide-in-left max-w-[560px] whitespace-pre-line text-base leading-relaxed text-slate-600 md:text-lg" style={{ animationDelay: "120ms" }}>{copy.description}</p>
          <div className="slide-in-left flex flex-wrap items-center gap-3" style={{ animationDelay: "190ms" }}>
            <Button
              variant="hero"
              size="xl"
              className="h-12 rounded-2xl bg-[#b7ff5a] px-6 text-sm font-semibold tracking-[0.01em] text-[#111111] shadow-[0_20px_35px_-18px_rgba(124,174,38,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#a8ee4d] hover:shadow-[0_26px_42px_-20px_rgba(111,155,34,0.62)]"
              asChild
            >
              <Link href="/positions">
                {copy.primaryCta}
              </Link>
            </Button>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
};

const HeroVisual = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).hero;

  return (
  <div className="relative h-[460px] md:h-[500px]">
    {/* Card 1: Position Search List Style */}
    <div className="slide-in-right absolute left-0 top-6 w-[80%] animate-float-y [animation-duration:3.8s]" style={{ animationDelay: "120ms" }}>
      <div className="relative rotate-[-8deg]">
      <div className="absolute -bottom-2 -right-2 h-full w-full rounded-2xl bg-[#7DD3FC]/45" />
      <div className="relative rounded-2xl border-2 border-[#93C5FD] bg-white p-4 shadow-[0_26px_50px_-24px_rgba(37,99,235,0.7)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-extrabold text-[#1D4ED8]">{copy.positionsPanelTitle}</p>
        <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-bold text-[#1D4ED8]">{copy.positionsPanelSortLabel}</span>
      </div>
      <div className="space-y-2">
        {copy.positionRows.slice(0, 2).map((row) => (
          <div key={row.role} className="rounded-xl border border-[#BFDBFE] bg-[#F8FBFF] p-2.5">
            <div className="flex items-start gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-muted-foreground">{row.company}</p>
                <p className="line-clamp-1 text-xs font-bold">{row.role}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {copy.sampleLocation}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {copy.sampleWorkType}
                  </span>
                </div>
              </div>
              <span className="rounded bg-[#22D3EE]/25 px-1.5 py-0.5 text-[9px] font-extrabold text-[#0C4A6E]">{copy.openLabel}</span>
            </div>
          </div>
        ))}
      </div>
      </div>
      </div>
    </div>

    {/* Card 2: Company Detail Style */}
    <div className="slide-in-right absolute right-0 top-[36%] w-[74%] animate-float-y [animation-duration:4.2s] [animation-delay:0.35s]" style={{ animationDelay: "210ms" }}>
      <div className="relative rotate-[11deg]">
      <div className="absolute -bottom-2 -left-2 h-full w-full rounded-2xl bg-[#C4B5FD]/40" />
      <div className="relative rounded-2xl border-2 border-[#A5B4FC] bg-white p-4 shadow-[0_26px_50px_-24px_rgba(79,70,229,0.7)]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy.companyPanelEyebrow}</p>
      <div className="mt-2 flex items-center gap-2.5">
        <div>
          <p className="text-sm font-semibold">Lumen Studio</p>
          <p className="text-[11px] text-muted-foreground">{copy.companyPanelPartnerLabel}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-md bg-[#EEF2FF] px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelIndustryLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelIndustryValue}</p>
        </div>
        <div className="rounded-md bg-[#EEF2FF] px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelSizeLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelSizeValue}</p>
        </div>
        <div className="rounded-md bg-[#EEF2FF] px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelOpenPositionsLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelOpenPositionsValue}</p>
        </div>
        <div className="rounded-md bg-[#EEF2FF] px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelWorkTypeLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelWorkTypeValue}</p>
        </div>
      </div>
      </div>
      </div>
    </div>

    {/* Card 3: Student profile */}
    <div className="slide-in-right absolute bottom-6 left-10 w-[63%] animate-float-y [animation-duration:3.2s] [animation-delay:0.15s]" style={{ animationDelay: "300ms" }}>
      <div className="relative rotate-[-12deg]">
      <div className="absolute -top-2 -right-2 h-full w-full rounded-2xl bg-[#F9A8D4]/35" />
      <div className="relative rounded-2xl border-2 border-[#C4B5FD] bg-white p-5 shadow-[0_26px_50px_-24px_rgba(124,58,237,0.72)]">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-9 w-9 overflow-hidden border border-border/60" style={AVATAR_SQUIRCLE_STYLE}>
          <img
            src="/img_profile_0.webp"
            alt="Student profile"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{copy.studentProfile}</p>
          <p className="text-sm font-semibold">Mei L.</p>
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{copy.profileProgress}</span>
        <span className="font-semibold">68%</span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#EDE9FE]">
        <div className="h-full w-[68%] rounded-full bg-primary" />
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {copy.readinessLabel} · {copy.recommendationLabel}
      </div>
      </div>
      </div>
    </div>
  </div>
  );
};
