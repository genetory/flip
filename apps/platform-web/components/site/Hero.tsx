"use client";

import { Button } from "../ui/button";
import Link from "next/link";
import { Users, CheckCircle2, MapPin, Briefcase } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";

export const Hero = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).hero;

  return (
    <section className="relative overflow-hidden bg-gradient-hero md:h-[calc(100svh-4rem)]">
      <div className="container grid items-center gap-10 py-12 md:h-full md:grid-cols-[1.05fr_1fr] md:py-8">
        <div className="animate-fade-up space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-success" />
            {copy.badge}
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.2] tracking-tight md:text-6xl">
            <span className="block">{copy.titleTop}</span>
            <span className="relative mt-2.5 inline-block">
              {copy.titleAccent}
              <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full bg-accent/60" />
            </span>
          </h1>
          <p className="max-w-xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{copy.description}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link href="/positions">
                {copy.primaryCta}
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/matching-probability">{copy.secondaryCta}</Link>
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
    <div className="absolute left-0 top-0 w-[79%] animate-float-y [animation-duration:3.8s]">
      <div className="rotate-[-2deg] rounded-2xl border border-border/60 bg-card p-4 shadow-elevated">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">{copy.positionsPanelTitle}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{copy.positionsPanelSortLabel}</span>
      </div>
      <div className="space-y-2">
        {copy.positionRows.slice(0, 2).map((row) => (
          <div key={row.role} className="rounded-xl border border-border/60 bg-card p-2.5">
            <div className="flex items-start gap-2.5">
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                <img
                  src="/img_position_search.webp?v=20260426"
                  alt={`${row.company} ${copy.positionThumbnailAltSuffix}`}
                  className="h-full w-full object-cover"
                />
              </div>
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
              <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-foreground">{copy.openLabel}</span>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>

    {/* Card 2: Company Detail Style */}
    <div className="absolute right-0 top-32 w-[72%] animate-float-y [animation-duration:4.2s] [animation-delay:0.35s]">
      <div className="rotate-[2deg] rounded-2xl border border-border/60 bg-card p-4 shadow-elevated">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy.companyPanelEyebrow}</p>
      <div className="mt-2 flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-border/60 bg-muted text-sm font-bold text-muted-foreground">
          L
        </div>
        <div>
          <p className="text-sm font-semibold">Lumen Studio</p>
          <p className="text-[11px] text-muted-foreground">{copy.companyPanelPartnerLabel}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-md bg-muted/40 px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelIndustryLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelIndustryValue}</p>
        </div>
        <div className="rounded-md bg-muted/40 px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelSizeLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelSizeValue}</p>
        </div>
        <div className="rounded-md bg-muted/40 px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelOpenPositionsLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelOpenPositionsValue}</p>
        </div>
        <div className="rounded-md bg-muted/40 px-2 py-1.5">
          <p className="text-muted-foreground">{copy.companyPanelWorkTypeLabel}</p>
          <p className="mt-0.5 font-semibold text-foreground">{copy.companyPanelWorkTypeValue}</p>
        </div>
      </div>
      </div>
    </div>

    {/* Card 3: Student profile */}
    <div className="absolute bottom-8 left-6 w-[60%] animate-float-y [animation-duration:3.2s] [animation-delay:0.15s]">
      <div className="rotate-[-1deg] rounded-2xl border border-border bg-card p-5 shadow-elevated">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-accent text-foreground">
          <Users className="h-4 w-4" />
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
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[68%] rounded-full bg-gradient-accent" />
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {copy.readinessLabel} · {copy.recommendationLabel}
      </div>
      </div>
    </div>

  </div>
  );
};
