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
    subtitle: "지금 내 상태를 점검하고 목표 직무를 정해봐요",
    goal: "내 취업 준비 상태를 점검하고, 지원하고 싶은 직무를 3개 이내로 정해요. 다음 주 이력서에 담을 재료도 미리 모아봐요.",
    seminar: { date: "2026-07-13 (월)", time: "19:00–21:00", place: "온라인 (Zoom)", online: true },
    steps: [
      {
        id: "w1s1",
        title: "취업 준비 상태 자가진단",
        desc: "경력·어학·비자·직무 이해도 등 지금 내 준비 상태를 스스로 점검해봐요. 어디를 채우면 좋을지 방향이 보여요.",
        action: { label: "진단 시작하기", href: "/career-launch/diagnosis" }
      },
      {
        id: "w1s2",
        title: "관심 직무 3개 선정",
        desc: "AI가 전공·강점을 분석해 어울리는 직무를 추천해드려요. 마음이 가는 직무를 3개 이내로 골라봐요.",
        action: { label: "직무 선정하기", href: "/career-launch/jobs" }
      },
      {
        id: "w1s3",
        title: "이력서에 담을 재료 모으기",
        desc: "고른 직무가 원하는 역량·자격을 정리하고, 내 경험·프로젝트·성과를 떠오르는 대로 메모해둬요. 다음 주 이력서 작성이 훨씬 수월해져요."
      }
    ],
    submission: { required: true, status: "todo", label: "목표 직무 + 이력서 재료", source: "정한 목표 직무와 정리한 경험 메모" },
    feedback: { status: "none" }
  },
  {
    week: 2,
    title: "이력서 만들기",
    subtitle: "프로그램 안에서 바로 대표 이력서를 완성해봐요",
    goal: "기업에 낼 대표 이력서 초안을 완성해요. AI 진단으로 부족한 부분까지 채우면 든든한 이력서 한 부가 만들어져요.",
    seminar: { date: "2026-07-20 (월)", time: "19:00–21:00", place: "온라인 (Zoom)", online: true },
    steps: [
      {
        id: "w2s1",
        title: "이력서 기본 항목 작성",
        desc: "기본 정보·학력·연락처 같은 필수 항목부터 채워 이력서의 뼈대를 만들어봐요.",
        action: { label: "이력서 작성하기", href: "/career-launch/resume" }
      },
      {
        id: "w2s2",
        title: "경력·경험 3개 이상 정리",
        desc: "지난 주 모아둔 재료로 프로젝트·인턴·활동을 3개 이상 정리해요. 성과를 숫자로 표현하면 훨씬 눈에 잘 띄어요.",
        action: { label: "경험 정리하기", href: "/career-launch/resume" }
      },
      {
        id: "w2s3",
        title: "AI 이력서 진단으로 보완",
        desc: "완성한 이력서를 AI로 진단해 완성도와 부족한 부분을 확인하고 채워봐요.",
        action: { label: "이력서 진단하기", href: "/career-launch/resume" }
      }
    ],
    submission: { required: true, status: "todo", label: "대표 이력서 초안", source: "프로그램에서 만든 대표 이력서" },
    feedback: { status: "none" }
  },
  {
    week: 3,
    title: "자기소개서 만들기 & 다듬기",
    subtitle: "자기소개서를 쓰고 이력서와 맞춰 완성본을 만들어요",
    goal: "목표 회사에 맞춘 자기소개서를 완성하고, 이력서와 서로 어울리게 다듬어 이력서·자소서 완성본을 만들어요.",
    seminar: { date: "2026-07-27 (월)", time: "19:00–21:00", place: "오프라인 (강남)", online: false },
    steps: [
      {
        id: "w3s1",
        title: "자기소개서 4문항 작성",
        desc: "지원 동기·강점 등 4개 문항을 채워 목표 회사용 자기소개서를 써봐요.",
        action: { label: "자기소개서 작성", href: "/career-launch/cover-letter" }
      },
      {
        id: "w3s2",
        title: "이력서·자소서 함께 다듬기",
        desc: "이력서와 자기소개서의 메시지가 서로 일관되게 맞춰 다듬어봐요. 두 문서가 같은 이야기를 하면 설득력이 커져요.",
        action: { label: "이력서 다듬기", href: "/career-launch/resume" }
      },
      {
        id: "w3s3",
        title: "완성도 점검 & 피드백 반영",
        desc: "AI 진단과 운영진 피드백을 반영해 완성도를 끌어올려 완성본을 만들어요."
      }
    ],
    submission: { required: true, status: "todo", label: "이력서 + 자기소개서 완성본", source: "프로그램에서 만든 이력서·자기소개서" },
    feedback: { status: "none" }
  },
  {
    week: 4,
    title: "완성 & 기업 지원",
    subtitle: "완성한 이력서·자소서로 기업에 지원해봐요",
    goal: "이력서·자기소개서 완성본을 확정하고, 목표 공고에 실제로 지원해요. 4주의 결실을 맺는 단계예요!",
    seminar: { date: "2026-08-03 (월)", time: "19:00–21:00", place: "오프라인 (강남)", online: false },
    steps: [
      {
        id: "w4s1",
        title: "이력서·자소서 최종 확정",
        desc: "완성한 이력서와 자기소개서를 마지막으로 검토해 확정해요.",
        action: { label: "내 이력서 보기", href: "/career-launch/resume" }
      },
      {
        id: "w4s2",
        title: "지원할 공고 3개 선정",
        desc: "지원할 채용 공고 3개를 정하고 마감일과 자격요건을 미리 체크해요.",
        action: { label: "공고 보기", href: "/positions" }
      },
      {
        id: "w4s3",
        title: "기업에 지원하기",
        desc: "완성한 이력서로 목표 기업에 지원해봐요. 드디어 실전이에요!",
        action: { label: "지원하러 가기", href: "/positions" }
      }
    ],
    submission: { required: true, status: "todo", label: "기업 지원 완료", source: "완성한 이력서로 제출한 지원" },
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
  "4주 미션 모두 완료하기",
  "세미나 3회 이상 참석하기",
  "이력서·자기소개서 완성하고 기업에 지원하기"
];

