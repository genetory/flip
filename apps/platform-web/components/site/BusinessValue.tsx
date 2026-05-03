"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { ShieldCheck, UserCheck, Workflow, Globe2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { Reveal } from "./Reveal";
import { paperlogy } from "../../lib/fonts";

const valueIcons = [ShieldCheck, UserCheck, Workflow, Globe2] as const;
const valueCardThemes = [
  "bg-[#2563EB]",
  "bg-[#7C3AED]",
  "bg-[#10B981]",
  "bg-[#F97316]",
] as const;

export const BusinessValue = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).businessValue;
  const isEnglish = locale === "en";

  return (
    <section id="for-business" className="relative overflow-hidden border-y border-slate-200 bg-white py-20 text-[#0B1227]">
      <div className="container relative max-w-[1200px]">
        <Reveal className="mx-auto mb-14 grid max-w-4xl items-center gap-6 md:grid-cols-[220px_1fr]">
          <div className="mx-auto w-[150px] md:mx-0 md:w-[220px]">
            <Image
              src="/img_for_business.webp"
              alt="Global talent illustration"
              width={1468}
              height={1126}
              className="h-auto w-full rounded-2xl object-cover shadow-[0_24px_50px_-34px_rgba(15,23,42,0.5)]"
              sizes="220px"
            />
          </div>
          <div className="text-center md:text-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">
            {copy.sectionLabel}
          </p>
          <h2 className={`${paperlogy.className} text-3xl font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
            {copy.titleTop}
            <br />
            <span className="mt-2 inline-block">
              {copy.titleBottom}
            </span>
          </h2>
          <p className="mt-5 text-slate-600">{copy.description}</p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {copy.cards.map((card, index) => {
            const Icon = valueIcons[index];
            return (
              <Reveal
                key={card.title}
                className={`group rounded-2xl p-6 text-white transition-all duration-300 hover:-translate-y-1 ${valueCardThemes[index]}`}
                delayMs={index * 80}
                y="sm"
              >
                <Icon className="mb-5 h-6 w-6 fill-white stroke-white" />
                <h3 className={`mb-2 font-display font-black leading-tight tracking-[-0.02em] text-white text-balance ${isEnglish ? "text-[1.55rem] md:text-[1.65rem]" : "text-2xl md:text-[1.9rem]"}`}>
                  {card.title}
                </h3>
                <p className={`leading-relaxed text-white/95 text-pretty ${isEnglish ? "text-[0.98rem] md:text-base" : "text-base md:text-[1.05rem]"}`}>
                  {card.description}
                </p>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-3" delayMs={180}>
          <Button
            variant="hero"
            size="xl"
            className={`${paperlogy.className} h-12 rounded-2xl bg-white px-6 text-sm font-extrabold text-[#0b3dd9] hover:bg-blue-50`}
          >
            {copy.primaryCta}
          </Button>
        </Reveal>

      </div>
    </section>
  );
};
