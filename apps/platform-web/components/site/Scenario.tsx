"use client";

import { Fragment, useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";

const ScenarioStep = ({
  text,
  index,
  isLast,
  tab
}: {
  text: string;
  index: number;
  isLast: boolean;
  tab: "student" | "company";
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, index * 140);

    return () => {
      window.clearTimeout(timer);
    };
  }, [index, tab, text]);

  return (
    <Fragment>
      <li
        className={cn(
          "relative transition-all duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none",
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        <div className="h-full rounded-2xl border border-border/60 bg-background p-3.5 lg:w-[180px]">
          <div className="mb-2.5">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-foreground px-2 text-[11px] font-bold text-background">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug text-foreground">{text}</p>
        </div>
      </li>
      {!isLast ? (
        <li
          aria-hidden
          className={cn(
            "hidden items-center px-2 transition-all duration-700 ease-out lg:flex motion-reduce:transform-none motion-reduce:transition-none",
            visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
        </li>
      ) : null}
    </Fragment>
  );
};

export const Scenario = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).scenario;
  const [tab, setTab] = useState<"student" | "company">("student");
  const steps = tab === "student" ? copy.studentSteps : copy.companySteps;
  const description = tab === "student" ? copy.studentDescription : copy.companyDescription;
  const scenarioImage = tab === "student" ? "/img_student_sight.webp" : "/img_partner_sight.webp";
  const scenarioImageAlt = tab === "student" ? copy.studentImageAlt : copy.companyImageAlt;
  const desktopColsClass = "lg:grid-cols-5";

  return (
    <section className="border-y border-border bg-muted/30 py-16 md:py-20">
      <div className="container max-w-[1200px]">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">{copy.sectionLabel}</p>
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-background p-1 shadow-card">
            {[
              { key: "student", label: copy.tabs.student },
              { key: "company", label: copy.tabs.company }
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as "student" | "company")}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
            </div>
          </div>

          <div className="mx-auto mb-6 w-full max-w-3xl md:mb-7">
            <img src={scenarioImage} alt={scenarioImageAlt} className="h-[150px] w-full object-contain md:h-[230px]" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {tab === "student" ? copy.studentTitle : copy.companyTitle}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">{description}</p>
        </div>

        <ol className={cn("mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3", desktopColsClass, "lg:flex lg:max-w-none lg:items-stretch lg:justify-center")}>
          {steps.map((s, i) => (
            <ScenarioStep
              key={`${tab}-${s}-${i}`}
              text={s}
              index={i}
              isLast={i === steps.length - 1}
              tab={tab}
            />
          ))}
        </ol>
      </div>
    </section>
  );
};
