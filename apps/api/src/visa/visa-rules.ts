// 비자 가능성 체크 — rule-based eligibility + actionable status + 경로 hint.
//
// Phase 1 (2026-06): 단순 "가능/불가능" 이 아니라 외국인이 다음 행동을 잡기
// 쉽게 — 결과를 5단계 상태(`available_now`/`after_job_offer`/...)로 분류하고,
// 현재 비자에 맞춘 로드맵(D-2 → D-10 → E-7 → F-2-7 같은) + visa-aware FAQ
// 키들을 함께 emit. 프론트는 키만 받아 visa-i18n.ts 에서 로케일로 렌더.
//
// This is NOT legal advice. The result page surfaces a prominent disclaimer
// and points users to KIS/HiKorea for the official check.

export type EducationLevel = "HIGH_SCHOOL" | "BACHELOR" | "MASTER" | "PHD";
export type KoreanLevel    = "NONE" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";
export type MajorCategory  = string;

// 졸업 상태 — 외국인 학생들이 가장 자주 부딪치는 분기. "내가 지금 어떤
// 비자로 갈 수 있는가" 는 졸업까지 남은 시간에 크게 좌우된다.
export type GraduationStatus =
  | "not_applicable"  // 학생 아님 (이미 졸업했고 더 진학 안 함, 또는 학력 무관)
  | "completed"       // 이미 졸업
  | "within_6mo"      // 6개월 이내 졸업 예정
  | "within_1y"       // 1년 이내 졸업 예정
  | "later";          // 그 이후 졸업 예정

const STEM_MAJORS = new Set([
  "IT", "ENGINEERING", "SCIENCE",
  "IT_SOFTWARE", "AI_DATA",
  "MECHANICAL", "ELECTRICAL", "CIVIL", "CHEMICAL",
  "MEDICINE", "AGRICULTURE"
]);
export function isStemMajor(major: string | null | undefined): boolean {
  return Boolean(major && STEM_MAJORS.has(major));
}

export type VisaFit = "high" | "medium" | "low";

// 결과 페이지에서 사용자가 한 눈에 "지금 / 취업 제안 후 / 졸업 후 / 준비
// 필요 / 어려움" 으로 잡고 다음 행동을 결정할 수 있게 하기 위한 상태.
export type VisaStatus =
  | "available_now"        // 지금 조건 충족 — 바로 신청 검토 가능
  | "after_job_offer"      // 한국 회사 채용 제안만 있으면 가능
  | "after_graduation"     // 졸업하면 가능
  | "needs_preparation"    // 한국어 / 서류 / 경력 등 보완 필요
  | "not_likely";          // 현재 조건으로는 어려움

export type EligibleVisa = {
  code: string;          // e.g. "D-10"
  name: string;          // Korean fallback — i18n 사전에 없으면 사용
  fit: VisaFit;          // confidence (기존 호환)
  status: VisaStatus;    // NEW — 사용자가 다음 행동 잡는 데 쓰는 라벨
  conditions: string[];  // Korean fallback
  notes?: string;
  // NEW — 이 비자가 "available_now" 가 아닌 이유. 프론트가 status 그룹 안에서
  // 추가로 보여주는 짧은 체크리스트(예: ["job_offer", "topik_3"]). 백엔드는
  // 키만 emit, 프론트가 locale 별 카피로 변환.
  blockers?: string[];
};

export type VisaRoadmap = {
  // 사용자 비자 흐름. 예: D-2 학생 → ["D-2","D-10","E-7","F-2-7"]
  steps: string[];
  // 우선순위 힌트 key (i18n 으로 변환)
  priorityKey?: string;
};

export type NextStep = {
  qKey: string;  // 질문 i18n 키 (예: "d2.work_part_time")
  aKey: string;  // 답변 i18n 키
};

export type VisaInput = {
  nationality: string;
  currentVisa: string | null;
  educationLevel: EducationLevel;
  majorCategory: MajorCategory | null;
  koreanLevel: KoreanLevel;
  workYears: number;
  targetRole: string | null;
  // NEW (모두 optional — 기존 호출자 호환)
  inKorea?: boolean;
  hasJobOffer?: boolean;
  graduationStatus?: GraduationStatus;
};

