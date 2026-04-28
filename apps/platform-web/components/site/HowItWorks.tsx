"use client";

import { Plus, UserPlus, Sparkles, Activity } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";

const stepIcons = [Plus, UserPlus, Sparkles, Activity] as const;

export const HowItWorks = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).howItWorks;

  return (
    <section id="how" className="bg-background py-20">
      <div className="container max-w-[1200px]">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{copy.sectionLabel}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {copy.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <div key={step.num} className="relative">
                <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-display text-xs font-bold text-muted-foreground">STEP {step.num}</span>
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold leading-tight">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < copy.steps.length - 1 && (
                  <div className="absolute right-[-14px] top-1/2 hidden h-px w-7 bg-border lg:block" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
