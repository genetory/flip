"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Check, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { useAuthSession } from "../auth/AuthSessionProvider";

export const StudentProfile = () => {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const copy = getSiteMessages(locale).studentProfile;
  const heroCopy = getSiteMessages(locale).hero;
  const doneChecklist = copy.checklist.filter((item) => item.done).slice(0, 2);
  const pendingChecklist = copy.checklist.filter((item) => !item.done).slice(0, 2);
  const previewChecklist = [...doneChecklist, ...pendingChecklist];
  const ctaHref = isAuthenticated ? "/profile" : "/login";
  const targetProgress = 68;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedProgress(targetProgress * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section id="for-students" className="bg-muted/40 py-20">
      <div className="container grid max-w-[1200px] gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="mx-auto w-full max-w-[500px] rounded-2xl border border-border bg-card p-5 shadow-elevated">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border/60">
                <Image
                  src="/img_profile_0.webp"
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{heroCopy.studentProfile}</p>
                <p className="text-sm font-semibold">Mei L.</p>
                <p className="text-[11px] text-muted-foreground">{copy.profileMeta}</p>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{heroCopy.profileProgress}</span>
              <span className="font-semibold">{Math.round(animatedProgress)}%</span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${animatedProgress}%` }} />
            </div>
            <div className="mb-3 flex items-center gap-1.5 text-[11px] text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {heroCopy.readinessLabel} · {heroCopy.recommendationLabel}
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/40 px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{copy.recommendationsLabel}</p>
                <p className="text-sm font-semibold text-foreground">7</p>
              </div>
              <div className="rounded-lg bg-accent/10 px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{copy.unlockedLabel}</p>
                <p className="text-sm font-semibold text-foreground">+12</p>
              </div>
            </div>

            <ul className="space-y-1.5">
              {previewChecklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-xs text-foreground">
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/50" />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{copy.sectionLabel}</p>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {copy.titleTop}
            <br />
            {copy.titleBottom}
          </h2>
          <p className="mt-4 max-w-lg whitespace-pre-line text-muted-foreground">{copy.description}</p>
          <ul className="mt-6 space-y-3">
            {copy.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-success" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
          <Button variant="hero" size="xl" className="mt-7" asChild>
            <Link href={ctaHref}>{copy.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
