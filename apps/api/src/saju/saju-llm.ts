import OpenAI from "openai";
import lunar from "lunar-javascript";

// gpt-4o-mini is plenty for this kind of cultural / narrative text and
// keeps the per-prediction cost negligible (~$0.001).
const MODEL = "gpt-4o-mini";

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (cachedClient) return cachedClient;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
}

export type SajuPredictionInput = {
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime?: string | null;
  calendarType?: "solar" | "lunar";
  locale?: string;
};

export type SajuRoleReasoning = {
  role: string;
  reason: string;
};

export type SajuElementBalance = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type SajuDetails = {
  strengths: string[];
  workEnvironment: string[];
  cautionAdvice: string;
  roleReasonings: SajuRoleReasoning[];
  specificRoles: string[];
  elementBalance: SajuElementBalance | null;
  dayMaster: string;
  recommendedIndustries: string[];
  rolesToAvoid: string[];
  growthPattern: string;
  motto: string;
};

export type SajuPredictionResult = {
  interpretation: string;
  recommendedRoleNames: string[];
  details: SajuDetails;
};

export type SajuTranslatableContent = {
  interpretation: string;
  details: SajuDetails;
};

// Translate the dynamic text fields of an existing prediction into the
// viewer's locale. Static taxonomy entries (recommendedRoleNames,
// roleReasonings[].role) stay in Korean because they map back to DB
// values. Returns null on failure so the caller can fall back to the
// original locale's text.
export async function translateSajuContent(
  content: SajuTranslatableContent,
  targetLocale: string
): Promise<SajuTranslatableContent | null> {
  const client = getClient();
  if (!client) return null;
  const { languageName, bcp47 } = resolveLanguageDirective(targetLocale);
  const prompt = [
    `Translate the following saju reading payload into ${languageName} (BCP47: ${bcp47}).`,
    `Preserve meaning, tone (warm / non-fatalistic), and structure exactly. Do not invent or drop entries.`,
    ``,
    `Translation rules:`,
    `- TRANSLATE these into ${languageName}: interpretation, dayMaster, strengths[], workEnvironment[], cautionAdvice, roleReasonings[].reason, specificRoles[], recommendedIndustries[], rolesToAvoid[], growthPattern, motto.`,
    `- specificRoles[] are concrete job titles (e.g. "프로덕트 디자이너", "퍼포먼스 마케터") and MUST be translated into ${languageName} natural job titles. Do NOT keep them in Korean.`,
    `- DO NOT translate the "role" field inside roleReasonings — those are Korean taxonomy keys (e.g. "개발", "디자인") and must stay in Korean exactly.`,
    `- DO NOT change elementBalance numbers — copy them exactly.`,
    ``,
    `Return ONLY a JSON object with the same shape:`,
    `{`,
    `  "interpretation": "<translated to ${languageName}>",`,
    `  "details": {`,
    `    "elementBalance": <unchanged numbers>,`,
    `    "dayMaster": "<translated>",`,
    `    "strengths": ["<translated>", ...],`,
    `    "workEnvironment": ["<translated>", ...],`,
    `    "cautionAdvice": "<translated>",`,
    `    "roleReasonings": [{ "role": "<unchanged Korean>", "reason": "<translated>" }, ...],`,
    `    "specificRoles": ["<translated specific job titles, NOT Korean>", ...],`,
    `    "recommendedIndustries": ["<translated>", ...],`,
    `    "rolesToAvoid": ["<translated>", ...],`,
    `    "growthPattern": "<translated>",`,
    `    "motto": "<translated>"`,
    `  }`,
    `}`,
    ``,
    `Original payload:`,
    JSON.stringify(content)
  ].join("\n");
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You translate JSON content into ${languageName} (${bcp47}) and return strict JSON only.`
        },
        { role: "user", content: prompt }
      ]
    });
    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SajuTranslatableContent>;
    if (typeof parsed.interpretation !== "string" || !parsed.details) return null;
    const d = parsed.details;
    const eb = d.elementBalance as Partial<SajuElementBalance> | undefined;
    return {
      interpretation: parsed.interpretation.trim(),
      details: {
        strengths: Array.isArray(d.strengths) ? d.strengths.map((s) => String(s).trim()).filter(Boolean) : [],
        workEnvironment: Array.isArray(d.workEnvironment) ? d.workEnvironment.map((s) => String(s).trim()).filter(Boolean) : [],
        cautionAdvice: typeof d.cautionAdvice === "string" ? d.cautionAdvice.trim() : "",
        roleReasonings: Array.isArray(d.roleReasonings)
          ? d.roleReasonings
              .map((r) => ({
                role: typeof r?.role === "string" ? r.role.trim() : "",
                reason: typeof r?.reason === "string" ? r.reason.trim() : ""
              }))
              .filter((r) => r.role && r.reason)
          : [],
        specificRoles: Array.isArray(d.specificRoles)
          ? d.specificRoles.map((s) => String(s).trim()).filter(Boolean).slice(0, 6)
          : [],
        elementBalance: eb
          ? {
              wood: Math.max(0, Math.min(100, Number(eb.wood) || 0)),
              fire: Math.max(0, Math.min(100, Number(eb.fire) || 0)),
              earth: Math.max(0, Math.min(100, Number(eb.earth) || 0)),
              metal: Math.max(0, Math.min(100, Number(eb.metal) || 0)),
              water: Math.max(0, Math.min(100, Number(eb.water) || 0))
            }
          : null,
        dayMaster: typeof d.dayMaster === "string" ? d.dayMaster.trim() : "",
        recommendedIndustries: Array.isArray(d.recommendedIndustries)
          ? d.recommendedIndustries.map((s) => String(s).trim()).filter(Boolean).slice(0, 5)
          : [],
        rolesToAvoid: Array.isArray(d.rolesToAvoid)
          ? d.rolesToAvoid.map((s) => String(s).trim()).filter(Boolean).slice(0, 3)
          : [],
        growthPattern: typeof d.growthPattern === "string" ? d.growthPattern.trim() : "",
        motto: typeof d.motto === "string" ? d.motto.trim() : ""
      }
    };
  } catch (error) {
    console.error("[saju] translation failed", error);
    return null;
  }
}

// Compute the actual sexagenary (heavenly-stem + earthly-branch) pillars
// for the year and month from the birth date. Anchoring the LLM prompt
// on these CONCRETE Korean characters dramatically increases output
// variety — without them gpt-4o-mini converges on the same "warm
// balanced creative" reading regardless of input.
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEM_ELEMENT_KO = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const STEM_ELEMENT_EN = ["Wood", "Wood", "Fire", "Fire", "Earth", "Earth", "Metal", "Metal", "Water", "Water"];
const STEM_YIN_YANG_KO = ["양", "음", "양", "음", "양", "음", "양", "음", "양", "음"];
const STEM_YIN_YANG_EN = ["Yang", "Yin", "Yang", "Yin", "Yang", "Yin", "Yang", "Yin", "Yang", "Yin"];
const BRANCH_ELEMENT_KO = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];
const BRANCH_ELEMENT_EN = ["Water", "Earth", "Wood", "Wood", "Earth", "Fire", "Fire", "Earth", "Metal", "Metal", "Earth", "Water"];
const BRANCH_ANIMAL_KO = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
type SajuPillars = {
  yearKo: string;
  yearEn: string;
  monthKo: string;
  monthEn: string;
  dayKo: string;
  dayEn: string;
  hourKo: string | null;
  hourEn: string | null;
  dominantElements: string[];
};

// Map traditional Chinese character → modern Korean Hangul for the 10
// 천간 (heavenly stems) + 12 지지 (earthly branches). lunar-javascript
// emits CJK characters, which we localize for downstream display +
// element lookup.
const CHAR_TO_KO: Record<string, string> = {
  "甲": "갑", "乙": "을", "丙": "병", "丁": "정", "戊": "무",
  "己": "기", "庚": "경", "辛": "신", "壬": "임", "癸": "계",
  "子": "자", "丑": "축", "寅": "인", "卯": "묘", "辰": "진",
  "巳": "사", "午": "오", "未": "미", "申": "신", "酉": "유",
  "戌": "술", "亥": "해"
};
const KO_STEM_INDEX: Record<string, number> = {
  갑: 0, 을: 1, 병: 2, 정: 3, 무: 4, 기: 5, 경: 6, 신: 7, 임: 8, 계: 9
};
const KO_BRANCH_INDEX: Record<string, number> = {
  자: 0, 축: 1, 인: 2, 묘: 3, 진: 4, 사: 5, 오: 6, 미: 7, 신: 8, 유: 9, 술: 10, 해: 11
};

function pillarToKo(cjk: string): string {
  return cjk.split("").map((c) => CHAR_TO_KO[c] ?? c).join("");
}

// EightChar.getXxx() returns a 2-character CJK string (stem + branch).
// We need to split it into stem index + branch index for element lookup.
function decodePillar(cjk: string): { stemIdx: number; branchIdx: number; ko: string } {
  const ko = pillarToKo(cjk);
  // ko is also 2 chars: first stem, second branch
  const stemIdx = KO_STEM_INDEX[ko[0]] ?? 0;
  const branchIdx = KO_BRANCH_INDEX[ko[1]] ?? 0;
  return { stemIdx, branchIdx, ko };
}

function pillarLabel(
  cjk: string,
  ko: string,
  stemIdx: number,
  branchIdx: number,
  extra?: string
): { ko: string; en: string } {
  const koDescriptor = `${STEM_YIN_YANG_KO[stemIdx]}${STEM_ELEMENT_KO[stemIdx]} + ${BRANCH_ELEMENT_KO[branchIdx]}${extra ? ` / ${extra}` : ""}`;
  const enDescriptor = `${STEM_YIN_YANG_EN[stemIdx]} ${STEM_ELEMENT_EN[stemIdx]} stem + ${BRANCH_ELEMENT_EN[branchIdx]} branch${extra ? ` — ${extra}` : ""}`;
  return {
    ko: `${ko} (${koDescriptor})`,
    en: `${cjk} (${enDescriptor})`
  };
}

// Apply Seoul true-solar-time (진태양시) correction. KST is anchored to
// the 135°E meridian but Seoul sits at ~127°E, so local solar time runs
// ~32 minutes behind KST. Traditional Korean saju practitioners apply
// this correction so the hour pillar reflects the actual position of the
// sun at the birth location. Carries borrows across day / month / year
// when the subtraction crosses midnight.
const SEOUL_SOLAR_OFFSET_MINUTES = 32;

function applySeoulSolarOffset(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): { year: number; month: number; day: number; hour: number; minute: number } {
  let y = year;
  let mo = month;
  let d = day;
  let h = hour;
  let mi = minute - SEOUL_SOLAR_OFFSET_MINUTES;
  if (mi < 0) {
    mi += 60;
    h -= 1;
  }
  if (h < 0) {
    h += 24;
    d -= 1;
    if (d < 1) {
      mo -= 1;
      if (mo < 1) {
        mo = 12;
        y -= 1;
      }
      d = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    }
  }
  return { year: y, month: mo, day: d, hour: h, minute: mi };
}

// Computes the four-pillar (사주팔자) decomposition for a birth moment.
// Uses lunar-javascript under the hood so we get accurate 24-solar-term
// boundaries and ephemeris-based lunar↔solar conversion. Input times are
// nudged by Seoul's 진태양시 offset (-32 min) so the hour pillar and any
// midnight crossings reflect actual Seoul solar time, not the KST
// meridian. The calibration anchor (1987-08-12 10:00 → 정묘 / 무신 /
// 계사 / 정사) matches a real published manse-ryeok entry.
export function computeSajuPillars(
  birthDateStr: string,
  birthTime?: string | null,
  calendarType: "solar" | "lunar" = "solar"
): SajuPillars {
  const [yearIn, monthIn, dayIn] = birthDateStr.split("-").map((x) => Number(x));
  let hourIn = 12;
  let minuteIn = 0;
  if (birthTime && /^\d{2}:\d{2}$/.test(birthTime)) {
    const [hh, mm] = birthTime.split(":").map(Number);
    hourIn = hh;
    minuteIn = mm;
  }
  // KST → Seoul 진태양시 (-32 min). Applied for solar input directly; for
  // lunar input we apply it after lunar→solar conversion (lunar dates are
  // calendar days, not clock times, so we don't shift the lunar date
  // itself — only the wallclock minute count).
  const adjusted = applySeoulSolarOffset(yearIn, monthIn, dayIn, hourIn, minuteIn);
  const solar =
    calendarType === "lunar"
      ? lunar.Lunar.fromYmdHms(yearIn, monthIn, dayIn, adjusted.hour, adjusted.minute, 0).getSolar()
      : lunar.Solar.fromYmdHms(adjusted.year, adjusted.month, adjusted.day, adjusted.hour, adjusted.minute, 0);
  const eightChar = solar.getLunar().getEightChar();

  const yearPillar = decodePillar(eightChar.getYear());
  const monthPillar = decodePillar(eightChar.getMonth());
  const dayPillar = decodePillar(eightChar.getDay());
  const hourPillar = birthTime ? decodePillar(eightChar.getTime()) : null;

  const yearLabel = pillarLabel(
    eightChar.getYear(),
    yearPillar.ko,
    yearPillar.stemIdx,
    yearPillar.branchIdx,
    `${BRANCH_ANIMAL_KO[yearPillar.branchIdx]}해`
  );
  const monthLabel = pillarLabel(
    eightChar.getMonth(),
    monthPillar.ko,
    monthPillar.stemIdx,
    monthPillar.branchIdx
  );
  const dayLabel = pillarLabel(
    eightChar.getDay(),
    dayPillar.ko,
    dayPillar.stemIdx,
    dayPillar.branchIdx,
    "일주 = day-master"
  );
  const hourLabel = hourPillar
    ? pillarLabel(eightChar.getTime(), hourPillar.ko, hourPillar.stemIdx, hourPillar.branchIdx)
    : null;

  // Element tally across all known pillars.
  const tally: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  tally[STEM_ELEMENT_KO[yearPillar.stemIdx]] += 1;
  tally[BRANCH_ELEMENT_KO[yearPillar.branchIdx]] += 1;
  tally[STEM_ELEMENT_KO[monthPillar.stemIdx]] += 1;
  tally[BRANCH_ELEMENT_KO[monthPillar.branchIdx]] += 1;
  tally[STEM_ELEMENT_KO[dayPillar.stemIdx]] += 1;
  tally[BRANCH_ELEMENT_KO[dayPillar.branchIdx]] += 1;
  if (hourPillar) {
    tally[STEM_ELEMENT_KO[hourPillar.stemIdx]] += 1;
    tally[BRANCH_ELEMENT_KO[hourPillar.branchIdx]] += 1;
  }
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const dominantElements = sorted.filter(([, n]) => n > 0 && n === sorted[0][1]).map(([k]) => k);

  return {
    yearKo: yearLabel.ko,
    yearEn: yearLabel.en,
    monthKo: monthLabel.ko,
    monthEn: monthLabel.en,
    dayKo: dayLabel.ko,
    dayEn: dayLabel.en,
    hourKo: hourLabel?.ko ?? null,
    hourEn: hourLabel?.en ?? null,
    dominantElements
  };
}

// Job-role taxonomy in Korean — these values are what the Position table
// stores in `preferredJobRole`, so the LLM must always return them in
// Korean even when the user-facing interpretation is in another language.
const JOB_ROLE_TAXONOMY = [
  "개발",
  "디자인",
  "기획·전략",
  "마케팅·광고",
  "영업",
  "고객서비스·리테일",
  "경영·비즈니스",
  "미디어",
  "교육",
  "법률·법집행기관",
  "금융",
  "의료·제약",
  "건설·생산",
  "연구·R&D",
  "HR·인사",
  "통·번역",
  "IT 운영·관리"
];

function resolveLanguageDirective(locale: string | undefined): {
  languageName: string;
  bcp47: string;
} {
  switch (locale) {
    case "en":
      return { languageName: "English", bcp47: "en" };
    case "zh-CN":
      return { languageName: "Simplified Chinese", bcp47: "zh-CN" };
    case "vi":
      return { languageName: "Vietnamese", bcp47: "vi" };
    case "ja":
      return { languageName: "Japanese", bcp47: "ja" };
    case "id":
      return { languageName: "Indonesian", bcp47: "id" };
    case "ko":
    default:
      return { languageName: "Korean", bcp47: "ko" };
  }
}

function buildPrompt(input: SajuPredictionInput): string {
  const genderText = input.gender === "male" ? "Male" : "Female";
  const cal = input.calendarType === "lunar" ? "lunar" : "solar";
  const taxonomyText = JOB_ROLE_TAXONOMY.join(", ");
  const { languageName, bcp47 } = resolveLanguageDirective(input.locale);
  const pillars = computeSajuPillars(input.birthDate, input.birthTime, input.calendarType ?? "solar");
  return [
    `You are a warm, friendly mentor who reads Korean traditional Five-Element (오행) Saju to advise on career fit.`,
    ``,
    `--- PRECOMPUTED SAJU (anchor your entire reading to these) ---`,
    `These four pillars were computed deterministically from the birth info. Treat them as FACTS. Two different people with different pillars must get visibly different readings.`,
    `- Year pillar (年柱): ${pillars.yearKo}`,
    `- Month pillar (月柱): ${pillars.monthKo}`,
    `- Day pillar (日柱 / day-master): ${pillars.dayKo}`,
    pillars.hourKo ? `- Hour pillar (時柱): ${pillars.hourKo}` : `- Hour pillar (時柱): unknown — base the reading on the other three pillars only`,
    `- Dominant elements: ${pillars.dominantElements.join(", ")}`,
    `- English notation: year=${pillars.yearEn}, month=${pillars.monthEn}, day=${pillars.dayEn}${pillars.hourEn ? `, hour=${pillars.hourEn}` : ""}`,
    `Hard rules:`,
    `- "elementBalance" percentages MUST be highest on the dominant elements above and visibly skewed (e.g. 35/25/15/15/10), not a flat 20/20/20/20/20.`,
    `- "dayMaster" string MUST be derived from the DAY pillar's stem element (the precomputed day-master above), e.g. KO "정화(丁火) — 촛불 같은 따뜻한 빛" for 정 stem; EN "Yin Fire (정) — gentle candle flame".`,
    `- "interpretation" MUST cite at least the year pillar (${pillars.yearKo}) AND the day pillar (${pillars.dayKo}), explaining how their elements flavor the person.`,
    `- "recommendedRoleNames", "specificRoles", "recommendedIndustries" MUST visibly bias toward the dominant elements above — NOT a safe generic mix.`,
    ``,
    `Element → career affinities (use as a guideline, combine with the dominant elements above):`,
    `- 목 / Wood: growth, planning, creation, content, design, education — strategy/UX/branding/contents/teaching`,
    `- 화 / Fire: communication, energy, expression, brand presence — marketing/sales/PR/people-facing`,
    `- 토 / Earth: stability, trust, support, operations — HR/finance/operations/customer success`,
    `- 금 / Metal: precision, judgement, analysis, structure — engineering/legal/finance/research`,
    `- 수 / Water: flow, learning, depth, networks — research/strategy/data/journalism/global business`,
    ``,
    `User info`,
    `- Name: ${input.name}`,
    `- Gender: ${genderText}`,
    `- Birth date: ${input.birthDate} (${cal} calendar)`,
    input.birthTime ? `- Birth time: ${input.birthTime}` : `- Birth time: unknown`,
    ``,
    `Respond ONLY as a strict JSON object — no markdown, no code fences, no extra prose:`,
    `{`,
    `  "interpretation": "5 to 7 warm sentences in ${languageName} (${bcp47}). MUST explicitly mention which elements dominate, which one is lacking, and the day-master element from STEP 1, then describe how those translate to the person's personal strengths and the mood/style of work that suits them. Avoid fatalistic or absolute language.",`,
    `  "recommendedRoleNames": ["pick EXACTLY 1 to 2 (NEVER more than 2) from this Korean taxonomy and return them exactly as Korean strings: ${taxonomyText}. Focus tightly on the dominant element — do not hedge by listing many categories."],`,
    `  "details": {`,
    `    "elementBalance": { "wood": <0-100>, "fire": <0-100>, "earth": <0-100>, "metal": <0-100>, "water": <0-100> },  // integers, total ≈ 100, reflecting this person's specific five-element distribution from STEP 1. MUST differ across different birth dates.`,
    `    "dayMaster": "<1-line label in ${languageName} naming the day-master element, e.g. KO '갑목(甲木) — 큰 나무', EN 'Yang Wood (甲) — the tall tree'>",`,
    `    "strengths": ["3 to 5 short single-sentence personality / work strengths in ${languageName}"],`,
    `    "workEnvironment": ["3 to 4 short bullets in ${languageName} describing the team culture and working style that suit this person"],`,
    `    "cautionAdvice": "1 to 2 warm sentences in ${languageName} flagging the kind of work or environment that might drain this person. Constructive.",`,
    `    "roleReasonings": [`,
    `      { "role": "<must equal one of recommendedRoleNames exactly>", "reason": "2 to 3 sentences in ${languageName} explaining why this Korean job category fits, tied to the element profile" }`,
    `    ],`,
    `    "specificRoles": ["EXACTLY 2 to 4 HIGHLY SPECIFIC job titles in ${languageName}, ALL drawn from the SAME 1-2 categories in recommendedRoleNames. Do NOT introduce a third category. EACH entry must have AT LEAST ONE of: (a) a specialization keyword (e.g. UX/UI/Service for 'designer'; backend/frontend/platform for 'engineer'; growth/brand/performance for 'marketer'), (b) an industry parenthetical (e.g. (Fintech), (B2B SaaS), (D2C 커머스), (헬스케어), (게임), (콘텐츠/미디어), (HR Tech), (EdTech)), (c) a seniority prefix (Junior/Mid/Senior/Lead, 주니어/시니어/리드). NEVER output bare titles like '개발자', 'Designer'. BAD: 'UX 디자이너', 'Product Manager'. GOOD: '시니어 UX 디자이너 (B2B SaaS)', '그로스 마케팅 매니저 (D2C 커머스)', 'Senior Product Manager (Fintech)', '백엔드 엔지니어 (게임)'."],`,
    `    "recommendedIndustries": ["3 to 5 industries that fit this person in ${languageName} — concrete sectors (e.g. KO '콘텐츠/미디어', 'AI/SaaS', '핀테크', '교육테크', '커머스', '헬스케어'), NOT job functions. Pick the ones that match the dominant element."],`,
    `    "rolesToAvoid": ["2 to 3 short labels in ${languageName} for job styles this person should be wary of — e.g. KO '반복적인 단순 입력 업무', '비전 없이 굴러가는 안정형 조직'. Phrase as work-style descriptions, not specific titles."],`,
    `    "growthPattern": "2 to 3 sentences in ${languageName} on the person's likely career arc — early years strengths, mid-career inflection, what mastery looks like for their element profile.",`,
    `    "motto": "ONE short (under 14 words) motivational line in ${languageName} that captures this person's career identity. Should feel personal, not generic."`,
    `  }`,
    `}`,
    ``,
    `Important:`,
    `- recommendedRoleNames must be the Korean strings from the taxonomy above, unchanged. Do not translate them, do not invent new categories.`,
    `- details.roleReasonings must include one entry per recommendedRoleNames in the same order, and "role" must match exactly (Korean string).`,
    `- details.specificRoles must be concrete job titles in ${languageName}, NOT broad fields, NOT in Korean (unless ${languageName} IS Korean).`,
    `- interpretation, strengths, workEnvironment, cautionAdvice, reason, and specificRoles fields must be written entirely in ${languageName} (BCP47: ${bcp47}).`
  ].join("\n");
}

