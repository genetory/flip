// APLY PARTNERS 기업 제휴(/premium-partners) — 선택지 코드는 API(partnerApplySchema)와 같은 값이다.
// 화면 문구는 언어마다 달라도 저장은 늘 이 코드로.
import type { L } from "./premium";

type Opt = { code: string; label: L };

export const PARTNER_MODEL_OPTIONS: Opt[] = [
  { code: "REFERRAL", label: ["인재 추천형", "Talent referral"] },
  { code: "INTERNSHIP", label: ["인턴십 채용형", "Internship hiring"] },
  { code: "PROJECT", label: ["프로젝트 협력형", "Project collaboration"] }
];
export const PARTNER_SIZE_OPTIONS: Opt[] = [
  { code: "S1_9", label: ["1–9명", "1–9"] },
  { code: "S10_49", label: ["10–49명", "10–49"] },
  { code: "S50_299", label: ["50–299명", "50–299"] },
  { code: "S300_PLUS", label: ["300명 이상", "300+"] }
];
export const PARTNER_HIRING_OPTIONS: Opt[] = [
  { code: "NOW", label: ["지금 계획 있음", "Planned now"] },
  { code: "WITHIN_6M", label: ["6개월 안", "Within 6 months"] },
  { code: "CONSIDERING", label: ["검토 중", "Considering"] },
  { code: "NO_PLAN", label: ["아직 없음", "Not yet"] }
];
export const PARTNER_HEADCOUNT_OPTIONS: Opt[] = [
  { code: "H1", label: ["1명", "1"] },
  { code: "H2_3", label: ["2–3명", "2–3"] },
  { code: "H4_5", label: ["4–5명", "4–5"] },
  { code: "H6_PLUS", label: ["6명 이상", "6+"] },
  { code: "UNDECIDED", label: ["미정", "Not sure"] }
];
export const PARTNER_DURATION_OPTIONS: Opt[] = [
  { code: "W4", label: ["4주", "4 weeks"] },
  { code: "W8", label: ["8주", "8 weeks"] },
  { code: "W12", label: ["12주", "12 weeks"] },
  { code: "M3_PLUS", label: ["3개월 이상", "3+ months"] },
  { code: "NEGOTIABLE", label: ["협의", "Flexible"] }
];
export const PARTNER_FOREIGN_OPTIONS: Opt[] = [
  { code: "YES", label: ["가능", "Yes"] },
  { code: "VISA_DEPENDENT", label: ["체류자격에 따라", "Depends on visa"] },
  { code: "NO", label: ["어려움", "Not possible"] },
  { code: "UNSURE", label: ["잘 모르겠어요", "Not sure"] }
];
export const PARTNER_CONVERSION_OPTIONS: Opt[] = [
  { code: "YES", label: ["있음", "Yes"] },
  { code: "POSSIBLE", label: ["성과에 따라", "Based on performance"] },
  { code: "NO", label: ["없음", "No"] },
  { code: "UNDECIDED", label: ["미정", "Undecided"] }
];
