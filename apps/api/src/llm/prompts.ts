// 생성형 LLM 프롬프트 단일 소스(governance).
//
// 여기 있는 프롬프트 빌더는 API 핸들러(index.ts)와 품질 평가 하니스(src/eval)가
// "동일하게" 사용한다. 프롬프트를 바꾸면 양쪽에 자동 반영되고, eval 로 회귀를 잡는다.
// (기존에 index.ts 인라인으로 흩어져 있던 자소서·이력서 생성 프롬프트를 이관)

// 서비스 전체 생성형 LLM의 말투·언어 통일 — 항상 한국어, 다정하고 예의 바른 존댓말.
// (번역·영문 자기소개 등 '다른 언어 출력'이 목적인 기능은 이 지시를 붙이지 않는다.)
// locale 인자는 하위호환을 위해 남겨두되 무시한다.
export function aiLangDirective(_locale?: string): string {
  return (
    "\n\n[말투·언어 — 필수] 입력이 어떤 언어(영어·중국어·베트남어·일본어 등)로 작성됐더라도 그 의미를 정확히 이해하고, " +
    "결과는 반드시 한국어로만 작성해줘(입력을 그대로 옮기지 말고 자연스러운 한국어 문장으로 정리). " +
    "다정하고 따뜻하며 예의 바른 존댓말로, 취업이 처음인 사람도 편하게 느낄 만큼 친근하게. " +
    "평가·훈계하는 말투나 딱딱한 지시문은 피하고 응원하는 톤으로. " +
    "단, JSON 필드명은 지정된 대로 영어로 두고, 고유명사·회사/학교명·기술/스킬 용어(예: Python, Excel)는 그대로 유지해줘."
  );
}

// 이력서/자소서 '다듬기' 방향 가이드. polish-intro / polish-experience / cover-letter(polish) 공용.
export const POLISH_STYLE_GUIDE: Record<string, string> = {
  natural:
    "내용·길이는 그대로 두고, 어색한 표현과 맞춤법·띄어쓰기만 매끄럽게 고치세요. 문장을 새로 늘리거나 줄이지 마세요(가벼운 교정).",
  expand:
    "내용을 더 자세하고 풍부하게 풀어쓰세요. 주어진 사실의 맥락·과정·역할·노력을 구체적으로 보여주어 짧은 입력을 충실한 문장으로 확실히 길게 키우되, 없는 사실(회사·수치·성과·기간)을 새로 지어내지는 마세요.",
  concise: "군더더기·수식어를 과감히 덜어내고 핵심만 남겨, 원문보다 눈에 띄게 짧게 줄이세요.",
  achievement:
    "성과와 결과 중심으로 재구성하세요. 한 일을 '무엇을 해서 어떤 결과를 냈다' 형태로 바꿔 결과·기여·수치를 문장 앞쪽에 배치하되, 원문에 없는 수치·성과를 새로 지어내지는 마세요(있는 내용만 강조).",
  professional: "격식 있고 차분한 전문가 톤으로 신뢰감 있게 다듬으세요.",
  impact: "지원자의 강점과 동기가 잘 드러나도록 자신감 있는 톤으로 다듬으세요(없는 사실 추가 금지)."
};

export type PolishStyle = "natural" | "concise" | "professional" | "impact" | "expand" | "achievement";

