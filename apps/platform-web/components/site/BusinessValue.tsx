"use client";

import { Button } from "../ui/button";
import { ShieldCheck, UserCheck, Workflow, Globe2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";

const valueIcons = [ShieldCheck, UserCheck, Workflow, Globe2] as const;

export const BusinessValue = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).businessValue;

  return (
    <section id="for-business" className="relative overflow-hidden bg-foreground py-20 text-background">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="container relative max-w-[1200px]">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold text-accent">{copy.sectionLabel}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {copy.titleTop}
            <br />
            {copy.titleBottom}
          </h2>
          <p className="mt-4 text-background/70">{copy.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {copy.cards.map((card, index) => {
            const Icon = valueIcons[index];
            return (
              <div
                key={card.title}
                className="group rounded-2xl border border-background/10 bg-background/5 p-6 backdrop-blur transition-colors hover:bg-background/10"
              >
                <div className="mb-5 inline-grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{card.title}</h3>
                <p className="text-sm leading-relaxed text-background/70">{card.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button variant="hero" size="xl">
            {copy.primaryCta}
          </Button>
          <Button variant="outline" size="xl" className="border-background/20 bg-transparent text-background hover:bg-background/10">
            {copy.secondaryCta}
          </Button>
        </div>
      </div>
    </section>
  );
};
