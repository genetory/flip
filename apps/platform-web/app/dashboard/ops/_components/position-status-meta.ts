export type PositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";

type StatusMeta = {
  labelKo: string;
  tone: "status-draft" | "status-pending" | "status-approved" | "status-paused" | "status-closed" | "status-rejected";
  optionClass:
    | "ops-position-status-draft"
    | "ops-position-status-pending"
    | "ops-position-status-open"
    | "ops-position-status-paused"
    | "ops-position-status-closed"
    | "ops-position-status-rejected";
};

const STATUS_META: Record<PositionStatus, StatusMeta> = {
  DRAFT: { labelKo: "임시저장", tone: "status-draft", optionClass: "ops-position-status-draft" },
  PENDING_REVIEW: { labelKo: "승인대기", tone: "status-pending", optionClass: "ops-position-status-pending" },
  OPEN: { labelKo: "모집중", tone: "status-approved", optionClass: "ops-position-status-open" },
  PAUSED: { labelKo: "일시중지", tone: "status-paused", optionClass: "ops-position-status-paused" },
  CLOSED: { labelKo: "마감", tone: "status-closed", optionClass: "ops-position-status-closed" },
  REJECTED: { labelKo: "반려", tone: "status-rejected", optionClass: "ops-position-status-rejected" }
};

export function getOpsPositionStatusMeta(status: PositionStatus) {
  return STATUS_META[status];
}
