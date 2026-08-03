// 5가지 Talent 상태 mock 스냅샷. 개발 중 persona 를 전환해 상태별 화면을 확인한다.
import { journeyLabels, applyStepLabels } from "../labels";
import type {
  Application,
  ApplyStepKey,
  Experience,
  JourneyStep,
  JourneyStepKey,
  StepState,
  TalentPersonaId,
  TalentSnapshot
} from "../types";

const journeyOrder: JourneyStepKey[] = [
  "interest",
  "experiences",
  "profile",
  "resume",
  "cover",
  "apply",
  "interview"
];

function buildJourney(states: Partial<Record<JourneyStepKey, StepState>>): JourneyStep[] {
  return journeyOrder.map((key) => ({
    key,
    label: journeyLabels[key],
    state: states[key] ?? "todo"
  }));
}

function applySteps(states: Partial<Record<ApplyStepKey, StepState>>): Application["steps"] {
  const order: ApplyStepKey[] = ["analyze", "resume", "cover", "review", "submit", "interview"];
  return order.map((key) => ({ key, label: applyStepLabels[key], state: states[key] ?? "todo" }));
}

// 경험 mock 풀 — 상태별로 필요한 만큼 잘라 사용.
const experiencePool: Experience[] = [
  {
    id: "exp-cafe",
    type: "part-time",
    title: "카페 아르바이트",
    period: "2024.03 – 2024.12",
    summary: "고객 응대와 주문 관리를 담당하며 혼잡 시간대 업무 순서를 정리해 주문 누락을 줄였습니다.",
    createdAt: "2026-07-10",
    answers: {
      what: "동네 카페에서 아르바이트를 했어요.",
      role: "주문 응대와 재고 관리를 담당했어요.",
      difficulty: "바쁜 시간대에 주문이 자주 밀렸어요.",
      solution: "업무 순서를 정리한 순서표를 만들었어요.",
      result: "주문 누락이 줄고 대기 시간이 짧아졌어요."
    }
  },
  {
    id: "exp-club",
    type: "club",
    title: "교내 마케팅 동아리",
    period: "2024.09 – 2025.06",
    summary: "동아리 SNS 채널을 운영하며 3개월간 팔로워를 1.5배 늘렸습니다.",
    createdAt: "2026-07-11"
  },
  {
    id: "exp-project",
    type: "team-project",
    title: "브랜드 리뉴얼 팀 프로젝트",
    period: "2025.03 – 2025.06",
    summary: "4인 팀에서 기획을 맡아 사용자 인터뷰를 진행하고 개선안을 도출했습니다.",
    createdAt: "2026-07-12"
  }
];

const baseProfile = (displayName: string, interests: string[]): TalentSnapshot["profile"] => ({
  displayName,
  headline: interests.length ? `${interests[0]}에 관심 있는 첫 취업 준비생` : undefined,
  interests,
  isForeigner: false,
  education: [{ school: "한국대학교", major: "경영학과", period: "2021 – 2026" }],
  skills: ["문서 작성", "SNS 운영"],
  languages: ["한국어(모국어)", "영어(비즈니스)"]
});

const NEW: TalentSnapshot = {
  personaId: "new",
  greetingName: "지훈",
  stageLabel: "이제 막 시작했어요",
  progress: 8,
  onboardingDone: false,
  journey: buildJourney({ interest: "doing" }),
  weeklyTasks: [
    { id: "t1", label: "관심 직무 방향 정해보기", done: false },
    { id: "t2", label: "내 경험 1개 정리하기", done: false }
  ],
  profile: baseProfile("김지훈", []),
  experiences: [],
  resumes: [],
  coverLetters: [],
  applications: []
};

const EXPERIENCES: TalentSnapshot = {
  personaId: "experiences",
  greetingName: "지훈",
  stageLabel: "경험을 정리하고 있어요",
  progress: 32,
  onboardingDone: true,
  journey: buildJourney({ interest: "done", experiences: "doing" }),
  weeklyTasks: [
    { id: "t1", label: "경험 1개 더 정리하기", done: false },
    { id: "t2", label: "첫 이력서 만들어보기", done: false }
  ],
  profile: baseProfile("김지훈", ["마케팅"]),
  experiences: experiencePool.slice(0, 2),
  resumes: [],
  coverLetters: [],
  applications: []
};

