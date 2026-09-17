// LLM-as-judge — 강한 모델로 출력 품질을 루브릭 채점(각 0~5).
// 규칙 검사(checks.ts)가 못 잡는 자연스러움·근거성·문항 적합성을 평가한다.
import type OpenAI from "openai";
import type { GoldenCase, JudgeScore } from "./types";

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    groundedness: { type: "integer", minimum: 0, maximum: 5 },
    naturalness: { type: "integer", minimum: 0, maximum: 5 },
    relevance: { type: "integer", minimum: 0, maximum: 5 },
    structure: { type: "integer", minimum: 0, maximum: 5 },
    overall: { type: "integer", minimum: 0, maximum: 5 },
    rationale: { type: "string" }
  },
  required: ["groundedness", "naturalness", "relevance", "structure", "overall", "rationale"]
} as const;

const RUBRIC = `당신은 한국 채용 서류(이력서·자기소개서) 첨삭 전문가입니다. 아래 [입력 근거]만을 기준으로 [생성 결과]를 냉정하게 채점하세요.
각 항목 0~5 정수:
- groundedness(근거성): 입력에 없는 사실(회사·수치·성과·경력·일화)을 지어냈으면 낮게. 5=전부 근거 있음, 0=핵심이 날조.
- naturalness(자연스러움): 어색한 번역투·비문·과장 미사여구 없이 한국어가 매끄럽고 톤이 적절한가.
- relevance(적합성): 문항/다듬기 지시의 의도에 정확히 답했는가.
- structure(구성): 두괄식·STAR·하나의 매끄러운 흐름 등 구조가 좋은가.
- overall(종합): 실제로 제출/사용할 만한 완성도.
반드시 [입력 근거]에 근거해 채점하고, rationale 에 감점 사유를 1~2문장 한국어로.`;

export async function judgeCase(
  openai: OpenAI,
  c: GoldenCase,
  output: string,
  model: string
): Promise<JudgeScore> {
  const inputStr = JSON.stringify(c.input, null, 1);
  const userMsg = `[입력 근거]\n${inputStr}\n\n[생성 결과]\n${output}`;
  const resp = await openai.responses.create({
    model,
    input: [
      { role: "system", content: RUBRIC },
      { role: "user", content: userMsg }
    ],
    text: { format: { type: "json_schema", name: "judge_result", schema: JUDGE_SCHEMA, strict: true } }
  });
  const raw = (resp as { output_text?: string }).output_text ?? "{}";
  const parsed = JSON.parse(raw) as JudgeScore;
  return parsed;
}
