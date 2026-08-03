// Talent(첫 취업 학생) 도메인 타입.
// 화면/도메인 로직/데이터 접근을 분리하기 위한 공용 타입 정의.
// 실제 백엔드가 붙기 전까지 repository(mock)가 이 타입으로 데이터를 제공한다.

export type StepState = "done" | "doing" | "todo" | "locked";

// 5가지 mock 상태(개발 중 쉽게 전환).
export type TalentPersonaId =
  | "new" // 신규 Talent
  | "experiences" // 경험 2개 작성
  | "resume" // 이력서 완성
  | "applying" // 공고 지원 준비 중
  | "interview"; // 면접 준비 중

// 커리어 여정 단계.
export type JourneyStepKey =
  | "interest"
  | "experiences"
  | "profile"
  | "resume"
  | "cover"
  | "apply"
  | "interview";

export interface JourneyStep {
  key: JourneyStepKey;
  label: string;
  state: StepState;
}

// 경험 유형.
export type ExperienceType =
  | "school-project"
  | "team-project"
  | "intern"
  | "part-time"
  | "club"
  | "activity"
  | "contest"
  | "volunteer"
  | "personal-project"
  | "freelance"
  | "content"
  | "startup"
  | "etc";

// 경험 작성 질문(8단계).
export type ExperienceQuestionKey =
  | "what"
  | "why"
  | "role"
  | "did"
  | "difficulty"
  | "solution"
  | "result"
  | "learned";

export interface Experience {
  id: string;
  type: ExperienceType;
  title: string;
  period?: string;
  summary?: string; // 취업 언어로 정리된 이력서 문장
  keyRole?: string; // 핵심 역할
  skills?: string[]; // 활용할 수 있는 역량
  answers?: Partial<Record<ExperienceQuestionKey, string>>;
  createdAt: string;
}

export type ResumeStatus = "none" | "draft" | "improving" | "ready";
export interface Resume {
  id: string;
  title: string;
  status: ResumeStatus;
  targetRole?: string;
  updatedAt: string;
}

export type CoverLetterType = "basic" | "tailored";
export interface CoverLetter {
  id: string;
  type: CoverLetterType;
  title: string;
  jobTitle?: string;
  company?: string;
  status: "draft" | "ready";
  updatedAt: string;
}

export type EmploymentType = "intern" | "newgrad" | "fulltime" | "contract";
export type WorkMode = "onsite" | "remote" | "hybrid";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  isInternOrNew: boolean;
  workMode: WorkMode;
  deadline?: string;
  majorFree?: boolean;
  foreignerOk?: boolean;
  external?: boolean;
  externalUrl?: string;
  saved?: boolean;
  reasons?: string[]; // 추천 이유
  // 상세
  responsibilities?: string[];
  qualifications?: string[];
  preferred?: string[];
  conditions?: string[];
  process?: string[];
  fitReasons?: string[];
  prepChecklist?: string[];
}

export type ApplicationStatus = "interested" | "preparing" | "applied" | "interview" | "result";
export type ApplyStepKey = "analyze" | "resume" | "cover" | "review" | "submit" | "interview";

export interface ApplicationStep {
  key: ApplyStepKey;
  label: string;
  state: StepState;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  external?: boolean;
  externalUrl?: string;
  steps: ApplicationStep[];
  updatedAt: string;
}

export interface TalentProfile {
  displayName: string;
  headline?: string; // 한줄 소개
  interests: string[]; // 관심 직무
  isForeigner: boolean;
  nationality?: string;
  koreanLevel?: string;
  visaStatus?: string;
  workConditions?: string;
  education?: { school: string; major?: string; period?: string }[];
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  wish?: string; // 희망 조건
  attachments?: { label: string; kind: string }[];
}

export type OnboardingGoal = "explore" | "resume" | "cover" | "jobs" | "interview";

// 홈 화면이 사용하는 사용자 스냅샷.
export interface TalentSnapshot {
  personaId: TalentPersonaId;
  greetingName: string;
  stageLabel: string; // 현재 취업 준비 단계
  progress: number; // 0~100
  onboardingDone: boolean;
  journey: JourneyStep[];
  weeklyTasks: { id: string; label: string; done: boolean }[];
  profile: TalentProfile;
  experiences: Experience[];
  resumes: Resume[];
  coverLetters: CoverLetter[];
  applications: Application[];
}
