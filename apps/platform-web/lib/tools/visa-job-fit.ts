// 무료 비자·직무 진단 — 규칙 기반. LLM 을 호출하지 않는다.
//
// 왜 규칙인가: 입력(체류자격·전공·경력·관심 직무·한국어·지역)으로 계산할 수 있는 내용이라
// LLM 을 쓸 이유가 없다. 비용도 들고, 같은 입력에 다른 답이 나오면 신뢰가 깨진다.
//
// 지키는 선: ① 취업·비자 가능 여부를 확정하지 않는다 ② 공식 확인이 필요한 항목을 분명히
// 표시한다 ③ 사용자가 입력하지 않은 경력·조건을 추정하지 않는다.

export type GraduationStatus = "enrolled" | "graduating" | "graduated" | "none";
export type ExperienceLevel = "none" | "intern" | "under3" | "over3" | "unknown";
export type KoreanLevel = "none" | "basic" | "business" | "fluent" | "unknown";

export type VisaJobFitInput = {
  /** 체류자격 코드(예: D-2, E-7). "unknown" = 모르겠음/없음. */
  visa: string;
  /** 전공 계열(고정 키). 자유 입력을 받지 않는다 — 분석 이벤트·저장에 원문이 섞이지 않게. */
  majorField: MajorField | "unknown";
  graduation: GraduationStatus;
  experience: ExperienceLevel;
  /** 관심 직무(고정 키) 최대 3개. */
  interests: JobCategory[];
  korean: KoreanLevel;
  /** 희망 지역(시·도) 또는 "any". */
  region: string;
};

export type MajorField = "it" | "engineering" | "business" | "design" | "humanities" | "science" | "service" | "other";
export type JobCategory = "dev" | "data" | "design" | "marketing" | "sales" | "planning" | "manufacturing" | "service" | "translation";

export const MAJOR_FIELDS: MajorField[] = ["it", "engineering", "business", "design", "humanities", "science", "service", "other"];
export const JOB_CATEGORIES: JobCategory[] = ["dev", "data", "design", "marketing", "sales", "planning", "manufacturing", "service", "translation"];

/**
 * 체류자격별 취업 관련 성격. 여기 적은 내용은 일반 안내이며 심사 기준이 아니다.
 * workAllowed:
 *   "yes"      — 취업 활동이 원칙적으로 가능한 자격
 *   "limited"  — 조건부(시간제 허가·자격 변경 등 확인 필요)
 *   "check"    — 이 도구가 단정할 수 없음 → 공식 확인 안내
 */
type VisaRule = { workAllowed: "yes" | "limited" | "check"; note: { ko: string; en: string } };

const VISA_RULES: Record<string, VisaRule> = {
  "E-7": { workAllowed: "yes", note: { ko: "지정된 직무·고용주 기준이 있어 공고의 직무가 자격과 맞는지 확인이 필요해요.", en: "Tied to specific roles and employers — check that the posting matches your permit." } },
  "E-9": { workAllowed: "limited", note: { ko: "허용 업종과 사업장 변경 규정이 있어, 지원 전 기업과 확인이 필요해요.", en: "Limited to certain industries with workplace-change rules — confirm with the employer." } },
  "D-2": { workAllowed: "limited", note: { ko: "유학 자격이에요. 시간제 취업은 사전 허가가 필요하고, 졸업 후에는 자격 변경이 필요해요.", en: "A study visa. Part-time work needs prior permission; after graduation you'll need to change status." } },
  "D-4": { workAllowed: "limited", note: { ko: "연수 자격이에요. 시간제 취업은 사전 허가가 필요해요.", en: "A training visa. Part-time work needs prior permission." } },
  "D-10": { workAllowed: "limited", note: { ko: "구직 자격이에요. 취업이 확정되면 근무 가능한 자격으로 변경해야 해요.", en: "A job-seeking visa. Once hired, you must change to a work-eligible status." } },
  "F-2": { workAllowed: "yes", note: { ko: "거주 자격이에요. 세부 유형에 따라 범위가 달라 확인이 필요해요.", en: "A residency status; scope varies by subtype." } },
  "F-4": { workAllowed: "yes", note: { ko: "재외동포 자격이에요. 일부 단순노무 직종은 제한이 있어요.", en: "Overseas Korean status; some manual-labor roles are restricted." } },
  "F-5": { workAllowed: "yes", note: { ko: "영주 자격이에요. 취업 제한이 거의 없어요.", en: "Permanent residency; almost no employment restrictions." } },
  "F-6": { workAllowed: "yes", note: { ko: "결혼이민 자격이에요. 취업 제한이 거의 없어요.", en: "Marriage migrant status; almost no employment restrictions." } },
  "H-1": { workAllowed: "limited", note: { ko: "관광취업(워킹홀리데이) 자격이에요. 허용 직종과 기간 제한이 있어요.", en: "Working holiday status with restrictions on roles and duration." } }
};

/** 전공 계열 → 잘 맞는 직무. 없는 조합은 점수를 주지 않는다(추정하지 않는다). */
const MAJOR_TO_JOBS: Record<MajorField, JobCategory[]> = {
  it: ["dev", "data", "planning"],
  engineering: ["manufacturing", "dev", "data"],
  business: ["marketing", "sales", "planning"],
  design: ["design", "planning"],
  humanities: ["translation", "marketing", "service"],
  science: ["data", "manufacturing"],
  service: ["service", "sales"],
  other: []
};

/** 직무별로 한국어가 얼마나 필요한지(일반적인 경향). */
const JOB_KOREAN_NEED: Record<JobCategory, KoreanLevel> = {
  dev: "basic",
  data: "basic",
  design: "basic",
  marketing: "business",
  sales: "business",
  planning: "business",
  manufacturing: "basic",
  service: "business",
  translation: "fluent"
};

