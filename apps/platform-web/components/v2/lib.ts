// v2 화면들이 같이 쓰는 작은 계산.
import type { PublicPositionListItem } from "../../lib/member-profile-client";

/** 오늘(로컬)부터 그 날까지 남은 날. 지났으면 null. */
export function daysUntil(iso: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(iso);
  day.setHours(0, 0, 0, 0);
  const d = Math.round((day.getTime() - today.getTime()) / 86400000);
  return d >= 0 ? d : null;
}

export const companyOf = (p: PublicPositionListItem): string => p.partnerOrganization?.name?.trim() || p.sourceCompanyName?.trim() || "";

/** 공고 대표 사진 — 썸네일 → 회사 사무실 사진 → 로고. */
export const jobPhotoOf = (p: PublicPositionListItem): string | null =>
  p.thumbnailImages?.[0] || p.partnerOrganization?.officePhotoImageData || p.partnerOrganization?.companyLogoImageData || null;

/** 근무지 앞 두 마디(시·구)만. */
export const shortPlace = (s?: string | null): string => (s || "").split(" ").slice(0, 2).join(" ");
