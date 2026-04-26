"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addMyFavoritePosition,
  applyMyPosition,
  getMyAppliedPositions,
  getMyFavoritePositions,
  removeMyFavoritePosition,
  type PublicPositionListItem
} from "../../lib/member-profile-client";
import { type Position } from "../../lib/positions-data";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { Button } from "../ui/button";
import { Bookmark, Briefcase, LayoutGrid, List, MapPin } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";

function inferWorkType(value?: string | null): "On-site" | "Hybrid" | "Remote" {
  const text = (value ?? "").toLowerCase();
  if (text.includes("remote") || text.includes("재택")) return "Remote";
  if (text.includes("hybrid") || text.includes("하이브리드")) return "Hybrid";
  return "On-site";
}

function workTypeLabel(value: string, locale: "ko" | "en") {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "remote") return locale === "ko" ? "원격근무" : "Remote";
  if (normalized === "hybrid") return locale === "ko" ? "혼합근무" : "Hybrid";
  if (normalized === "onsite") return locale === "ko" ? "대면근무" : "On-site";
  return value;
}

function companyHref(domain?: string | null) {
  if (!domain?.trim()) return null;
  return `/companies/${encodeURIComponent(domain.trim())}`;
}

function extractDomainFromEmail(email?: string | null) {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

function mapPublicPositionToCard(item: PublicPositionListItem, locale: "ko" | "en"): Position {
  const now = Date.now();
  const createdAt = new Date(item.createdAt);
  const postedDays = Number.isNaN(createdAt.getTime())
    ? 0
    : Math.max(0, Math.floor((now - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
  const company = item.partnerOrganization?.name?.trim() || item.partnerOrganization?.domain || (locale === "ko" ? "파트너 기업" : "Partner company");
  const role = item.title;
  const category = item.preferredJobRole?.trim() || (locale === "ko" ? "직무 미정" : "Role TBD");
  const workType = item.workType ?? inferWorkType(item.workingHours);
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const startLabel =
    startDate && !Number.isNaN(startDate.getTime())
      ? `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, "0")}.${String(startDate.getDate()).padStart(2, "0")}`
      : locale === "ko" ? "즉시" : "Immediate";
  const statusMatchBase = item.status === "MATCHING" ? 86 : 78;
  const match = Math.min(99, Math.max(60, statusMatchBase + Math.min(8, item.matchingParticipantsCount)));
  const tags = [
    ...(item.preferredJobRole ? [item.preferredJobRole] : []),
    ...item.communicationLanguages.slice(0, 2),
    ...(item.workingHours ? [item.workingHours] : [])
  ].filter((value, index, array) => array.indexOf(value) === index).slice(0, 3);

  return {
    id: item.id,
    createdAt: item.createdAt,
    partnerDomain: item.partnerOrganization?.domain ?? undefined,
    thumbnailUrl: item.thumbnailImages[0] ?? undefined,
    company,
    initial: company[0]?.toUpperCase() ?? "P",
    role,
    category,
    industry: item.partnerOrganization?.industry ?? "OTHER",
    companySize: item.partnerOrganization?.companySize ?? (locale === "ko" ? "미정" : "TBD"),
    eligibleVisas: item.eligibleVisas,
    location: item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || (locale === "ko" ? "협의" : "To be discussed"),
    type: workType,
    start: startLabel,
    postedDays,
    applicants: item.matchingParticipantsCount,
    match,
    tags,
    highlight: postedDays <= 3 ? "New" : item.status === "MATCHING" ? "Hot" : undefined
  };
}

function formatPostedDate(position: Position, locale: "ko" | "en") {
  if (position.createdAt) {
    const created = new Date(position.createdAt);
    if (!Number.isNaN(created.getTime())) {
      const now = Date.now();
      const diffMs = Math.max(0, now - created.getTime());
      const minutes = Math.floor(diffMs / (60 * 1000));
      if (minutes < 60) return locale === "ko" ? `${Math.max(1, minutes)}분 전` : `${Math.max(1, minutes)}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return locale === "ko" ? `${hours}시간 전` : `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return locale === "ko" ? `${days}일 전` : `${days}d ago`;
      const y = created.getFullYear();
      const m = String(created.getMonth() + 1).padStart(2, "0");
      const d = String(created.getDate()).padStart(2, "0");
      return `${y}. ${m}. ${d}`;
    }
  }
  if (position.postedDays <= 0) return locale === "ko" ? "오늘" : "Today";
  return locale === "ko" ? `${position.postedDays}일 전` : `${position.postedDays}d ago`;
}

export function CompanyPositionsSection({ items }: { items: PublicPositionListItem[] }) {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const copy = {
    positions: isKo ? "포지션" : "positions",
    listView: isKo ? "리스트 보기" : "List view",
    gridView: isKo ? "그리드 보기" : "Grid view",
    save: isKo ? "저장" : "Save",
    edit: isKo ? "수정하기" : "Edit",
    apply: isKo ? "지원하기" : "Apply",
    applied: isKo ? "지원완료" : "Applied",
    viewDetailSuffix: isKo ? "상세보기" : "View details",
    thumbnailSuffix: isKo ? "썸네일" : "thumbnail"
  };
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const positions = items.map((item) => mapPublicPositionToCard(item, locale));

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated || !user?.id || user.role !== "STUDENT") {
      setFavoriteIds([]);
      setAppliedIds([]);
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const [favorites, applied] = await Promise.all([getMyFavoritePositions(), getMyAppliedPositions()]);
        if (ignore) return;
        setFavoriteIds(favorites.map((item) => item.id));
        setAppliedIds(applied.map((item) => item.id));
      } catch {
        if (!ignore) {
          setFavoriteIds([]);
          setAppliedIds([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isReady, isAuthenticated, user?.id, user?.role]);

  async function toggleFavorite(positionId: string) {
    if (!isAuthenticated || !user?.id || user.role !== "STUDENT") return;
    const isFavorite = favoriteIds.includes(positionId);
    const optimistic = isFavorite
      ? favoriteIds.filter((id) => id !== positionId)
      : [...favoriteIds, positionId];
    setFavoriteIds(optimistic);
    try {
      if (isFavorite) {
        await removeMyFavoritePosition(positionId);
      } else {
        await addMyFavoritePosition(positionId);
      }
    } catch {
      setFavoriteIds(favoriteIds);
    }
  }

  async function applyFromList(positionId: string) {
    if (!isAuthenticated || !user?.id || user.role !== "STUDENT") return;
    if (appliedIds.includes(positionId)) return;
    setAppliedIds((prev) => [...prev, positionId]);
    try {
      await applyMyPosition(positionId);
    } catch {
      setAppliedIds((prev) => prev.filter((id) => id !== positionId));
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{positions.length}</span>{isKo ? "개 " : " "}{copy.positions}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={viewMode === "list" ? "dark" : "outline"}
            size="icon"
            aria-label={copy.listView}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "grid" ? "dark" : "outline"}
            size="icon"
            aria-label={copy.gridView}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((p) => {
            const isOwnPartnerPosting =
              user?.role === "PARTNER"
              && Boolean(p.partnerDomain)
              && extractDomainFromEmail(user.email) === p.partnerDomain?.toLowerCase();
            return (
              <PositionGridCard
                key={p.id}
                p={p}
                locale={locale}
                copy={copy}
                isOwnPartnerPosting={isOwnPartnerPosting}
                isStudentUser={user?.role === "STUDENT"}
                isApplied={appliedIds.includes(p.id)}
                isFavorite={favoriteIds.includes(p.id)}
                onToggleFavorite={() => {
                  void toggleFavorite(p.id);
                }}
                onApply={() => {
                  void applyFromList(p.id);
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((p) => {
            const isOwnPartnerPosting =
              user?.role === "PARTNER"
              && Boolean(p.partnerDomain)
              && extractDomainFromEmail(user.email) === p.partnerDomain?.toLowerCase();
            return (
              <PositionRow
                key={p.id}
                p={p}
                locale={locale}
                copy={copy}
                isOwnPartnerPosting={isOwnPartnerPosting}
                isStudentUser={user?.role === "STUDENT"}
                isApplied={appliedIds.includes(p.id)}
                isFavorite={favoriteIds.includes(p.id)}
                onToggleFavorite={() => {
                  void toggleFavorite(p.id);
                }}
                onApply={() => {
                  void applyFromList(p.id);
                }}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

const PositionRow = ({
  p,
  locale,
  copy,
  isOwnPartnerPosting,
  isStudentUser,
  isApplied,
  isFavorite,
  onToggleFavorite,
  onApply
}: {
  p: Position;
  locale: "ko" | "en";
  copy: Record<string, string>;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
}) => {
  const href = companyHref(p.partnerDomain);
  return (
    <article className="group relative rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-elevated">
      <Link
        href={`/positions/${p.id}`}
        aria-label={`${p.role} ${copy.viewDetailSuffix}`}
        className="absolute inset-0 z-10 rounded-xl"
      />
      <p className="absolute right-4 top-3 text-[11px] text-muted-foreground">{formatPostedDate(p, locale)}</p>
      <div className="flex flex-col gap-2 md:grid md:grid-cols-[180px_1fr_auto] md:items-stretch md:gap-3">
        <div className="aspect-[16/9] w-full shrink-0 self-start overflow-hidden rounded-xl md:w-[180px] md:self-auto">
          {p.thumbnailUrl ? (
            <img
              src={p.thumbnailUrl}
              alt={`${p.company} ${copy.thumbnailSuffix}`}
              className="block h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-muted font-display text-2xl font-bold leading-none text-muted-foreground">
              {p.initial}
            </div>
          )}
        </div>

        <div className="flex-1 md:flex md:flex-col md:justify-center">
          <div className="mb-0.5 min-w-0 text-xs text-muted-foreground">
            {href ? (
              <Link href={href} className="relative z-20 block max-w-[45%] truncate font-semibold hover:text-foreground">
                {p.company}
              </Link>
            ) : (
              <p className="max-w-[45%] truncate font-semibold">{p.company}</p>
            )}
            <p className="mt-1 truncate leading-tight">{p.category}</p>
          </div>
          <h3 className="line-clamp-1 font-display text-lg font-bold leading-snug">{p.role}</h3>

          <div className="mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 max-w-[50%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{p.location}</span>
            <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(p.type, locale)}</span>
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 flex-row items-center justify-between gap-2 border-t border-border pt-1.5 md:mt-auto md:self-end md:border-0 md:pt-0">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" aria-label={copy.save} onClick={onToggleFavorite}>
              <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
            </Button>
            {isOwnPartnerPosting ? (
              <Button variant="dark" size="sm" asChild>
                <Link href={`/positions/${p.id}/edit`}>{copy.edit}</Link>
              </Button>
            ) : isStudentUser ? (
              <Button
                variant="dark"
                size="sm"
                onClick={onApply}
                disabled={isApplied}
                className={isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : undefined}
              >
                {isApplied ? copy.applied : copy.apply}
              </Button>
            ) : (
              <Button variant="dark" size="sm" asChild>
                <Link href={`/positions/${p.id}`}>{copy.apply}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

const PositionGridCard = ({
  p,
  locale,
  copy,
  isOwnPartnerPosting,
  isStudentUser,
  isApplied,
  isFavorite,
  onToggleFavorite,
  onApply
}: {
  p: Position;
  locale: "ko" | "en";
  copy: Record<string, string>;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
}) => {
  const href = companyHref(p.partnerDomain);
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-elevated">
      <Link
        href={`/positions/${p.id}`}
        aria-label={`${p.role} ${copy.viewDetailSuffix}`}
        className="absolute inset-0 z-10 rounded-xl"
      />
      {p.thumbnailUrl ? (
        <img src={p.thumbnailUrl} alt={`${p.company} ${copy.thumbnailSuffix}`} className="block aspect-[16/9] w-full rounded-xl object-cover" />
      ) : (
        <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
          {p.initial}
        </div>
      )}
      <div className="mt-4 text-xs text-muted-foreground">
        <div className="min-w-0 md:flex md:flex-col md:justify-center">
          {href ? (
            <Link href={href} className="relative z-20 block truncate font-semibold hover:text-foreground">
              {p.company}
            </Link>
          ) : (
            <p className="truncate font-semibold">{p.company}</p>
          )}
          <p className="mt-1 truncate">{p.category}</p>
        </div>
      </div>
      <h3 className="mt-1 truncate font-display text-base font-bold leading-tight">{p.role}</h3>
      <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{p.location}</span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(p.type, locale)}</span>
      </div>
      <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
        <Button variant="outline" size="icon" aria-label={copy.save} onClick={onToggleFavorite}>
          <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
        </Button>
        {isOwnPartnerPosting ? (
          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${p.id}/edit`}>{copy.edit}</Link>
          </Button>
        ) : isStudentUser ? (
          <Button
            variant="dark"
            className={`h-10 flex-1 text-sm ${isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:opacity-100" : ""}`}
            onClick={onApply}
            disabled={isApplied}
          >
            {isApplied ? copy.applied : copy.apply}
          </Button>
        ) : (
          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${p.id}`}>{copy.apply}</Link>
          </Button>
        )}
      </div>
    </article>
  );
};
