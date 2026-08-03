// Talent 도메인 표시 문구/질문 세트 — 화면에 하드코딩하지 않고 여기서 관리.
import type {
  ApplicationStatus,
  ApplyStepKey,
  ExperienceQuestionKey,
  ExperienceType,
  JourneyStepKey,
  OnboardingGoal,
  ResumeStatus
} from "./types";

export const experienceTypeLabels: Record<ExperienceType, string> = {
  "school-project": "학교 프로젝트",
  "team-project": "팀 프로젝트",
  intern: "인턴",
  "part-time": "아르바이트",
  club: "동아리",
  activity: "대외활동",
  contest: "공모전",
  volunteer: "봉사활동",
  "personal-project": "개인 프로젝트",
  freelance: "프리랜서",
  content: "콘텐츠 운영",
  startup: "창업 및 서비스 운영",
  etc: "기타 경험"
};

export const experienceTypeOptions = Object.entries(experienceTypeLabels).map(
  ([value, label]) => ({ value: value as ExperienceType, label })
);

// 경험 작성 질문(8단계, 대화형/단계형).
export const experienceQuestions: { key: ExperienceQuestionKey; label: string; placeholder: string }[] = [
  { key: "what", label: "어떤 경험인가요?", placeholder: "예) 카페에서 아르바이트를 했어요." },
  { key: "why", label: "왜 시작했나요?", placeholder: "예) 사람을 응대하는 일을 배우고 싶었어요." },
  { key: "role", label: "어떤 역할을 맡았나요?", placeholder: "예) 주문 응대와 재고 관리를 맡았어요." },
  { key: "did", label: "직접 한 일은 무엇인가요?", placeholder: "예) 혼잡 시간대 주문 처리 순서를 새로 정리했어요." },
  { key: "difficulty", label: "어려운 점은 무엇이었나요?", placeholder: "예) 바쁜 시간대에 주문이 자주 밀렸어요." },
  { key: "solution", label: "어떻게 해결했나요?", placeholder: "예) 업무 순서를 정리해 순서표를 만들었어요." },
  { key: "result", label: "결과는 어떻게 달라졌나요?", placeholder: "예) 주문 누락이 줄고 대기 시간이 짧아졌어요." },
  { key: "learned", label: "무엇을 배웠나요?", placeholder: "예) 우선순위를 정하는 법을 배웠어요." }
];

export const journeyLabels: Record<JourneyStepKey, string> = {
  interest: "관심 직무 선택",
  experiences: "경험 정리",
  profile: "첫 프로필",
  resume: "첫 이력서",
  cover: "첫 자기소개서",
  apply: "첫 지원",
  interview: "첫 면접"
};

export const resumeStatusLabels: Record<ResumeStatus, string> = {
  none: "아직 이력서가 없어요",
  draft: "기본 이력서가 완성됐어요",
  improving: "조금 더 구체적으로 만들 수 있어요",
  ready: "지원할 준비가 됐어요"
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  interested: "관심",
  preparing: "준비 중",
  applied: "지원 완료",
  interview: "면접",
  result: "결과"
};

export const applicationStatusOrder: ApplicationStatus[] = [
  "interested",
  "preparing",
  "applied",
  "interview",
  "result"
];

export const applyStepLabels: Record<ApplyStepKey, string> = {
  analyze: "공고 분석",
  resume: "맞춤 이력서",
  cover: "자기소개서",
  review: "제출 전 확인",
  submit: "지원 완료",
  interview: "면접 준비"
};

// 온보딩 첫 질문 선택지.
export const onboardingGoals: { value: OnboardingGoal; label: string }[] = [
  { value: "explore", label: "아직 어떤 일을 해야 할지 모르겠어요" },
  { value: "resume", label: "첫 이력서를 만들고 싶어요" },
  { value: "cover", label: "자기소개서를 준비하고 싶어요" },
  { value: "jobs", label: "지원할 공고를 찾고 싶어요" },
  { value: "interview", label: "면접을 준비하고 있어요" }
];

// 온보딩 이후 최소 질문 세트(한 단계씩).
export const onboardingSteps: {
  key: string;
  question: string;
  helper?: string;
  options: string[];
  allowSkip?: boolean;
}[] = [
  {
    key: "status",
    question: "지금 어떤 상태에 가장 가까운가요?",
    options: ["재학 중", "졸업 예정", "졸업 후 취업 준비 중", "이직 준비는 아니에요"]
  },
  {
    key: "field",
    question: "관심 있는 분야가 있나요?",
    options: ["기획·PM", "마케팅·콘텐츠", "디자인", "개발", "영업·CX", "경영·인사", "아직 모르겠어요"]
  },
  {
    key: "role",
    question: "희망하는 직무가 있나요?",
    helper: "아직 정하지 않았다면 건너뛰어도 좋아요.",
    options: ["콘텐츠 마케터", "서비스 기획자", "UX 디자이너", "프론트엔드 개발자", "아직 모름"],
    allowSkip: true
  },
  {
    key: "experience",
    question: "해본 경험이 있나요?",
    options: ["아르바이트", "동아리·대외활동", "학교·팀 프로젝트", "인턴", "아직 없어요"]
  },
  {
    key: "opportunity",
    question: "지금 원하는 기회는 무엇인가요?",
    options: ["인턴", "신입 정규직", "우선 경험을 쌓고 싶어요", "아직 모르겠어요"]
  }
];

// 자기소개서(공고 맞춤) 질문.
export const tailoredCoverQuestions = [
  "왜 이 직무에 지원하나요?",
  "어떤 경험을 가장 보여주고 싶나요?",
  "그 경험에서 직접 한 일은 무엇인가요?",
  "회사에서 어떤 기여를 하고 싶나요?"
];

// 이력서 생성 단계.
export const resumeFlowSteps = [
  "사용할 경험 선택",
  "지원 직무 선택",
  "강조할 역량 선택",
  "이력서 초안 생성",
  "항목별 수정",
  "디자인 선택",
  "결과 확인"
];
