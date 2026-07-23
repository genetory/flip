"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { MapPin, Briefcase, Bookmark } from "@phosphor-icons/react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";
import { Reveal } from "./Reveal";
import { paperlogy } from "../../lib/fonts";

type HomePositionCardItem = {
  id: string;
  title: string;
  company: string;
  companyInitial: string;
  category: string;
  location: string;
  workType: string;
  thumbnailUrl: string | null;
  createdAt: string;
};

type HomePositionsCopy = ReturnType<typeof getSiteMessages>["positions"];
const FALLBACK_THUMBS = [
  "/img_position_thumb_0.webp",
  "/img_position_thumb_1.webp",
  "/img_position_thumb_2.webp",
  "/img_position_thumb_3.webp",
  "/img_position_thumb_4.webp"
];

function seededRotation(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const normalized = (hash % 1000) / 1000;
  return min + normalized * (max - min);
}

function mapItemToHomeCard(item: PublicPositionListItem, copy: HomePositionsCopy): HomePositionCardItem {
  const company = item.partnerOrganization?.name?.trim() || copy.defaultCompanyName;
  const normalizedWorkType = (item.workType ?? "").toLowerCase().replace(/[\s_-]/g, "");
  let workType = item.workType ?? copy.workTypeOnsite;
  if (normalizedWorkType === "remote") workType = copy.workTypeRemote;
  if (normalizedWorkType === "hybrid") workType = copy.workTypeHybrid;
  if (normalizedWorkType === "onsite") workType = copy.workTypeOnsite;

  return {
    id: item.id,
    title: item.title,
    company,
    companyInitial: company[0]?.toUpperCase() ?? "P",
    category: item.preferredJobRole?.trim() || copy.defaultCategory,
    location: item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || copy.defaultLocation,
    workType,
    thumbnailUrl: item.thumbnailImages[0] ?? null,
    createdAt: item.createdAt
  };
}

