"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addMyFavoritePosition,
  applyMyPosition,
  getMyAppliedPositions,
  getMyFavoritePositions,
  getMyPartnerOrganization,
  removeMyFavoritePosition,
  type PublicPositionListItem
} from "../../lib/member-profile-client";
import { getPublicPositionStatusBadge } from "../../lib/position-status-meta";
import { type Position } from "../../lib/positions-data";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { Button } from "../ui/button";
import { Bookmark, Briefcase, LayoutGrid, List, MapPin } from "lucide-react";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
type PositionCard = Position & { status: PublicPositionListItem["status"] };

function inferWorkType(value?: string | null): "On-site" | "Hybrid" | "Remote" {
  const text = (value ?? "").toLowerCase();
  if (text.includes("remote") || text.includes("재택")) return "Remote";
  if (text.includes("hybrid") || text.includes("하이브리드")) return "Hybrid";
  return "On-site";
}

function workTypeLabel(value: string, locale: PlatformLocale) {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  const pick = (ko: string, en: string, zh: string, vi: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : en;
  if (normalized === "remote") return pick("원격근무", "Remote", "远程办公", "Làm việc từ xa");
  if (normalized === "hybrid") return pick("혼합근무", "Hybrid", "混合办公", "Làm việc kết hợp");
  if (normalized === "onsite") return pick("대면근무", "On-site", "现场办公", "Làm việc tại văn phòng");
  return value;
}

function companyHref(partnerOrganizationId?: string | null) {
  if (!partnerOrganizationId?.trim()) return null;
  return `/companies/${encodeURIComponent(partnerOrganizationId.trim())}`;
}

function mapPublicPositionToCard(item: PublicPositionListItem, locale: PlatformLocale): PositionCard {
  const now = Date.now();
  const createdAt = new Date(item.createdAt);
  const postedDays = Number.isNaN(createdAt.getTime())
    ? 0
    : Math.max(0, Math.floor((now - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
  const pick = (ko: string, en: string, zh: string, vi: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : en;
  const company = item.partnerOrganization?.name?.trim() || pick("파트너 기업", "Partner company", "合作企业", "Doanh nghiệp đối tác");
  const role = item.title;
  const category = item.preferredJobRole?.trim() || pick("직무 미정", "Role TBD", "岗位待定", "Vị trí chưa xác định");
  const workType = item.workType ?? inferWorkType(item.workingHours);
  const startDate = item.startDate ? new Date(item.startDate) : null;
  const startLabel =
    startDate && !Number.isNaN(startDate.getTime())
      ? `${startDate.getFullYear()}.${String(startDate.getMonth() + 1).padStart(2, "0")}.${String(startDate.getDate()).padStart(2, "0")}`
      : pick("즉시", "Immediate", "立即", "Ngay");
  const statusMatchBase = item.status === "OPEN" ? 86 : 78;
  const match = Math.min(99, Math.max(60, statusMatchBase + Math.min(8, item.matchingParticipantsCount)));
  const tags = [
    ...(item.preferredJobRole ? [item.preferredJobRole] : []),
    ...item.communicationLanguages.slice(0, 2),
    ...(item.workingHours ? [item.workingHours] : [])
  ].filter((value, index, array) => array.indexOf(value) === index).slice(0, 3);

  return {
    id: item.id,
    createdAt: item.createdAt,
    partnerDomain: item.partnerOrganization?.id ?? undefined,
    thumbnailUrl: item.thumbnailImages[0] ?? undefined,
    company,
    initial: company[0]?.toUpperCase() ?? "P",
    role,
    category,
    industry: item.partnerOrganization?.industry ?? "OTHER",
    companySize: item.partnerOrganization?.companySize ?? pick("미정", "TBD", "未定", "Chưa xác định"),
    eligibleVisas: item.eligibleVisas,
    location: item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || pick("협의", "To be discussed", "可协商", "Thỏa thuận"),
    type: workType,
    start: startLabel,
    postedDays,
    applicants: item.matchingParticipantsCount,
    match,
    tags,
    highlight: postedDays <= 3 ? "New" : item.status === "OPEN" ? "Hot" : undefined,
    status: item.status
  };
}

function getPositionStatusBadge(status: PublicPositionListItem["status"], locale: PlatformLocale) {
  return getPublicPositionStatusBadge(status, locale);
}

function formatPostedDate(position: Position, locale: PlatformLocale) {
  const pick = (ko: string, en: string, zh: string, vi: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : en;
  if (position.createdAt) {
    const created = new Date(position.createdAt);
    if (!Number.isNaN(created.getTime())) {
      const now = Date.now();
      const diffMs = Math.max(0, now - created.getTime());
      const minutes = Math.floor(diffMs / (60 * 1000));
      if (minutes < 60) {
        const n = Math.max(1, minutes);
        return pick(`${n}분 전`, `${n}m ago`, `${n} 分钟前`, `${n} phút trước`);
      }
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return pick(`${hours}시간 전`, `${hours}h ago`, `${hours} 小时前`, `${hours} giờ trước`);
      const days = Math.floor(hours / 24);
      if (days < 7) return pick(`${days}일 전`, `${days}d ago`, `${days} 天前`, `${days} ngày trước`);
      const y = created.getFullYear();
      const m = String(created.getMonth() + 1).padStart(2, "0");
      const d = String(created.getDate()).padStart(2, "0");
      return `${y}. ${m}. ${d}`;
    }
  }
  if (position.postedDays <= 0) return pick("오늘", "Today", "今天", "Hôm nay");
  return pick(`${position.postedDays}일 전`, `${position.postedDays}d ago`, `${position.postedDays} 天前`, `${position.postedDays} ngày trước`);
}

export function CompanyPositionsSection({ items }: { items: PublicPositionListItem[] }) {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const pick = (ko: string, en: string, zh: string, vi: string) =>
    isKo ? ko : isZh ? zh : isVi ? vi : en;
  const copy = {
    positions: pick("포지션", "positions", "职位", "vị trí"),
    listView: pick("리스트 보기", "List view", "列表视图", "Xem dạng danh sách"),
    gridView: pick("그리드 보기", "Grid view", "网格视图", "Xem dạng lưới"),
    save: pick("저장", "Save", "收藏", "Lưu"),
    edit: pick("수정하기", "Edit", "编辑", "Chỉnh sửa"),
    apply: pick("지원하기", "Apply", "申请", "Ứng tuyển"),
    applied: pick("지원완료", "Applied", "已申请", "Đã ứng tuyển"),
    viewDetailSuffix: pick("상세보기", "View details", "查看详情", "Xem chi tiết"),
    thumbnailSuffix: pick("썸네일", "thumbnail", "缩略图", "ảnh thu nhỏ")
  };
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [myPartnerOrganizationId, setMyPartnerOrganizationId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!isReady || !isAuthenticated || user?.role !== "PARTNER") {
      setMyPartnerOrganizationId(null);
      return;
    }
    let ignore = false;
    void (async () => {
      try {
        const org = await getMyPartnerOrganization();
        if (ignore) return;
        setMyPartnerOrganizationId(org?.id ?? null);
      } catch {
        if (!ignore) setMyPartnerOrganizationId(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isReady, isAuthenticated, user?.role]);

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
          <span className="font-semibold text-foreground">{positions.length}</span>{isKo ? "개 " : isZh ? " " : isVi ? " " : " "}{copy.positions}
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
            const isOwnPartnerPosting = !!myPartnerOrganizationId && p.partnerDomain === myPartnerOrganizationId;
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
            const isOwnPartnerPosting = !!myPartnerOrganizationId && p.partnerDomain === myPartnerOrganizationId;
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
  p: PositionCard;
  locale: PlatformLocale;
  copy: Record<string, string>;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
}) => {
  const href = companyHref(p.partnerDomain);
  const statusBadge = getPositionStatusBadge(p.status, locale);
  return (
    <article className="group relative rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-elevated">
      <Link
        href={`/positions/${p.id}`}
        aria-label={`${p.role} ${copy.viewDetailSuffix}`}
        className="absolute inset-0 z-10 rounded-xl"
      />
      <p className="absolute right-4 top-3 text-[11px] text-muted-foreground">{formatPostedDate(p, locale)}</p>
      <div className="flex flex-col gap-2 md:grid md:grid-cols-[180px_1fr_auto] md:items-stretch md:gap-3">
        <div className="relative aspect-[16/9] w-full shrink-0 self-start overflow-hidden rounded-xl md:w-[180px] md:self-auto">
          <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
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
  p: PositionCard;
  locale: PlatformLocale;
  copy: Record<string, string>;
  isOwnPartnerPosting: boolean;
  isStudentUser: boolean;
  isApplied: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onApply: () => void;
}) => {
  const href = companyHref(p.partnerDomain);
  const statusBadge = getPositionStatusBadge(p.status, locale);
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-elevated">
      <Link
        href={`/positions/${p.id}`}
        aria-label={`${p.role} ${copy.viewDetailSuffix}`}
        className="absolute inset-0 z-10 rounded-xl"
      />
      <div className="relative">
        <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
        {p.thumbnailUrl ? (
          <img src={p.thumbnailUrl} alt={`${p.company} ${copy.thumbnailSuffix}`} className="block aspect-[16/9] w-full rounded-xl object-cover" />
        ) : (
          <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
            {p.initial}
          </div>
        )}
      </div>
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
