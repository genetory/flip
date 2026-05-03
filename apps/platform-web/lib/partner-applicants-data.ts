export type PartnerApplicantStatus =
  | "APPLIED"
  | "REVIEWING"
  | "INTERVIEW"
  | "OFFERED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "COMPLETED";

export type PartnerApplicantItem = {
  id: string;
  name: string;
  nationality: string;
  email: string;
  positionId: string;
  positionTitle: string;
  languages: string[];
  school: string;
  major: string;
  residence: string;
  appliedAt: string;
  recommendation: "HIGH" | "NORMAL" | "CHECK";
  status: PartnerApplicantStatus;
  summary: string;
  motivation: string;
  portfolioUrl?: string;
  availableStartDate?: string;
  memo?: string;
};

export const PARTNER_APPLICANTS_MOCK: PartnerApplicantItem[] = [
  {
    id: "app-001",
    name: "Nguyen Minh Anh",
    nationality: "Vietnam",
    email: "minh.anh@example.com",
    positionId: "pos-001",
    positionTitle: "Global Marketing Intern",
    languages: ["Korean (Intermediate)", "English (Advanced)", "Vietnamese (Native)"],
    school: "Kyunghee University",
    major: "Business Administration",
    residence: "Seoul",
    appliedAt: "2026-04-28T03:00:00.000Z",
    recommendation: "HIGH",
    status: "REVIEWING",
    summary: "SNS 콘텐츠 운영 경험 1년, 리서치 보고서 작성 경험 보유",
    motivation: "한국 시장 진출 캠페인 실무를 경험하고 싶습니다.",
    portfolioUrl: "https://portfolio.example.com/minh-anh",
    availableStartDate: "2026-06-10"
  },
  {
    id: "app-002",
    name: "Siti Aisyah",
    nationality: "Indonesia",
    email: "aisyah@example.com",
    positionId: "pos-001",
    positionTitle: "Global Marketing Intern",
    languages: ["English (Advanced)", "Indonesian (Native)", "Korean (Beginner)"],
    school: "Sungkyunkwan University",
    major: "Media Communication",
    residence: "Suwon",
    appliedAt: "2026-04-29T01:10:00.000Z",
    recommendation: "NORMAL",
    status: "APPLIED",
    summary: "브랜드 콘텐츠 기획 프로젝트 3회 참여",
    motivation: "글로벌 대상 콘텐츠 기획 역량을 높이고 싶습니다.",
    availableStartDate: "2026-06-01"
  },
  {
    id: "app-003",
    name: "Chen Wei",
    nationality: "China",
    email: "chenwei@example.com",
    positionId: "pos-002",
    positionTitle: "Operations Research Intern",
    languages: ["Chinese (Native)", "Korean (Advanced)", "English (Intermediate)"],
    school: "Korea University",
    major: "Industrial Engineering",
    residence: "Seoul",
    appliedAt: "2026-04-26T11:00:00.000Z",
    recommendation: "CHECK",
    status: "INTERVIEW",
    summary: "데이터 정리 및 운영 지표 대시보드 구축 경험",
    motivation: "운영 최적화 프로젝트를 통해 문제 해결 경험을 쌓고 싶습니다.",
    availableStartDate: "2026-05-20"
  }
];

export function getApplicantStatusLabel(status: PartnerApplicantStatus) {
  if (status === "APPLIED") return "지원 완료";
  if (status === "REVIEWING") return "검토 중";
  if (status === "INTERVIEW") return "면접 요청";
  if (status === "OFFERED") return "합격 제안";
  if (status === "ACCEPTED") return "수락";
  if (status === "REJECTED") return "불합격";
  if (status === "WITHDRAWN") return "지원 취소";
  return "수료";
}