// 생성 결과에서 상투적 과장 수식어를 결정적으로 제거(프롬프트로도 지양시키지만 모델이 종종 흘림).
// 전(前)-명사/부사 수식어만 제거해 문법을 해치지 않게 한다. API 핸들러와 eval 이 공용으로 사용.
export function stripCliches(text: string): string {
  return text
    .replace(/혁신적(?:인|으로)?\s*/g, "")
    .replace(/탁월(?:한|하게)\s*/g, "")
    .replace(/압도적(?:인|으로)?\s*/g, "")
    .replace(/독보적(?:인|으로)?\s*/g, "")
    .replace(/누구보다(?:도)?\s*/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();
}

// ── 자소서(자기소개서) 문항 답변 생성/다듬기 ─────────────────────────────
export type CoverLetterExperience = {
  title?: string;
  type?: string;
  org?: string;
  period?: string;
  summary?: string;
  bullets?: string[];
};
export type CoverLetterEducation = { school?: string; major?: string; status?: string };
export type CoverLetterLanguage = { language?: string; level?: string };

export type CoverLetterInput = {
  mode?: "draft" | "polish"; // 기본 draft
  style?: PolishStyle;
  prompt: string; // 자소서 문항
  current?: string; // 다듬을 기존 답변 / 참고 메모
  keywords?: string[]; // 반드시 반영할 소재
  targetChars?: number; // 목표 분량(공백 포함)
  desiredJobRole?: string;
  jobCategories?: string[];
  companyName?: string;
  jobText?: string; // 목표 공고(JD) 본문 — 있으면 요구역량에 경험을 연결(그라운딩)
  experiences?: CoverLetterExperience[];
  education?: CoverLetterEducation[];
  skills?: string[];
  languages?: CoverLetterLanguage[];
  summary?: string;
  selfIntroduction?: string;
  locale?: string;
};

export type LlmMessages = { system: string; user: string };

// 구조화 출력 스키마(Responses API json_schema 용).
export const COVER_TEXT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { text: { type: "string" } },
  required: ["text"]
} as const;
export const POLISH_TEXT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { polished: { type: "string" } },
  required: ["polished"]
} as const;
export const DRAFT_TEXT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { text: { type: "string" }, why: { type: "string" } },
  required: ["text", "why"]
} as const;