export async function generateSajuPrediction(
  input: SajuPredictionInput
): Promise<SajuPredictionResult | null> {
  const client = getClient();
  if (!client) return null;
  const { languageName, bcp47 } = resolveLanguageDirective(input.locale);
  const prompt = buildPrompt(input);
  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You always respond as a single pure JSON object. The "interpretation", "strengths", "workEnvironment", "cautionAdvice", and "reason" text fields are written in ${languageName} (${bcp47}); the "recommendedRoleNames" entries and "details.roleReasonings[].role" stay in Korean exactly as given in the taxonomy.`
        },
        { role: "user", content: prompt }
      ]
    });
    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<{
      interpretation: string;
      recommendedRoleNames: string[];
      details: Partial<{
        strengths: string[];
        workEnvironment: string[];
        cautionAdvice: string;
        roleReasonings: Array<{ role?: string; reason?: string }>;
        specificRoles: string[];
        elementBalance: Partial<SajuElementBalance>;
        dayMaster: string;
        recommendedIndustries: string[];
        rolesToAvoid: string[];
        growthPattern: string;
        motto: string;
      }>;
    }>;
    const interpretation = typeof parsed.interpretation === "string" ? parsed.interpretation.trim() : "";
    const recommendedRoleNames = Array.isArray(parsed.recommendedRoleNames)
      ? parsed.recommendedRoleNames
          .filter((r): r is string => typeof r === "string")
          .map((r) => r.trim())
          .filter((r) => JOB_ROLE_TAXONOMY.includes(r))
          .slice(0, 3)
      : [];
    if (!interpretation || recommendedRoleNames.length === 0) return null;

    const strengths = Array.isArray(parsed.details?.strengths)
      ? parsed.details.strengths.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean).slice(0, 5)
      : [];
    const workEnvironment = Array.isArray(parsed.details?.workEnvironment)
      ? parsed.details.workEnvironment.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean).slice(0, 4)
      : [];
    const cautionAdvice = typeof parsed.details?.cautionAdvice === "string" ? parsed.details.cautionAdvice.trim() : "";
    const roleReasonings: SajuRoleReasoning[] = Array.isArray(parsed.details?.roleReasonings)
      ? parsed.details.roleReasonings
          .map((r) => ({
            role: typeof r?.role === "string" ? r.role.trim() : "",
            reason: typeof r?.reason === "string" ? r.reason.trim() : ""
          }))
          .filter((r) => r.role && r.reason && recommendedRoleNames.includes(r.role))
      : [];

    const specificRoles = Array.isArray(parsed.details?.specificRoles)
      ? parsed.details.specificRoles
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
      : [];

    const rawEb = parsed.details?.elementBalance;
    const elementBalance: SajuElementBalance | null = rawEb
      ? {
          wood: Math.max(0, Math.min(100, Number(rawEb.wood) || 0)),
          fire: Math.max(0, Math.min(100, Number(rawEb.fire) || 0)),
          earth: Math.max(0, Math.min(100, Number(rawEb.earth) || 0)),
          metal: Math.max(0, Math.min(100, Number(rawEb.metal) || 0)),
          water: Math.max(0, Math.min(100, Number(rawEb.water) || 0))
        }
      : null;
    const dayMaster = typeof parsed.details?.dayMaster === "string" ? parsed.details.dayMaster.trim() : "";
    const recommendedIndustries = Array.isArray(parsed.details?.recommendedIndustries)
      ? parsed.details.recommendedIndustries
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];
    const rolesToAvoid = Array.isArray(parsed.details?.rolesToAvoid)
      ? parsed.details.rolesToAvoid
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];
    const growthPattern = typeof parsed.details?.growthPattern === "string" ? parsed.details.growthPattern.trim() : "";
    const motto = typeof parsed.details?.motto === "string" ? parsed.details.motto.trim() : "";

    return {
      interpretation,
      recommendedRoleNames,
      details: {
        strengths,
        workEnvironment,
        cautionAdvice,
        roleReasonings,
        specificRoles,
        elementBalance,
        dayMaster,
        recommendedIndustries,
        rolesToAvoid,
        growthPattern,
        motto
      }
    };
  } catch (error) {
    console.error("[saju] LLM generation failed", error);
    return null;
  }
}
