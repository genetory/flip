export type PositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";
export type PositionLocale = "ko" | "en";

type StatusMeta = {
  labelKo: string;
  labelEn: string;
  badgeClassName: string;
};

const STATUS_META: Record<PositionStatus, StatusMeta> = {
  DRAFT: { labelKo: "임시저장", labelEn: "Draft", badgeClassName: "bg-slate-50 text-slate-700 border-slate-300" },
  PENDING_REVIEW: { labelKo: "승인대기", labelEn: "Pending review", badgeClassName: "bg-amber-50 text-amber-800 border-amber-300" },
  OPEN: { labelKo: "모집중", labelEn: "Open", badgeClassName: "bg-blue-50 text-blue-700 border-blue-300" },
  PAUSED: { labelKo: "일시중지", labelEn: "Paused", badgeClassName: "bg-cyan-50 text-cyan-800 border-cyan-300" },
  CLOSED: { labelKo: "마감", labelEn: "Closed", badgeClassName: "bg-gray-100 text-gray-700 border-gray-300" },
  REJECTED: { labelKo: "반려", labelEn: "Rejected", badgeClassName: "bg-red-50 text-red-800 border-red-300" }
};

export function getPublicPositionStatusBadge(status: PositionStatus, locale: PositionLocale) {
  const meta = STATUS_META[status];
  return { label: locale === "ko" ? meta.labelKo : meta.labelEn, className: meta.badgeClassName };
}