const RESUME: TalentSnapshot = {
  personaId: "resume",
  greetingName: "지훈",
  stageLabel: "첫 이력서를 완성했어요",
  progress: 58,
  onboardingDone: true,
  journey: buildJourney({
    interest: "done",
    experiences: "done",
    profile: "done",
    resume: "done",
    cover: "doing"
  }),
  weeklyTasks: [
    { id: "t1", label: "첫 자기소개서 시작하기", done: false },
    { id: "t2", label: "관심 공고 3개 저장하기", done: false }
  ],
  profile: baseProfile("김지훈", ["마케팅", "서비스 기획"]),
  experiences: experiencePool.slice(0, 3),
  resumes: [{ id: "res-1", title: "마케팅 지원용 이력서", status: "ready", targetRole: "콘텐츠 마케팅", updatedAt: "2026-07-25" }],
  coverLetters: [],
  applications: [
    {
      id: "app-1",
      jobId: "job-content-intern",
      jobTitle: "콘텐츠 마케팅 인턴",
      company: "무브먼트랩",
      status: "interested",
      steps: applySteps({}),
      updatedAt: "2026-07-26"
    }
  ]
};

const APPLYING: TalentSnapshot = {
  personaId: "applying",
  greetingName: "지훈",
  stageLabel: "첫 지원을 준비하고 있어요",
  progress: 74,
  onboardingDone: true,
  journey: buildJourney({
    interest: "done",
    experiences: "done",
    profile: "done",
    resume: "done",
    cover: "doing",
    apply: "doing"
  }),
  weeklyTasks: [
    { id: "t1", label: "지원 동기 작성 마무리", done: false },
    { id: "t2", label: "예상 면접 질문 살펴보기", done: false }
  ],
  profile: baseProfile("김지훈", ["마케팅"]),
  experiences: experiencePool.slice(0, 3),
  resumes: [{ id: "res-1", title: "마케팅 지원용 이력서", status: "ready", targetRole: "콘텐츠 마케팅", updatedAt: "2026-07-27" }],
  coverLetters: [
    { id: "cov-1", type: "tailored", title: "무브먼트랩 콘텐츠 마케팅 인턴", jobTitle: "콘텐츠 마케팅 인턴", company: "무브먼트랩", status: "draft", updatedAt: "2026-07-28" }
  ],
  applications: [
    {
      id: "app-1",
      jobId: "job-content-intern",
      jobTitle: "콘텐츠 마케팅 인턴",
      company: "무브먼트랩",
      status: "preparing",
      steps: applySteps({ analyze: "done", resume: "done", cover: "doing" }),
      updatedAt: "2026-07-28"
    },
    {
      id: "app-2",
      jobId: "job-service-planner",
      jobTitle: "서비스 기획 신입",
      company: "핀버드",
      status: "interested",
      steps: applySteps({}),
      updatedAt: "2026-07-24"
    }
  ]
};

const INTERVIEW: TalentSnapshot = {
  personaId: "interview",
  greetingName: "지훈",
  stageLabel: "면접을 준비하고 있어요",
  progress: 88,
  onboardingDone: true,
  journey: buildJourney({
    interest: "done",
    experiences: "done",
    profile: "done",
    resume: "done",
    cover: "done",
    apply: "done",
    interview: "doing"
  }),
  weeklyTasks: [
    { id: "t1", label: "예상 면접 질문 5개 답변 정리", done: false },
    { id: "t2", label: "1분 자기소개 연습", done: true }
  ],
  profile: baseProfile("김지훈", ["마케팅"]),
  experiences: experiencePool.slice(0, 3),
  resumes: [{ id: "res-1", title: "마케팅 지원용 이력서", status: "ready", targetRole: "콘텐츠 마케팅", updatedAt: "2026-07-29" }],
  coverLetters: [
    { id: "cov-1", type: "tailored", title: "무브먼트랩 콘텐츠 마케팅 인턴", jobTitle: "콘텐츠 마케팅 인턴", company: "무브먼트랩", status: "ready", updatedAt: "2026-07-29" }
  ],
  applications: [
    {
      id: "app-1",
      jobId: "job-content-intern",
      jobTitle: "콘텐츠 마케팅 인턴",
      company: "무브먼트랩",
      status: "interview",
      steps: applySteps({ analyze: "done", resume: "done", cover: "done", review: "done", submit: "done", interview: "doing" }),
      updatedAt: "2026-07-29"
    },
    {
      id: "app-2",
      jobId: "job-service-planner",
      jobTitle: "서비스 기획 신입",
      company: "핀버드",
      status: "applied",
      steps: applySteps({ analyze: "done", resume: "done", cover: "done", review: "done", submit: "done" }),
      updatedAt: "2026-07-27"
    }
  ]
};

export const personaSnapshots: Record<TalentPersonaId, TalentSnapshot> = {
  new: NEW,
  experiences: EXPERIENCES,
  resume: RESUME,
  applying: APPLYING,
  interview: INTERVIEW
};

export const personaOptions: { id: TalentPersonaId; label: string }[] = [
  { id: "new", label: "신규" },
  { id: "experiences", label: "경험 2개" },
  { id: "resume", label: "이력서 완성" },
  { id: "applying", label: "지원 준비" },
  { id: "interview", label: "면접 준비" }
];

export const defaultPersona: TalentPersonaId = "experiences";
