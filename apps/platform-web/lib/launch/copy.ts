// UX Phase 7 — Career Launch 제품 언어 단일 소스. 내부 상태 코드 → 사용자 문구 매핑만 담당(비즈니스 로직 없음).
// 화면마다 흩어져 있던 상태/오류/빈상태/로딩/성공/CTA 문구를 여기서 중앙 관리한다.
// i18n: 기존 useLaunchT(6언어)는 각 화면에서 유지하고, 여기서는 한국어 기준 매핑을 제공한다.

// ── 용어 사전(§4) — 사용자 노출 표현 ──
export const TERMS = {
  coach: "AI 커리어 코치",
  consult: "1:1 커리어 상담",
  judgment: "코치의 판단",
  draft: "코치의 초안",
  knownAboutMe: "코치가 알고 있는 나",
  consultHistory: "상담 기록",
  mission: "이번 주 미션",
  firstConsult: "첫 커리어 상담",
  progress: "진행 현황",
  artifact: "결과물",
  applicationPackage: "지원 패키지",
  readiness: "지원 준비도",
  jobTrial: "직무 체험",
  targetJob: "목표 직무",
  challengeJob: "도전 직무",
  correctionNotebook: "면접 오답노트",
  weakness: "먼저 개선할 부분",
  retry: "다시 답해보기",
  transferTest: "다른 표현의 질문으로 확인",
  growthReport: "성장 리포트",
  cohort: "기수",
  league: "직무 리그",
  intervention: "사람 개입",
  atRisk: "진행 확인 필요",
  confidence: "코치 판단 확신도",
  adminHome: "운영 현황"
} as const;

// ── 주차·미션 상태(§7) ──
export const MISSION_STATUS_LABEL: Record<string, string> = {
  not_started: "아직 시작 전",
  available: "시작할 수 있어요",
  in_progress: "진행 중",
  needs_confirmation: "확인이 필요해요",
  completed: "완성했어요",
  locked: "이전 결과물을 완성하면 열려요",
  skipped: "이번에는 건너뛰었어요",
  blocked: "먼저 확인할 내용이 있어요"
};

// ── 결과물 상태(§7) ──
export const ARTIFACT_STATUS_LABEL: Record<string, string> = {
  not_started: "아직 만들지 않았어요",
  draft: "코치의 초안이 있어요",
  in_progress: "작성 중이에요",
  needs_confirmation: "확인할 내용이 있어요",
  finalized: "이 내용으로 확정했어요",
  improvable: "더 개선할 수 있어요",
  archived: "이전 버전"
};

// ── 상담 상태(§7) ──
export const CONSULT_STATUS_LABEL: Record<string, string> = {
  ready: "상담을 시작할 수 있어요",
  in_progress: "상담 중",
  completed: "오늘 상담을 마쳤어요",
  abandoned: "상담을 중간에 멈췄어요",
  failed: "상담을 이어가지 못했어요"
};

// ── 면접 오답 상태(§7) ──
export const CORRECTION_STATUS_LABEL: Record<string, string> = {
  discovered: "먼저 개선할 답변",
  coaching: "코치와 답변을 정리하는 중",
  retrying: "같은 질문에 다시 답하는 중",
  transfer_test: "다른 표현의 질문으로 확인 중",
  passed: "해결한 답변",
  paused: "잠시 멈췄어요",
  archived: "이전 오답"
};
// 오답 그룹(허브)
export const CORRECTION_GROUP_LABEL: Record<string, string> = {
  practice_first: "먼저 연습할 답변",
  retrying: "다시 답하는 중",
  transfer: "다른 질문으로 확인 중",
  passed: "해결한 답변",
  paused: "잠시 멈춘 답변"
};

// ── 학생 운영 상태(§9) — 관리자 표현 ──
export const STUDENT_STATUS_LABEL: Record<string, string> = {
  invited: "초대 전송",
  registered: "가입 완료",
  onboarding: "첫 상담 준비",
  active: "정상 진행",
  at_risk: "진행 확인 필요",
  intervention_required: "사람의 도움이 필요",
  paused: "잠시 멈춤",
  completed: "프로그램 완료",
  withdrawn: "참여 종료"
};

// ── Career Profile 상태(§10) ──
export const PROFILE_STATUS_LABEL: Record<string, string> = {
  confirmed: "확인한 내용",
  inferred: "코치가 이렇게 이해했어요",
  missing: "결과물에 필요한 내용",
  conflicted: "다시 확인할 내용",
  outdated: "업데이트가 필요할 수 있어요"
};

