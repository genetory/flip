// 평가 대상 기능 레지스트리 — 프롬프트 빌더(단일 소스)와 출력 파서를 연결.
// 여기 buildMessages 는 실제 API(index.ts)가 쓰는 것과 동일한 함수다.
import {
  buildCoverLetterMessages,
  buildPolishExperienceMessages,
  buildPolishIntroMessages,
  buildDraftResumeTextMessages,
  COVER_TEXT_SCHEMA,
  POLISH_TEXT_SCHEMA,
  DRAFT_TEXT_SCHEMA,
  type CoverLetterInput,
  type PolishExperienceInput,
  type PolishIntroInput,
  type DraftResumeTextInput
} from "../llm/prompts";
import type { FeatureId } from "./types";

export type FeatureSpec = {
  id: FeatureId;
  label: string;
  // 실제 API 와 동일한 모델(기본값). env 로 override 가능.
  model: () => string;
  temperature: number;
  buildMessages: (input: Record<string, unknown>) => { system: string; user: string };
  // 프로덕션과 동일한 구조화 출력 스키마.
  schema: Record<string, unknown>;
  schemaName: string;
  // 모델 JSON 응답에서 최종 텍스트 추출.
  extract: (json: Record<string, unknown>) => string;
};

// 기능별 생성 모델(비용/품질 티어링). 우선순위:
//   EVAL_GENERATOR_MODEL(전역 강제, A/B용) > 기능별 env > 기본값(gpt-4o-mini = 프로덕션 현행)
// 예) 바이오프: COVER_LETTER_MODEL=claude-sonnet-* RESUME_TEXT_MODEL=claude-haiku-*
const DEFAULT_GEN = () => process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";
const coverModel = () => process.env.EVAL_GENERATOR_MODEL ?? process.env.COVER_LETTER_MODEL ?? DEFAULT_GEN();
const resumeTextModel = () => process.env.EVAL_GENERATOR_MODEL ?? process.env.RESUME_TEXT_MODEL ?? DEFAULT_GEN();

export const FEATURES: Record<FeatureId, FeatureSpec> = {
  cover_letter: {
    id: "cover_letter",
    label: "자기소개서 문항 답변 생성",
    model: coverModel,
    temperature: 0.6,
    buildMessages: (input) => buildCoverLetterMessages(input as CoverLetterInput),
    schema: COVER_TEXT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "cover_letter",
    extract: (json) => (typeof json.text === "string" ? json.text : "")
  },
  polish_experience: {
    id: "polish_experience",
    label: "이력서 경험 설명 다듬기",
    model: resumeTextModel,
    temperature: 0.5,
    buildMessages: (input) => buildPolishExperienceMessages(input as PolishExperienceInput),
    schema: POLISH_TEXT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "polish_experience",
    extract: (json) => (typeof json.polished === "string" ? json.polished : "")
  },
  polish_intro: {
    id: "polish_intro",
    label: "이력서 자기소개 다듬기",
    model: resumeTextModel,
    temperature: 0.5,
    buildMessages: (input) => buildPolishIntroMessages(input as PolishIntroInput),
    schema: POLISH_TEXT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "polish_intro",
    extract: (json) => (typeof json.polished === "string" ? json.polished : "")
  },
  draft_resume_text: {
    id: "draft_resume_text",
    label: "이력서 텍스트 생성/개선(자기소개·경험·활동)",
    model: resumeTextModel,
    temperature: 0.5,
    buildMessages: (input) => buildDraftResumeTextMessages(input as DraftResumeTextInput),
    schema: DRAFT_TEXT_SCHEMA as unknown as Record<string, unknown>,
    schemaName: "draft_resume_text",
    extract: (json) => (typeof json.text === "string" ? json.text : "")
  }
};
