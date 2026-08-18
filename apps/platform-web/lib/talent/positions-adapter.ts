// 실제 포지션(PublicPositionListItem)을 Talent 카드용 뷰로 변환.
// 데이터·기능은 aply.global 포지션 탐색과 동일한 API를 쓰고, 표시만 Talent 톤으로 맞춘다.
import type { PublicPositionListItem } from "../member-profile-client";
import type { PlatformT } from "../i18n";

export interface PositionView {
  id: string;
  title: string;
  company: string;
  isUndisclosedCompany: boolean; // 회사명이 비공개(fallback)라 회사 상세 링크 대상 아님
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

function sourceLabel(provider: PublicPositionListItem["sourceProvider"], t: PlatformT): string | null {
  switch (provider) {
    case "WANTED":
      return t("원티드", "Wanted", "Wanted", "Wanted", "Wanted", "Wanted");
    case "BUDDIES":
      return "Buddies"; // 브랜드명 — 번역하지 않음
    case "OTHER":
      return t("외부", "External", "外部", "Bên ngoài", "外部", "Eksternal");
    default:
      return null; // INTERNAL
  }
}

function employmentLabel(type: PublicPositionListItem["employmentType"], t: PlatformT): string {
  switch (type) {
    case "FULL_TIME":
      return t("정규직", "Full-time", "全职", "Toàn thời gian", "正社員", "Penuh waktu");
    case "PART_TIME":
      return t("아르바이트", "Part-time", "兼职", "Bán thời gian", "アルバイト", "Paruh waktu");
    case "INTERN":
    case "UNPAID_INTERN":
      return t("인턴", "Intern", "实习", "Thực tập", "インターン", "Magang");
    default:
      return t("채용", "Hiring", "招聘", "Tuyển dụng", "採用", "Rekrutmen");
  }
}

function workTypeLabel(workType: NonNullable<PublicPositionListItem["workType"]>, t: PlatformT): string {
  switch (workType) {
    case "On-site":
      return t("사무실", "On-site", "办公室", "Tại văn phòng", "オフィス", "Kantor");
    case "Hybrid":
      return t("하이브리드", "Hybrid", "混合办公", "Kết hợp", "ハイブリッド", "Hibrida");
    case "Remote":
      return t("재택", "Remote", "远程", "Từ xa", "リモート", "Jarak jauh");
    default:
      return workType;
  }
}

export function toPositionView(item: PublicPositionListItem, t: PlatformT): PositionView {
  const realCompany = item.partnerOrganization?.name || item.sourceCompanyName;
  const company = realCompany || t("비공개 기업", "Undisclosed company", "未公开企业", "Công ty ẩn danh", "非公開企業", "Perusahaan dirahasiakan");
  const location = item.workLocation || item.partnerOrganization?.officeAddress || t("지역 미정", "Location TBD", "地点待定", "Chưa xác định địa điểm", "勤務地未定", "Lokasi belum ditentukan");
  const isIntern = item.employmentType === "INTERN" || item.employmentType === "UNPAID_INTERN";

  let deadlineText: string | null = null;
  if (item.sourceDeadlineRolling) deadlineText = t("상시 채용", "Always hiring", "常年招聘", "Tuyển liên tục", "常時採用", "Rekrutmen berkelanjutan");
  else if (item.sourceDeadlineDate) deadlineText = `~${item.sourceDeadlineDate.slice(0, 10)}`;

  // Aply 내부 = sourceProvider INTERNAL. 원티드/버디스/기타는 외부 → 원본 링크로 지원.
  const isInternal = item.sourceProvider === "INTERNAL" && item.sourceKind !== "EXTERNAL";
  // 모의 면접 가능 = 회사가 등록(내부 CIP) 했거나, 공고 JD(주요업무·자격요건)가 있으면(원티드 등 외부 포함).
  const hasMockInterview =
    (isInternal && (!!item.mockInterviewIntent?.trim() || (item.mockInterviewQuestions?.length ?? 0) > 0)) ||
    !!item.mainResponsibilities?.trim() ||
    !!item.requiredQualifications?.trim();

  return {
    id: item.id,
    title: item.title,
    company,
    isUndisclosedCompany: !realCompany,
    location,
    employmentLabel: employmentLabel(item.employmentType, t),
    isInternOrNew: isIntern,
    workTypeLabel: item.workType ? workTypeLabel(item.workType, t) : null,
    deadlineText,
    // 외국인 지원 가능 = 서버 '외국인도 지원 가능' 필터와 동일 기준:
    // 내부(APLY CIP)는 전부 대상, 외부(원티드 등)는 FOREIGNER_FRIENDLY 태그가 있는 공고.
    foreignerOk: isInternal || (item.eligibleVisas ?? []).includes("FOREIGNER_FRIENDLY"),
    external: !isInternal,
    externalUrl: item.sourceUrl,
    isInternal,
    sourceProvider: item.sourceProvider,
    sourceLabel: sourceLabel(item.sourceProvider, t),
    thumbnail: item.thumbnailImages?.[0] ?? null,
    hasMockInterview
  };
}