// ── 오류 문구(§11) — 저장 여부에 맞게 골라 쓴다 ──
export const ERROR_COPY = {
  fetch: { title: "진행 내용을 불러오지 못했어요.", body: "잠시 후 다시 확인해 주세요.", cta: "다시 불러오기" },
  send: { title: "답변을 보내지 못했어요.", body: "작성한 내용은 그대로 남아 있어요.", cta: "다시 보내기" },
  response: { title: "코치의 답변을 불러오지 못했어요.", body: "방금 보낸 답변은 저장되어 있어요.", cta: "답변 다시 받기" },
  artifact: { title: "상담 내용은 저장됐지만 결과물에는 반영되지 않았어요.", body: "", cta: "다시 반영하기" },
  forbidden: { title: "이 정보에 접근할 권한이 없습니다.", body: "소속 기관이나 담당 기수를 확인해 주세요.", cta: "" },
  session: { title: "로그인 시간이 만료됐어요.", body: "다시 로그인하면 작성 중이던 화면으로 돌아옵니다.", cta: "다시 로그인하기" },
  unknown: { title: "요청을 처리하지 못했어요.", body: "같은 문제가 반복되면 고객지원에 알려주세요.", cta: "다시 시도하기" }
} as const;

// ── 로딩 문구(§9) — 상황별 ──
export const LOADING_COPY: Record<string, string> = {
  default: "내용을 불러오고 있어요.",
  coach_reply: "코치가 답변을 정리하고 있어요.",
  strengths: "경험에서 강점을 찾고 있어요.",
  job_reason: "추천 직무의 근거를 확인하고 있어요.",
  compare_jd: "공고와 이력서를 비교하고 있어요.",
  cover_draft: "자기소개서 초안을 정리하고 있어요.",
  fact_check: "지원서에서 다시 확인할 내용을 찾고 있어요.",
  interview_q: "면접 질문을 준비하고 있어요.",
  answer_pattern: "답변의 반복 패턴을 확인하고 있어요.",
  growth_compare: "처음과 지금의 답변을 비교하고 있어요.",
  cohort: "기수 진행 현황을 불러오고 있어요.",
  report: "성과 리포트를 만들고 있어요."
};

// ── 성공 문구(§12) — 수행 행동+결과 ──
export const SUCCESS_COPY: Record<string, string> = {
  target_confirmed: "목표 직무로 확정했어요.",
  resume_reflected: "이력서에 반영했어요.",
  package_finalized: "지원 패키지를 완성했어요.",
  answer_saved: "답변이 저장됐어요.",
  correction_passed: "오답 하나를 해결했어요.",
  next_week: "다음 주차를 시작할 수 있어요.",
  assignee_set: "담당자를 지정했어요.",
  intervention_changed: "개입 상태를 변경했어요.",
  report_created: "리포트를 만들었어요."
};

// ── CTA(§6) — 행동·결과 표현 ──
export const CTA = {
  startConsult: "오늘 상담 시작하기",
  nextMission: "다음 미션으로",
  continue: "이어서 진행하기",
  finalize: "이 내용으로 확정하기",
  makeDraft: "내 정보로 초안 만들기",
  regenerate: "다른 방향으로 제안받기",
  submitAnswer: "답변 완료하기",
  seeJudgment: "코치의 판단 확인하기",
  seeArtifact: "결과물 확인하기",
  retryAnswer: "다시 답해보기",
  finishMission: "이번 미션 마치기",
  finalizePackage: "지원 패키지 확정하기",
  endToday: "오늘은 여기까지",
  skipQuestion: "이번 질문 건너뛰기"
} as const;

// ── 빈 상태(§10) — 무엇이/왜/어떻게/CTA ──
export const EMPTY_COPY = {
  artifacts: { title: "아직 완성한 지원서가 없어요.", body: "목표 직무를 정하면 확인된 경험을 바탕으로 이력서 초안을 만들 수 있어요.", cta: "직무 탐험 시작하기", href: "/career-launch/week/1" },
  corrections: { title: "아직 면접 오답노트가 없어요.", body: "첫 실전면접을 마치면 코치가 먼저 개선할 답변을 정리해 드려요.", cta: "첫 실전면접 준비하기", href: "/career-launch/week/3" },
  growth: { title: "아직 비교할 성장 데이터가 없어요.", body: "첫 면접을 완료하면 이후 답변과 비교할 수 있어요.", cta: "첫 실전면접 시작하기", href: "/career-launch/week/3" },
  interventions: { title: "지금 바로 확인해야 할 학생은 없어요.", body: "", cta: "", href: "" },
  students: { title: "아직 등록된 학생이 없어요.", body: "학생을 등록하거나 초대 링크를 생성해 주세요.", cta: "학생 등록하기", href: "" }
} as const;

// ── 데이터 없음 vs 값 0 구분(§10) ──
export const NO_DATA = "아직 수집된 데이터가 없어요.";
export const NOT_COLLECTED = "이 기수에서는 해당 데이터를 수집하지 않았습니다.";

// ── helper — 매핑만, 로직 없음 ──
export const missionStatusLabel = (s: string) => MISSION_STATUS_LABEL[s] ?? "진행 중";
export const artifactStatusLabel = (s: string) => ARTIFACT_STATUS_LABEL[s] ?? s;
export const correctionStatusLabel = (s: string) => CORRECTION_STATUS_LABEL[s] ?? s;
export const studentStatusLabel = (s: string) => STUDENT_STATUS_LABEL[s] ?? s;
export const profileStatusLabel = (s: string) => PROFILE_STATUS_LABEL[s] ?? "확인한 내용";
