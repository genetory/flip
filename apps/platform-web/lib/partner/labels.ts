// 파트너 앱 공용 라벨/스타일.
import type { PartnerApplicantStatus } from "../member-profile-client";

export const PARTNER_APPLICANT_STATUS: Record<PartnerApplicantStatus, { label: string; cls: string }> = {
  APPLIED: { label: "신규 지원", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  REVIEWING: { label: "검토 중", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  INTERVIEW: { label: "면접", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  OFFERED: { label: "합격 제안", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  ACCEPTED: { label: "합격", cls: "bg-[#E7F8EF] text-[#12B76A]" },
  REJECTED: { label: "불합격", cls: "bg-[#FDECEE] text-[#F04452]" },
  WITHDRAWN: { label: "철회", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  COMPLETED: { label: "완료", cls: "bg-[#F2F4F6] text-[#8B95A1]" }
};

type PositionStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "REJECTED";

export const PARTNER_POSITION_STATUS: Record<PositionStatus, { label: string; cls: string }> = {
  DRAFT: { label: "작성 중", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  PENDING_REVIEW: { label: "검토 요청", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  OPEN: { label: "게시 중", cls: "bg-[#E7F8EF] text-[#12B76A]" },
  PAUSED: { label: "일시중지", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  CLOSED: { label: "마감", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  REJECTED: { label: "반려", cls: "bg-[#FDECEE] text-[#F04452]" }
};

export const PARTNER_RECOMMENDATION: Record<"HIGH" | "NORMAL" | "CHECK", { label: string; cls: string }> = {
  HIGH: { label: "적극 추천", cls: "bg-[#E7F8EF] text-[#0A9B59]" },
  NORMAL: { label: "보통", cls: "bg-[#F2F4F6] text-[#8B95A1]" },
  CHECK: { label: "확인 필요", cls: "bg-[#FFF3E6] text-[#E8890C]" }
};
