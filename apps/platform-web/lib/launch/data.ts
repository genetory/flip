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

// 주차별 "해야 할 일"을 순서가 있는 실행 스텝으로 표현.
// desc: 무엇을 어떻게 하는지, action: 관련 aply.global 도구 바로가기(선택).
export type Step = {
  id: string;
  title: string;
  desc: string;
  action?: { label: string; href: string };
  done?: boolean;
};

export type WeekPlan = {
  week: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  goal: string;
  seminar: { date: string; time: string; place: string; online: boolean };
  steps: Step[];
  // 과제는 수동 제출이 아니라 aply.global 활동에서 자동 수집된다. source 는 그 출처.
  submission: { required: boolean; status: MissionStatus; label: string; source: string };
  feedback: { status: "none" | "pending" | "done"; note?: string };
};

export const WEEKS: WeekPlan[] = [
  {
    week: 1,
    title: "취업 가능성 진단 & 직무 방향 설정",
    subtitle: "지금 내 위치를 확인하고 목표 직무를 정해봐요",
    goal: "AI 진단으로 지금 내 취업 준비 상태를 살펴보고, 지원하고 싶은 직무를 3개 이내로 편하게 좁혀봐요.",
    seminar: { date: "2026-07-13 (월)", time: "19:00–21:00", place: "온라인 (Zoom)", online: true },
    steps: [
      {
        id: "w1s1",
        title: "AI 이력서 자가진단 실행",
        desc: "resume-maker에서 지금 이력서를 진단해봐요. 완성도와 부족한 부분을 리포트로 한눈에 확인할 수 있어요.",
        action: { label: "이력서 진단하기", href: "/resume-maker" }
      },
      {
        id: "w1s2",
        title: "관심 직무 3개 선정",
        desc: "채용 공고를 둘러보며 마음이 가는 직무를 3개 이내로 좁혀봐요. 너무 넓게 잡기보다 집중할 방향을 정하는 게 좋아요.",
        action: { label: "공고 둘러보기", href: "/positions" }
      },
      {
        id: "w1s3",
        title: "직무별 필요 역량 정리",
        desc: "고른 직무가 어떤 역량·자격을 원하는지 정리해봐요. 지금 내가 가진 것과 비교하면 무엇을 채우면 될지 보여요."
      }
    ],
    submission: { required: true, status: "todo", label: "진단 결과 + 목표 직무", source: "resume-maker 이력서 진단" },
    feedback: { status: "none" }
  },
  {
    week: 2,
    title: "이력서 & 자기소개서 완성",
    subtitle: "resume-maker로 기업에 낼 이력서·자소서를 만들어봐요",
    goal: "기업에 낼 대표 이력서 1부와 목표 회사용 자기소개서 1부를 완성해봐요. 하나씩 채우다 보면 금방이에요!",
    seminar: { date: "2026-07-20 (월)", time: "19:00–21:00", place: "온라인 (Zoom)", online: true },
    steps: [
      {
        id: "w2s1",
        title: "이력서 필수 항목 작성",
        desc: "resume-maker로 기본 정보·학력·연락처 같은 필수 항목부터 채워 이력서의 뼈대를 만들어봐요.",
        action: { label: "이력서 작성하기", href: "/resume-maker" }
      },
      {
        id: "w2s2",
        title: "경력·경험 3개 이상 정리",
        desc: "경험 채팅으로 프로젝트·인턴·활동을 3개 이상 정리해봐요. 성과를 숫자로 표현하면 훨씬 눈에 잘 띄어요.",
        action: { label: "경험 정리하기", href: "/resume-maker" }
      },
      {
        id: "w2s3",
        title: "자기소개서 4문항 작성",
        desc: "목표 회사에 맞춰 지원 동기·강점 등 4개 문항을 채워 자기소개서를 완성해봐요.",
        action: { label: "자기소개서 작성", href: "/resume-maker" }
      }
    ],
    submission: { required: true, status: "todo", label: "이력서 + 자기소개서", source: "resume-maker 대표 이력서·자기소개서" },
    feedback: { status: "none" }
  },
  {
    week: 3,
    title: "모의면접 & 기업 지원 준비",
    subtitle: "AI 모의면접으로 답변을 다듬고 지원 준비를 마쳐봐요",
    goal: "모의면접으로 답변을 다듬고, 지원할 공고 3개까지 준비를 마쳐봐요. 실전이 한결 편해질 거예요.",
    seminar: { date: "2026-07-27 (월)", time: "19:00–21:00", place: "오프라인 (강남)", online: false },
    steps: [
      {
        id: "w3s1",
        title: "AI 모의면접 1회 진행",
        desc: "AI 모의면접으로 실제 면접처럼 답변을 연습해봐요. 끝나면 개선할 점을 리포트로 알려드려요.",
        action: { label: "모의면접 시작", href: "/resume-maker" }
      },
      {
        id: "w3s2",
        title: "예상 질문 10개 답변 정리",
        desc: "자주 나오는 예상 질문 10개를 뽑아 나만의 답변을 미리 준비해두면 훨씬 든든해요."
      },
      {
        id: "w3s3",
        title: "지원할 공고 3개 선정",
        desc: "실제로 지원할 공고 3개를 정하고, 마감일과 자격요건을 미리 체크해봐요.",
        action: { label: "공고 보기", href: "/positions" }
      }
    ],
    submission: { required: true, status: "todo", label: "모의면접 결과 + 지원 리스트", source: "AI 모의면접 결과와 저장한 공고" },
    feedback: { status: "none" }
  },
  {
    week: 4,
    title: "기업 제출용 프로필 완성",
    subtitle: "Global Talent Profile을 완성해 기업에 선보여요",
    goal: "이력서·자소서·면접 결과를 한데 모아 나만의 Global Talent Profile을 완성해봐요. 이제 정말 거의 다 왔어요!",
    seminar: { date: "2026-08-03 (월)", time: "19:00–21:00", place: "오프라인 (강남)", online: false },
    steps: [
      {
        id: "w4s1",
        title: "프로필 최종 검토",
        desc: "이력서·자소서·모의면접 결과가 프로필에 잘 담겼는지 마지막으로 점검해봐요.",
        action: { label: "내 프로필 보기", href: "/career-launch/profile" }
      },
      {
        id: "w4s2",
        title: "포트폴리오·링크 정리",
        desc: "작업물·깃허브·포트폴리오 링크를 정리해 프로필에 더해봐요."
      },
      {
        id: "w4s3",
        title: "기업 제출 동의",
        desc: "완성한 프로필을 참여 기업에 공유하는 데 동의하면 모든 준비가 끝나요. 정말 수고 많았어요!"
      }
    ],
    submission: { required: true, status: "todo", label: "Global Talent Profile", source: "완성된 Global Talent Profile" },
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
  currentWeek: 1 as 1 | 2 | 3 | 4,
  cohort: "2026 여름 1기"
};

// 수료 조건.
export const COMPLETION_CRITERIA = [
  "4주차까지 미션 모두 완료하기",
  "세미나 3회 이상 참석하기",
  "Global Talent Profile 완성하기"
];

// 다음 오프라인 세미나(대시보드용) — 프로그램 시작 시점 기준 Week 1 세미나.
export const NEXT_SEMINAR = { title: "Week 1 · 취업 가능성 진단 세미나", date: "2026-07-13 (월)", time: "19:00", place: "온라인 (Zoom)" };

// 전체 진행률(완료 스텝 / 전체).
export function overallProgress(): number {
  const all = WEEKS.flatMap((w) => w.steps);
  const done = all.filter((s) => s.done).length;
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
