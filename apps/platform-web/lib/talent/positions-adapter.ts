// 실제 포지션(PublicPositionListItem)을 Talent 카드용 뷰로 변환.
// 데이터·기능은 aply.global 포지션 탐색과 동일한 API를 쓰고, 표시만 Talent 톤으로 맞춘다.
import type { PublicPositionListItem } from "../member-profile-client";

export interface PositionView {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentLabel: string;
  isInternOrNew: boolean;
  workTypeLabel: string | null;
  deadlineText: string | null;
  foreignerOk: boolean;
  external: boolean;
  externalUrl: string | null;
  isInternal: boolean; // Aply 자체 채용(내부) — CIP 배지·실제 지원 페이지 대상
  sourceProvider: PublicPositionListItem["sourceProvider"]; // INTERNAL / WANTED / BUDDIES / OTHER
  sourceLabel: string | null; // 외부 출처 표시(원티드 등)
  thumbnail: string | null;
  hasMockInterview: boolean; // 회사가 모의 면접(의도/대표질문)을 등록한 내부 공고
}

const sourceLabels: Record<PublicPositionListItem["sourceProvider"], string | null> = {
  INTERNAL: null,
  WANTED: "원티드",
  BUDDIES: "Buddies",
  OTHER: "외부"
};

const employmentLabels: Record<PublicPositionListItem["employmentType"], string> = {
  FULL_TIME: "정규직",
  INTERN: "인턴",
  PART_TIME: "아르바이트",
  UNPAID_INTERN: "인턴"
};

const workTypeLabels: Record<NonNullable<PublicPositionListItem["workType"]>, string> = {
  "On-site": "사무실",
  Hybrid: "하이브리드",
  Remote: "재택"
};

export function toPositionView(item: PublicPositionListItem): PositionView {
  const company = item.partnerOrganization?.name || item.sourceCompanyName || "비공개 기업";
  const location = item.workLocation || item.partnerOrganization?.officeAddress || "지역 미정";
  const isIntern = item.employmentType === "INTERN" || item.employmentType === "UNPAID_INTERN";

  let deadlineText: string | null = null;
  if (item.sourceDeadlineRolling) deadlineText = "상시 채용";
  else if (item.sourceDeadlineDate) deadlineText = `~${item.sourceDeadlineDate.slice(0, 10)}`;

  // Aply 내부 = sourceProvider INTERNAL. 원티드/버디스/기타는 외부 → 원본 링크로 지원.
  const isInternal = item.sourceProvider === "INTERNAL" && item.sourceKind !== "EXTERNAL";
  const hasMockInterview = isInternal && (!!item.mockInterviewIntent?.trim() || (item.mockInterviewQuestions?.length ?? 0) > 0);

  return {
    id: item.id,
    title: item.title,
    company,
    location,
    employmentLabel: employmentLabels[item.employmentType] ?? "채용",
    isInternOrNew: isIntern,
    workTypeLabel: item.workType ? workTypeLabels[item.workType] : null,
    deadlineText,
    foreignerOk: (item.eligibleVisas?.length ?? 0) > 0,
    external: !isInternal,
    externalUrl: item.sourceUrl,
    isInternal,
    sourceProvider: item.sourceProvider,
    sourceLabel: sourceLabels[item.sourceProvider] ?? null,
    thumbnail: item.thumbnailImages?.[0] ?? null,
    hasMockInterview
  };
}
