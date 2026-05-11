export type PositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";

type StatusMeta = {
  labelKo: string;
  badgeTone: "ops-status-draft" | "ops-status-pending" | "ops-status-approved" | "ops-status-paused" | "ops-status-closed" | "ops-status-rejected";
  optionClass:
    | "ops-position-status-draft"
    | "ops-position-status-pending"
    | "ops-position-status-open"
    | "ops-position-status-paused"
    | "ops-position-status-closed"
    | "ops-position-status-rejected";
};

const STATUS_META: Record<PositionStatus, StatusMeta> = {
  DRAFT: { labelKo: "임시저장", badgeTone: "ops-status-draft", optionClass: "ops-position-status-draft" },
  PENDING_REVIEW: { labelKo: "승인대기", badgeTone: "ops-status-pending", optionClass: "ops-position-status-pending" },
  OPEN: { labelKo: "모집중", badgeTone: "ops-status-approved", optionClass: "ops-position-status-open" },
  PAUSED: { labelKo: "일시중지", badgeTone: "ops-status-paused", optionClass: "ops-position-status-paused" },
  CLOSED: { labelKo: "마감", badgeTone: "ops-status-closed", optionClass: "ops-position-status-closed" },
  REJECTED: { labelKo: "반려", badgeTone: "ops-status-rejected", optionClass: "ops-position-status-rejected" }
};

export function getPartnerPositionStatusMeta(status: PositionStatus) {
  return STATUS_META[status];
}
