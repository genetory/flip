"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { Reveal } from "./Reveal";
import { paperlogy } from "../../lib/fonts";

const AVATAR_SQUIRCLE_CLIP_ID = "student-profile-avatar-squircle-clip";
const AVATAR_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const AVATAR_SQUIRCLE_STYLE = {
  clipPath: `url(#${AVATAR_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${AVATAR_SQUIRCLE_CLIP_ID})`
} as const;

export const StudentProfile = () => {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const copy = getSiteMessages(locale).studentProfile;
  const ctaHref = isAuthenticated ? "/profile" : "/login";
  const ctaLabel = isAuthenticated
    ? locale === "ko"
      ? "내 프로필 완성하기"
      : "Complete my profile"
    : locale === "ko"
      ? "내 프로필 시작하기"
      : "Start my profile";
  const [activeSlot, setActiveSlot] = useState(0);
  const slotCards = useMemo(
    () =>
      [
        { name: "Minji K.", progress: 81, chance: 87 },
        { name: "Daniel P.", progress: 74, chance: 79 },
        { name: "Hana S.", progress: 92, chance: 95 },
        { name: "Alex T.", progress: 68, chance: 72 },
        { name: "Jisoo L.", progress: 86, chance: 91 },
      ].map((item, index) => ({
        id: index,
        name: item.name,
        profileSrc: `/img_profile_${index}.webp`,
        progress: item.progress,
        chance: item.chance,
      })),
    []
  );
  const slotCardThemes = [
    "from-[#2563EB] to-[#0EA5E9] text-white",
    "from-[#7C3AED] to-[#EC4899] text-white",
    "from-[#10B981] to-[#22C55E] text-white",
    "from-[#F97316] to-[#F59E0B] text-white",
    "from-[#E11D48] to-[#F43F5E] text-white",
  ] as const;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const speedCardsPerSec = 0.42;

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setActiveSlot((prev) => prev + delta * speedCardsPerSec);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [slotCards.length]);

  return (
    <section id="for-students" className="bg-white py-20">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={AVATAR_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={AVATAR_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
      <div className="container grid max-w-[1200px] gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <Reveal className="order-2 lg:order-1" y="lg">
          <div className="relative mx-auto w-full max-w-[560px] animate-float-y [animation-duration:4.2s]">
            <div className="relative h-[600px] overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-white via-white/80 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-white via-white/80 to-transparent" />
              <div className="relative h-full">
                {Array.from({ length: 9 }, (_, virtualIdx) => {
                  const centeredIndex = Math.floor(activeSlot) - 4 + virtualIdx;
                  const wrappedIndex = ((centeredIndex % slotCards.length) + slotCards.length) % slotCards.length;
                  const card = slotCards[wrappedIndex];
                  const wrapped = centeredIndex - activeSlot;
                  const distance = Math.abs(wrapped);
                  const yOffset = wrapped * 122;
                  const scale = Math.max(0.62, 1 - distance * 0.12);
                  const opacity = Math.max(0.3, 1 - distance * 0.24);
                  const zIndex = Math.round(20 - distance * 3);

                  return (
                    <div
                      key={`${card.id}-${centeredIndex}`}
                      className="absolute left-1/2 top-1/2 w-[72%] -translate-x-1/2"
                      style={{
                        transform: `translate(-50%, calc(-50% + ${yOffset}px)) scale(${scale})`,
                        opacity,
                        zIndex,
                      }}
                    >
                      <div className={`flex items-center justify-between rounded-full bg-gradient-to-r px-6 py-6 shadow-[0_14px_30px_-22px_rgba(2,6,23,0.5)] ${slotCardThemes[card.id]}`}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-16 w-16 overflow-hidden ring-2 ring-white/80" style={AVATAR_SQUIRCLE_STYLE}>
                            <Image src={card.profileSrc} alt="Profile photo" fill className="object-cover" sizes="64px" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-extrabold">{card.name}</p>
                            <div className="mt-1 flex items-center justify-between text-[11px] font-semibold opacity-90">
                              <p>
                              {locale === "ko" ? "프로필 완성도" : "Profile completion"}
                              </p>
                              <p>{card.progress}%</p>
                            </div>
                            <div className="mt-1.5 h-2 w-[128px] overflow-hidden rounded-full bg-white/55">
                              <div className="h-full rounded-full bg-white" style={{ width: `${card.progress}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold opacity-80">{locale === "ko" ? "매칭 가능성" : "Match chance"}</p>
                          <p className="font-display text-[38px] font-black leading-none">{card.chance}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="order-1 lg:order-2" delayMs={90}>
          <h2 className={`${paperlogy.className} text-3xl font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
            {copy.titleTop}
            <br />
            <span className="mt-2 inline-block -rotate-[0.8deg] rounded-2xl bg-[#ffd36a] px-5 py-2.5 text-[#0B1227] shadow-[0_16px_34px_-18px_rgba(180,120,0,0.35)] md:px-7 md:py-3">
              {copy.titleBottom}
            </span>
          </h2>
          <p className="mt-5 max-w-lg whitespace-pre-line text-slate-600">{copy.description}</p>
          <ul className="mt-5 space-y-1.5">
            {copy.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2 text-sm leading-snug text-slate-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B46E8]" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="dark"
            size="lg"
            className="mt-7 h-11 rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            asChild
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
};