// 다음 오프라인 세미나(대시보드용) — 프로그램 시작 시점 기준 Week 1 세미나.
export const NEXT_SEMINAR = { title: "Week 1 · 취업 가능성 진단 세미나", date: "2026-07-13 (월)", time: "19:00", place: "온라인 (Zoom)" };

// Week 1 — AI 직무 추천(목). 실제로는 학생 프로필·전공·관심사를 분석해 생성.
export type RecommendedJob = {
  id: string;
  role: string; // 추천 직무
  match: number; // 매칭 점수(%)
  reason: string; // 추천 이유
  skills: string[]; // 관련 역량
  tags: string[]; // 매칭용 키워드(전공·분야)
  query: string; // /positions 검색어
};

export const RECOMMENDED_JOBS: RecommendedJob[] = [
  {
    id: "rj1",
    role: "글로벌 마케팅",
    match: 92,
    reason: "경영학 전공과 다국어 역량이 잘 맞아요. 해외 시장을 겨냥하는 국내 기업 수요가 많은 직무예요.",
    skills: ["시장 분석", "콘텐츠 기획", "다국어 커뮤니케이션"],
    tags: ["마케팅", "경영", "경영학", "글로벌", "해외", "비즈니스"],
    query: "글로벌 마케팅"
  },
  {
    id: "rj2",
    role: "해외영업 · 글로벌 세일즈",
    match: 88,
    reason: "모국어·한국어·영어를 함께 쓰는 강점이 크게 작용해요. 외국인 인재를 적극 채용하는 분야예요.",
    skills: ["협상", "고객 관리", "영어 · 모국어"],
    tags: ["영업", "세일즈", "경영", "무역", "글로벌", "해외"],
    query: "해외영업"
  },
  {
    id: "rj3",
    role: "고객경험(CX) · CS 매니저",
    match: 83,
    reason: "커뮤니케이션 강점과 꼼꼼함이 잘 어울려요. 글로벌 고객을 대응하는 팀에서 선호해요.",
    skills: ["고객 응대", "문제 해결", "다국어"],
    tags: ["고객", "서비스", "cs", "경영", "커뮤니케이션"],
    query: "고객경험"
  },
  {
    id: "rj4",
    role: "데이터 분석",
    match: 76,
    reason: "숫자로 성과를 정리하는 걸 좋아한다면 도전해볼 만해요. 기초 역량을 조금 더 쌓으면 경쟁력이 커져요.",
    skills: ["엑셀 · SQL", "데이터 해석", "리포팅"],
    tags: ["데이터", "통계", "it", "컴퓨터", "분석", "경영"],
    query: "데이터 분석"
  },
  {
    id: "rj5",
    role: "브랜드 · 콘텐츠 마케팅",
    match: 74,
    reason: "기획·표현에 관심이 있다면 잘 맞아요. 포트폴리오를 함께 준비하면 더 강해져요.",
    skills: ["콘텐츠 기획", "브랜딩", "SNS 운영"],
    tags: ["마케팅", "콘텐츠", "디자인", "미디어", "브랜드"],
    query: "콘텐츠 마케팅"
  },
  {
    id: "rj6",
    role: "인사(HR) · 채용",
    match: 72,
    reason: "사람과 조직에 관심이 있다면 잘 맞아요. 글로벌 인재를 채용·관리하는 팀에서 강점이 돼요.",
    skills: ["채용", "조직 관리", "커뮤니케이션"],
    tags: ["인사", "hr", "경영", "심리", "조직"],
    query: "인사"
  },
  {
    id: "rj7",
    role: "무역 · 물류",
    match: 70,
    reason: "국제 비즈니스에 관심이 있다면 잘 어울려요. 다국어와 서류 처리 강점이 크게 작용해요.",
    skills: ["수출입", "공급망", "서류 관리"],
    tags: ["무역", "물류", "경영", "국제", "공급망", "비즈니스"],
    query: "무역"
  },
  {
    id: "rj8",
    role: "서비스 기획(PM)",
    match: 68,
    reason: "사용자 관점에서 서비스를 설계하는 걸 좋아한다면 도전해볼 만해요. 기획 경험을 쌓아가면 좋아요.",
    skills: ["기획", "사용자 리서치", "협업"],
    tags: ["기획", "it", "컴퓨터", "서비스", "pm", "경영"],
    query: "서비스 기획"
  },
  {
    id: "rj9",
    role: "통·번역 코디네이터",
    match: 66,
    reason: "언어 강점을 바로 살릴 수 있어요. 글로벌 협업이 많은 조직에서 수요가 있어요.",
    skills: ["통역", "번역", "문서화"],
    tags: ["통역", "번역", "어학", "언어", "외국어"],
    query: "통역"
  }
];

// 입력한 전공·관심 키워드로 추천 직무를 재정렬(매칭되는 직무를 앞으로).
// (지금은 목업 규칙. 이후 실제 프로필 분석으로 대체)
export function recommendJobs(query?: string): RecommendedJob[] {
  const q = (query ?? "").trim().toLowerCase();
  const byMatch = (a: RecommendedJob, b: RecommendedJob) => b.match - a.match;
  if (!q) return [...RECOMMENDED_JOBS].sort(byMatch);
  const words = q.split(/[\s,·]+/).filter(Boolean);
  const hit = (j: RecommendedJob) => {
    const hay = [j.role, j.reason, ...j.skills, ...j.tags].join(" ").toLowerCase();
    return words.some((w) => hay.includes(w));
  };
  const hits = RECOMMENDED_JOBS.filter(hit).sort(byMatch);
  const rest = RECOMMENDED_JOBS.filter((j) => !hit(j)).sort(byMatch);
  return [...hits, ...rest];
}

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
