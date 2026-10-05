// 문서 전체 점검(AI) 프롬프트·스키마 — 에디터의 '전체 점검' 버튼이 쓰는 것.
//
// index.ts 가 아니라 여기 둔 이유: 프롬프트가 이 기능의 전부라서 모델을 실제로 돌려
// 확인해야 하는데, 26,000 줄짜리 index.ts 안에 있으면 서버를 띄우고 로그인해야만 볼 수 있다.
// 여기 있으면 엔드포인트와 검증 스크립트가 **같은 프롬프트**를 쓴다.
//
// 저장할 때는 절대 돌지 않는다(사용자가 부르지 않은 비용이 나가면 안 된다).
// 규칙 점검(platform-web/lib/talent/resume-scan.ts, cover-scan.ts)이 이미 잡는 것은
// 프롬프트로 막는다 — AI 는 규칙으로 못 잡는 '판단'만 본다.
import { aiLangDirective } from "./prompts";

/** 결과는 반드시 입력으로 준 블록 id 로 돌려받는다. 그래야 화면이 문서 본문의 그 블록에
 *  표시를 띄울 수 있다. */
export const REVIEW_FINDINGS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          severity: { type: "string", enum: ["high", "medium"] },
          issue: { type: "string" },
          fix: { type: "string" }
        },
        required: ["id", "severity", "issue", "fix"]
      }
    }
  },
  required: ["findings"]
};

export type ReviewFinding = { id: string; severity: "high" | "medium"; issue: string; fix: string };

/** AI 가 돌려준 지적을 믿을 수 있는 형태로 — 모르는 id·빈 내용은 버리고, 한 블록당 2건까지.
 *  모르는 id 를 버리는 게 핵심이다: AI 가 id 를 지어내도 엉뚱한 블록에 표시되지 않는다. */
export function normalizeReviewFindings(raw: unknown, allowed: Set<string>, maxTotal: number): ReviewFinding[] {
  if (!Array.isArray(raw)) return [];
  const perId = new Map<string, number>();
  const out: ReviewFinding[] = [];
  for (const r of raw as { id?: unknown; severity?: unknown; issue?: unknown; fix?: unknown }[]) {
    if (!r || typeof r !== "object") continue;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    if (!allowed.has(id)) continue;
    const issue = typeof r.issue === "string" ? r.issue.trim().slice(0, 200) : "";
    if (!issue) continue;
    const n = perId.get(id) ?? 0;
    if (n >= 2) continue;
    perId.set(id, n + 1);
    out.push({
      id,
      severity: r.severity === "high" ? "high" : "medium",
      issue,
      fix: typeof r.fix === "string" ? r.fix.trim().slice(0, 400) : ""
    });
    if (out.length >= maxTotal) break;
  }
  return out;
}

/** 규칙 점검이 이미 보여 주는 것 — AI 가 중복으로 지적하면 목록이 쓸모없이 길어진다.
 *  gpt-4o-mini 는 '하지 마라'를 뭉뚱그려 주면 흘리므로, 금지 대상을 판정 가능한 문장으로 적는다. */
const SKIP_RULES =
  "프로그램이 이미 규칙으로 찾아 사용자에게 보여 주는 것이 있습니다. 아래에 해당하는 지적은 **내보내지 마세요**:\n" +
  "- 숫자·수치·정량적 성과가 없다는 지적\n" +
  "- 글이 짧다 / 길다 / 글자 수가 모자라다·넘친다는 지적\n" +
  "- 기간·날짜가 비어 있다는 지적\n" +
  "- 내용이 비어 있다는 지적\n" +
  "- 말투·문체·종결어미('…했습니다' 등)에 관한 지적\n" +
  "- 다른 항목과 내용이 겹친다는 지적\n" +
  "- '흔한 표현이다 / 상투적이다'라는 지적\n" +
  "- '더 구체적으로 쓰라'는 말만 있고 무엇이 왜 불분명한지는 없는 지적\n";

const HONESTY_RULES =
  "규칙:\n" +
  "1. 사실을 만들지 마세요. 글에 없는 경험·수치·회사·역할을 새로 쓰면 안 됩니다.\n" +
  "2. **잘 쓴 글은 건드리지 마세요.** 한 항목에 (가) 본인이 무엇을 했는지, (나) 어떻게 했는지, " +
  "(다) 무엇이 달라졌는지가 이미 드러나 있으면 그 항목은 findings 에 넣지 마세요. " +
  "잘 쓴 글에 억지로 트집을 잡으면 사용자가 이 점검을 믿지 않게 됩니다 — 놓치는 것보다 나쁩니다.\n" +
  "3. fix 는 사용자가 그대로 쓸 수 있는 **완성된 한 문장**으로 쓰세요. 다만 근거가 글에 없으면 " +
  "문장을 지어내지 말고, 무엇을 적어야 하는지 묻는 형태로 쓰세요(예: '맡은 역할이 무엇이었는지 한 줄 넣어 주세요').\n" +
  "4. issue 는 '무엇이 왜 약한지' 한 문장. 글에서 걸린 대목을 가리켜 쓰세요. 짧고 담백하게, 훈계하지 마세요.\n" +
  "5. 고칠 게 없으면 findings 를 빈 배열로 두세요. 억지로 채우지 마세요. 0건도 좋은 답입니다.\n" +
  "6. 한 항목에 최대 2건, 전체 최대 8건. 읽는 사람에게 가장 크게 걸리는 것부터.\n" +
  "7. severity: high = 이대로 내면 손해인 것, medium = 고치면 나아지는 것.\n" +
  "8. 안내·머리말·따옴표를 붙이지 마세요. issue·fix 둘 다 문장만.\n" +
  "\n[내보내기 전 자기 점검] 지적 하나하나에 대해 스스로 물어보세요 — " +
  "이 지적이 숫자·길이·기간·말투·중복·상투어에 관한 것인가? 또는 '더 구체적으로'라는 말뿐인가? " +
  "하나라도 그렇다면 그 지적을 버리세요. 남은 것만 내보내세요.\n";

