// resume-maker (AI 이력서 만들기) 빌더 도메인 타입/상수.
// 빌더 상태는 별도 테이블 없이 기존 Resume.content.builder 네임스페이스에 저장한다
// (resume-maker-client.ts 참고). 한국어 단일 언어 MVP.

export type ResumePurpose =
  | "first_job"
  | "intern"
  | "job_change"
  | "part_time"
  | "career_switch"
  | "specific_posting"
  | "improve_existing";

export const RESUME_PURPOSES: { value: ResumePurpose; label: string; desc: string }[] = [
  { value: "first_job", label: "첫 취업", desc: "사회에 첫발을 내딛는 신입 이력서" },
  { value: "intern", label: "인턴 지원", desc: "인턴십·체험형 채용 지원" },
  { value: "job_change", label: "이직", desc: "경력을 살린 이직 이력서" },
  { value: "part_time", label: "아르바이트", desc: "단기·시간제 근무 지원" },
  { value: "career_switch", label: "직무 전환", desc: "새로운 직무로의 전환" },
  { value: "specific_posting", label: "특정 공고 지원", desc: "특정 채용 공고에 맞춘 이력서" },
  { value: "improve_existing", label: "기존 이력서 개선", desc: "이미 있는 이력서를 다듬기" }
];

// 희망 직무 — 최대 3개 선택. "아직 모르겠어요"는 단독 선택 처리(아래 UI에서).
export const JOB_UNDECIDED = "undecided";
export const JOB_CATEGORIES: { value: string; label: string }[] = [
  { value: "service_planning", label: "서비스 기획" },
  { value: "marketing", label: "마케팅" },
  { value: "development", label: "개발" },
  { value: "design", label: "디자인" },
  { value: "sales", label: "영업" },
  { value: "operations", label: "운영" },
  { value: "hr", label: "인사" },
  { value: "finance", label: "재무" },
  { value: "customer_support", label: "고객 지원" },
  { value: JOB_UNDECIDED, label: "아직 모르겠어요" }
];
export const MAX_JOB_CATEGORIES = 3;

// 외국인 비자 종류 — 기본 정보 드롭다운용. value 는 content.basicVisa(CandidateVisaType) 와 일치.
export const RESUME_VISA_OPTIONS: { value: string; label: string }[] = [
  { value: "D2_STUDENT", label: "D-2 유학" },
  { value: "D4_GENERAL_TRAINING", label: "D-4 어학연수" },
  { value: "D10_JOB_SEEKING", label: "D-10 구직" },
  { value: "E7_SPECIFIC_ACTIVITY", label: "E-7 특정활동" },
  { value: "F2_RESIDENCE", label: "F-2 거주" },
  { value: "F4_OVERSEAS_KOREAN", label: "F-4 재외동포" },
  { value: "F5_PERMANENT_RESIDENCE", label: "F-5 영주" },
  { value: "F6_MARRIAGE_IMMIGRATION", label: "F-6 결혼이민" },
  { value: "H1_WORKING_HOLIDAY", label: "H-1 워킹홀리데이" },
  { value: "OTHER", label: "기타" }
];

export type ResumeStartMethod = "scratch" | "upload" | "paste";
export const START_METHODS: { value: ResumeStartMethod; label: string; desc: string }[] = [
  { value: "scratch", label: "처음부터 만들기", desc: "질문에 답하며 새로 만들어요" },
  { value: "upload", label: "기존 이력서 업로드", desc: "PDF·문서를 올려 시작해요" },
  { value: "paste", label: "작성한 내용 붙여넣기", desc: "메모해 둔 내용을 붙여넣어요" }
];

export type ExperienceType =
  | "career"
  | "intern"
  | "part_time"
  | "school_project"
  | "personal_project"
  | "club"
  | "external_activity"
  | "competition"
  | "volunteer"
  | "education"
  | "side_project"
  | "etc";

export const EXPERIENCE_TYPES: { value: ExperienceType; label: string }[] = [
  { value: "career", label: "경력" },
  { value: "intern", label: "인턴" },
  { value: "part_time", label: "아르바이트" },
  { value: "school_project", label: "학교 프로젝트" },
  { value: "personal_project", label: "개인 프로젝트" },
  { value: "club", label: "동아리" },
  { value: "external_activity", label: "대외활동" },
  { value: "competition", label: "공모전" },
  { value: "volunteer", label: "봉사활동" },
  { value: "education", label: "교육 수료" },
  { value: "side_project", label: "사이드 프로젝트" },
  { value: "etc", label: "기타" }
];

export function experienceTypeLabel(type: ExperienceType): string {
  return EXPERIENCE_TYPES.find((t) => t.value === type)?.label ?? "기타";
}

export type ExperienceStatus = "collecting" | "needs_questions" | "generated" | "ready";
export const EXPERIENCE_STATUS_META: Record<
  ExperienceStatus,
  { label: string; tone: "neutral" | "warn" | "info" | "success" }
> = {
  collecting: { label: "내용 수집 중", tone: "neutral" },
  needs_questions: { label: "추가 질문 필요", tone: "warn" },
  generated: { label: "문장 생성 완료", tone: "info" },
  ready: { label: "이력서 사용 가능", tone: "success" }
};

// ── AI 경험 인터뷰 / 문장 생성 (P2) ──
export type InterviewQuestionType =
  | "short_text"
  | "long_text"
  | "number"
  | "single_select"
  | "multi_select"
  | "select_with_custom";

export type InterviewQuestion = {
  id: string;
  prompt: string;
  type: InterviewQuestionType;
  options?: string[];
  helper?: string;
  optional: boolean;
};

