"use client";

import { useLanguage } from "../i18n/LanguageProvider";
import { Reveal } from "./Reveal";

const sponsors = [
  { src: "/img_sponcer_0.png", alt: "Sponsor 0" },
  { src: "/img_sponcer_1.png", alt: "Sponsor 1" },
  { src: "/img_sponcer_2.png", alt: "Sponsor 2" },
  { src: "/img_sponcer_3.png", alt: "Sponsor 3" },
  { src: "/img_sponcer_4.png", alt: "Sponsor 4" },
  { src: "/img_sponcer_5.png", alt: "Sponsor 5" },
  { src: "/img_sponcer_6.png", alt: "Sponsor 6" }
];

export const Sponsors = () => {
  const { locale } = useLanguage();
  const eyebrow = locale === "ko" ? "함께하는 파트너 기업" : "Partner Companies";
  const title = locale === "ko" ? "Aply와 함께하는 검증된 한국 기업들" : "Verified Korean companies partnering with Aply";

  return (
    <section className="bg-white py-12 md:py-14">
      <div className="container max-w-[1200px]">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl">
            {title}
          </h2>
        </Reveal>

        <Reveal delayMs={80} y="sm" className="mt-7">
          <div className="relative overflow-x-hidden py-2">
            <div className="flex w-max animate-marquee items-center gap-8 md:gap-12">
              {[...sponsors, ...sponsors].map((item, index) => (
                <div
                  key={`${item.src}-${index}`}
                  className="flex h-16 w-[180px] items-center justify-center rounded-xl bg-white/80 px-4 md:h-20 md:w-[220px]"
                >
                  <img src={item.src} alt={item.alt} className="h-9 w-full object-contain md:h-11" />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  );
};
