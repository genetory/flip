"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { getSiteMessages } from "../../lib/site-messages";
import { useLanguage } from "../i18n/LanguageProvider";
import { Reveal } from "./Reveal";

type ScenarioTab = "student" | "company";

export const Scenario = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).scenario;

  const [tab, setTab] = useState<ScenarioTab>("student");
  const [active, setActive] = useState(false);

  const isStudent = tab === "student";
  const title = isStudent ? copy.studentTitle : copy.companyTitle;
  const description = isStudent ? copy.studentDescription : copy.companyDescription;
  const steps = isStudent ? copy.studentSteps : copy.companySteps;
  const imageSrc = isStudent ? "/img_scenario_student.webp" : "/img_scenario_company.webp";
  const imageAlt = isStudent ? copy.studentImageAlt : copy.companyImageAlt;

  useEffect(() => {
    setActive(false);
    const timer = window.setTimeout(() => setActive(true), 30);
    return () => window.clearTimeout(timer);
  }, [tab]);

  const leftSteps = isStudent ? [] : steps;
  const rightSteps = isStudent ? steps : [];
  const leftImage = isStudent ? imageSrc : "";
  const rightImage = isStudent ? "" : imageSrc;
  const leftImageAlt = isStudent ? imageAlt : "";
  const rightImageAlt = isStudent ? "" : imageAlt;

  return (
    <section className="relative overflow-hidden border-y border-blue-400/50 bg-[#0b3dd9] pt-16 pb-0 md:pt-24 md:pb-0">
      <div className="container max-w-[1180px]">
        <Reveal className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-16 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/90">{copy.sectionLabel}</p>

          <div className="mb-8 flex justify-center">
            <div className="relative inline-flex min-w-[340px] rounded-2xl bg-white/14 p-1 md:min-w-[420px]">
              <span
                className={cn(
                  "pointer-events-none absolute -top-7 z-30 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-900 shadow-[0_10px_20px_-12px_rgba(2,6,23,0.5)] transition-all duration-300",
                  isStudent
                    ? "left-8 -rotate-6 bg-[#b7ff5a]"
                    : "right-8 rotate-6 bg-[#ffd36a]",
                )}
              >
                {isStudent ? "student view" : "company view"}
              </span>
              {([
                { key: "student", label: copy.tabs.student },
                { key: "company", label: copy.tabs.company }
              ] as const).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "relative z-10 flex-1 cursor-pointer select-none rounded-xl px-6 py-3 text-base uppercase transition-all duration-200 active:scale-[0.99] md:text-lg",
                    tab === item.key
                      ? "bg-white text-[#0b3dd9] font-black"
                      : "font-semibold text-blue-100/90 hover:text-white",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-blue-100/95 md:text-base">{description}</p>
        </Reveal>

        <Reveal y="sm" className="mx-auto max-w-6xl">
          <div
            className={cn(
              "grid items-end gap-8 lg:gap-10",
              isStudent ? "lg:grid-cols-[0.86fr_1.14fr]" : "lg:grid-cols-[1.14fr_0.86fr]"
            )}
          >
            <div className="min-h-[320px] md:min-h-[430px]">
              {leftImage ? (
                <div
                  className={cn(
                    "relative h-[320px] overflow-visible transition-all duration-700 ease-smooth md:h-[430px]",
                    active ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                  )}
                >
                  <img src={leftImage} alt={leftImageAlt} className="absolute -bottom-2 left-0 h-full w-auto object-contain" />
                </div>
              ) : (
                <ol className="flex h-[320px] flex-col justify-start gap-2 pt-8 md:h-[430px] md:pt-10">
                  {leftSteps.map((step, index) => (
                    <li
                      key={`${tab}-left-${step}-${index}`}
                      className={cn(
                        "transition-all duration-700 ease-smooth",
                        active ? "translate-x-0 translate-y-0 opacity-100" : "-translate-x-10 translate-y-3 opacity-0"
                      )}
                      style={{ transitionDelay: `${index * 90}ms` }}
                    >
                      <div className="inline-flex w-full flex-col items-center py-2 text-center transition-transform duration-300 hover:z-10 hover:-translate-y-0.5">
                        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80">
                          Step {index + 1}
                        </span>
                        <p className="font-display text-lg font-black leading-tight tracking-[-0.01em] text-white md:text-2xl">
                          {step}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="min-h-[320px] md:min-h-[430px]">
              {rightImage ? (
                <div
                  className={cn(
                    "relative h-[320px] overflow-visible transition-all duration-700 ease-smooth md:h-[430px]",
                    active ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                  )}
                >
                  <img src={rightImage} alt={rightImageAlt} className="absolute -bottom-2 right-0 h-full w-auto object-contain" />
                </div>
              ) : (
                <ol className="flex h-[320px] flex-col justify-start gap-2 pt-8 md:h-[430px] md:pt-10">
                  {rightSteps.map((step, index) => (
                    <li
                      key={`${tab}-right-${step}-${index}`}
                      className={cn(
                        "transition-all duration-700 ease-smooth",
                        active ? "translate-x-0 translate-y-0 opacity-100" : "translate-x-10 translate-y-3 opacity-0"
                      )}
                      style={{ transitionDelay: `${index * 90}ms` }}
                    >
                      <div className="inline-flex w-full flex-col items-center py-2 text-center transition-transform duration-300 hover:z-10 hover:-translate-y-0.5">
                        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80">
                          Step {index + 1}
                        </span>
                        <p className="font-display text-lg font-black leading-tight tracking-[-0.01em] text-white md:text-2xl">
                          {step}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
