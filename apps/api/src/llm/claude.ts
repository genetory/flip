// Claude 공용 호출 헬퍼 — 서비스의 모든 텍스트 생성은 여기를 거친다(2026-10 OpenAI → Claude 전환).
//
// 모델은 두 단계로만 쓴다(낭비 방지):
//   LIGHT_MODEL   (Haiku 5.5)  — 번역·요약·다듬기·추출·짧은 필드 생성 등 대부분의 기능. 이전 gpt-4o-mini 자리.
//   QUALITY_MODEL (Sonnet 5.5) — 자소서·문서 점검·모의 면접·코칭·매칭 재정렬·인재 인사이트처럼
//                                판단 품질이 곧 기능 가치인 곳. 이전 gpt-4o / claude-sonnet-5 자리.
// effort 기본은 low — 짧은 구조화 출력에서 생각 토큰을 아낀다. 판단이 핵심인 호출만 medium 을 넘긴다.
//
// 구조화 출력은 output_config.format(json_schema)으로 강제한다. Sonnet 5.5 는 강제 tool_choice 를
// 400 으로 거절하므로 tool use 방식은 쓰지 않는다. 스키마에 Claude 가 받지 않는 키워드(maxLength 등)가
// 있으면 sanitizeSchema 가 떼어 내고, 그래도 400 이면 'JSON만 답하라' 텍스트 모드로 한 번 더 시도한다.
import Anthropic from "@anthropic-ai/sdk";

export const LIGHT_MODEL = process.env.CLAUDE_LIGHT_MODEL ?? "claude-haiku-5-5";
export const QUALITY_MODEL = process.env.CLAUDE_QUALITY_MODEL ?? "claude-sonnet-5-5";

const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 120_000);
const MAX_RETRIES = Number(process.env.LLM_MAX_RETRIES ?? 2);

export type Effort = "low" | "medium" | "high";
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type LlmUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
};

let cached: Anthropic | null = null;
function client(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("missing_anthropic_key");
  cached = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: MAX_RETRIES });
  return cached;
}

export function hasLlm(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function usageOf(resp: Anthropic.Message): LlmUsage {
  return {
    inputTokens: resp.usage?.input_tokens ?? 0,
    outputTokens: resp.usage?.output_tokens ?? 0,
    cacheReadInputTokens: resp.usage?.cache_read_input_tokens ?? 0,
    cacheCreationInputTokens: resp.usage?.cache_creation_input_tokens ?? 0
  };
}

function textOf(resp: Anthropic.Message): string {
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

// system 블록 — 고정부/가변부가 오면 고정부에만 캐시 breakpoint 를 둔다(캐시는 prefix 바이트 완전 일치).
// 최소 캐시 길이에 못 미치면 조용히 캐시가 안 걸릴 뿐 동작·비용은 그대로다.
function systemBlocks(a: { system: string; systemCacheable?: string; systemVariable?: string }): Anthropic.TextBlockParam[] {
  if (a.systemCacheable && a.systemVariable !== undefined) {
    return [
      { type: "text", text: a.systemCacheable, cache_control: { type: "ephemeral" } },
      { type: "text", text: a.systemVariable }
    ];
  }
  return [{ type: "text", text: a.system, cache_control: { type: "ephemeral" } }];
}

function toMessages(a: { user?: string; messages?: ChatMessage[] }): Anthropic.MessageParam[] {
  if (a.messages && a.messages.length) {
    // 첫 메시지는 user 여야 한다 — 인사말 등 assistant 로 시작하는 대화는 앞을 잘라 맞춘다.
    const firstUser = a.messages.findIndex((m) => m.role === "user");
    return (firstUser > 0 ? a.messages.slice(firstUser) : a.messages).map((m) => ({ role: m.role, content: m.content }));
  }
  return [{ role: "user", content: a.user ?? "" }];
}

// 모델이 코드블록·앞말을 붙여도 첫 '{' ~ 마지막 '}' 를 JSON 으로 본다.
export function extractJsonText(raw: string): string {
  const s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  if (s.startsWith("{") && s.endsWith("}")) return s;
  const i = s.indexOf("{");
  const j = s.lastIndexOf("}");
  return i >= 0 && j > i ? s.slice(i, j + 1) : s;
}

function parseObject<T>(raw: string): T | null {
  try {
    const v = JSON.parse(extractJsonText(raw));
    return v && typeof v === "object" && !Array.isArray(v) ? (v as T) : null;
  } catch {
    return null;
  }
}

const JSON_ONLY = "\n\n응답은 JSON 객체 하나만 출력한다. 코드블록(```)·설명·앞말 없이 '{' 로 시작해 '}' 로 끝낸다.";

// Claude 구조화 출력이 받지 않는 제약 키워드를 떼고, 모든 object 에 additionalProperties:false 를 단다.
// 뗀 제약(글자 수·개수·범위)은 description 에 적어 모델이 지키게 한다 — 호출부 zod 검증이 그 범위를 본다.
const DROP_KEYS = new Set(["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minLength", "maxLength", "pattern", "maxItems", "uniqueItems"]);
export function sanitizeSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitizeSchema);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === "strict") continue;
    if (DROP_KEYS.has(k) || (k === "minItems" && typeof v === "number" && v > 1)) {
      dropped.push(`${k}: ${JSON.stringify(v)}`);
      continue;
    }
    if (k === "format" && typeof v === "string" && !["date-time", "time", "date", "duration", "email", "hostname", "uri", "ipv4", "ipv6", "uuid"].includes(v)) continue;
    // properties·$defs 의 키는 필드 이름이라 그대로 두고 값만 정리한다.
    if ((k === "properties" || k === "$defs") && v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([pk, pv]) => [pk, sanitizeSchema(pv)]));
      continue;
    }
    out[k] = sanitizeSchema(v);
  }
  if (dropped.length) out.description = `${typeof out.description === "string" ? out.description + " " : ""}{${dropped.join(", ")}}`;
  const t = out.type;
  if (t === "object" || (Array.isArray(t) && t.includes("object"))) out.additionalProperties = false;
  return out;
}

