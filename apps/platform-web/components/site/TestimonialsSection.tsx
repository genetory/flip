"use client";

import { User } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { getSiteMessages } from "../../lib/site-messages";
import { useLanguage } from "../i18n/LanguageProvider";
import { Reveal } from "./Reveal";

const stickyColors = ["bg-white", "bg-white", "bg-white", "bg-white"] as const;

const ReviewAvatar = ({ src, alt }: { src?: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  const showFallback = !src || hasError;

  if (showFallback) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500">
        <User className="h-3.5 w-3.5" weight="bold" />
      </span>
    );
  }

  return <img src={src} alt={alt} className="h-6 w-6 rounded-full object-cover" onError={() => setHasError(true)} />;
};

export const TestimonialsSection = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).testimonials;
  const repeatedItems = [...copy.items, ...copy.items, ...copy.items, ...copy.items];
  const columns = [0, 1, 2, 3].map((col) => repeatedItems.filter((_, index) => index % 4 === col));

  return (
    <section id="testimonials" className="bg-[#f6f9ff] py-20">
      <div className="container max-w-[1200px]">
        <Reveal className="mb-20">
          <p className="mb-2 text-sm font-semibold text-[#1D4ED8]">{copy.sectionLabel.toUpperCase()}</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-[#0B1227] md:text-4xl">{copy.title}</h2>
        </Reveal>

        <Reveal y="sm">
          <div className="relative lg:rotate-[5deg]">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-[#f6f9ff] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-[#f6f9ff] to-transparent" />
            <div className="ml-auto grid max-w-[860px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
              {columns.map((colItems, colIndex) => {
                const directionClass = colIndex === 0 || colIndex === 2 ? "[animation-direction:reverse]" : "";
                return (
                  <div key={`col-${colIndex}`} className="group relative h-[440px] overflow-hidden">
                    <div className={`flex animate-[testiMarquee_44s_linear_infinite] flex-col gap-3 group-hover:[animation-play-state:paused] ${directionClass}`}>
                      {[...colItems, ...colItems].map((item, itemIndex) => (
                        <article
                          key={`${item.by}-${colIndex}-${itemIndex}`}
                          className={`${stickyColors[colIndex]} h-auto px-4 py-3.5 shadow-[0_20px_34px_-24px_rgba(15,23,42,0.45)]`}
                        >
                          <span className="mb-2 block h-2 w-10 rounded bg-white/80" />
                          <p className="text-[14px] font-normal leading-relaxed text-[#0B1227]">"{item.quote}"</p>
                          <div className="mt-2 flex items-center gap-2">
                            <ReviewAvatar src={item.avatar} alt={item.by} />
                            <p className="text-[10px] font-semibold text-slate-700">{item.by}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
      <style jsx global>{`
        @keyframes testiMarquee {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </section>
  );
};
