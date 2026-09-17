// LLM 품질 평가 하니스 — 공통 타입.

export type FeatureId = "cover_letter" | "polish_experience" | "polish_intro" | "draft_resume_text";

// 골든 케이스 — 합성(가상) 입력. 공개 레포 규칙상 실제 사용자 PII 는 넣지 않는다.
export type GoldenCase = {
  id: string;
  feature: FeatureId;
  note?: string;
  input: Record<string, unknown>;
  // 규칙 검사용 기대치(선택).
  expect?: {
    minChars?: number;
    maxChars?: number;
    // 입력에서 유래한 '허용 숫자'(예: 기간·수치) — 이 외의 숫자는 환각 의심으로 표시.
    allowedNumbers?: string[];
  };
};

export type CheckResult = { name: string; pass: boolean; weight: number; detail?: string };

// LLM-as-judge 루브릭(각 0~5).
export type JudgeScore = {
  groundedness: number; // 입력 근거성(없는 사실 지어냄 여부)
  naturalness: number; // 한국어 자연스러움·톤
  relevance: number; // 문항/지시 적합성
  structure: number; // 두괄식·STAR·흐름
  overall: number; // 종합
  rationale: string;
};

export type CaseResult = {
  id: string;
  feature: FeatureId;
  output: string;
  error?: string;
  checks: CheckResult[];
  checkScore: number; // 0~1 (가중 통과율)
  judge?: JudgeScore;
  ms: number;
};

export type Report = {
  startedAt: string;
  generatorModel: string;
  judgeModel: string;
  cases: CaseResult[];
  summary: {
    total: number;
    errored: number;
    avgCheckScore: number; // 0~1
    avgJudgeOverall: number | null; // 0~5
    byFeature: Record<string, { count: number; avgCheckScore: number; avgJudgeOverall: number | null }>;
  };
};
