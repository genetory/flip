"use client";

import { useEffect, useMemo, useState } from "react";
import { getSiteMessages } from "../../lib/site-messages";
import { useLanguage } from "../i18n/LanguageProvider";
import { Reveal } from "./Reveal";

export const ProvenResults = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).cases;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const animatedValues = useMemo(() => {
    const count200 = Math.round(200 * progress);
    const count100 = Math.round(100 * progress);
    const score45 = (4.5 * progress).toFixed(1);
    const score48 = (4.8 * progress).toFixed(1);

    return [`${count200}+`, `${count100}+`, `${score45}/5.0`, `${score48}/5.0`];
  }, [progress]);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container max-w-[1200px]">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{copy.resultsEyebrow}</p>
            <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-[#0B1227] md:text-5xl">
            {copy.resultsTitle}
            <br />
            {copy.resultsSubtitle}
          </h2>
        </Reveal>

        <Reveal delayMs={90} y="sm">
          <div className="grid grid-cols-2 gap-6 md:gap-8">
            {copy.stats.map((item, index) => (
              <div
                key={item.label}
                className="px-2 py-2 text-center transition-transform duration-300 hover:-translate-y-1"
                style={{ transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)` }}
              >
                <p className="font-display text-6xl font-black leading-none tracking-[-0.05em] text-[#0B46E8] md:text-8xl lg:text-9xl">
                  {animatedValues[index]}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-600 md:text-base">{item.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
