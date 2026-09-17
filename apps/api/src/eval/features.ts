// 평가 대상 기능 레지스트리 — 프롬프트 빌더(단일 소스)와 출력 파서를 연결.
// 여기 buildMessages 는 실제 API(index.ts)가 쓰는 것과 동일한 함수다.
import {
  buildCoverLetterMessages,
  buildPolishExperienceMessages,
  type CoverLetterInput,
  type PolishExperienceInput
} from "../llm/prompts";
import type { FeatureId } from "./types";

export type FeatureSpec = {
  id: FeatureId;
  label: string;
  // 실제 API 와 동일한 모델(기본값). env 로 override 가능.
  model: () => string;
  temperature: number;
  buildMessages: (input: Record<string, unknown>) => { system: string; user: string };
  // 모델 JSON 응답에서 최종 텍스트 추출.
  extract: (json: Record<string, unknown>) => string;
};

const genModel = () => process.env.EVAL_GENERATOR_MODEL ?? process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";

export const FEATURES: Record<FeatureId, FeatureSpec> = {
  cover_letter: {
    id: "cover_letter",
    label: "자기소개서 문항 답변 생성",
    model: genModel,
    temperature: 0.6,
    buildMessages: (input) => buildCoverLetterMessages(input as CoverLetterInput),
    extract: (json) => (typeof json.text === "string" ? json.text : "")
  },
  polish_experience: {
    id: "polish_experience",
    label: "이력서 경험 설명 다듬기",
    model: genModel,
    temperature: 0.5,
    buildMessages: (input) => buildPolishExperienceMessages(input as PolishExperienceInput),
    extract: (json) => (typeof json.polished === "string" ? json.polished : "")
  }
};
