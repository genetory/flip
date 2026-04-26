"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight, MapPin, Briefcase, Bookmark } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";

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

function mapItemToHomeCard(item: PublicPositionListItem, copy: HomePositionsCopy): HomePositionCardItem {
  const company = item.partnerOrganization?.name?.trim() || item.partnerOrganization?.domain || copy.defaultCompanyName;
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
        thumbnailUrl: null,
        createdAt: ""
      })),
    [copy.items]
  );

  const sectionItems = latestPositions.length > 0 ? latestPositions : fallbackItems;

  return (
    <section id="positions" className="border-t border-border bg-background py-20">
      <div className="container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{copy.title}</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">{copy.description}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/positions">
              {copy.viewAll} <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="mx-auto max-w-[1200px] space-y-3 md:hidden">
          {sectionItems.map((position) => (
            <article key={`${position.id}-list`} className="group relative rounded-xl border border-border/60 bg-card p-3">
              <Link href={`/positions/${position.id}`} aria-label={`${position.title} ${copy.detailAriaSuffix}`} className="absolute inset-0 z-10 rounded-xl" />
              <div className="flex items-start gap-3">
                <div className="h-[88px] w-[120px] shrink-0 overflow-hidden rounded-lg bg-muted">
                  {position.thumbnailUrl ? (
                    <img src={position.thumbnailUrl} alt={`${position.company} ${copy.thumbnailAltSuffix}`} className="block h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-display text-2xl font-bold text-muted-foreground">
                      {position.companyInitial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted-foreground">
                    <p className="truncate font-semibold">{position.company}</p>
                    <p className="mt-0.5 truncate">{position.category}</p>
                  </div>
                  <h3 className="mt-1 line-clamp-2 font-display text-sm font-bold leading-snug">{position.title}</h3>
                  <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-[11px] text-muted-foreground">
                    <span className="inline-flex min-w-0 max-w-[52%] items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {position.location}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      {position.workType}
                    </span>
                  </div>
                  <div className="relative z-20 mt-2 flex items-center gap-2">
                    <Button variant="outline" size="icon" aria-label={copy.saveAriaLabel} className="h-8 w-8">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="dark" size="sm" className="h-8 px-3 text-xs" asChild>
                      <Link href={`/positions/${position.id}`}>{copy.applyCta}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mx-auto hidden max-w-[1200px] gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {sectionItems.map((position) => (
            <article key={position.id} className="group relative flex h-full w-full flex-col rounded-xl border border-border/60 bg-card p-3.5">
              <Link href={`/positions/${position.id}`} aria-label={`${position.title} ${copy.detailAriaSuffix}`} className="absolute inset-0 z-10 rounded-xl" />
              {position.thumbnailUrl ? (
                <img src={position.thumbnailUrl} alt={`${position.company} ${copy.thumbnailAltSuffix}`} className="block aspect-[16/9] w-full rounded-xl object-cover" />
              ) : (
                <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
                  {position.companyInitial}
                </div>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{position.company}</p>
                  <p className="mt-1 truncate">{position.category}</p>
                </div>
              </div>
              <h3 className="mt-1 line-clamp-1 font-display text-base font-bold leading-tight">{position.title}</h3>
              <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
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
                <Button variant="outline" size="icon" aria-label={copy.saveAriaLabel}>
                  <Bookmark />
                </Button>
                <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
                  <Link href={`/positions/${position.id}`}>{copy.applyCta}</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>

        {isLoading ? <p className="mt-4 text-sm text-muted-foreground">{copy.loadingLabel}</p> : null}

        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-muted/40 p-5 md:flex-row md:items-center md:justify-between">
          <div className="w-full overflow-hidden rounded-xl bg-muted md:w-[260px] md:shrink-0">
            <div className="aspect-[16/9] w-full">
              <img src="/img_partner_recruit.webp" alt={copy.partnerRecruitAlt} className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="md:flex-1">
            <p className="font-display text-lg font-semibold">{copy.partnerTitle}</p>
            <p className="text-sm text-muted-foreground">{copy.partnerDescription}</p>
          </div>
          <Button variant="dark" asChild>
            <Link href="/login">{copy.partnerCta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
