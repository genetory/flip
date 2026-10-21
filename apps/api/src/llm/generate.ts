// 구조화 생성 공용 헬퍼 — 항상 '파싱된 객체 또는 null' 을 돌려준다.
// 기존 자소서·이력서 생성기의 "JSON.parse 실패 → 조용히 {} → 502" 실패 클래스를 제거한다.
// 2026-10 부터 전부 Claude(./claude.ts)로 호출한다.
import { claudeJson, type Effort, type LlmUsage } from "./claude";

export type GenerateJsonArgs = {
  model: string;
  system: string;
  user: string;
  // 프롬프트 캐싱용 분리 입력(선택). 둘 다 주면 system 대신 이걸 쓰고 고정부에만 캐시를 건다.
  systemCacheable?: string;
  systemVariable?: string;
  // 강제할 JSON 스키마. object + additionalProperties:false 권장.
  schema: Record<string, unknown>;
  schemaName: string;
  // 이전 OpenAI 호출부 호환용 — Claude 최신 모델은 sampling 값을 받지 않아 무시한다.
  temperature?: number;
  strict?: boolean;
  effort?: Effort;
  maxTokens?: number;
};

export type GenerateJsonResult<T> = {
  data: T | null;
  raw: string;
  via: "anthropic" | "none";
  error?: string;
  // 프롬프트 캐시가 실제로 맞는지 확인하는 유일한 수단이므로 호출부에서 버리지 말 것
  // (cacheReadInputTokens 가 계속 0 이면 고정부가 캐시에 안 걸린 것).
  usage?: LlmUsage;
};

export async function generateJson<T = Record<string, unknown>>(a: GenerateJsonArgs): Promise<GenerateJsonResult<T>> {
  const r = await claudeJson<T>({
    model: a.model,
    system: a.system,
    systemCacheable: a.systemCacheable,
    systemVariable: a.systemVariable,
    user: a.user,
    schema: a.schema,
    effort: a.effort,
    maxTokens: a.maxTokens
  });
  return { data: r.data, raw: r.raw, via: r.data || r.usage ? "anthropic" : "none", error: r.error, usage: r.usage };
}
