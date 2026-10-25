// 웹 서버 라우트(app/api/*)용 Claude JSON 호출. API 서버의 src/llm/claude.ts 와 같은 규칙:
// 가벼운 상담·추출은 Haiku 5.5, 구조화 출력(json_schema)으로 형식을 강제하고 effort 는 low.
// ANTHROPIC_API_KEY 는 웹 앱 런타임 설정에 있어야 한다(없으면 null → 라우트가 502 로 폴백).
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.CLAUDE_LIGHT_MODEL || "claude-haiku-5-5";

let cached: Anthropic | null = null;
function client(): Anthropic | null {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  cached = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 2 });
  return cached;
}

export function hasClaudeKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function claudeJsonObject<T>(a: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T | null> {
  const anthropic = client();
  if (!anthropic) return null;
  // 첫 메시지는 user 여야 한다.
  const first = a.messages.findIndex((m) => m.role === "user");
  const messages = first > 0 ? a.messages.slice(first) : a.messages;
  if (!messages.length) return null;
  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: a.maxTokens ?? 4096,
    output_config: { effort: "low", format: { type: "json_schema", schema: a.schema } },
    system: [{ type: "text", text: a.system, cache_control: { type: "ephemeral" } }],
    messages
  });
  if (resp.stop_reason === "refusal") return null;
  const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
