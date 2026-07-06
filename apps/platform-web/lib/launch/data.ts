// APLY Global Career Launch — 4주 프로그램 MVP 목데이터/타입.
// 초기 스캐폴드라 백엔드 없이 이 데이터로 화면을 채운다. 이후 API 연동 예정.

export const LAUNCH = {
  name: "APLY Global Career Launch",
  tagline: "외국인 유학생을 위한 4주 한국 취업 준비 프로그램",
  // 포인트 컬러
  lime: "#B7FF5A",
  blue: "#0B46E8"
} as const;

export type MissionStatus = "todo" | "submitted" | "reviewed";

export type Mission = {
  id: string;
  label: string;
  done?: boolean;
};

export type WeekPlan = {
  week: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  goal: string;
  seminar: { date: string; time: string; place: string; online: boolean };
  missions: Mission[];
  submission: { required: boolean; status: MissionStatus; label: string };
  feedback: { status: "none" | "pending" | "done"; note?: string };
};

export const WEEKS: WeekPlan[] = [
  {
    week: 1,
    title: "취업 가능성 진단 & 직무 방향 설정",
    subtitle: "나의 현재 위치를 파악하고 목표 직무를 정한다",
    goal: "AI 진단으로 취업 가능성을 확인하고, 지원할 직무 방향을 3개 이내로 좁힌다.",
    seminar: { date: "2026-07-13 (월)", time: "19:00–21:00", place: "온라인 (Zoom)", online: true },
    missions: [
      { id: "w1m1", label: "이력서 자가진단 완료", done: true },
      { id: "w1m2", label: "관심 직무 3개 선정" },
      { id: "w1m3", label: "직무별 필요 역량 정리" }
    ],
    submission: { required: true, status: "reviewed", label: "진단 결과 + 목표 직무 제출" },
    feedback: { status: "done", note: "직무 방향이 명확합니다. 2주차에 이력서로 구체화해요." }
  },
  {
    week: 2,
    title: "이력서 & 자기소개서 완성",
    subtitle: "resume-maker 로 기업 제출용 이력서/자소서를 만든다",
    goal: "대표 이력서 1부 + 목표 회사용 자기소개서 1부를 완성한다.",
    seminar: { date: "2026-07-20 (월)", time: "19:00–21:00", place: "온라인 (Zoom)", online: true },
    missions: [
      { id: "w2m1", label: "이력서 필수 항목 작성" },
      { id: "w2m2", label: "경력/경험 3개 이상 정리" },
      { id: "w2m3", label: "자기소개서 문항 4개 작성" }
    ],
    submission: { required: true, status: "submitted", label: "이력서 + 자소서 링크 제출" },
    feedback: { status: "pending" }
  },
  {
    week: 3,
    title: "모의면접 & 기업 지원 준비",
    subtitle: "AI 모의면접으로 답변을 다듬고 지원 준비를 마친다",
    goal: "모의면접 1회 완료 + 목표 공고 3개에 지원할 준비를 끝낸다.",
    seminar: { date: "2026-07-27 (월)", time: "19:00–21:00", place: "오프라인 (강남)", online: false },
    missions: [
      { id: "w3m1", label: "AI 모의면접 1회 진행" },
      { id: "w3m2", label: "예상 질문 10개 답변 정리" },
      { id: "w3m3", label: "지원할 공고 3개 선정" }
    ],
    submission: { required: true, status: "todo", label: "모의면접 결과 + 지원 리스트 제출" },
    feedback: { status: "none" }
  },
  {
    week: 4,
    title: "기업 제출용 프로필 완성",
    subtitle: "Global Talent Profile 을 완성해 기업에 제출한다",
    goal: "이력서·자소서·면접·추천을 담은 Global Talent Profile 을 완성한다.",
    seminar: { date: "2026-08-03 (월)", time: "19:00–21:00", place: "오프라인 (강남)", online: false },
    missions: [
      { id: "w4m1", label: "프로필 최종 검토" },
      { id: "w4m2", label: "포트폴리오/링크 정리" },
      { id: "w4m3", label: "기업 제출 동의" }
    ],
    submission: { required: true, status: "todo", label: "Global Talent Profile 제출" },
    feedback: { status: "none" }
  }
];

// 현재 로그인한(목) 학생.
export const STUDENT = {
  name: "Nguyen Mai",
  nameKo: "응우옌 마이",
  email: "mai@example.com",
  school: "고려대학교",
  major: "경영학",
  currentWeek: 2 as 1 | 2 | 3 | 4,
  cohort: "2026 여름 1기"
};

// 수료 조건.
export const COMPLETION_CRITERIA = [
  "4주차 미션 모두 제출",
  "오프라인 세미나 3회 이상 참석",
  "Global Talent Profile 완성 및 제출"
];

// 다음 오프라인 세미나(대시보드용).
export const NEXT_SEMINAR = { title: "Week 3 · 모의면접 워크숍", date: "2026-07-27 (월)", time: "19:00", place: "강남 세미나룸 A" };

// 전체 진행률(완료 미션 / 전체).
export function overallProgress(): number {
  const all = WEEKS.flatMap((w) => w.missions);
  const done = all.filter((m) => m.done).length;
  return Math.round((done / all.length) * 100);
}

// ── 운영자 데이터 ──
export const OPS_STATS = {
  applicants: 128,
  selected: 40,
  expectedCompletion: 32,
  resumeCompletionRate: 68, // %
  mockInterviewRate: 45, // %
  topCandidates: 12
};

export type OpsStudent = {
  id: string;
  name: string;
  school: string;
  major: string;
  week: 1 | 2 | 3 | 4;
  progress: number;
  resumeDone: boolean;
  interviewDone: boolean;
  status: "지원" | "선발" | "진행중" | "수료예정" | "탈락";
  top: boolean;
};

export const OPS_STUDENTS: OpsStudent[] = [
  { id: "s1", name: "Nguyen Mai", school: "고려대", major: "경영학", week: 2, progress: 50, resumeDone: true, interviewDone: false, status: "진행중", top: true },
  { id: "s2", name: "Li Wei", school: "연세대", major: "컴퓨터공학", week: 3, progress: 70, resumeDone: true, interviewDone: true, status: "수료예정", top: true },
  { id: "s3", name: "Tanaka Yuki", school: "성균관대", major: "디자인", week: 1, progress: 20, resumeDone: false, interviewDone: false, status: "선발", top: false },
  { id: "s4", name: "Aisha Rahman", school: "한양대", major: "국제학", week: 2, progress: 45, resumeDone: true, interviewDone: false, status: "진행중", top: false },
  { id: "s5", name: "Chen Jing", school: "서울대", major: "경제학", week: 4, progress: 92, resumeDone: true, interviewDone: true, status: "수료예정", top: true }
];

export type OpsSubmission = {
  id: string;
  student: string;
  week: 1 | 2 | 3 | 4;
  title: string;
  submittedAt: string;
  status: MissionStatus;
};

export const OPS_SUBMISSIONS: OpsSubmission[] = [
  { id: "sub1", student: "Li Wei", week: 3, title: "모의면접 결과 + 지원 리스트", submittedAt: "2026-07-28", status: "submitted" },
  { id: "sub2", student: "Nguyen Mai", week: 2, title: "이력서 + 자소서", submittedAt: "2026-07-21", status: "submitted" },
  { id: "sub3", student: "Chen Jing", week: 4, title: "Global Talent Profile", submittedAt: "2026-08-04", status: "reviewed" },
  { id: "sub4", student: "Aisha Rahman", week: 2, title: "이력서 + 자소서", submittedAt: "2026-07-22", status: "submitted" }
];
