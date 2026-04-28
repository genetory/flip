"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Check, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { Reveal } from "./Reveal";

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
    <section id="for-students" className="bg-white py-20">
      <div className="container grid max-w-[1200px] gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <Reveal className="order-2 lg:order-1" y="lg">
          <div className="slide-in-right relative mx-auto w-full max-w-[500px] rotate-[-3deg] animate-float-y [animation-duration:4s] transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: "120ms" }}>
            <div className="absolute -right-2 -top-2 h-full w-full rounded-3xl bg-[#7DD3FC]/35" />
            <div className="relative rounded-3xl border-2 border-[#93C5FD] bg-white p-5 shadow-[0_26px_50px_-24px_rgba(37,99,235,0.65)]">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#93C5FD]">
                <Image
                  src="/img_profile_0.webp"
                  alt="Profile photo"
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#1D4ED8]">{heroCopy.studentProfile}</p>
                <p className="text-sm font-extrabold text-[#0B1227]">Mei L.</p>
                <p className="text-[11px] text-slate-500">{copy.profileMeta}</p>
              </div>
              <span className="ml-auto rounded-full bg-[#0B46E8] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.04em] text-white">
                READY
              </span>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">{heroCopy.profileProgress}</span>
              <span className="font-extrabold text-[#0B1227]">{Math.round(animatedProgress)}%</span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#DBEAFE]">
              <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${animatedProgress}%` }} />
            </div>
            <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#0B46E8]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {heroCopy.readinessLabel} · {heroCopy.recommendationLabel}
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2">
                <p className="text-[10px] font-semibold text-slate-500">{copy.recommendationsLabel}</p>
                <p className="text-sm font-extrabold text-[#1D4ED8]">7</p>
              </div>
              <div className="rounded-xl border border-[#C4B5FD] bg-[#F5F3FF] px-3 py-2">
                <p className="text-[10px] font-semibold text-slate-500">{copy.unlockedLabel}</p>
                <p className="text-sm font-extrabold text-[#6D28D9]">+12</p>
              </div>
            </div>

            <ul className="space-y-1.5">
              {previewChecklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1.5 text-xs text-foreground shadow-[0_8px_20px_-18px_rgba(37,99,235,0.45)]">
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 text-[#0B46E8]" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/50" />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            </div>
          </div>
        </Reveal>

        <Reveal className="order-1 lg:order-2" delayMs={90}>
          <p className="slide-in-left mb-3 inline-flex rounded-full border border-[#93C5FD] bg-white px-3 py-1 text-xs font-extrabold tracking-[0.04em] text-[#1D4ED8] shadow-sm" style={{ animationDelay: "40ms" }}>
            {copy.sectionLabel}
          </p>
          <h2 className="slide-in-left font-display text-3xl font-black leading-[1.04] tracking-[-0.03em] text-[#0B1227] md:text-5xl" style={{ animationDelay: "90ms" }}>
            {copy.titleTop}
            <br />
            <span className="mt-2 inline-block -rotate-[0.8deg] rounded-2xl bg-[#ffd36a] px-5 py-2.5 text-[#0B1227] shadow-[0_16px_34px_-18px_rgba(180,120,0,0.35)] md:px-7 md:py-3">
              {copy.titleBottom}
            </span>
          </h2>
          <p className="slide-in-left mt-5 max-w-lg whitespace-pre-line text-slate-600" style={{ animationDelay: "150ms" }}>{copy.description}</p>
          <ul className="slide-in-left mt-5 space-y-1.5" style={{ animationDelay: "210ms" }}>
            {copy.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2 text-sm leading-snug text-slate-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B46E8]" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="hero"
            size="xl"
            className="slide-in-left mt-7 h-12 rounded-2xl bg-[#0B46E8] px-6 text-sm font-extrabold shadow-[0_20px_35px_-18px_rgba(30,64,175,0.9)] hover:bg-[#0A3FCF]"
            style={{ animationDelay: "280ms" }}
            asChild
          >
            <Link href={ctaHref}>{copy.cta}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
