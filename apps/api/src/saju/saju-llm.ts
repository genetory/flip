import OpenAI from "openai";

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
  return [
    `You are a warm, friendly mentor who reads Korean traditional Five-Element (오행) Saju to advise on career fit.`,
    ``,
    `STEP 1 — Compute the five-element profile from the birth info.`,
    `Map year/month/day/hour (the four pillars / 사주팔자) to heavenly stems and earthly branches, count Wood (木) / Fire (火) / Earth (土) / Metal (金) / Water (水) presence, and determine:`,
    `- The DOMINANT element (the most abundant one or two)`,
    `- The LACKING element (the one mostly absent)`,
    `- The DAY-MASTER element (the heavenly stem of the day pillar)`,
    `Different birth dates MUST yield different profiles — never give the same dominant/lacking pair to two different people.`,
    ``,
    `STEP 2 — Tailor career direction to the computed profile.`,
    `Use these element → career affinities as a guideline (NOT a strict mapping — combine with day-master and lacking element):`,
    `- Wood: growth, planning, creation, education, content, design — strategy/UX/branding/contents/teaching`,
    `- Fire: communication, energy, expression, brand presence — marketing/sales/PR/people-facing roles`,
    `- Earth: stability, trust, support, operations — HR/finance/operations/customer success`,
    `- Metal: precision, judgement, analysis, structure — engineering/legal/finance/research`,
    `- Water: flow, learning, depth, networks — research/strategy/data/journalism/global business`,
    `Make sure the recommendedRoleNames and specificRoles VISIBLY differ from a "generic safe" answer; they should clearly trace back to this person's specific profile.`,
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
    `  "recommendedRoleNames": ["pick 2 to 3 from this Korean taxonomy and return them exactly as Korean strings: ${taxonomyText}"],`,
    `  "details": {`,
    `    "elementBalance": { "wood": <0-100>, "fire": <0-100>, "earth": <0-100>, "metal": <0-100>, "water": <0-100> },  // integers, total ≈ 100, reflecting this person's specific five-element distribution from STEP 1. MUST differ across different birth dates.`,
    `    "dayMaster": "<1-line label in ${languageName} naming the day-master element, e.g. KO '갑목(甲木) — 큰 나무', EN 'Yang Wood (甲) — the tall tree'>",`,
    `    "strengths": ["3 to 5 short single-sentence personality / work strengths in ${languageName}"],`,
    `    "workEnvironment": ["3 to 4 short bullets in ${languageName} describing the team culture and working style that suit this person"],`,
    `    "cautionAdvice": "1 to 2 warm sentences in ${languageName} flagging the kind of work or environment that might drain this person. Constructive.",`,
    `    "roleReasonings": [`,
    `      { "role": "<must equal one of recommendedRoleNames exactly>", "reason": "2 to 3 sentences in ${languageName} explaining why this Korean job category fits, tied to the element profile" }`,
    `    ],`,
    `    "specificRoles": ["6 to 8 HIGHLY SPECIFIC job titles in ${languageName}. AVOID one-word generics like 'Developer', 'Marketer', 'Designer'. ADD a specialization, industry vertical, or seniority modifier so each title is concrete enough to paste into a job board search and get real results. Examples: KO '백엔드 엔지니어 (핀테크)', '그로스 마케팅 매니저 (D2C 커머스)', 'AI 프로덕트 디자이너 (B2B SaaS)', '시니어 UX 리서처', '콘텐츠 전략가 (브랜드 미디어)' / EN 'Senior Product Designer (B2B SaaS)', 'Growth Marketing Manager (D2C/Consumer)', 'Backend Engineer (Fintech)', 'UX Researcher (Early-stage Startup)'. Span junior to senior, span at least 2 industry verticals, span at least 2 specializations within the same broad field."],`,
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
          .slice(0, 6)
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