export function buildCoverLetterMessages(input: CoverLetterInput): LlmMessages {
  const {
    mode, style, prompt, current, keywords, targetChars, desiredJobRole, jobCategories,
    companyName, jobText, experiences, education, skills, languages, summary, selfIntroduction, locale
  } = input;
  const jd = (jobText ?? "").trim().slice(0, 4000);
  const isPolish = mode === "polish";
  const target = targetChars ?? 800;
  const styleGuide = POLISH_STYLE_GUIDE[style ?? "natural"] ?? POLISH_STYLE_GUIDE.natural;
  const keywordList = (keywords ?? []).map((k) => k.trim()).filter(Boolean);
  const expText = (experiences ?? [])
    .map((e, i) => {
      const head = [e.title, e.type, e.org, e.period].filter(Boolean).join(" · ");
      const body = [e.summary, ...(e.bullets ?? [])].filter(Boolean).join("\n  - ");
      return `${i + 1}. ${head}${body ? `\n  - ${body}` : ""}`;
    })
    .join("\n");
  const eduText = (education ?? [])
    .map((e) => [e.school, e.major, e.status].filter(Boolean).join(" · "))
    .filter(Boolean)
    .join("\n");
  const langText = (languages ?? [])
    .map((l) => [l.language, l.level].filter(Boolean).join(" - "))
    .filter(Boolean)
    .join(", ");
  const system =
    "당신은 한국 기업 채용에 제출하는 한국형 자기소개서(자소서)를 대신 써 주는 전문 코치입니다.\n" +
    (isPolish
      ? keywordList.length
        ? "사용자가 쓴 자소서 답변을 다듬되, 아래 '반드시 반영할 소재'를 새 문장으로 추가해 지원 동기·계기 이야기로 자연스럽게 녹여 넣으세요. 소재를 충분히 풀어내기 위해 분량을 늘려도 됩니다(제공되지 않은 수상·수치·성과는 지어내지 말 것).\n"
        : `사용자가 쓴 자소서 답변을 다듬으세요(없는 사실 추가 금지).\n이번 다듬기 방향: ${styleGuide}\n`
      : "사용자의 이력서 정보를 바탕으로 해당 자소서 문항에 대한 답변을 처음부터 작성하세요.\n") +
    (jd
      ? "[목표 공고 반영 — 중요] 이 답변은 아래 '지원자 정보' 끝의 [목표 공고]에 지원하기 위한 것입니다. 공고가 요구하는 역량·업무·인재상을 파악해, 지원자의 실제 경험·스킬을 그 요구에 자연스럽게 연결하고 '왜 이 회사·직무에 적합한지'가 구체적으로 드러나게 쓰세요. 단, 공고 문구를 그대로 베끼지 말고, 지원자가 갖추지 않은 역량을 갖춘 척하거나 없는 경험을 지어내지 마세요(가진 것 안에서 공고와의 접점을 부각).\n"
      : "") +
    "규칙:\n" +
    "1. 제공된 이력서 정보와 아래 '지원자 제공 소재'에 없는 사실(회사·수치·성과·기간·일화)을 지어내지 마세요. 주어진 내용 안에서만 작성합니다. 특히 퍼센트·인원·금액·횟수 같은 구체 수치는 입력에 명시된 값만 쓰고, 그럴듯해 보이는 추정치·예시 수치(예: '30% 향상')도 절대 만들어내지 마세요. 수치가 없으면 수치 없이 서술합니다.\n" +
    "2. 한국 자소서 문체 — 1인칭(저는), 정중한 '~습니다'체, 두괄식. 경험은 STAR(상황-과제-행동-결과) 흐름으로 구체적으로.\n" +
    (isPolish
      ? "3. 위 다듬기 방향에 맞게 분량을 조절하세요. 불릿/번호/머리말 없이 줄글로 작성합니다.\n"
      : `3. 분량은 공백 포함 약 ${target}자(±15%)로 맞추세요. 목표에 미달하지 않게, 부족하면 경험의 배경·맥락·동기·배운 점을 더 구체적으로 풀어 목표 분량을 채웁니다(억지로 늘리기 위한 반복·군더더기는 금지). 한두 문단으로 자연스럽게 이어 쓰고, 불릿/번호/머리말 없이 줄글로 작성합니다.\n`) +
    "4. 문항의 의도에 정확히 답하세요(지원동기면 동기와 회사 적합성, 성장과정이면 가치관 형성, 직무역량이면 경험 근거, 입사 후 포부면 구체적 계획).\n" +
    "5. 정보가 부족하면 학력·스킬·어학·태도를 중심으로 담백하게. 과장·미사여구·상투어를 쓰지 마세요. 특히 '혁신적/탁월한/압도적/완벽한/최고의/누구보다/독보적' 같은 표현은 절대 사용 금지입니다(구체적 사실·행동으로 대신 보여줍니다).\n" +
    "6. 한국어로만 작성하세요.\n" +
    (keywordList.length
      ? "7. [최우선 — 반드시 지킴] 다음은 지원자가 직접 제공한 소재·사실입니다(이력서에 없어도 사실로 간주). 아래 '반드시 반영할 소재'가 하나도 빠짐없이 모두 본문에 실제로 등장해야 합니다. 하나라도 빠지면 실패한 답변입니다. 답변을 쓰기 전에 각 소재를 어디에·어떻게 녹일지 먼저 정한 뒤, 단순 나열이 아니라 왜 그것이 지원 동기·가치관·계기와 이어지는지 이야기로 발전시켜 풀어냅니다(위 '다듬기 방향'이 분량·내용 유지를 지시해도 이 소재는 문장을 추가해서라도 반드시 넣습니다). 예: '아빠가 삼성전자 출신' → 아버지의 영향으로 그 분야를 존경하게 되었고 그 길을 따라 지원하게 된 계기로 서술. 다만 제공되지 않은 수상·수치·구체 성과를 새로 지어내지는 마세요.\n" +
        `   반드시 반영할 소재(모두 포함): ${keywordList.map((k) => `「${k}」`).join(", ")}\n` +
        "   작성을 마치기 전에 위 소재가 전부 본문에 들어갔는지 스스로 확인하고, 빠진 게 있으면 넣어서 완성하세요.\n"
      : "") +
    '\nJSON 한 개 객체로만 응답: { "text": string }' + aiLangDirective(locale);
  const user = [
    companyName ? `지원 회사: ${companyName}` : "",
    desiredJobRole ? `희망 직무: ${desiredJobRole}` : "",
    jobCategories?.length ? `관심 직군: ${jobCategories.join(", ")}` : "",
    eduText ? `학력:\n${eduText}` : "",
    skills?.length ? `스킬: ${skills.join(", ")}` : "",
    langText ? `어학: ${langText}` : "",
    summary ? `한 줄 요약: ${summary}` : "",
    selfIntroduction ? `자기소개: ${selfIntroduction}` : "",
    expText ? `경험:\n${expText}` : "경험: (입력된 경험 없음)",
    keywordList.length
      ? `\n[반드시 본문에 녹일 소재 — 아래 항목 모두 포함]\n${keywordList.map((k) => `- ${k}`).join("\n")}`
      : "",
    jd ? `\n[목표 공고]\n${jd}` : "",
    `\n[자소서 문항]\n${prompt}`,
    isPolish && current ? `\n[다듬을 기존 답변]\n${current}` : current ? `\n[참고 메모]\n${current}` : ""
  ]
    .filter(Boolean)
    .join("\n\n");
  return { system, user };
}

