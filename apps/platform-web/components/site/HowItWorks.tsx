"use client";

import { Plus, UserPlus, Sparkle as Sparkles, Pulse as Activity } from "@phosphor-icons/react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { Reveal } from "./Reveal";

const stepIcons = [Plus, UserPlus, Sparkles, Activity] as const;

export const HowItWorks = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).howItWorks;

  return (
    <section id="how" className="relative overflow-hidden bg-white py-20">
      <div className="pointer-events-none absolute -left-14 top-10 h-40 w-40 rounded-full bg-[#7DD3FC]/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-[#60A5FA]/30 blur-3xl" />
      <div className="container max-w-[1200px]">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 inline-flex rounded-full border border-[#93C5FD] bg-white px-3 py-1 text-xs font-extrabold tracking-[0.04em] text-[#1D4ED8] shadow-sm">
            {copy.sectionLabel}
          </p>
          <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-[#0B1227] md:text-5xl">{copy.title}</h2>
        </Reveal>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex snap-x snap-mandatory gap-4 md:gap-5">
          {copy.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <Reveal key={step.num} className="relative min-w-[82%] snap-center md:min-w-[46%] lg:min-w-[31%]" delayMs={index * 90} y="sm">
                <div className="h-full rounded-2xl border-2 border-[#BFDBFE] bg-white p-6 shadow-[0_18px_34px_-24px_rgba(37,99,235,0.55)] transition-all duration-300 hover:-translate-y-1 hover:rotate-[-0.6deg] hover:border-[#60A5FA]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-display text-xs font-extrabold text-[#1D4ED8]">STEP {step.num}</span>
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B46E8] text-white shadow-[0_12px_24px_-14px_rgba(30,64,175,0.8)]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-display text-lg font-extrabold leading-tight text-[#0B1227]">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </Reveal>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
};