export type VisaEvaluation = {
  eligibleVisas: EligibleVisa[];
  roadmap: VisaRoadmap;
  nextSteps: NextStep[];
};

// E-9 (EPS) 대상국 — 송출국가 협정. MOEL 운영 (2026-06 snapshot).
const E9_ELIGIBLE_NATIONALITIES = new Set([
  "VN", "TH", "PH", "ID", "MM", "MN", "KH", "LK", "PK", "NP", "UZ", "BD", "TL", "KG", "LA", "TJ"
]);

// 졸업 예정(미래) 인지 — D-10/E-7 후보 비자의 status 분기에 핵심.
function isFutureGraduation(g?: GraduationStatus): boolean {
  return g === "within_6mo" || g === "within_1y" || g === "later";
}

export function evaluateVisaEligibility(input: VisaInput): EligibleVisa[] {
  const results: EligibleVisa[] = [];
  const koreanScore = koreanLevelScore(input.koreanLevel);
  const isHighEducation = input.educationLevel === "MASTER" || input.educationLevel === "PHD";
  const hasJobOffer = input.hasJobOffer === true;
  const futureGrad = isFutureGraduation(input.graduationStatus);

  // ----- D-10 구직 비자 -----
  if (input.educationLevel !== "HIGH_SCHOOL") {
    const fit: VisaFit =
      koreanScore >= 3 ? "high" :
      koreanScore >= 2 ? "medium" : "low";
    // status: 졸업 예정 → after_graduation. 이미 졸업/해당 없음 → available_now.
    // 학력은 학사 이상 확정 상태라고 가정.
    const status: VisaStatus = futureGrad ? "after_graduation" : "available_now";
    const blockers: string[] = [];
    if (futureGrad) blockers.push("graduation");
    if (koreanScore < 2) blockers.push("topik_3");

    results.push({
      code: "D-10",
      name: "구직 비자",
      fit,
      status,
      blockers: blockers.length ? blockers : undefined,
      conditions: [
        "학사 이상 학위 보유",
        koreanScore >= 3
          ? "TOPIK 3급 이상 또는 한국 대학 졸업 → 가산 점수"
          : "한국어 능력 가산점이 적용되지 않음",
        "구직 활동 계획서 + 졸업증명서 제출 필요"
      ],
      notes: "최대 6개월 + 6개월 연장. 이 기간 안에 취업해 E-7 등으로 전환해야 합니다."
    });
  } else {
    // 고졸 — D-10 은 어려움이지만 사용자에게 알려는 줘야 함.
    results.push({
      code: "D-10",
      name: "구직 비자",
      fit: "low",
      status: "not_likely",
      blockers: ["bachelor_or_higher"],
      conditions: ["학사 이상 학위 보유 필요"],
      notes: "현재 학력으로는 D-10 구직 비자 신청이 어렵습니다."
    });
  }

  // ----- E-7 특정활동 -----
  const e7Eligible =
    isHighEducation
    || (input.educationLevel === "BACHELOR" && input.workYears >= 1)
    || (input.educationLevel === "BACHELOR" && isStemMajor(input.majorCategory));

  let e7Status: VisaStatus;
  const e7Blockers: string[] = [];
  if (!e7Eligible) {
    if (futureGrad) {
      e7Status = "after_graduation";
      e7Blockers.push("graduation");
    } else if (input.educationLevel === "BACHELOR" && !isStemMajor(input.majorCategory) && input.workYears < 1) {
      e7Status = "needs_preparation";
      e7Blockers.push("work_experience");
    } else {
      e7Status = "needs_preparation";
      e7Blockers.push("bachelor_or_higher");
    }
  } else if (futureGrad) {
    e7Status = "after_graduation";
    e7Blockers.push("graduation");
  } else if (!hasJobOffer) {
    e7Status = "after_job_offer";
    e7Blockers.push("job_offer", "role_match");
  } else {
    e7Status = "available_now";
  }

  const e7Fit: VisaFit =
    e7Status === "available_now" ? "high" :
    e7Status === "after_job_offer" || e7Status === "after_graduation" ? "medium" : "low";

  results.push({
    code: "E-7",
    name: "특정활동 (전문 직군)",
    fit: e7Fit,
    status: e7Status,
    blockers: e7Blockers.length ? e7Blockers : undefined,
    conditions: [
      "학사 + 동일 직무 경력 1년 이상, 또는 석사 이상",
      "지정된 85개 직군(전문가/관리자) 중 하나",
      "사용자(회사)의 추천서 + 직무 적합성 입증 필요"
    ],
    notes: "외국인 채용 경험이 있는 회사를 통하는 게 발급이 빠릅니다. Aply 파트너 회사 중 E-7 스폰서 가능 회사를 우선 추천해드려요."
  });

  // ----- E-9 비전문취업 -----
  if (E9_ELIGIBLE_NATIONALITIES.has(input.nationality.toUpperCase())) {
    const status: VisaStatus = "needs_preparation"; // EPS-TOPIK + 송출국 절차 필요
    results.push({
      code: "E-9",
      name: "비전문취업 (EPS)",
      fit: "medium",
      status,
      blockers: ["eps_topik", "home_country_eps"],
      conditions: [
        "송출국가의 EPS 시스템을 통해 한국어 시험(EPS-TOPIK) 합격",
        "제조업·농축산·어업·건설업·서비스업 등 지정 업종",
        "최초 3년 + 1년 10개월 연장 가능"
      ],
      notes: "전문직 경력자에겐 보통 권장하지 않습니다. EPS는 본국 정부 채널을 통해 신청해야 합니다."
    });
  }

  // ----- F-4 재외동포 -----
  results.push({
    code: "F-4",
    name: "재외동포",
    fit: "low",
    status: "needs_preparation",
    blockers: ["korean_heritage_proof"],
    conditions: [
      "본인 또는 직계 부모/조부모가 대한민국 국적을 보유한 적이 있어야 함",
      "취업 활동 제한이 거의 없음 (단순 노무 제외)"
    ],
    notes: "한국계라면 이 비자가 가장 유리합니다. 출입국·외국인청에 직접 확인해 보세요."
  });

  // ----- F-2-7 점수제 거주 -----
  if (isHighEducation && koreanScore >= 2) {
    results.push({
      code: "F-2-7",
      name: "거주 비자 (점수제)",
      fit: "medium",
      status: "needs_preparation", // 일정 기간 합법 체류 후에 신청 가능 — 즉시 불가
      blockers: ["prior_visa_stay", "points_80"],
      conditions: [
        "학력·연봉·한국어·연령·국내 거주 기간 등 점수 합산 80점 이상",
        "5년 이상 합법 체류 시 F-5(영주) 신청 가능"
      ],
      notes: "현재 비자(D-10/E-7 등)로 일정 기간 체류한 후 신청할 수 있는 \"다음 단계\" 비자입니다."
    });
  }

  // 정렬: status(action urgency) → fit. available_now 가 최상단.
  const statusOrder: Record<VisaStatus, number> = {
    available_now: 0,
    after_job_offer: 1,
    after_graduation: 2,
    needs_preparation: 3,
    not_likely: 4
  };
  const fitOrder: Record<VisaFit, number> = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => {
    const s = statusOrder[a.status] - statusOrder[b.status];
    return s !== 0 ? s : fitOrder[a.fit] - fitOrder[b.fit];
  });
  return results;
}

