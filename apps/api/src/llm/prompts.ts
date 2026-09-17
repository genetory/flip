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
  experiences?: CoverLetterExperience[];
  education?: CoverLetterEducation[];
  skills?: string[];
  languages?: CoverLetterLanguage[];
  summary?: string;
  selfIntroduction?: string;
  locale?: string;
};

export type LlmMessages = { system: string; user: string };

export function buildCoverLetterMessages(input: CoverLetterInput): LlmMessages {
  const {
    mode, style, prompt, current, keywords, targetChars, desiredJobRole, jobCategories,
    companyName, experiences, education, skills, languages, summary, selfIntroduction, locale
  } = input;
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
    "규칙:\n" +
    "1. 제공된 이력서 정보와 아래 '지원자 제공 소재'에 없는 사실(회사·수치·성과·기간·일화)을 지어내지 마세요. 주어진 내용 안에서만 작성합니다.\n" +
    "2. 한국 자소서 문체 — 1인칭(저는), 정중한 '~습니다'체, 두괄식. 경험은 STAR(상황-과제-행동-결과) 흐름으로 구체적으로.\n" +
    (isPolish
      ? "3. 위 다듬기 방향에 맞게 분량을 조절하세요. 불릿/번호/머리말 없이 줄글로 작성합니다.\n"
      : `3. 분량은 공백 포함 약 ${target}자(±15%)로 맞추세요. 한두 문단으로 자연스럽게 이어 쓰고, 불릿/번호/머리말 없이 줄글로 작성합니다.\n`) +
    "4. 문항의 의도에 정확히 답하세요(지원동기면 동기와 회사 적합성, 성장과정이면 가치관 형성, 직무역량이면 경험 근거, 입사 후 포부면 구체적 계획).\n" +
    "5. 정보가 부족하면 학력·스킬·어학·태도를 중심으로 담백하게. 과장·미사여구는 피합니다.\n" +
    "6. 한국어로만 작성하세요.\n" +
    (keywordList.length
      ? "7. [최우선] 다음은 지원자가 직접 제공한 소재·사실입니다(이력서에 없어도 사실로 간주). 위 '다듬기 방향'이 분량·내용 유지를 지시하더라도, 이 소재만큼은 반드시 답변에 새로 녹여 넣으세요(필요하면 문장을 추가해 분량을 늘려도 됩니다). 단순 나열이 아니라, 왜 그것이 지원 동기·가치관·계기와 이어지는지 이야기로 발전시켜 풀어냅니다. 예: '아빠가 삼성전자 출신' → 아버지의 영향으로 그 분야를 존경하게 되었고 그 길을 따라 지원하게 된 계기로 서술. 다만 제공되지 않은 수상·수치·구체 성과를 새로 지어내지는 마세요.\n" +
        `   반드시 반영할 소재: ${keywordList.map((k) => `「${k}」`).join(", ")}\n`
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
