// Anthropic(Claude) 구조화 생성 헬퍼 — OpenAI generateJson 과 동일한 계약을 따른다.
// 구조화 출력은 tool use 로 강제한다: 원하는 JSON 스키마를 input_schema 로 하는 단일 도구를
// 정의하고 tool_choice 로 그 도구 사용을 강제 → 모델이 tool_use.input 에 파싱된 객체를 돌려준다.
//
// 클라이언트/키는 지연 생성(ANTHROPIC_API_KEY). 키가 없으면 명확한 error 를 담아 반환한다.
import Anthropic from "@anthropic-ai/sdk";

export type AnthropicJsonArgs = {
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  schemaName: string;
  temperature?: number;
  maxTokens?: number;
};

export type AnthropicJsonResult<T> = {
  data: T | null;
  raw: string;
  via: "anthropic" | "none";
  error?: string;
  usage?: { inputTokens: number; outputTokens: number };
};

let cached: Anthropic | null = null;
function client(): Anthropic | null {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  cached = new Anthropic({ apiKey });
  return cached;
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateJsonAnthropic<T = Record<string, unknown>>(
  a: AnthropicJsonArgs
): Promise<AnthropicJsonResult<T>> {
  const { model, system, user, schema, schemaName, temperature, maxTokens } = a;
  const anthropic = client();
  if (!anthropic) return { data: null, raw: "", via: "none", error: "missing_anthropic_key" };

  try {
    // 최신 Claude 모델은 temperature 를 받지 않으므로(“deprecated”) 전달하지 않는다(기본값 사용).
    void temperature;
    const resp = await anthropic.messages.create({
      model,
      max_tokens: maxTokens ?? 4096,
      // 시스템 프롬프트를 캐시 가능 블록으로 표시 — 반복 호출에서 입력 토큰 재사용분을 대폭 할인.
      // (지시·품질 가이드가 길고 요청 간 대체로 동일. 캐시 미스여도 비용/동작 변화 없음.)
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: user }],
      tools: [
        {
          name: schemaName,
          description: "지정한 스키마에 맞춰 최종 결과를 이 도구로만 반환하세요.",
          input_schema: schema as Anthropic.Tool.InputSchema
        }
      ],
      tool_choice: { type: "tool", name: schemaName }
    });
    const usage = {
      inputTokens: resp.usage?.input_tokens ?? 0,
      outputTokens: resp.usage?.output_tokens ?? 0
    };
    const block = resp.content.find((b) => b.type === "tool_use");
    if (block && block.type === "tool_use") {
      const data = (block.input ?? null) as T | null;
      return { data, raw: JSON.stringify(block.input ?? {}), via: "anthropic", usage };
    }
    // 도구를 안 쓰고 텍스트로 답한 경우(드묾) — 텍스트에서 JSON 파싱 시도.
    const textBlock = resp.content.find((b) => b.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
    try {
      const parsed = JSON.parse(raw) as T;
      if (parsed && typeof parsed === "object") return { data: parsed, raw, via: "anthropic", usage };
    } catch {
      /* fallthrough */
    }
    return { data: null, raw, via: "anthropic", error: "no_tool_use", usage };
  } catch (e) {
    return { data: null, raw: "", via: "none", error: (e as Error).message?.slice(0, 200) ?? "call_failed" };
  }
}
