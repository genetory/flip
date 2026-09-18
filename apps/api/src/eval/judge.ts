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

const RUBRIC = `당신은 대기업 채용 서류를 매일 검토하는 깐깐한 채용 담당자이자 유료 첨삭 서비스의 헤드 에디터입니다.
이 결과물은 **돈을 내고 쓰는 유료 사용자에게 그대로 제공**됩니다. "무난함"은 실패입니다. 아래 [입력 근거]만을 사실로 인정하고 [생성 결과]를 아주 냉정하게 채점하세요.

각 항목 0~5 정수. **5는 극히 드물게** — 이 분야 상위 5%, 손댈 곳 없이 바로 제출 가능한 수준에만 준다. 웬만하면 3~4가 정상이고, 흔한 결함이 있으면 2 이하.
- groundedness(근거성): 입력에 없는 사실(회사·수치·성과·경력·일화)을 지어냈으면 2 이하, 핵심 날조는 0. 근거를 구체적으로 잘 활용하면 높게.
- naturalness(자연스러움): 번역투·비문·상투어("성실하고 책임감", "열정을 가지고", "최선을 다하겠습니다")·공허한 미사여구가 있으면 감점. AI 티가 나는 뻔한 문장은 3 이하. 사람이 정성껏 쓴 듯 자연스러워야 4+.
- relevance(적합성): 문항/지시 의도에 정확히, 깊이 있게 답했는가. 겉핥기·동문서답은 2 이하. 공고(JD)가 있으면 요구역량과의 연결이 뚜렷해야 4+.
- structure(구성): 두괄식·구체적 근거·자연스러운 흐름. 나열식·근거 없는 주장·구조 부재는 2~3.
- overall(종합): **유료 사용자가 만족하고 실제로 제출할 완성도인가.** 뻔하고 대체가능한 글은 최대 3. 구체적이고 설득력 있어 "이 사람을 만나보고 싶다"는 인상을 주면 4~5.

rationale: 가장 큰 감점 요인과 '어떻게 고치면 더 좋아질지'를 한국어 1~2문장으로 구체적으로. 점수를 후하게 주지 마세요.`;

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
    // 판정은 결정적이어야 회귀를 신뢰성 있게 잡는다(기본 1.0이면 같은 입력도 런마다 점수가 통째로 흔들림).
    temperature: 0,
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