type BaseArgs = {
  model: string;
  system: string;
  systemCacheable?: string;
  systemVariable?: string;
  user?: string;
  messages?: ChatMessage[];
  maxTokens?: number;
  effort?: Effort;
};

/** 자유 텍스트 응답. 대화형 답변·짧은 문장 생성용. */
export async function claudeText(a: BaseArgs): Promise<{ text: string; usage: LlmUsage }> {
  const resp = await client().messages.create({
    model: a.model,
    max_tokens: a.maxTokens ?? 4096,
    output_config: { effort: a.effort ?? "low" },
    system: systemBlocks(a),
    messages: toMessages(a)
  });
  if (resp.stop_reason === "refusal") throw new Error("llm_refusal");
  return { text: textOf(resp), usage: usageOf(resp) };
}

export type ClaudeJsonResult<T> = { data: T | null; raw: string; usage?: LlmUsage; error?: string };

/**
 * JSON 객체 응답. schema 를 주면 구조화 출력으로 강제하고, 없으면 프롬프트로 'JSON만' 요구해 파싱한다.
 * 던지지 않는다 — 실패는 data:null + error 로 돌려준다(호출부가 502 등으로 처리).
 */
export async function claudeJson<T = Record<string, unknown>>(
  a: BaseArgs & { schema?: Record<string, unknown> }
): Promise<ClaudeJsonResult<T>> {
  let anthropic: Anthropic;
  try {
    anthropic = client();
  } catch (e) {
    return { data: null, raw: "", error: (e as Error).message };
  }
  const base = {
    model: a.model,
    max_tokens: a.maxTokens ?? 16000,
    messages: toMessages(a)
  };
  if (a.schema) {
    try {
      const resp = await anthropic.messages.create({
        ...base,
        system: systemBlocks(a),
        output_config: {
          effort: a.effort ?? "low",
          format: { type: "json_schema", schema: sanitizeSchema(a.schema) as Record<string, unknown> }
        }
      });
      if (resp.stop_reason === "refusal") return { data: null, raw: "", usage: usageOf(resp), error: "llm_refusal" };
      const raw = textOf(resp);
      const data = parseObject<T>(raw);
      if (data) return { data, raw, usage: usageOf(resp) };
      if (resp.stop_reason === "max_tokens") return { data: null, raw, usage: usageOf(resp), error: "max_tokens" };
    } catch (e) {
      // 스키마를 API 가 거절한 경우만 텍스트 모드로 재시도. 그 밖의 오류(429·5xx 등)는 SDK 재시도 후 실패로 본다.
      if (!(e instanceof Anthropic.BadRequestError)) return { data: null, raw: "", error: (e as Error).message?.slice(0, 200) ?? "call_failed" };
      console.warn("[llm] structured output rejected, retrying as text JSON:", (e as Error).message?.slice(0, 200));
    }
  }
  try {
    const schemaHint = a.schema ? `\n\nJSON 스키마:\n${JSON.stringify(a.schema)}` : "";
    const sys = systemBlocks({
      system: a.system + schemaHint + JSON_ONLY,
      systemCacheable: a.systemCacheable,
      systemVariable: a.systemVariable !== undefined ? a.systemVariable + schemaHint + JSON_ONLY : undefined
    });
    const resp = await anthropic.messages.create({ ...base, system: sys, output_config: { effort: a.effort ?? "low" } });
    if (resp.stop_reason === "refusal") return { data: null, raw: "", usage: usageOf(resp), error: "llm_refusal" };
    const raw = textOf(resp);
    const data = parseObject<T>(raw);
    return data ? { data, raw, usage: usageOf(resp) } : { data: null, raw, usage: usageOf(resp), error: "invalid_json" };
  } catch (e) {
    return { data: null, raw: "", error: (e as Error).message?.slice(0, 200) ?? "call_failed" };
  }
}

/** 기존 `JSON.parse(raw)` 호출부용 — JSON 객체 문자열을 돌려준다(실패하면 "{}"). */
export async function claudeJsonRaw(a: BaseArgs & { schema?: Record<string, unknown> }): Promise<string> {
  const r = await claudeJson(a);
  if (!r.data && r.error) console.warn(`[llm] ${a.model} json failed:`, r.error);
  return r.data ? JSON.stringify(r.data) : "{}";
}