// ── 이력서 경험 설명 다듬기 ────────────────────────────────────────────
export type PolishExperienceInput = {
  text: string;
  style?: PolishStyle;
  type?: string;
  locale?: string;
};

// ── 이력서 자기소개 다듬기 ─────────────────────────────────────────────
export type PolishIntroInput = {
  text: string;
  style?: PolishStyle;
  keywords?: string[];
  desiredJobRole?: string;
  jobCategories?: string[];
  locale?: string;
};

export function buildPolishIntroMessages(input: PolishIntroInput): LlmMessages {
  const { text, desiredJobRole, jobCategories, style, keywords, locale } = input;
  const styleGuide = POLISH_STYLE_GUIDE[style ?? "natural"] ?? POLISH_STYLE_GUIDE.natural;
  const keywordList = (keywords ?? []).map((k) => k.trim()).filter(Boolean);
  const system =
    "당신은 한국 채용 이력서의 자기소개를 다듬는 첨삭 코치입니다.\n" +
    (keywordList.length
      ? "사용자가 쓴 자기소개를 다듬되, 아래 '반드시 반영할 소재'를 새 문장으로 추가해 자연스럽게 녹여 주세요. 소재를 충분히 풀어내기 위해 분량을 늘려도 됩니다.\n"
      : `사용자가 쓴 자기소개를 더 설득력 있게 다듬어 주세요.\n이번 다듬기 방향: ${styleGuide}\n`) +
    "규칙:\n" +
    "1. 사용자가 적지 않은 경력·수치·회사명·성과를 지어내지 마세요. 있는 내용과 아래 '제공 소재'만 사용합니다. 특히 퍼센트·인원·금액 같은 구체 수치는 원문에 있는 값만 쓰고, 그럴듯한 추정치를 만들지 마세요.\n" +
    "2. 군더더기·중복을 없애고 문장을 매끄럽게, 맞춤법·띄어쓰기를 교정하세요. 과장 상투어('혁신적/탁월한/압도적/독보적')는 쓰지 말고 구체적 사실로 보여주세요.\n" +
    "3. 1인칭 진술체를 유지하고, 한국어로만 작성하세요.\n" +
    (keywordList.length
      ? `4. [최우선 — 반드시 지킴] 아래 소재가 하나도 빠짐없이 모두 본문에 등장해야 합니다(빠지면 실패). 단순 나열이 아니라 이야기로 자연스럽게 녹입니다(제공되지 않은 수치·성과는 금지).\n   반드시 반영할 소재(모두 포함): ${keywordList.map((k) => `「${k}」`).join(", ")}\n`
      : "") +
    "\n" +
    'JSON 한 개 객체로만 응답: { "polished": string }' + aiLangDirective(locale);
  const ctxParts = [desiredJobRole ? `희망 직무: ${desiredJobRole}` : "", jobCategories?.length ? `관심 직군: ${jobCategories.join(", ")}` : ""]
    .filter(Boolean)
    .join("\n");
  const user = `${ctxParts ? `${ctxParts}\n\n` : ""}${keywordList.length ? `[반드시 본문에 녹일 소재 — 모두 포함]\n${keywordList.map((k) => `- ${k}`).join("\n")}\n\n` : ""}자기소개 원문:\n${text}`;
  return { system, user };
}

// ── 이력서 텍스트 생성/개선(AiTextHelperModal 백엔드) ─────────────────────
export type DraftFieldType = "selfIntroduction" | "summary" | "career" | "activity";
export type DraftMode = "improve" | "expand" | "generate";
export type DraftResumeTextInput = {
  currentText: string;
  fieldType: DraftFieldType;
  mode?: DraftMode;
  context?: { companyName?: string; position?: string; title?: string };
  hints?: string;
  locale?: string;
};