// 현재 비자(또는 한국 밖) 기준 추천 경로. visa code 시퀀스만 emit.
// 프론트는 각 step 을 카드로 그리고 visa-i18n 으로 라벨 / 설명을 붙임.
export function buildRoadmap(input: VisaInput): VisaRoadmap {
  const cur = (input.currentVisa ?? "").toUpperCase();
  const hasJobOffer = input.hasJobOffer === true;
  const futureGrad = isFutureGraduation(input.graduationStatus);

  // 우선순위 힌트 — 결과 페이지 상단에 한 줄 표시.
  let priorityKey: string | undefined;
  if (futureGrad && !hasJobOffer) priorityKey = "get_offer_before_grad";
  else if (hasJobOffer) priorityKey = "switch_to_e7";
  else if (!cur || cur === "NONE") priorityKey = "find_first_offer";
  else priorityKey = "plan_next_visa";

  // 비자별 경로 — 단순 lookup 으로 시작. 더 세분화는 향후 단계에서.
  switch (cur) {
    case "D-2":
    case "D-4":
      return { steps: [cur, "D-10", "E-7", "F-2-7"], priorityKey };
    case "D-10":
      return { steps: ["D-10", "E-7", "F-2-7", "F-5"], priorityKey };
    case "E-7":
      return { steps: ["E-7", "F-2-7", "F-5"], priorityKey };
    case "E-9":
      return { steps: ["E-9", "E-7-4", "F-2-7", "F-5"], priorityKey };
    case "H-1":
      return { steps: ["H-1", "E-7", "F-2-7"], priorityKey };
    case "F-2":
    case "F-4":
    case "F-5":
    case "F-6":
      // 이미 장기 체류 — 별도 전환 없이 자유 취업 가능 / 영주 향함.
      return { steps: [cur, "F-5"], priorityKey: "already_long_term" };
    default:
      // 한국 밖 / 비자 없음
      if (hasJobOffer) return { steps: ["E-7", "F-2-7", "F-5"], priorityKey };
      return { steps: ["D-10", "E-7", "F-2-7"], priorityKey };
  }
}

