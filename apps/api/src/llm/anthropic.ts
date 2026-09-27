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
  // 프롬프트 캐싱용 분리 입력. 둘 다 주면 system 대신 이걸 쓰고, 고정부에만 cache_control 을 건다.
  // systemCacheable 은 요청마다 바이트가 완전히 같아야 한다(캐시는 prefix 완전 일치).
  systemCacheable?: string;
  systemVariable?: string;
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
  // cacheReadInputTokens 가 반복 호출에서 계속 0 이면 캐시가 안 맞는 것이다(고정부에 요청별 값이 섞였는지 확인).
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
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

// system 블록 구성 — 고정부/가변부가 오면 고정부에만 캐시 breakpoint 를 둔다.
// 캐시 가능한 최소 prefix 길이(모델별 512~4096 토큰)에 못 미치면 조용히 캐시가 안 걸릴 뿐,
// 동작·비용은 그대로다. 자소서 고정부는 약 5K 토큰이라 충분히 넘는다.
function buildSystemBlocks(a: {
  system: string;
  systemCacheable?: string;
  systemVariable?: string;
}): Anthropic.TextBlockParam[] {
  const { system, systemCacheable, systemVariable } = a;
  if (systemCacheable && systemVariable !== undefined) {
    return [
      { type: "text", text: systemCacheable, cache_control: { type: "ephemeral" } },
      { type: "text", text: systemVariable }
    ];
  }
  return [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
}

export async function generateJsonAnthropic<T = Record<string, unknown>>(
  a: AnthropicJsonArgs
): Promise<AnthropicJsonResult<T>> {
  const { model, system, user, schema, schemaName, temperature, maxTokens, systemCacheable, systemVariable } = a;
  const anthropic = client();
  if (!anthropic) return { data: null, raw: "", via: "none", error: "missing_anthropic_key" };

  try {
    // 최신 Claude 모델은 temperature 를 받지 않으므로(“deprecated”) 전달하지 않는다(기본값 사용).
    void temperature;
    const resp = await anthropic.messages.create({
      model,
      max_tokens: maxTokens ?? 4096,
      // 캐시는 prefix 바이트 완전 일치라서, 고정부와 가변부를 따로 받은 경우에는 고정부 블록에만
      // cache_control 을 건다. 한 블록에 몰아넣고 요청별 값(목표 글자 수·키워드 등)을 끼워 넣으면
      // 매 호출 캐시 미스가 된다. 분리 입력이 없으면 기존처럼 전체를 한 블록으로 캐시 시도.
      system: buildSystemBlocks({ system, systemCacheable, systemVariable }),
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
      outputTokens: resp.usage?.output_tokens ?? 0,
      cacheReadInputTokens: resp.usage?.cache_read_input_tokens ?? 0,
      cacheCreationInputTokens: resp.usage?.cache_creation_input_tokens ?? 0
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
