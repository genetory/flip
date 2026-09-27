// 구조화 생성 공용 헬퍼 — Responses API json_schema(강제 스키마)로 먼저 시도하고,
// 실패하면 chat.completions json_object 로 폴백해 '항상 파싱된 객체'를 돌려준다.
// 기존 자소서·이력서 생성기의 "JSON.parse 실패 → 조용히 {} → 502" 실패 클래스를 제거한다.
import type OpenAI from "openai";
import { generateJsonAnthropic } from "./anthropic";

// model 이 Claude 계열이면 Anthropic 경로를 쓴다(생성기만 벤더 교체, judge 등 나머지는 그대로).
export function isClaudeModel(model: string): boolean {
  return /^claude/i.test(model);
}

export type GenerateJsonArgs = {
  openai: OpenAI;
  model: string;
  system: string;
  user: string;
  // 프롬프트 캐싱용 분리 입력(선택). Claude 경로에서만 의미가 있고, OpenAI 경로는 합본 system 을 쓴다.
  systemCacheable?: string;
  systemVariable?: string;
  // 강제할 JSON 스키마(Responses API 용). object + additionalProperties:false 권장.
  schema: Record<string, unknown>;
  schemaName: string;
  temperature?: number;
  strict?: boolean;
};

export type GenerateJsonResult<T> = {
  data: T | null;
  raw: string;
  via: "responses" | "chat" | "anthropic" | "none";
  error?: string;
  // Anthropic 경로에서만 채워진다. 프롬프트 캐시가 실제로 맞는지 확인하는 유일한 수단이므로
  // 호출부에서 버리지 말 것(cacheReadInputTokens 가 계속 0 이면 고정부가 캐시에 안 걸린 것).
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
};

function tryParse<T>(raw: string): T | null {
  try {
    const v = JSON.parse(raw || "{}");
    return v && typeof v === "object" ? (v as T) : null;
  } catch {
    return null;
  }
}

export async function generateJson<T = Record<string, unknown>>(
  a: GenerateJsonArgs
): Promise<GenerateJsonResult<T>> {
  const { openai, model, system, user, schema, schemaName, temperature, strict = true, systemCacheable, systemVariable } = a;

  // 0) Claude 계열이면 Anthropic(tool use) 경로로 라우팅.
  if (isClaudeModel(model)) {
    const r = await generateJsonAnthropic<T>({ model, system, user, schema, schemaName, temperature, systemCacheable, systemVariable });
    return { data: r.data, raw: r.raw, via: r.via, error: r.error, usage: r.usage };
  }

  // 1) Responses API + json_schema (스키마 강제).
  try {
    const resp = await openai.responses.create({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      text: { format: { type: "json_schema", name: schemaName, schema, strict } }
    });
    const raw = (resp as { output_text?: string }).output_text ?? "";
    const data = tryParse<T>(raw);
    if (data) return { data, raw, via: "responses" };
  } catch {
    /* 폴백으로 진행 */
  }

  // 2) chat.completions + json_object 폴백.
  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: temperature ?? 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const data = tryParse<T>(raw);
    if (data) return { data, raw, via: "chat" };
    return { data: null, raw, via: "chat", error: "invalid_json" };
  } catch (e) {
    return { data: null, raw: "", via: "none", error: (e as Error).message?.slice(0, 200) ?? "call_failed" };
  }
}