const KOREAN_RANK: Record<KoreanLevel, number> = { none: 0, basic: 1, business: 2, fluent: 3, unknown: -1 };

export type FitReason = { ko: string; en: string };

export type RecommendedRole = {
  category: JobCategory;
  /** 0~100. 입력으로 계산한 상대 점수이고 합격 가능성이 아니다. */
  score: number;
  reasons: FitReason[];
  /** 한국어 요건이 입력보다 높을 때의 주의. */
  koreanGap: boolean;
};

export type VisaJobFitResult = {
  roles: RecommendedRole[];
  /** 공식 확인이 필요한 항목 — 비워 두지 않는다. */
  visaChecks: FitReason[];
  /** 입력에서 비어 있어 결과가 좁아진 항목(추정하지 않았다는 표시). */
  missingInputs: FitReason[];
};

export function visaRuleOf(code: string): VisaRule | null {
  return VISA_RULES[code.toUpperCase()] ?? null;
}

export const SUPPORTED_VISA_CODES = Object.keys(VISA_RULES);

/**
 * 규칙으로 추천 직무를 계산한다. 최대 3개.
 * 점수는 '입력과의 일치도'이며 합격·취업 가능성이 아니다.
 */
export function computeVisaJobFit(input: VisaJobFitInput): VisaJobFitResult {
  const scores = new Map<JobCategory, { score: number; reasons: FitReason[] }>();
  const add = (cat: JobCategory, points: number, reason?: FitReason) => {
    const cur = scores.get(cat) ?? { score: 0, reasons: [] };
    cur.score += points;
    if (reason) cur.reasons.push(reason);
    scores.set(cat, cur);
  };

  // 1) 사용자가 고른 관심 직무가 1순위 근거다.
  for (const c of input.interests) {
    add(c, 50, { ko: "관심 직무로 선택했어요.", en: "You picked this as an interest." });
  }

  // 2) 전공 계열과 맞는 직무.
  if (input.majorField !== "unknown") {
    for (const c of MAJOR_TO_JOBS[input.majorField] ?? []) {
      add(c, 25, { ko: "전공 계열과 연결되는 직무예요.", en: "Connected to your field of study." });
    }
  }

  // 3) 경력 — 입력한 것만 반영한다. "unknown"은 아무 가정도 하지 않는다.
  if (input.experience === "over3") {
    for (const c of [...scores.keys()]) add(c, 10, { ko: "3년 이상 경력은 경력직 공고에서 유리해요.", en: "3+ years helps for experienced roles." });
  } else if (input.experience === "none" || input.experience === "intern") {
    for (const c of [...scores.keys()]) add(c, 5, { ko: "신입·인턴 공고부터 시작하는 경로예요.", en: "A path that starts from entry-level and internships." });
  }

  const roles: RecommendedRole[] = [...scores.entries()]
    .map(([category, v]) => {
      const need = JOB_KOREAN_NEED[category];
      const koreanGap = KOREAN_RANK[input.korean] >= 0 && KOREAN_RANK[input.korean] < KOREAN_RANK[need];
      const reasons = [...v.reasons];
      if (koreanGap) {
        reasons.push({
          ko: "이 직무는 보통 더 높은 한국어 수준을 요구해요.",
          en: "This role usually expects a higher level of Korean."
        });
      }
      return { category, score: Math.min(100, v.score), reasons, koreanGap };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 비자 확인 항목 — 항상 하나 이상 제공한다.
  const visaChecks: FitReason[] = [];
  const rule = visaRuleOf(input.visa);
  if (rule) {
    visaChecks.push(rule.note);
    if (rule.workAllowed === "limited") {
      visaChecks.push({
        ko: "지원 전에 출입국·고용센터에서 취업 가능 범위를 확인해 주세요.",
        en: "Check the scope of permitted work with immigration before applying."
      });
    }
  } else {
    visaChecks.push({
      ko: "입력한 체류자격은 이 도구가 다루지 않아요. 출입국에 직접 확인해 주세요.",
      en: "This tool doesn't cover the status you entered. Please confirm with immigration."
    });
  }
  if (input.graduation === "enrolled" || input.graduation === "graduating") {
    visaChecks.push({
      ko: "졸업 전후로 자격 변경이 필요한 경우가 많아요. 일정을 미리 확인해 주세요.",
      en: "A status change is often needed around graduation — check the timing early."
    });
  }

  // 입력하지 않아 결과가 좁아진 항목 — 추정하지 않았음을 알린다.
  const missingInputs: FitReason[] = [];
  if (input.majorField === "unknown") missingInputs.push({ ko: "전공 계열을 고르면 추천이 더 정확해져요.", en: "Picking your field of study makes this more accurate." });
  if (input.experience === "unknown") missingInputs.push({ ko: "경력 수준을 고르면 신입·경력 공고를 구분해 줄 수 있어요.", en: "Telling us your experience lets us separate entry-level from experienced roles." });
  if (input.korean === "unknown") missingInputs.push({ ko: "한국어 수준을 고르면 요구 수준이 높은 직무를 걸러 줄 수 있어요.", en: "Your Korean level lets us flag roles that need more Korean." });

  return { roles, visaChecks, missingInputs };
}

/** 직무 카테고리 → 공고 검색에 쓸 키워드(한국어 공고 제목·직무명 기준). */
export const JOB_CATEGORY_QUERY: Record<JobCategory, string> = {
  dev: "개발",
  data: "데이터",
  design: "디자인",
  marketing: "마케팅",
  sales: "영업",
  planning: "기획",
  manufacturing: "생산",
  service: "서비스",
  translation: "통역"
};
