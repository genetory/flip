"use client";

import { Button } from "../ui/button";
import { ShieldCheck, UserCheck, Workflow, Globe2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { Reveal } from "./Reveal";

const valueIcons = [ShieldCheck, UserCheck, Workflow, Globe2] as const;

export const BusinessValue = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).businessValue;

  return (
    <section id="for-business" className="relative overflow-hidden border-y border-white/15 bg-black py-20 text-background">
      <div className="container relative max-w-[1200px]">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/90">
            {copy.sectionLabel}
          </p>
          <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            {copy.titleTop}
            <br />
            <span className="mt-2 inline-block">
              {copy.titleBottom}
            </span>
          </h2>
          <p className="mt-5 text-blue-100/95">{copy.description}</p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {copy.cards.map((card, index) => {
            const Icon = valueIcons[index];
            return (
              <Reveal
                key={card.title}
                className="group rounded-2xl border border-white/30 bg-white/14 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/20"
                delayMs={index * 80}
                y="sm"
              >
                <div className="mb-5 inline-grid h-11 w-11 place-items-center rounded-xl bg-white text-[#0b3dd9]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-lg font-extrabold text-white">{card.title}</h3>
                <p className="text-sm leading-relaxed text-blue-100/90">{card.description}</p>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-3" delayMs={180}>
          <Button variant="hero" size="xl" className="h-12 rounded-2xl bg-white px-6 text-sm font-extrabold text-[#0b3dd9] hover:bg-blue-50">
            {copy.primaryCta}
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
