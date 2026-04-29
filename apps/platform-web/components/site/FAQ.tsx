"use client";

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { Reveal } from "./Reveal";

export const FAQ = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).faq;
  const [audienceTab, setAudienceTab] = useState<"company" | "student">("company");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const items = audienceTab === "company" ? copy.companyItems : copy.studentItems;
  const activeItem = items[activeIndex] ?? items[0];

  const handleSelectQuestion = (index: number) => {
    if (index === activeIndex) return;
    setIsAnswerLoading(true);
    setActiveIndex(index);
    window.setTimeout(() => {
      setIsAnswerLoading(false);
    }, 520);
  };

  return (
    <section className="relative overflow-hidden bg-[#eef3ff] py-14">
      <div className="pointer-events-none absolute -left-20 top-8 h-52 w-52 rounded-full bg-[#93C5FD]/45 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-8 h-56 w-56 rounded-full bg-[#c4b5fd]/35 blur-3xl" />
      <div className="container max-w-[1200px]">
        <Reveal>
          <p className="mb-2 inline-flex rounded-full border border-[#bfdbfe] bg-white/80 px-3 py-1 text-xs font-bold tracking-[0.08em] text-[#1D4ED8]">{copy.sectionLabel}</p>
          <h2 className="font-display text-3xl font-black tracking-[-0.02em] text-[#0B1227] md:text-5xl">{copy.title}</h2>
          <p className="mt-3 text-slate-600">{copy.description}</p>
          <div className="mt-5 inline-flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAudienceTab("company");
                setActiveIndex(0);
                setIsAnswerLoading(false);
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-extrabold shadow-[0_10px_20px_-14px_rgba(15,23,42,0.45)] transition-all ${
                audienceTab === "company"
                  ? "-rotate-2 border-[#0B46E8] bg-[#0B46E8] text-white"
                  : "-rotate-1 border-[#BFDBFE] bg-white text-[#1D4ED8] hover:-translate-y-0.5"
              }`}
            >
              {copy.tabs.company}
            </button>
            <button
              type="button"
              onClick={() => {
                setAudienceTab("student");
                setActiveIndex(0);
                setIsAnswerLoading(false);
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-extrabold shadow-[0_10px_20px_-14px_rgba(15,23,42,0.45)] transition-all ${
                audienceTab === "student"
                  ? "rotate-2 border-[#0B46E8] bg-[#0B46E8] text-white"
                  : "rotate-1 border-[#BFDBFE] bg-white text-[#1D4ED8] hover:-translate-y-0.5"
              }`}
            >
              {copy.tabs.student}
            </button>
          </div>
        </Reveal>

        <Reveal delayMs={100} y="sm" className="mt-10 mb-10">
          <div className="mx-auto grid max-w-[980px] gap-4 rounded-[28px] border border-[#dbeafe] bg-white/65 p-4 shadow-[0_28px_60px_-36px_rgba(37,99,235,0.5)] backdrop-blur md:grid-cols-[0.85fr_1.15fr]">
            <aside className="max-h-[620px] space-y-1.5 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={item.question}
                    onClick={() => handleSelectQuestion(index)}
                    className={`w-full px-1 py-3 text-left transition-colors duration-200 ${
                      isActive ? "text-[#0B46E8]" : "text-slate-600 hover:text-[#0B46E8]"
                    }`}
                  >
                    <p className={`font-display text-sm leading-snug ${isActive ? "font-bold" : "font-semibold"}`}>
                      {item.question.replace(/^Q\.\s*/, "")}
                    </p>
                  </button>
                );
              })}
            </aside>

            <div className="space-y-6 rounded-2xl border border-[#dbeafe] bg-white p-4 shadow-[0_18px_34px_-22px_rgba(15,23,42,0.22)] md:p-5">
              <div className="ml-auto flex w-full max-w-[92%] items-end justify-end gap-2">
                <div className="max-w-full rounded-2xl rounded-br-md bg-gradient-to-br from-[#0B46E8] to-[#2563EB] px-4 py-3 text-left text-white shadow-[0_18px_32px_-20px_rgba(30,64,175,0.9)]">
                  <h3 className="font-display text-sm font-bold leading-relaxed md:text-base">
                    {activeItem.question.replace(/^Q\.\s*/, "")}
                  </h3>
                </div>
                <img src="/img_profile_0.webp" alt="Question profile" className="h-8 w-8 shrink-0 rounded-full object-cover md:h-9 md:w-9" />
              </div>

              <div className="mr-auto flex w-full max-w-[96%] items-end justify-start gap-2">
                <img src="/img_logo.webp" alt="Answer profile" className="h-8 w-8 shrink-0 rounded-full bg-white object-contain p-1 md:h-9 md:w-9" />
                <div
                  className={`rounded-2xl rounded-tl-md bg-gradient-to-br from-[#f8fbff] to-[#f3f7ff] px-4 ${isAnswerLoading ? "py-1.5" : "py-3"} text-left text-slate-700 ${
                    isAnswerLoading ? "w-[86px]" : "w-full"
                  }`}
                >
                  {isAnswerLoading ? (
                    <div className="flex min-h-[32px] items-center justify-center">
                      <div className="inline-flex items-center gap-1.5 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#60A5FA] [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#60A5FA] [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#60A5FA] [animation-delay:240ms]" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 font-display text-sm leading-relaxed md:text-base">
                      {activeItem.answer.split("\n").map((line, lineIndex) => (
                        <p key={`${activeItem.question}-${lineIndex}`}>{line.replace(/^\s*-\s*/, "")}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