// 답변 — 텍스트/선택 외에 "잘 모르겠어요/기억나지 않아요/건너뛰기" 마커를 보존.
export type InterviewAnswerValue =
  | { kind: "text"; value: string }
  | { kind: "choices"; value: string[] }
  | { kind: "unknown" } // 모름·기억 안 남
  | { kind: "skipped" };

export type InterviewState = {
  coachNote?: string;
  questions: InterviewQuestion[];
  answers: Record<string, InterviewAnswerValue>;
};

export type GeneratedBullet = {
  text: string;
  evidenceLevel: "confirmed" | "inferred";
  needsReview: boolean;
};

export type ExperienceGeneration = {
  summary: string;
  resumeBullets: GeneratedBullet[];
  skills: string[];
  followUpQuestions: InterviewQuestion[];
  warnings: string[];
  generatedAt: string;
};

// 사용자가 승인한 문장만 이력서에 반영(P3에서 content 로 매핑).
export type ApprovedBullet = { id: string; text: string };

export type BuilderExperience = {
  id: string;
  type: ExperienceType;
  title: string;
  org?: string;
  startDate?: string; // "YYYY-MM"
  endDate?: string; // "YYYY-MM" (빈 값이면 진행 중)
  rawInput?: string; // 사용자가 처음 입력한 한두 문장
  confirmedTasks?: string[]; // ① 한 줄→추론→체크: 사용자가 체크해 확정한 업무 항목
  roleTags?: string[]; // 관련 직무 태그
  status: ExperienceStatus;
  interview?: InterviewState;
  generation?: ExperienceGeneration;
  approvedBullets?: ApprovedBullet[];
  approvedSkills?: string[];
  createdAt: string;
  updatedAt: string;
};

// ── 템플릿 / 디자인 (P3) ──
export type ResumeTemplateId = "basic" | "newgrad" | "project";
export const RESUME_TEMPLATES: { id: ResumeTemplateId; label: string; desc: string }[] = [
  { id: "basic", label: "기본형", desc: "어느 직무에나 무난한 단정한 기본 레이아웃" },
  { id: "newgrad", label: "신입형", desc: "요약·학력·자기소개를 앞세운 신입 친화 구성" },
  { id: "project", label: "프로젝트 강조형", desc: "프로젝트·활동 경험을 먼저 보여주는 구성" }
];

// 비주얼 레이아웃 — 템플릿(섹션 순서)과 별개로 시트의 골격을 바꾼다.
export type ResumeLayoutId = "modern" | "sidebar" | "sidebar-right" | "centered" | "band";
export const RESUME_LAYOUTS: { id: ResumeLayoutId; label: string; desc: string }[] = [
  { id: "modern", label: "모던 단단형", desc: "한 단 구성에 포인트 타이틀로 깔끔하게" },
  { id: "sidebar", label: "2단 사이드바형", desc: "좌측 사이드바(스킬·어학·자격) + 우측 본문" },
  { id: "sidebar-right", label: "2단 사이드바(우측)", desc: "사이드바를 오른쪽에 두는 2단 구성" },
  { id: "centered", label: "센터 헤더형", desc: "이름·연락처를 가운데 정렬한 단정한 구성" },
  { id: "band", label: "헤더 밴드형", desc: "이름·연락처를 컬러 밴드로 강조" }
];

// 포인트 컬러 — 섹션 타이틀·구분선·헤더 밴드 등에 쓰이는 강조색.
export const DEFAULT_ACCENT = "#0B46E8";
export const ACCENT_PRESETS = ["#0B46E8", "#111827", "#0F766E", "#7C3AED", "#DC2626", "#EA580C"];

// 섹션 제목 왼쪽 마커 모양.
export type ResumeTitleMarker = "diamond" | "bar" | "dot" | "underline" | "none";
export const RESUME_TITLE_MARKERS: { id: ResumeTitleMarker; label: string }[] = [
  { id: "diamond", label: "마름모" },
  { id: "bar", label: "세로 바" },
  { id: "dot", label: "점" },
  { id: "underline", label: "밑줄" },
  { id: "none", label: "없음" }
];

export type ResumeDesignSettings = {
  templateId: ResumeTemplateId;
  layout: ResumeLayoutId;
  accentColor: string;
  titleMarker: ResumeTitleMarker;
  fontScale: number; // 0.9 | 1 | 1.1
  lineHeight: number; // 1.4 | 1.6 | 1.8
  sectionGap: number; // 12 | 16 | 22 (px)
  showPhoto: boolean;
};

export const DEFAULT_DESIGN: ResumeDesignSettings = {
  templateId: "basic",
  layout: "modern",
  accentColor: DEFAULT_ACCENT,
  titleMarker: "diamond",
  fontScale: 1,
  lineHeight: 1.6,
  sectionGap: 22,
  showPhoto: false
};

export type ResumeBuilderState = {
  version: 1;
  onboarding: {
    purpose?: ResumePurpose;
    jobCategories: string[]; // JOB_CATEGORIES value 또는 JOB_UNDECIDED, 최대 3
    startMethod?: ResumeStartMethod;
    isForeigner?: boolean; // 외국인이면 기본 정보에 비자 항목 노출
    completedAt?: string;
  };
  experiences: BuilderExperience[];
  // 편집(P3) — 디자인 설정 + 포함할 경험 선택(미설정이면 승인 경험 전부 포함).
  design?: ResumeDesignSettings;
  includedExperienceIds?: string[];
  templateId?: string; // legacy/back-compat
  updatedAt?: string;
};

export const EMPTY_BUILDER_STATE: ResumeBuilderState = {
  version: 1,
  onboarding: { jobCategories: [] },
  experiences: []
};

export function isOnboardingComplete(state: ResumeBuilderState): boolean {
  const o = state.onboarding;
  return Boolean(o.purpose && o.jobCategories.length > 0 && o.startMethod);
}