export function buildDraftResumeTextMessages(input: DraftResumeTextInput): LlmMessages {
  const { currentText, fieldType, mode = "improve", context, hints, locale } = input;
  const fieldName = {
    selfIntroduction: "자기소개",
    summary: "요약",
    career: "경력 설명",
    activity: "활동·프로젝트 설명"
  }[fieldType];
  const modeNote =
    mode === "improve"
      ? "기존 표현을 더 명확하고 임팩트 있게 다듬으세요. 의미를 부풀리지 마세요."
      : mode === "expand"
        ? "기존 내용에 구체적 사례·수치(있다면)·맥락을 자연스럽게 더 적어주세요."
        : "사용자가 제공한 키워드·맥락만으로 적절한 길이의 초안을 작성하세요. 추측이 필요하면 추상적으로 두세요.";
  const system =
    `당신은 한국 기업 채용을 돕는 이력서 코치입니다. 외국인 지원자의 ${fieldName}을(를) 작성/개선해 주세요.\n\n` +
    "엄격한 규칙:\n" +
    "1. 사용자가 명시적으로 제공하지 않은 새로운 사실(회사명·학교명·직책·날짜·수치·기술·자격증·프로젝트)을 절대 만들어내지 마세요.\n" +
    "2. 원문 또는 hints 에 적힌 숫자만 사용하고, 새 숫자를 추가/추정하지 마세요.\n" +
    "3. 의미를 부풀리거나 추측하지 마세요. 과장 상투어('혁신적/탁월한/압도적/독보적')는 쓰지 말고 구체적 사실로 보여주세요. 빈약한 입력은 빈약한 결과로 두는 게 정직합니다.\n" +
    "4. 한국어로 자연스럽고 정중하게 작성하세요.\n" +
    `5. ${fieldName} 으로서 적절한 길이로 작성하세요 (자기소개·요약은 200–500자, 경력·활동 설명은 60–200자 권장).\n\n` +
    'JSON 한 개의 객체만 응답: { "text": string, "why": string }. why 는 1-2 문장으로 어떤 점을 다듬었는지/생성했는지 한국어로 설명.' +
    aiLangDirective(locale);
  const parts: string[] = [`요청 모드: ${modeNote}`];
  if (context) {
    const ctxText = [
      context.companyName ? `회사명: ${context.companyName}` : null,
      context.position ? `직책: ${context.position}` : null,
      context.title ? `활동명: ${context.title}` : null
    ]
      .filter(Boolean)
      .join(", ");
    if (ctxText) parts.push(`맥락: ${ctxText}`);
  }
  if (hints?.trim()) parts.push(`사용자 키워드/요청: ${hints.trim()}`);
  parts.push(`현재 ${fieldName}:\n${currentText || "(비어있음)"}`);
  return { system, user: parts.join("\n\n") };
}

export function buildPolishExperienceMessages(input: PolishExperienceInput): LlmMessages {
  const { text, type, style, locale } = input;
  const styleGuide = POLISH_STYLE_GUIDE[style ?? "natural"] ?? POLISH_STYLE_GUIDE.natural;
  const system =
    "당신은 이력서에 들어갈 '경험 설명'을 다듬는 첨삭 코치입니다.\n" +
    "사용자가 적은 경험 내용을 더 명확하고 이력서에 어울리게 다듬어 주세요.\n" +
    `이번 다듬기 방향: ${styleGuide}\n` +
    "규칙:\n" +
    "1. 사용자가 적지 않은 회사·수치·성과를 지어내지 마세요. 있는 내용만 다듬습니다.\n" +
    "2. 한 일과 역할이 잘 드러나도록 구체적인 문장으로 정리하세요.\n" +
    "3. 군더더기·중복을 없애고 맞춤법·띄어쓰기를 교정하세요.\n" +
    "4. 한국어, 담백한 진술체로 작성하세요.\n" +
    "5. 한 일이 여러 가지여도 줄바꿈으로 끊어 나열하지 말고, 자연스러운 연결어로 이어 하나의 매끄럽게 흐르는 단락으로 묶으세요. 주어·시제·맥락을 일관되게 맞추고 같은 내용을 반복하지 마세요.\n\n" +
    'JSON 한 개 객체로만 응답: { "polished": string }' + aiLangDirective(locale);
  const user = `${type ? `경험 유형: ${type}\n` : ""}경험 설명:\n${text}`;
  return { system, user };
}