export const Positions = () => {
  const { locale } = useLanguage();
  const copy = getSiteMessages(locale).positions;
  const [latestPositions, setLatestPositions] = useState<HomePositionCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const [deckOpen, setDeckOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const page = await getPublicPositionsPage({ limit: 30 });
        if (!mounted) return;
        const latest = [...page.items]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8)
          .map((item) => mapItemToHomeCard(item, copy));
        setLatestPositions(latest);
      } catch {
        if (!mounted) return;
        setLatestPositions([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [copy]);

  useEffect(() => {
    const node = deckRef.current;
    if (!node) return;
    let timer: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        // Delay one tick so the initial "stacked" state is painted first on hard refresh.
        timer = window.setTimeout(() => setDeckOpen(true), 40);
        observer.unobserve(node);
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const fallbackItems = useMemo<HomePositionCardItem[]>(
    () =>
      copy.items.slice(0, 8).map((position, index) => ({
        id: `fallback-${index}-${position.role}`,
        title: position.role,
        company: position.company,
        companyInitial: position.initial,
        category: position.category,
        location: position.location,
        workType: position.workType,
        thumbnailUrl: FALLBACK_THUMBS[index % FALLBACK_THUMBS.length] ?? null,
        createdAt: ""
      })),
    [copy.items]
  );

  const sectionItems = fallbackItems;
  const mobileItems = sectionItems.slice(0, 5);
  const rollingItems = sectionItems.slice(0, 6);
  const deckItems = rollingItems.slice(0, 5);
  const deckRotations = useMemo(
    () => deckItems.map((item, index) => seededRotation(`${item.id}-${index}`, -5.5, 5.5)),
    [deckItems]
  );

  return (
    <section id="positions" className="relative overflow-hidden bg-white py-20">
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-[#7DD3FC]/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-[#60A5FA]/30 blur-3xl" />
      <div className="container max-w-[1200px]">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className={`${paperlogy.className} text-3xl font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>{copy.title}</h2>
            <p className="mt-2 max-w-xl text-slate-600">{copy.description}</p>
          </div>
          <Button
            variant="dark"
            className="h-11 rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            asChild
          >
            <Link href="/positions">
              {copy.viewAll}
            </Link>
          </Button>
        </Reveal>

        <div className="mx-auto mt-8 max-w-[1200px] space-y-3 md:hidden">
          {mobileItems.map((position, index) => (
            <Reveal key={`${position.id}-list-wrap`} delayMs={index * 70} y="sm">
              <article
                key={`${position.id}-list`}
                className="relative rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 shadow-[0_12px_26px_-20px_rgba(15,23,42,0.4)] transition-all duration-300"
              >
                <Link href="/positions" aria-label={copy.viewAll} className="absolute inset-0 z-10 rounded-xl" />
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    {position.thumbnailUrl ? (
                      <img src={position.thumbnailUrl} alt={position.title} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[11px] font-black uppercase tracking-[0.02em] text-[#0B1227]">
                        {position.companyInitial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 text-[11px] text-slate-500">
                        <p className="truncate font-extrabold text-[#1D4ED8]">{position.company}</p>
                        <p className="mt-0.5 truncate">{position.category}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-slate-400">{
                          locale === "ko" ? "15시간 전" : locale === "zh-CN" ? "15 小时前" : locale === "vi" ? "15 giờ trước" : locale === "ja" ? "15時間前" : locale === "id" ? "15 jam lalu" : "15h ago"
                        }</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-rose-500">{
                          locale === "ko" ? "채용시 마감" : locale === "zh-CN" ? "招满即止" : locale === "vi" ? "Đóng khi đủ" : locale === "ja" ? "採用時締切" : locale === "id" ? "Tutup setelah terisi" : "Closes when filled"
                        }</p>
                      </div>
                    </div>
                    <h3 className="mt-1 line-clamp-2 font-display text-[13px] font-extrabold leading-snug text-[#0B1227]">{position.title}</h3>
                    <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[11px] text-slate-500">
                      <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{position.location}</span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {position.workType}
                      </span>
                    </div>
                    <div className="relative z-20 mt-2 flex items-center justify-end gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl border border-slate-200 bg-white opacity-80" aria-label={copy.saveAriaLabel} disabled>
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="dark"
                        className="h-8 rounded-xl bg-[#111827] px-3 text-xs font-semibold text-white pointer-events-none"
                        aria-disabled="true"
                      >
                        {locale === "ko" ? "Buddies로 보러가기" : locale === "zh-CN" ? "在 Buddies 查看" : locale === "vi" ? "Xem trên Buddies" : locale === "ja" ? "Buddiesで見る" : locale === "id" ? "Lihat di Buddies" : "View on Buddies"}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div ref={deckRef} className="relative mx-auto hidden max-w-[1200px] py-8 md:block">
          <div className="relative h-[260px]">
            {deckItems.map((position, index) => {
              const visualIndex = index;
              const randomTilt = deckRotations[index] ?? 0;
              return (
              <article
                key={`${position.id}-fan-${index}`}
                className="absolute left-1/2 top-0 flex w-[280px] flex-col rounded-2xl bg-white p-3.5 shadow-[0_0_36px_-14px_rgba(37,99,235,0.52)] transition-[transform,opacity] duration-700 ease-smooth"
                style={{
                  transform: deckOpen
                    ? `translateX(calc(-50% + ${(visualIndex - 2) * 186}px)) translateY(${Math.max(0, 16 - visualIndex * 2)}px) rotate(${randomTilt}deg)`
                    : `translateX(calc(-50% + ${(index - 2) * 6}px)) translateY(${index * 2}px) rotate(${randomTilt * 0.42}deg)`,
                  opacity: deckOpen ? 1 : 0.92,
                  transitionDelay: `${index * 90}ms`,
                  zIndex: deckItems.length - visualIndex
                }}
              >
                <Link href="/positions" aria-label={copy.viewAll} className="absolute inset-0 z-10 rounded-xl" />
                <div className="mb-2 overflow-hidden rounded-lg border border-[#DBEAFE] bg-slate-50">
                  {position.thumbnailUrl ? (
                    <img src={position.thumbnailUrl} alt={position.title} className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-[#DBEAFE] via-[#EFF6FF] to-[#E2E8F0]" />
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  <p className="truncate font-extrabold text-[#1D4ED8]">{position.company}</p>
                  <p className="mt-1 truncate">{position.category}</p>
                </div>
                <h3 className="mt-1 line-clamp-1 font-display text-base font-extrabold leading-tight text-[#0B1227]">{position.title}</h3>
                <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-slate-500">
                  <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {position.location}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1 truncate">
                    <Briefcase className="h-3 w-3 shrink-0" />
                    {position.workType}
                  </span>
                </div>
                <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
                  <Button variant="outline" size="icon" className="border-0 bg-white opacity-60" aria-label={copy.saveAriaLabel} disabled>
                    <Bookmark />
                  </Button>
                  <Button
                    variant="dark"
                    className="h-10 flex-1 rounded-xl bg-[#b7ff5a] text-sm font-semibold text-[#111111] shadow-[0_14px_26px_-18px_rgba(124,174,38,0.55)] pointer-events-none"
                    aria-disabled="true"
                  >
                    {copy.applyCta}
                  </Button>
                </div>
              </article>
            );
            })}
          </div>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-muted-foreground">{copy.loadingLabel}</p> : null}

        <div className="relative mt-24 overflow-hidden rounded-3xl bg-white shadow-[0_22px_40px_-28px_rgba(37,99,235,0.5)] md:mt-28">
          <div className="absolute right-6 top-5 rounded-full bg-[#ffd36a] px-3 py-1 text-[10px] font-extrabold tracking-[0.04em] text-[#0B1227]">
            FOR PARTNERS
          </div>
          <div className="grid gap-0 md:grid-cols-[0.4fr_1fr]">
            <div className="relative min-h-[64px] overflow-hidden md:min-h-[72px]">
              <img src="/img_company_recruit.webp?v=20260430" alt={copy.partnerRecruitAlt} className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white to-transparent" />
            </div>
            <div className="flex flex-col justify-center gap-1 p-5 md:p-6">
              <p className={`${paperlogy.className} text-xl font-black leading-tight tracking-[-0.02em] text-[#0B1227] md:text-2xl`}>{copy.partnerTitle}</p>
              <p className="max-w-md text-sm leading-relaxed text-slate-600">{copy.partnerDescription}</p>
              <div className="mt-4 md:mt-5">
                <Button
                  variant="dark"
                  size="lg"
                  className="h-11 rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  asChild
                >
                  <Link href="/login">{copy.partnerCta}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