const ID_RULE = "\nid 는 반드시 입력으로 받은 항목의 id 를 그대로 쓰세요. 새 id 를 만들면 안 됩니다.\n";
const JSON_SHAPE =
  'JSON 한 개 객체로만 응답: { "findings": [{ "id": string, "severity": "high"|"medium", "issue": string, "fix": string }] }';

export type ResumeReviewInput = {
  targetRole?: string;
  summary?: string;
  items: { id: string; section: string; company?: string; period?: string; text: string }[];
  locale?: string;
};

export function buildResumeReviewPrompt(input: ResumeReviewInput): { system: string; user: string } {
  const system =
    "당신은 한국 기업 채용을 돕는 이력서 컨설턴트입니다. 지원자가 쓴 이력서 항목들을 읽고, " +
    "채용 담당자가 읽었을 때 걸릴 만한 곳을 집어 줍니다.\n\n" +
    SKIP_RULES +
    "\n대신 이런 것을 보세요(규칙으로는 잡을 수 없는 것):\n" +
    "- 근거 없는 주장 — '성장에 기여', '효율을 개선' 처럼 무엇을 했는지가 없는 말\n" +
    "- 역할이 불분명 — 팀이 한 일인지 본인이 한 일인지 알 수 없는 문장\n" +
    "- 한 일만 나열 — 왜 했는지·어떻게 했는지·무엇이 달라졌는지가 없는 문장\n" +
    "- 희망 직무와 관련이 약해서 지면만 차지하는 항목\n" +
    "- 과장·단정 — 글에 있는 근거보다 크게 말한 곳\n\n" +
    HONESTY_RULES +
    ID_RULE +
    JSON_SHAPE +
    aiLangDirective(input.locale);
  const user =
    `${input.targetRole ? `지원자 희망 직무: ${input.targetRole}\n` : ""}` +
    `${input.summary ? `\n[자기소개]\n${input.summary}\n` : ""}` +
    `\n[이력서 항목]\n` +
    input.items
      .map(
        (it) =>
          `- id: ${it.id}\n  구분: ${it.section}\n` +
          `${it.company ? `  소속/제목: ${it.company}\n` : ""}` +
          `${it.period ? `  기간: ${it.period}\n` : ""}` +
          `  내용: ${it.text || "(비어 있음)"}`
      )
      .join("\n");
  return { system, user };
}

export type CoverReviewInput = {
  company?: string;
  jobText?: string;
  questions: { id: string; prompt: string; limit?: number | null; text: string }[];
  locale?: string;
};

export function buildCoverReviewPrompt(input: CoverReviewInput): { system: string; user: string } {
  const system =
    "당신은 한국 기업 채용을 돕는 자기소개서 컨설턴트입니다. 지원자가 쓴 문항별 답변을 읽고, " +
    "채용 담당자가 읽었을 때 걸릴 만한 곳을 집어 줍니다.\n\n" +
    SKIP_RULES +
    "\n대신 이런 것을 보세요(규칙으로는 잡을 수 없는 것):\n" +
    "- 문항에 답하지 않음 — 묻는 것과 다른 이야기를 한 답변\n" +
    "- 경험은 있는데 그래서 무엇을 배웠는지·지원 직무와 어떻게 이어지는지가 없음\n" +
    "- 성장 과정만 길고 지금 할 수 있는 일이 안 보임\n" +
    "- 근거 없는 주장 — '책임감이 강하다' 처럼 사례 없이 성격만 말한 곳\n" +
    "- 지원 회사·직무와 맞지 않는 내용(공고가 주어진 경우)\n\n" +
    HONESTY_RULES +
    ID_RULE +
    JSON_SHAPE +
    aiLangDirective(input.locale);
  const user =
    `${input.company ? `지원 회사: ${input.company}\n` : ""}` +
    `${input.jobText ? `\n[채용 공고]\n${input.jobText}\n` : ""}` +
    `\n[문항과 답변]\n` +
    input.questions
      .map(
        (q) =>
          `- id: ${q.id}\n  문항: ${q.prompt || "(문항 없음)"}\n` +
          `${q.limit ? `  글자 수 제한: ${q.limit}\n` : ""}` +
          `  답변: ${q.text || "(비어 있음)"}`
      )
      .join("\n\n");
  return { system, user };
}
