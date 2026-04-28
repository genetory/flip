"use client";

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { Reveal } from "./Reveal";

export const FAQ = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).faq;
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = copy.items[activeIndex];

  return (
    <section className="bg-[#e9edf5] py-10">
      <div className="container max-w-[1200px]">
        <Reveal>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{copy.sectionLabel}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
          <p className="mt-3 text-muted-foreground">{copy.description}</p>
        </Reveal>

        <Reveal delayMs={100} y="sm" className="mt-10 mb-10">
          <div className="mx-auto grid max-w-[980px] gap-4 rounded-2xl bg-[#f3f5fa] p-4 md:grid-cols-[0.85fr_1.15fr]">
            <aside className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {copy.items.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={item.question}
                    onClick={() => setActiveIndex(index)}
                    className={`w-full rounded-xl px-3 py-2 text-left transition-colors ${
                      isActive ? "bg-white text-[#0B46E8]" : "bg-transparent text-slate-600 hover:bg-white/70"
                    }`}
                  >
                    <p className="font-display text-sm font-semibold leading-snug">
                      {item.question.replace(/^Q\.\s*/, "")}
                    </p>
                  </button>
                );
              })}
            </aside>

            <div className="space-y-6 rounded-2xl bg-white p-4 shadow-[0_14px_28px_-20px_rgba(15,23,42,0.22)] md:p-5">
              <div className="ml-auto flex w-full max-w-[92%] items-end justify-end gap-2">
                <div className="max-w-full rounded-2xl rounded-br-md bg-[#0B46E8] px-4 py-3 text-left text-white shadow-[0_14px_28px_-20px_rgba(30,64,175,0.85)]">
                  <h3 className="font-display text-sm font-bold leading-relaxed md:text-base">
                    {activeItem.question.replace(/^Q\.\s*/, "")}
                  </h3>
                </div>
                <img src="/img_profile_0.webp" alt="Question profile" className="h-8 w-8 shrink-0 rounded-full object-cover md:h-9 md:w-9" />
              </div>

              <div className="mr-auto flex w-full max-w-[96%] items-end justify-start gap-2">
                <img src="/aply-logo-20260428.webp" alt="Answer profile" className="h-8 w-8 shrink-0 rounded-full bg-white object-contain p-1 md:h-9 md:w-9" />
                <div className="w-full rounded-2xl rounded-tl-md bg-[#f9fafc] px-4 py-3 text-left text-slate-700">
                  <div className="space-y-2 font-display text-sm leading-relaxed md:text-base">
                    {activeItem.answer.split("\n").map((line, lineIndex) => (
                      <p key={`${activeItem.question}-${lineIndex}`}>{line.replace(/^\s*-\s*/, "")}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
