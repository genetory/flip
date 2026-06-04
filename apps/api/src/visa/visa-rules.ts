// 비자 가능성 체크 — rule-based eligibility hint.
//
// This is NOT legal advice. The result page surfaces a prominent disclaimer
// and points users to KIS/HiKorea for the official check. We use this only
// to nudge "this kind of visa is worth looking into" and to drive signup.
//
// Rules are intentionally conservative — we'd rather say "MAYBE" and let
// the user confirm with the lawyer/HiKorea than say "YES" and mislead.

export type EducationLevel = "HIGH_SCHOOL" | "BACHELOR" | "MASTER" | "PHD";
export type KoreanLevel    = "NONE" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";
export type MajorCategory  = "IT" | "ENGINEERING" | "BUSINESS" | "DESIGN" | "HUMANITIES" | "SCIENCE" | "OTHER";

export type VisaFit = "high" | "medium" | "low";

export type EligibleVisa = {
  code: string;          // e.g. "D-10"
  name: string;          // e.g. "구직 비자"
  fit: VisaFit;          // confidence
  conditions: string[];  // bullet list shown on the result page
  notes?: string;        // disclaimers / next steps
};

export type VisaInput = {
  nationality: string;        // ISO code or free string ("VN", "CN", "KR" …)
  currentVisa: string | null; // "D-2", "F-4", etc., or null
  educationLevel: EducationLevel;
  majorCategory: MajorCategory | null;
  koreanLevel: KoreanLevel;
  workYears: number;
  targetRole: string | null;
};

// Nationalities that are eligible for E-9 (EPS) employment permit. Maintained
// as a small whitelist — the actual list is set by treaty and updated by MOEL.
// Source: https://www.eps.go.kr (2026-06 snapshot).
const E9_ELIGIBLE_NATIONALITIES = new Set([
  "VN", "TH", "PH", "ID", "MM", "MN", "KH", "LK", "PK", "NP", "UZ", "BD", "TL", "KG", "LA", "TJ"
]);

// Generic helper — translate input to a confidence per visa code.
export function evaluateVisaEligibility(input: VisaInput): EligibleVisa[] {
  const results: EligibleVisa[] = [];
  const koreanScore = koreanLevelScore(input.koreanLevel);
  const isHighEducation = input.educationLevel === "MASTER" || input.educationLevel === "PHD";

  // ----- D-10 구직 비자 -----
  // Bachelor's+ + Korea-related study or Korean ability → 구직 활동 가능.
  if (input.educationLevel !== "HIGH_SCHOOL") {
    const fit: VisaFit =
      koreanScore >= 3 ? "high" :
      koreanScore >= 2 ? "medium" : "low";
    results.push({
      code: "D-10",
      name: "구직 비자",
      fit,
      conditions: [
        "학사 이상 학위 보유",
        koreanScore >= 3
          ? "TOPIK 3급 이상 또는 한국 대학 졸업 → 가산 점수"
          : "한국어 능력 가산점이 적용되지 않음",
        "구직 활동 계획서 + 졸업증명서 제출 필요"
      ],
      notes: "최대 6개월 + 6개월 연장. 이 기간 안에 취업해 E-7 등으로 전환해야 합니다."
    });
  }

  // ----- E-7 특정활동 -----
  // 학사+해당 직무 또는 석사 이상이면 가능성 큼. 한국어와 직무 매칭이 중요.
  const e7Eligible = isHighEducation
    || (input.educationLevel === "BACHELOR" && input.workYears >= 1)
    || (input.educationLevel === "BACHELOR" && (input.majorCategory === "IT" || input.majorCategory === "ENGINEERING"));
  if (e7Eligible) {
    const fit: VisaFit =
      isHighEducation && koreanScore >= 2 ? "high" :
      isHighEducation || (input.workYears >= 1 && koreanScore >= 2) ? "medium" : "low";
    results.push({
      code: "E-7",
      name: "특정활동 (전문 직군)",
      fit,
      conditions: [
        "학사 + 동일 직무 경력 1년 이상, 또는 석사 이상",
        "지정된 85개 직군(전문가/관리자) 중 하나",
        "사용자(회사)의 추천서 + 직무 적합성 입증 필요"
      ],
      notes: "외국인 채용 경험이 있는 회사를 통하는 게 발급이 빠릅니다. Aply 파트너 회사 중 E-7 스폰서 가능 회사를 우선 추천해드려요."
    });
  }

  // ----- E-9 비전문취업 -----
  if (E9_ELIGIBLE_NATIONALITIES.has(input.nationality.toUpperCase())) {
    const fit: VisaFit =
      input.educationLevel === "HIGH_SCHOOL" || input.educationLevel === "BACHELOR" ? "medium" : "low";
    results.push({
      code: "E-9",
      name: "비전문취업 (EPS)",
      fit,
      conditions: [
        "송출국가의 EPS 시스템을 통해 한국어 시험(EPS-TOPIK) 합격",
        "제조업·농축산·어업·건설업·서비스업 등 지정 업종",
        "최초 3년 + 1년 10개월 연장 가능"
      ],
      notes: "전문직 경력자에겐 보통 권장하지 않습니다. EPS는 본국 정부 채널을 통해 신청해야 합니다."
    });
  }

  // ----- F-4 재외동포 -----
  // We don't ask about Korean heritage explicitly — just surface as info.
  results.push({
    code: "F-4",
    name: "재외동포 (Korean Heritage)",
    fit: "low",
    conditions: [
      "본인 또는 직계 부모/조부모가 대한민국 국적을 보유한 적이 있어야 함",
      "취업 활동 제한이 거의 없음 (단순 노무 제외)"
    ],
    notes: "한국계라면 이 비자가 가장 유리합니다. 출입국·외국인청에 직접 확인해보세요."
  });

  // ----- F-2-7 (점수제 거주) -----
  // 점수제는 학력/소득/한국어/연령 등을 종합. 석사 + 한국어 중급 이상이면 가능성 있음.
  if (isHighEducation && koreanScore >= 2) {
    results.push({
      code: "F-2-7",
      name: "거주 비자 (점수제)",
      fit: "medium",
      conditions: [
        "학력·연봉·한국어·연령·국내 거주 기간 등 점수 합산 80점 이상",
        "5년 이상 합법 체류 시 F-5(영주) 신청 가능"
      ],
      notes: "현재 비자(D-10/E-7 등)로 일정 기간 체류한 후에 신청할 수 있는 \"다음 단계\" 비자입니다."
    });
  }

  // Sort: high → medium → low.
  const fitOrder: Record<VisaFit, number> = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => fitOrder[a.fit] - fitOrder[b.fit]);
  return results;
}

function koreanLevelScore(level: KoreanLevel): number {
  switch (level) {
    case "NATIVE": return 4;
    case "ADVANCED": return 3;
    case "INTERMEDIATE": return 2;
    case "BEGINNER": return 1;
    case "NONE": return 0;
  }
}

export const EDUCATION_LEVELS: EducationLevel[] = ["HIGH_SCHOOL", "BACHELOR", "MASTER", "PHD"];
export const KOREAN_LEVELS: KoreanLevel[] = ["NONE", "BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"];
export const MAJOR_CATEGORIES: MajorCategory[] = ["IT", "ENGINEERING", "BUSINESS", "DESIGN", "HUMANITIES", "SCIENCE", "OTHER"];