// 현재 비자별 가장 흔한 next-step 질문 1-3개. i18n 키만 emit.
export function buildNextSteps(input: VisaInput): NextStep[] {
  const cur = (input.currentVisa ?? "").toUpperCase();
  switch (cur) {
    case "D-2":
      return [
        { qKey: "d2.work_part_time.q", aKey: "d2.work_part_time.a" },
        { qKey: "d2.switch_to_d10.q",  aKey: "d2.switch_to_d10.a" },
        { qKey: "d2.e7_after_grad.q",  aKey: "d2.e7_after_grad.a" }
      ];
    case "D-4":
      return [
        { qKey: "d4.switch_to_d10.q", aKey: "d4.switch_to_d10.a" },
        { qKey: "d4.eligible_for_e7.q", aKey: "d4.eligible_for_e7.a" }
      ];
    case "D-10":
      return [
        { qKey: "d10.how_long.q", aKey: "d10.how_long.a" },
        { qKey: "d10.what_jobs_qualify.q", aKey: "d10.what_jobs_qualify.a" },
        { qKey: "d10.internship.q", aKey: "d10.internship.a" }
      ];
    case "E-7":
      return [
        { qKey: "e7.change_jobs.q", aKey: "e7.change_jobs.a" },
        { qKey: "e7.duration.q", aKey: "e7.duration.a" }
      ];
    case "E-9":
      return [
        { qKey: "e9.switch_to_e74.q", aKey: "e9.switch_to_e74.a" }
      ];
    case "F-2":
    case "F-4":
    case "F-5":
    case "F-6":
      return [
        { qKey: "long_term.no_sponsor.q", aKey: "long_term.no_sponsor.a" }
      ];
    case "H-1":
      return [
        { qKey: "h1.switch_to_e7.q", aKey: "h1.switch_to_e7.a" }
      ];
    default:
      return [
        { qKey: "outside.fastest_route.q", aKey: "outside.fastest_route.a" },
        { qKey: "outside.need_korean.q",   aKey: "outside.need_korean.a" }
      ];
  }
}

// 통합 평가 — eligibleVisas + roadmap + nextSteps 한 번에.
export function evaluateVisa(input: VisaInput): VisaEvaluation {
  return {
    eligibleVisas: evaluateVisaEligibility(input),
    roadmap: buildRoadmap(input),
    nextSteps: buildNextSteps(input)
  };
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
