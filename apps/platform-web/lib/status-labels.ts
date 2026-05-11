// Centralized state → viewer label mapping (single source of truth)
// 화면 톤: partner=주황, student=초록, operator=파랑, terminal(합격/불합격)=초록/빨강 통일

export type Viewer = "partner" | "student" | "operator";

export type LabelStyle = {
  label: string;
  // Tailwind classes for badge background/text
  className: string;
};

// Position status — internal Prisma enum maps to ACTIVE/CLOSED conceptually
// Prisma: DRAFT | PENDING_REVIEW | OPEN | PAUSED | CLOSED | REJECTED
export type PositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";

export type ApplicationStatus = "SUBMITTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

const VIEWER_TONE = {
  partner: "bg-orange-50 text-orange-700 border border-orange-200",
  student: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  operator: "bg-blue-50 text-blue-700 border border-blue-200"
} as const;

const TERMINAL_TONE = {
  accepted: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border border-rose-200"
} as const;

function isActivePositionStatus(status: PositionStatus | string) {
  return status === "OPEN" || status === "DRAFT" || status === "PENDING_REVIEW";
}

function isClosedPositionStatus(status: PositionStatus | string) {
  return status === "CLOSED" || status === "PAUSED" || status === "REJECTED";
}

export function getPositionStatusLabel(status: PositionStatus | string, viewer: Viewer): LabelStyle {
  if (isActivePositionStatus(status)) {
    if (viewer === "partner") return { label: "모집 중", className: VIEWER_TONE.partner };
    if (viewer === "student") return { label: "지원 가능", className: VIEWER_TONE.student };
    return { label: "모집 중", className: VIEWER_TONE.operator };
  }
  if (isClosedPositionStatus(status)) {
    if (viewer === "student") return { label: "마감", className: "bg-gray-100 text-gray-600 border border-gray-200" };
    return { label: "모집 마감", className: "bg-gray-100 text-gray-600 border border-gray-200" };
  }
  return { label: status, className: "bg-gray-100 text-gray-600 border border-gray-200" };
}

export function getApplicationStatusLabel(status: ApplicationStatus | string, viewer: Viewer): LabelStyle {
  switch (status) {
    case "SUBMITTED":
      if (viewer === "student") return { label: "지원 완료", className: VIEWER_TONE.student };
      if (viewer === "partner") return { label: "검토 중", className: VIEWER_TONE.partner };
      return { label: "검토 중", className: VIEWER_TONE.operator };
    case "INTERVIEW":
      if (viewer === "partner") return { label: "면접 예정", className: VIEWER_TONE.partner };
      if (viewer === "student") return { label: "면접 예정", className: VIEWER_TONE.student };
      return { label: "면접 예정", className: VIEWER_TONE.operator };
    case "ACCEPTED":
      return { label: "합격", className: TERMINAL_TONE.accepted };
    case "REJECTED":
      return { label: "불합격", className: TERMINAL_TONE.rejected };
    case "WITHDRAWN":
      return { label: "철회", className: "bg-gray-100 text-gray-600 border border-gray-200" };
    default:
      return { label: String(status), className: "bg-gray-100 text-gray-600 border border-gray-200" };
  }
}
