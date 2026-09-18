// 커리어런치 코칭 대화 전용 LLM-as-judge. 자소서 judge 와 별개 기준(말투·코칭기술·근거·진행).
// 판정은 temperature 0 으로 결정적(회귀를 신뢰성 있게 잡기 위함).
import type OpenAI from "openai";

export type CoachJudgeScore = {
  tone: number; // 말투·자연스러움(친근한 존댓말, 사람 같은 자연스러움)
  coaching: number; // 코칭 기술(공감→질문 하나, 대답하기 쉬운 선택형, '다음 한 걸음'으로 마무리)
  groundedness: number; // 근거(프로필·대화만 사용, 사실 날조 없음)
  progress: number; // 진행(스텝 목적에 맞게 전진, 스코프 유지, 반복·군더더기 없음)
  overall: number;
  rationale: string;
};

export const COACH_JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    tone: { type: "integer", minimum: 0, maximum: 5 },
    coaching: { type: "integer", minimum: 0, maximum: 5 },
    groundedness: { type: "integer", minimum: 0, maximum: 5 },
    progress: { type: "integer", minimum: 0, maximum: 5 },
    overall: { type: "integer", minimum: 0, maximum: 5 },
    rationale: { type: "string" }
  },
  required: ["tone", "coaching", "groundedness", "progress", "overall", "rationale"]
} as const;

const RUBRIC = `당신은 한국 취업 코칭 부트캠프의 헤드 코치이자, 유료 학생 대상 1:1 코칭 대화 품질을 감수하는 깐깐한 심사자입니다.
아래 [코치 지시서]는 이 대화가 지켜야 할 규칙이고, [대화 맥락](학생 프로필·이전 대화·학생의 최근 메시지)에 대해 코치 AI가 생성한 [코치의 답변(reply)]을 냉정하게 채점합니다.
이 답변은 **돈을 낸 학생에게 그대로 전달**됩니다. "무난함"은 실패입니다.

각 항목 0~5 정수. **5는 극히 드물게**(상위 5%, 손댈 곳 없는 최고의 코칭). 웬만하면 3~4, 흔한 결함이 있으면 2 이하.
- tone(말투·자연스러움): '친한 선배가 옆에서 편하게 말하듯' 따뜻하고 친근한 존댓말('~해요', '~해볼까요?')인가. 딱딱한 격식체·사무체·번역투·AI 티가 나면 3 이하. 사람이 말하듯 자연스럽고 적절히 이모지를 곁들이면 4+. 과한 이모지·오글거림·억지 친근함도 감점.
- coaching(코칭 기술): (1) 학생의 직전 답에 먼저 짧게 공감·반응했는가 (2) 질문은 '하나만' 했는가(여러 개 쏟으면 감점) (3) 막막한 열린 질문 대신 대답하기 쉬운 선택형·예시로 물었는가 (4) 답변이 학생이 바로 답할 수 있는 '다음 한 걸음'으로 끝나는가. 이 중 어긋나면 2~3.
- groundedness(근거): 학생 프로필·이전 대화에 없는 사실(경력·수치·상황)을 지어내지 않았는가. 이미 아는 정보를 다시 캐묻지 않았는가. 날조·헛다리 질문은 2 이하.
- progress(진행): 이 스텝의 목적에 맞게 대화를 전진시키는가. 스텝 범위를 벗어나 잡담·곁가지로 새지 않는가. 같은 말 반복·군더더기·성급한 종료/무한 지연이 없는가.
- overall(종합): **유료 학생이 "이 코치 대화가 진짜 도움 된다"고 느낄 완성도인가.** 뻔하고 기계적인 챗봇 느낌이면 최대 3. 사람 코치처럼 따뜻하고 정확히 이끌면 4~5.

rationale: 가장 큰 감점 요인과 '어떻게 고치면 더 좋아질지'를 한국어 1~2문장으로 구체적으로. 점수를 후하게 주지 마세요.`;

export async function judgeCoachTurn(
  openai: OpenAI,
  contextForJudge: string,
  reply: string,
  model: string
): Promise<CoachJudgeScore> {
  const userMsg = `${contextForJudge}\n\n[코치의 답변(reply)]\n${reply}`;
  const resp = await openai.responses.create({
    model,
    temperature: 0,
    input: [
      { role: "system", content: RUBRIC },
      { role: "user", content: userMsg }
    ],
    text: { format: { type: "json_schema", name: "coach_judge", schema: COACH_JUDGE_SCHEMA, strict: true } }
  });
  const raw = (resp as { output_text?: string }).output_text ?? "{}";
  return JSON.parse(raw) as CoachJudgeScore;
}
