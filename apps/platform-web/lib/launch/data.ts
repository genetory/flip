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
  minutes?: number; // 예상 소요 시간(분)
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
        minutes: 10,
        desc: "경력·어학·비자·직무 이해도 등 지금 내 준비 상태를 스스로 점검해봐요. 어디를 채우면 좋을지 방향이 보여요.",
        action: { label: "시작하기", href: "/career-launch/diagnosis" }
      },
      {
        id: "w1s2",
        title: "관심 직무 3개 선정",
        minutes: 10,
        desc: "AI와 대화하며 나에게 어울리는 직무를 찾아봐요. 추천받은 직무 중 마음이 가는 걸 3개 이내로 골라요.",
        action: { label: "시작하기", href: "/career-launch/jobs" }
      },
      {
        id: "w1s3",
        title: "선정 직무 깊이 알기",
        minutes: 10,
        desc: "고른 직무가 실제로 어떤 일을 하고, 어떤 역량·자격이 필요한지 AI와 알아봐요. 뭘 준비하면 좋을지 방향이 잡혀요.",
        action: { label: "시작하기", href: "/career-launch/materials" }
      },
      {
        id: "w1s4",
        title: "한국 기업문화 이해",
        minutes: 10,
        desc: "한국의 채용 방식과 직장 문화를 먼저 이해해두면 이력서·면접 준비의 방향이 잡혀요.",
        action: { label: "시작하기", href: "/career-launch/culture/w1s4" }
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
        action: { label: "시작하기", href: "/career-launch/resume" }
      },
      {
        id: "w2s2",
        title: "경력·경험 3개 이상 정리",
        desc: "지난 주 모아둔 재료로 프로젝트·인턴·활동을 3개 이상 정리해요. 성과를 숫자로 표현하면 훨씬 눈에 잘 띄어요.",
        action: { label: "시작하기", href: "/career-launch/resume" }
      },
      {
        id: "w2s3",
        title: "AI 이력서 진단으로 보완",
        desc: "완성한 이력서를 AI로 진단해 완성도와 부족한 부분을 확인하고 채워봐요.",
        action: { label: "시작하기", href: "/career-launch/resume" }
      },
      {
        id: "w2s4",
        title: "한국식 이력서 매너",
        minutes: 10,
        desc: "사진·양식·표현 등 한국 이력서에서 지켜야 할 것과 피해야 할 것을 알아둬요.",
        action: { label: "시작하기", href: "/career-launch/culture/w2s4" }
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
        action: { label: "시작하기", href: "/career-launch/cover-letter" }
      },
      {
        id: "w3s2",
        title: "이력서·자소서 함께 다듬기",
        desc: "이력서와 자기소개서의 메시지가 서로 일관되게 맞춰 다듬어봐요. 두 문서가 같은 이야기를 하면 설득력이 커져요.",
        action: { label: "시작하기", href: "/career-launch/resume" }
      },
      {
        id: "w3s3",
        title: "완성도 점검 & 피드백 반영",
        desc: "AI 진단과 운영진 피드백을 반영해 완성도를 끌어올려 완성본을 만들어요."
      },
      {
        id: "w3s4",
        title: "비즈니스 커뮤니케이션 예절",
        minutes: 10,
        desc: "존댓말·호칭, 이메일 형식, 회신 매너 등 한국 직장의 소통 예절을 익혀요.",
        action: { label: "시작하기", href: "/career-launch/culture/w3s4" }
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
        action: { label: "시작하기", href: "/career-launch/resume" }
      },
      {
        id: "w4s2",
        title: "지원할 공고 3개 선정",
        desc: "지원할 채용 공고 3개를 정하고 마감일과 자격요건을 미리 체크해요.",
        action: { label: "시작하기", href: "/positions" }
      },
      {
        id: "w4s3",
        title: "기업에 지원하기",
        desc: "완성한 이력서로 목표 기업에 지원해봐요. 드디어 실전이에요!",
        action: { label: "시작하기", href: "/positions" }
      },
      {
        id: "w4s4",
        title: "면접 예절 & 입사 매너",
        minutes: 10,
        desc: "복장·인사·시간 약속·감사 메일까지, 면접과 입사 첫인상을 좌우하는 매너를 알아둬요.",
        action: { label: "시작하기", href: "/career-launch/culture/w4s4" }
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
  // ── 고객 · 언어 ──
  {
    id: "rj3",
    role: "고객경험(CX) · CS",
    match: 70,
    reason: "커뮤니케이션 강점과 꼼꼼함이 잘 어울려요. 글로벌 고객을 대응하는 팀에서 선호해요.",
    skills: ["고객 응대", "문제 해결", "다국어"],
    tags: ["고객", "서비스", "cs", "cx", "경영", "커뮤니케이션"],
    query: "고객경험"
  },
  {
    id: "rj9",
    role: "통·번역 코디네이터",
    match: 66,
    reason: "언어 강점을 바로 살릴 수 있어요. 글로벌 협업이 많은 조직에서 수요가 있어요.",
    skills: ["통역", "번역", "문서화"],
    tags: ["통역", "번역", "어학", "언어", "외국어"],
    query: "통역"
  },
  // ── 개발 · IT ──
  { id: "rj10", role: "백엔드 개발자", match: 90, reason: "서버·API·데이터베이스를 설계하고 만드는 직무예요. 컴퓨터공학·개발 경험이 있다면 강점이 커요.", skills: ["Java · Python", "API 설계", "데이터베이스"], tags: ["개발", "백엔드", "서버", "it", "컴퓨터", "컴퓨터공학", "소프트웨어", "프로그래밍", "엔지니어"], query: "백엔드 개발자" },
  { id: "rj11", role: "프론트엔드 개발자", match: 89, reason: "사용자가 보는 화면을 만드는 직무예요. 웹·UI 구현에 관심이 있다면 잘 맞아요.", skills: ["React", "TypeScript", "HTML · CSS"], tags: ["개발", "프론트엔드", "웹", "it", "컴퓨터", "컴퓨터공학", "소프트웨어", "프로그래밍", "ui"], query: "프론트엔드 개발자" },
  { id: "rj12", role: "소프트웨어 엔지니어", match: 88, reason: "제품 전반의 기능을 개발하는 직무예요. 개발 기초가 탄탄하다면 폭넓게 성장할 수 있어요.", skills: ["자료구조 · 알고리즘", "설계", "협업"], tags: ["개발", "소프트웨어", "엔지니어", "it", "컴퓨터", "컴퓨터공학", "프로그래밍"], query: "소프트웨어 엔지니어" },
  { id: "rj13", role: "웹 · 풀스택 개발자", match: 86, reason: "프론트와 백엔드를 함께 다루는 직무예요. 넓게 만들어보는 걸 좋아한다면 잘 어울려요.", skills: ["웹 개발", "API", "DB"], tags: ["개발", "풀스택", "웹", "it", "컴퓨터", "프로그래밍"], query: "풀스택 개발자" },
  { id: "rj14", role: "안드로이드 개발자", match: 83, reason: "안드로이드 앱을 만드는 직무예요. 모바일 서비스에 관심이 있다면 도전해볼 만해요.", skills: ["Kotlin", "Android", "UI 구현"], tags: ["개발", "모바일", "앱", "안드로이드", "it", "컴퓨터", "프로그래밍"], query: "안드로이드 개발자" },
  { id: "rj15", role: "iOS 개발자", match: 83, reason: "아이폰 앱을 만드는 직무예요. 애플 생태계·모바일에 관심이 있다면 잘 맞아요.", skills: ["Swift", "iOS", "UI 구현"], tags: ["개발", "모바일", "앱", "ios", "it", "컴퓨터", "프로그래밍"], query: "iOS 개발자" },
  { id: "rj16", role: "데이터 엔지니어", match: 85, reason: "데이터 파이프라인·인프라를 만드는 직무예요. 개발과 데이터를 함께 다뤄요.", skills: ["SQL", "데이터 파이프라인", "클라우드"], tags: ["데이터", "엔지니어", "개발", "it", "컴퓨터", "인프라"], query: "데이터 엔지니어" },
  { id: "rj17", role: "머신러닝 · AI 엔지니어", match: 86, reason: "데이터로 모델을 만들고 서비스에 적용하는 직무예요. 수학·데이터에 강하다면 강점이 커요.", skills: ["Python", "머신러닝", "데이터 처리"], tags: ["ai", "머신러닝", "ml", "데이터", "개발", "it", "컴퓨터", "인공지능"], query: "머신러닝 엔지니어" },
  { id: "rj18", role: "DevOps · 인프라 엔지니어", match: 82, reason: "서비스 배포·운영·클라우드를 다루는 직무예요. 시스템 전반에 관심이 있다면 잘 맞아요.", skills: ["AWS · 클라우드", "CI/CD", "리눅스"], tags: ["devops", "인프라", "클라우드", "개발", "it", "컴퓨터", "서버"], query: "DevOps" },
  { id: "rj19", role: "QA 엔지니어", match: 76, reason: "제품 품질을 점검하고 테스트하는 직무예요. 꼼꼼함이 강점이라면 잘 어울려요.", skills: ["테스트 설계", "자동화", "버그 리포팅"], tags: ["qa", "테스트", "품질", "개발", "it", "컴퓨터"], query: "QA" },
  { id: "rj20", role: "보안 엔지니어", match: 77, reason: "시스템과 데이터를 지키는 직무예요. 보안·네트워크에 관심이 있다면 강점이 돼요.", skills: ["네트워크", "취약점 분석", "보안"], tags: ["보안", "security", "개발", "it", "컴퓨터", "네트워크"], query: "보안" },
  { id: "rj21", role: "게임 개발자", match: 73, reason: "게임 클라이언트·서버를 만드는 직무예요. 게임을 좋아하고 개발에 관심이 있다면 잘 맞아요.", skills: ["C++ · Unity", "게임 로직", "최적화"], tags: ["게임", "개발", "unity", "it", "컴퓨터", "프로그래밍"], query: "게임 개발" },
  { id: "rj22", role: "웹 퍼블리셔", match: 65, reason: "디자인을 웹 화면으로 구현하는 직무예요. 디자인과 코드를 잇는 역할이에요.", skills: ["HTML · CSS", "반응형", "접근성"], tags: ["퍼블리셔", "웹", "프론트엔드", "디자인", "it"], query: "웹 퍼블리셔" },
  // ── 데이터 ──
  { id: "rj23", role: "데이터 사이언티스트", match: 84, reason: "데이터로 문제를 분석하고 인사이트를 만드는 직무예요. 통계·분석에 강하다면 강점이 커요.", skills: ["통계", "Python · R", "모델링"], tags: ["데이터", "사이언스", "ai", "통계", "분석", "it", "컴퓨터"], query: "데이터 사이언티스트" },
  { id: "rj24", role: "데이터 분석가", match: 80, reason: "숫자로 성과를 정리하고 의사결정을 돕는 직무예요. 분석을 좋아한다면 잘 맞아요.", skills: ["엑셀 · SQL", "데이터 해석", "리포팅"], tags: ["데이터", "통계", "분석", "it", "경영", "비즈니스"], query: "데이터 분석" },
  { id: "rj25", role: "BI · 데이터 기획", match: 74, reason: "데이터를 지표·대시보드로 만들어 팀을 돕는 직무예요. 분석과 기획을 함께 다뤄요.", skills: ["대시보드", "SQL", "지표 설계"], tags: ["bi", "데이터", "분석", "기획", "it"], query: "BI" },
  // ── 디자인 ──
  { id: "rj26", role: "UX · UI 디자이너", match: 80, reason: "사용자 경험과 화면을 디자인하는 직무예요. 디자인·사용자에 관심이 있다면 잘 어울려요.", skills: ["Figma", "UX 리서치", "UI 디자인"], tags: ["디자인", "ux", "ui", "프로덕트", "웹", "미술"], query: "UX 디자이너" },
  { id: "rj27", role: "프로덕트 디자이너", match: 78, reason: "제품 전체의 경험을 설계하는 디자인 직무예요. 문제 해결형 디자인을 좋아한다면 잘 맞아요.", skills: ["프로덕트 디자인", "프로토타이핑", "협업"], tags: ["디자인", "프로덕트", "ux", "ui"], query: "프로덕트 디자이너" },
  { id: "rj28", role: "BX · 브랜드 디자이너", match: 73, reason: "브랜드의 시각 아이덴티티를 만드는 직무예요. 브랜딩·그래픽에 관심이 있다면 좋아요.", skills: ["브랜딩", "그래픽", "타이포"], tags: ["디자인", "브랜드", "bx", "그래픽", "미술"], query: "브랜드 디자이너" },
  { id: "rj29", role: "영상 · 모션 디자이너", match: 69, reason: "영상·모션 그래픽을 만드는 직무예요. 영상 편집·애니메이션에 관심이 있다면 잘 맞아요.", skills: ["영상 편집", "모션 그래픽", "After Effects"], tags: ["디자인", "영상", "모션", "미디어", "편집"], query: "영상 디자이너" },
  // ── 기획 · PM ──
  { id: "rj30", role: "프로덕트 매니저(PM)", match: 83, reason: "제품 방향을 정하고 팀을 이끄는 직무예요. 기획·소통에 강하다면 강점이 커요.", skills: ["기획", "우선순위", "협업"], tags: ["기획", "pm", "프로덕트", "it", "경영", "서비스"], query: "프로덕트 매니저" },
  { id: "rj31", role: "서비스 기획자", match: 76, reason: "사용자 관점에서 서비스를 설계하는 직무예요. 기획 경험을 쌓아가면 좋아요.", skills: ["기획", "사용자 리서치", "문서화"], tags: ["기획", "서비스", "it", "경영", "pm"], query: "서비스 기획" },
  { id: "rj32", role: "프로젝트 매니저 · PMO", match: 71, reason: "프로젝트 일정·리소스를 관리하는 직무예요. 조율·관리에 강하다면 잘 어울려요.", skills: ["일정 관리", "리스크 관리", "협업"], tags: ["프로젝트", "pm", "pmo", "관리", "경영"], query: "프로젝트 매니저" },
  { id: "rj33", role: "게임 기획자", match: 67, reason: "게임의 규칙·콘텐츠를 설계하는 직무예요. 게임을 깊이 좋아한다면 잘 맞아요.", skills: ["게임 기획", "밸런싱", "시나리오"], tags: ["게임", "기획", "콘텐츠"], query: "게임 기획" },
  // ── 마케팅 · 광고 ──
  { id: "rj34", role: "그로스 마케터", match: 79, reason: "데이터로 성장을 만드는 마케팅 직무예요. 실험·분석을 좋아한다면 잘 맞아요.", skills: ["데이터 분석", "A/B 테스트", "퍼널"], tags: ["마케팅", "그로스", "데이터", "퍼포먼스", "it"], query: "그로스 마케팅" },
  { id: "rj35", role: "퍼포먼스 마케터", match: 78, reason: "광고 성과를 데이터로 높이는 직무예요. 숫자와 마케팅을 함께 좋아한다면 잘 맞아요.", skills: ["광고 운영", "데이터 분석", "리포팅"], tags: ["마케팅", "퍼포먼스", "광고", "데이터"], query: "퍼포먼스 마케팅" },
  { id: "rj36", role: "글로벌 마케팅", match: 77, reason: "해외 시장을 겨냥한 마케팅 직무예요. 다국어 역량이 큰 강점이 돼요.", skills: ["시장 분석", "콘텐츠 기획", "다국어"], tags: ["마케팅", "경영", "경영학", "글로벌", "해외", "비즈니스"], query: "글로벌 마케팅" },
  { id: "rj37", role: "콘텐츠 · 브랜드 마케터", match: 74, reason: "기획·표현에 관심이 있다면 잘 맞아요. 포트폴리오를 함께 준비하면 더 강해져요.", skills: ["콘텐츠 기획", "브랜딩", "SNS 운영"], tags: ["마케팅", "콘텐츠", "브랜드", "미디어", "sns"], query: "콘텐츠 마케팅" },
  { id: "rj38", role: "CRM 마케터", match: 70, reason: "고객 데이터로 재구매·충성도를 높이는 직무예요. 분석과 커뮤니케이션을 함께 다뤄요.", skills: ["CRM", "타겟팅", "메시지 기획"], tags: ["마케팅", "crm", "데이터", "고객"], query: "CRM 마케팅" },
  { id: "rj39", role: "PR · 홍보", match: 67, reason: "브랜드의 이야기를 알리는 직무예요. 글쓰기·소통에 강하다면 잘 어울려요.", skills: ["보도자료", "언론 관계", "커뮤니케이션"], tags: ["pr", "홍보", "마케팅", "커뮤니케이션", "미디어"], query: "홍보" },
  // ── 영업 · 비즈니스 ──
  { id: "rj40", role: "해외영업 · 글로벌 세일즈", match: 80, reason: "모국어·한국어·영어를 함께 쓰는 강점이 크게 작용해요. 외국인 인재를 적극 채용하는 분야예요.", skills: ["협상", "고객 관리", "영어 · 모국어"], tags: ["영업", "세일즈", "경영", "무역", "글로벌", "해외"], query: "해외영업" },
  { id: "rj41", role: "사업개발(BD)", match: 74, reason: "새로운 사업 기회를 발굴하고 파트너십을 만드는 직무예요. 전략·소통에 강하다면 잘 어울려요.", skills: ["전략", "제휴", "커뮤니케이션"], tags: ["사업개발", "bd", "전략", "경영", "비즈니스", "영업"], query: "사업개발" },
  { id: "rj42", role: "기술영업 (Sales Engineer)", match: 71, reason: "기술 제품을 고객에게 설명하고 파는 직무예요. IT 지식과 소통을 함께 살려요.", skills: ["제품 이해", "고객 대응", "제안"], tags: ["영업", "기술영업", "it", "b2b", "세일즈"], query: "기술영업" },
  // ── 경영 · 비즈니스 지원 ──
  { id: "rj43", role: "경영기획 · 전략", match: 72, reason: "회사의 방향과 계획을 세우는 직무예요. 분석·기획에 강하다면 강점이 커요.", skills: ["전략 기획", "시장 분석", "보고"], tags: ["경영", "전략", "기획", "경영학", "비즈니스"], query: "경영기획" },
  { id: "rj44", role: "인사(HR) · 채용", match: 71, reason: "사람과 조직을 다루는 직무예요. 글로벌 인재를 채용·관리하는 팀에서 강점이 돼요.", skills: ["채용", "조직 관리", "커뮤니케이션"], tags: ["인사", "hr", "경영", "심리", "조직"], query: "인사" },
  { id: "rj45", role: "재무 · 회계", match: 70, reason: "숫자와 자금을 다루는 직무예요. 꼼꼼함과 경영·회계 지식이 강점이 돼요.", skills: ["회계", "재무 분석", "엑셀"], tags: ["재무", "회계", "경영", "경제", "숫자"], query: "회계" },
  { id: "rj46", role: "HRD · 교육 담당", match: 65, reason: "구성원 성장을 돕는 교육을 기획하는 직무예요. 교육·사람에 관심이 있다면 잘 맞아요.", skills: ["교육 기획", "운영", "콘텐츠"], tags: ["hrd", "인사", "교육", "경영", "조직"], query: "HRD" },
  // ── 물류 · 무역 · 구매 ──
  { id: "rj47", role: "무역 · 수출입", match: 69, reason: "국제 거래와 수출입 업무를 다루는 직무예요. 다국어와 서류 처리 강점이 크게 작용해요.", skills: ["수출입", "무역 서류", "다국어"], tags: ["무역", "수출입", "국제", "경영", "비즈니스"], query: "무역" },
  { id: "rj48", role: "물류 · SCM", match: 67, reason: "공급망과 물류를 관리하는 직무예요. 계획·조율을 좋아한다면 잘 어울려요.", skills: ["공급망", "재고 관리", "데이터"], tags: ["물류", "scm", "공급망", "경영", "무역"], query: "물류" },
  { id: "rj49", role: "구매 · 소싱", match: 64, reason: "필요한 자재·서비스를 확보하는 직무예요. 협상·관리에 강하다면 좋아요.", skills: ["소싱", "협상", "원가 관리"], tags: ["구매", "소싱", "경영", "공급망"], query: "구매" },
  // ── 고객 · 미디어 ──
  { id: "rj50", role: "콘텐츠 에디터 · 작가", match: 66, reason: "글과 콘텐츠를 만드는 직무예요. 글쓰기·기획에 관심이 있다면 잘 맞아요.", skills: ["콘텐츠 기획", "글쓰기", "편집"], tags: ["콘텐츠", "에디터", "작가", "미디어", "글쓰기"], query: "콘텐츠 에디터" }
];

// 추천 입력 조건 — 학과·관심 산업·관심 직군. 각 옵션은 매칭용 terms 를 가진다.
export type JobFilterOption = { label: string; terms: string[] };

// 관심 직군(무엇을 하고 싶은가).
export const JOB_FIELDS: JobFilterOption[] = [
  { label: "개발", terms: ["개발", "it", "소프트웨어", "프로그래밍"] },
  { label: "데이터·AI", terms: ["데이터", "ai", "머신러닝", "분석"] },
  { label: "디자인", terms: ["디자인", "ux", "ui"] },
  { label: "기획·PM", terms: ["기획", "pm", "프로덕트"] },
  { label: "마케팅", terms: ["마케팅", "광고", "콘텐츠", "브랜드"] },
  { label: "영업·비즈니스", terms: ["영업", "세일즈", "사업개발", "비즈니스"] },
  { label: "경영·인사", terms: ["경영", "인사", "hr", "재무", "회계"] },
  { label: "물류·무역", terms: ["무역", "물류", "구매", "공급망"] },
  { label: "고객·CS", terms: ["고객", "cs", "cx"] },
  { label: "게임", terms: ["게임"] }
];

// 관심 산업(어떤 분야에서 일하고 싶은가).
export const JOB_INDUSTRIES: JobFilterOption[] = [
  { label: "IT·소프트웨어", terms: ["it", "개발", "소프트웨어", "웹"] },
  { label: "게임", terms: ["게임"] },
  { label: "금융", terms: ["재무", "회계", "금융", "경제"] },
  { label: "커머스·유통", terms: ["커머스", "유통", "물류", "고객"] },
  { label: "마케팅·광고", terms: ["마케팅", "광고", "브랜드"] },
  { label: "미디어·콘텐츠", terms: ["미디어", "콘텐츠", "영상", "글쓰기"] },
  { label: "제조·엔지니어링", terms: ["제조", "엔지니어", "품질"] },
  { label: "물류·무역", terms: ["물류", "무역", "공급망", "국제"] },
  { label: "교육", terms: ["교육", "hrd"] },
  { label: "스타트업", terms: ["it", "개발", "기획", "그로스"] }
];

// 조건(학과·관심 산업·관심 직군)을 하나의 키워드 목록으로 합친다.
export function buildJobQuery(input: { major?: string; industries?: string[]; fields?: string[] }): string {
  const parts: string[] = [];
  if (input.major?.trim()) parts.push(input.major.trim());
  for (const label of input.industries ?? []) {
    const opt = JOB_INDUSTRIES.find((o) => o.label === label);
    if (opt) parts.push(...opt.terms);
  }
  for (const label of input.fields ?? []) {
    const opt = JOB_FIELDS.find((o) => o.label === label);
    if (opt) parts.push(...opt.terms);
  }
  return parts.join(" ");
}

// 조건 키워드로 추천 직무를 정렬 — 매칭되는 키워드가 많을수록 앞으로.
// (지금은 목업 규칙. 이후 실제 프로필 분석으로 대체)
export function recommendJobs(query?: string): RecommendedJob[] {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return [...RECOMMENDED_JOBS].sort((a, b) => b.match - a.match);
  const words = Array.from(new Set(q.split(/[\s,·]+/).filter(Boolean)));
  const score = (j: RecommendedJob) => {
    const hay = [j.role, j.reason, ...j.skills, ...j.tags].join(" ").toLowerCase();
    return words.reduce((n, w) => (hay.includes(w) ? n + 1 : n), 0);
  };
  return [...RECOMMENDED_JOBS]
    .map((j) => ({ j, s: score(j) }))
    .sort((a, b) => b.s - a.s || b.j.match - a.j.match)
    .map((x) => x.j);
}

// 주차별 '한국 기업문화·예절' 학습 카드(스텝 id 로 키). 핵심 포인트 + 완료 체크.
// 간단형은 points, 상세형은 sections(주제별 묶음)으로 담는다.
export type CulturePoint = { title: string; body: string; tip?: string };
export type CultureSection = { heading: string; emoji?: string; summary?: string; items: CulturePoint[] };
export type CultureQuiz = { question: string; options: string[]; answer: number; explain: string };
export type CultureLesson = {
  id: string;
  emoji: string;
  title: string;
  intro: string;
  objectives?: string[];
  points?: CulturePoint[];
  sections?: CultureSection[];
  quiz?: CultureQuiz[];
};

export const CULTURE_LESSONS: Record<string, CultureLesson> = {
  w1s4: {
    id: "w1s4",
    emoji: "🏢",
    title: "한국 기업문화 이해",
    intro: "한국의 채용 방식부터 직급·소통·근로 제도까지 폭넓게 배워요. 문화를 알면 이력서·면접 준비 방향이 잡히고, 입사 후 적응도 훨씬 수월해요. 천천히 읽고 마지막 퀴즈로 확인해봐요.",
    objectives: [
      "한국의 채용 방식(공채·수시)과 전형 단계를 설명할 수 있어요",
      "기업 유형별 특징을 구분하고 내게 맞는 곳을 판단할 수 있어요",
      "직급·호칭·존댓말 등 기본 직장 예절을 이해해요",
      "외국인으로서 준비할 것(비자·한국어·강점)을 알아요"
    ],
    sections: [
      {
        heading: "1. 채용은 이렇게 진행돼요",
        emoji: "🧭",
        summary: "한국 취업의 큰 그림을 먼저 잡아봐요. 언제, 어떤 단계로 뽑는지 알면 준비 순서가 보여요.",
        items: [
          { title: "공채와 수시 채용", body: "대기업은 봄·가을 정기 공채가, 스타트업·외국계·중견기업은 필요할 때 뽑는 수시(상시) 채용이 많아요. 관심 기업이 어느 쪽인지 알면 지원 시기를 맞추기 좋아요.", tip: "관심 기업 3곳의 채용 방식(공채/수시)을 지금 검색해 확인해보세요." },
          { title: "전형 단계", body: "보통 서류(이력서·자기소개서) → 인적성·코딩테스트 → 실무 면접 → 임원 면접 순으로 진행돼요. 단계마다 준비 포인트가 달라요." },
          { title: "자기소개서의 비중", body: "한국은 자기소개서(자소서)를 특히 중요하게 봐요. 지원 동기·성장 과정·직무 역량을 '스토리'로 풀어내는 게 핵심이에요.", tip: "이 프로그램 3주차에서 자소서를 직접 완성하니, 지금은 '왜 중요한지'만 기억해두면 돼요." },
          { title: "인턴·산학·채용연계형", body: "인턴이나 산학협력으로 먼저 경험을 쌓고 정규직으로 전환되는 길도 많아요. 신입에게 좋은 진입 기회예요." }
        ]
      },
      {
        heading: "2. 기업 유형마다 색깔이 달라요",
        emoji: "🏢",
        summary: "같은 '취업'이어도 회사 종류에 따라 문화와 준비법이 달라요. 내 성향과 맞는 곳을 떠올리며 읽어봐요.",
        items: [
          { title: "대기업", body: "체계·안정·복지가 강점이에요. 공채 경쟁이 치열하고 전형 절차가 길어요." },
          { title: "중견기업", body: "대기업과 스타트업의 중간이에요. 안정성과 실무 기회를 동시에 얻기 좋아요." },
          { title: "스타트업", body: "빠른 성장, 다양한 역할, 수평적 문화가 매력이에요. 대신 변화가 빠르고 불확실성도 있어요." },
          { title: "외국계 기업", body: "영어 사용이 많고 성과·개인 중심 문화예요. 유학생의 언어·글로벌 강점을 살리기 좋아요.", tip: "외국계·글로벌 팀은 유학생에게 특히 유리해요. 지원 목록에 꼭 넣어보세요." },
          { title: "공기업·공공기관", body: "안정적이고 블라인드 채용이 많아 스펙보다 직무 적합성과 필기시험을 중요하게 봐요." }
        ]
      },
      {
        heading: "3. 직급과 호칭, 위계 문화",
        emoji: "🎓",
        summary: "한국 직장 예절의 기본이에요. 작은 호칭 하나가 첫인상을 좌우해요.",
        items: [
          { title: "직급 체계", body: "보통 사원 → 대리 → 과장 → 차장 → 부장 → 임원 순이에요. 요즘은 '님'·'프로'·'매니저'로 호칭을 통일하는 회사도 늘고 있어요." },
          { title: "호칭 예절", body: "이름만 부르지 않고 '○○님' 또는 직급(팀장님, 과장님)으로 불러요. 상대를 존중하는 기본 매너예요.", tip: "상대의 직급을 모르면 우선 '○○님'이 가장 안전해요." },
          { title: "나이·연차·서열", body: "나이와 입사 연차를 존중하는 분위기가 남아 있어요. 예의 바르고 겸손한 태도가 좋은 인상을 줘요." },
          { title: "존댓말이 기본", body: "회사에서는 기본적으로 존댓말을 써요. 친해져도 공적인 자리에선 예의를 지키는 게 자연스러워요." }
        ]
      },
      {
        heading: "4. 일하는 방식과 분위기",
        emoji: "🤝",
        summary: "실제로 회사에서 어떻게 일이 굴러가는지 미리 알아둬요. 입사 후 당황하지 않게요.",
        items: [
          { title: "팀워크 중심", body: "개인기보다 팀 성과와 협업을 중시해요. 소통 잘하고 협조적인 사람을 선호해요." },
          { title: "보고와 의사결정", body: "'보고'를 중요하게 여겨요. 진행 상황을 상사와 자주 공유하고, 큰 결정은 윗선의 승인을 거치는 편이에요.", tip: "'중간 보고'는 눈치가 아니라 신뢰예요. 막히면 혼자 끙끙대지 말고 일찍 공유하세요." },
          { title: "회의 문화", body: "결론과 역할을 정하는 자리예요. 요즘은 짧고 효율적인 회의로 바뀌는 중이에요." },
          { title: "눈치와 분위기", body: "말하지 않아도 상황을 살피는 '눈치' 문화가 있어요. 너무 어렵게 여기지 말고, 모르면 정중히 물어보면 돼요." },
          { title: "워라밸의 변화", body: "야근·회식 중심 문화는 빠르게 줄고, 주 52시간·유연근무·재택근무가 자리 잡는 중이에요." }
        ]
      },
      {
        heading: "5. 관계와 소통 문화",
        emoji: "🍽️",
        summary: "동료와 잘 지내는 법이에요. 강요받는 문화는 줄었으니 편하게 받아들여도 돼요.",
        items: [
          { title: "회식 문화", body: "팀 친목의 자리지만 강요는 줄고 참여도 자율화되는 추세예요. 부담되면 정중히 조절해도 괜찮아요." },
          { title: "점심 문화", body: "팀원과 함께 점심을 먹으며 자연스럽게 친해지는 경우가 많아요." },
          { title: "경조사 챙기기", body: "동료의 결혼·장례 등을 함께 챙기는 문화가 있어요(축의금·조의금). 잘 모르면 동료에게 물어보면 돼요." },
          { title: "공과 사 구분", body: "사적으로 친해도 업무에선 예의와 책임을 지키는 걸 프로답게 여겨요." }
        ]
      },
      {
        heading: "6. 근로 조건과 제도",
        emoji: "📋",
        summary: "내 권리와 관련된 중요한 내용이에요. 외국인이라면 특히 비자 부분을 꼭 기억해요.",
        items: [
          { title: "근로계약서·4대 보험", body: "입사 시 근로계약서를 꼭 확인해요. 국민연금·건강보험·고용보험·산재보험(4대 보험)이 기본으로 적용돼요.", tip: "근로계약서 없이 일하자고 하면 신중해야 해요. 서면 계약은 나를 보호하는 기본이에요." },
          { title: "연봉 구조", body: "기본급 + 성과급(인센티브) + 복지로 구성돼요. '연봉'은 보통 세전 1년 총액을 말해요." },
          { title: "연차·휴가", body: "일정 기간 근무하면 유급 연차가 생겨요. 눈치 보지 말고 제도대로 쓰도록 권장하는 곳이 늘고 있어요." },
          { title: "외국인 취업 비자", body: "정규 취업은 보통 E-7(특정활동) 비자가 필요해요. 회사가 스폰서가 되어 신청하니, 채용 단계에서 비자 지원 여부를 확인해요.", tip: "면접·채용 과정에서 'E-7 비자 스폰서가 가능한지' 꼭 확인하세요. 아주 중요해요." }
        ]
      },
      {
        heading: "7. 외국인으로서 이렇게 준비해요",
        emoji: "🌏",
        summary: "마지막으로, 유학생인 나만의 무기와 준비법을 정리해요.",
        items: [
          { title: "나만의 강점", body: "다국어·글로벌 감각·문화 이해는 큰 무기예요. 해외 시장·고객을 상대하는 직무에서 특히 빛나요." },
          { title: "한국어 준비", body: "업무 한국어와 TOPIK 점수는 든든한 자산이에요. 완벽하지 않아도 배우려는 성실한 태도를 좋게 봐요." },
          { title: "문화 적응 팁", body: "다르다고 위축되지 말고, 관찰하고 물어보며 배우면 돼요. 성실함과 존중이 신뢰를 만들어요." },
          { title: "흔한 오해 피하기", body: "침묵이 늘 동의는 아니고, 완곡하게 거절하는 경우도 있어요. 애매하면 정중히 다시 확인하는 습관이 좋아요." }
        ]
      }
    ],
    quiz: [
      {
        question: "대기업의 일반적인 채용 방식에 가장 가까운 것은?",
        options: ["필요할 때마다 뽑는 수시 채용", "봄·가을에 진행하는 정기 공채", "지인 추천으로만 채용", "채용을 거의 하지 않음"],
        answer: 1,
        explain: "대기업은 봄·가을 정기 공채가 많고, 스타트업·외국계·중견기업은 수시 채용이 많아요."
      },
      {
        question: "한국 직장에서 동료를 부를 때 가장 무난한 호칭은?",
        options: ["이름만 부른다", "'○○님' 또는 직급으로 부른다", "별명을 부른다", "성(姓)만 부른다"],
        answer: 1,
        explain: "이름만 부르기보다 '○○님'이나 직급(팀장님 등)으로 부르는 게 기본 예절이에요."
      },
      {
        question: "외국인이 한국에서 정규직으로 취업할 때 보통 필요한 취업 비자는?",
        options: ["D-2 (유학)", "E-7 (특정활동)", "B-2 (관광)", "비자가 필요 없다"],
        answer: 1,
        explain: "정규 취업은 보통 E-7 비자가 필요하고, 보통 회사가 스폰서가 되어 신청해요. 채용 단계에서 지원 여부를 확인하세요."
      },
      {
        question: "업무가 막혔을 때 한국 직장에서 바람직한 태도는?",
        options: ["혼자 끝까지 해결한 뒤에만 보고한다", "진행 상황을 일찍 공유하고 중간 보고한다", "보고하지 않고 넘어간다", "회식 자리에서만 이야기한다"],
        answer: 1,
        explain: "'중간 보고'는 눈치가 아니라 신뢰예요. 막히면 혼자 끙끙대지 말고 일찍 공유하는 게 좋아요."
      }
    ]
  },
  w2s4: {
    id: "w2s4",
    emoji: "📄",
    title: "한국식 이력서 매너",
    intro: "한국 이력서의 형식과 작성법, 피해야 할 실수까지 자세히 배워요. 이번 주에 만드는 이력서의 완성도가 확 올라가요. 마지막 퀴즈로 확인해봐요.",
    objectives: [
      "한국 이력서의 기본 구성과 형식을 알아요",
      "사진·인적사항을 어떻게 다루는지 이해해요",
      "경력·성과를 설득력 있게 쓰는 법을 알아요",
      "이력서에서 흔히 하는 실수를 피할 수 있어요"
    ],
    sections: [
      {
        heading: "1. 한국 이력서의 기본",
        emoji: "📋",
        summary: "한국 이력서는 형식이 중요해요. 기본 틀부터 잡아봐요.",
        items: [
          { title: "이력서 vs 자기소개서", body: "이력서는 '사실 정보(학력·경력·스킬)'를, 자기소개서는 '스토리(동기·역량)'를 담아요. 보통 함께 제출해요." },
          { title: "적당한 분량", body: "보통 1~2장이 적당해요. 길다고 좋은 게 아니라 핵심만 간결하게 담는 게 중요해요." },
          { title: "최신순 정렬", body: "학력·경력은 가장 최근 것부터 위에 적어요(역순).", tip: "오래된 아르바이트보다 최근의 관련 경험을 위쪽에 배치하세요." },
          { title: "일관된 형식", body: "날짜 표기·글꼴·줄 간격을 통일하면 깔끔하고 신뢰가 가요." }
        ]
      },
      {
        heading: "2. 사진과 인적사항",
        emoji: "📸",
        summary: "첫인상을 만드는 부분이에요. 과하지 않게 단정하게.",
        items: [
          { title: "증명사진", body: "단정한 증명사진을 넣는 경우가 많아요. 밝은 표정·깔끔한 복장이 좋아요(필수는 아니에요).", tip: "셀카·여행 사진은 금물. 정면 증명사진으로 준비하세요." },
          { title: "기본 인적사항", body: "이름·연락처·이메일 정도면 충분해요." },
          { title: "개인정보 주의", body: "주민등록번호 등 필요 이상의 민감한 정보는 넣지 않아요." },
          { title: "이메일 주소", body: "장난스러운 아이디보다 이름 기반의 단정한 주소를 써요." }
        ]
      },
      {
        heading: "3. 경력·성과 쓰는 법",
        emoji: "✍️",
        summary: "이력서의 핵심이에요. '무엇을 했다'가 아니라 '어떤 성과를 냈다'로 써봐요.",
        items: [
          { title: "사실·성과 중심", body: "과장 없이, 한 일과 그 결과를 구체적으로 적어요." },
          { title: "숫자로 표현", body: "'매출 20% 향상', '동아리원 30명 관리'처럼 수치가 있으면 설득력이 커져요.", tip: "애매한 '열심히'보다 구체적 숫자·결과 한 줄이 훨씬 강해요." },
          { title: "직무 연관성", body: "지원 직무와 관련된 경험을 위쪽·앞쪽에 배치해요." },
          { title: "행동 동사로 시작", body: "'기획했다·분석했다·개선했다'처럼 행동 동사로 시작하면 명확해요." }
        ]
      },
      {
        heading: "4. 이력서에서 피해야 할 것",
        emoji: "🚫",
        summary: "사소해 보여도 감점 요인이에요. 제출 전에 꼭 점검해요.",
        items: [
          { title: "오타·비문", body: "제출 전 소리 내어 읽으며 오타를 잡아요.", tip: "하루 지나 다시 보면 실수가 잘 보여요." },
          { title: "과한 디자인", body: "화려한 색·폰트보다 읽기 쉬운 깔끔함이 더 프로페셔널해요." },
          { title: "무관한 나열", body: "직무와 상관없는 경험을 잔뜩 넣으면 정작 핵심이 묻혀요." },
          { title: "비격식 표현", body: "이모지·구어체·줄임말은 피하고 정중한 문어체로 써요." }
        ]
      },
      {
        heading: "5. 유학생을 위한 이력서 팁",
        emoji: "🌏",
        summary: "나만의 강점을 이력서에 녹이는 법이에요.",
        items: [
          { title: "언어 능력 명시", body: "구사 언어와 수준(TOPIK 급수 등)을 분명히 적어요. 큰 강점이에요." },
          { title: "비자 상태", body: "필요하면 현재 비자와 취업 가능 여부를 간단히 밝혀요." },
          { title: "글로벌 경험", body: "해외 경험·다문화 프로젝트를 지원 직무의 강점으로 연결해요." },
          { title: "한국어 표현 점검", body: "어색한 문장은 한국인 동료·멘토에게 검토받으면 좋아요.", tip: "이 프로그램의 이력서 빌더와 코치를 적극 활용하세요." }
        ]
      }
    ],
    quiz: [
      {
        question: "한국 이력서에서 경력·학력을 정렬하는 일반적인 순서는?",
        options: ["오래된 순(옛날 → 최근)", "최신순(최근 → 옛날)", "가나다순", "순서 상관없이 무작위"],
        answer: 1,
        explain: "경력·학력은 가장 최근 것부터 위에 적는 역순(최신순)이 일반적이에요."
      },
      {
        question: "이력서에서 성과를 더 설득력 있게 표현하는 방법은?",
        options: ["'열심히 했다'처럼 감정 위주로", "'매출 20% 향상'처럼 구체적 숫자로", "최대한 길고 화려하게", "이모지를 많이 넣어서"],
        answer: 1,
        explain: "구체적인 숫자·결과가 있으면 설득력이 훨씬 커져요."
      },
      {
        question: "이력서에 넣지 않는 게 좋은 정보는?",
        options: ["이름과 연락처", "구사 언어와 수준", "주민등록번호 등 과도한 민감 정보", "지원 직무 관련 경력"],
        answer: 2,
        explain: "주민등록번호 같은 필요 이상의 민감 정보는 넣지 않는 게 좋아요."
      },
      {
        question: "유학생이 이력서에서 특히 살리면 좋은 강점은?",
        options: ["화려한 이력서 디자인", "구사 언어·글로벌 경험", "최대한 많은 무관한 경험", "긴 분량"],
        answer: 1,
        explain: "다국어·글로벌 경험은 유학생의 큰 무기예요. 직무 강점으로 연결하세요."
      }
    ]
  },
  w3s4: {
    id: "w3s4",
    emoji: "✉️",
    title: "비즈니스 커뮤니케이션 예절",
    intro: "존댓말·이메일·회신·요청 매너 등 한국 직장의 소통 예절을 자세히 익혀요. 어디서든 신뢰를 얻는 기본기예요. 마지막 퀴즈로 확인해봐요.",
    objectives: [
      "직장에서의 존댓말·호칭 사용법을 알아요",
      "비즈니스 이메일·메신저 예절을 이해해요",
      "정중하게 요청·거절·사과하는 표현을 익혀요",
      "회의·보고에서의 소통 매너를 알아요"
    ],
    sections: [
      {
        heading: "1. 호칭과 존댓말",
        emoji: "🗣️",
        summary: "소통의 시작이에요. 상대를 어떻게 부르느냐가 태도를 보여줘요.",
        items: [
          { title: "호칭 예절", body: "'○○님' 또는 직급(팀장님·대리님)으로 불러요. 이름만 부르지 않아요." },
          { title: "존댓말이 기본", body: "회사에서는 기본적으로 존댓말을 써요. 친해져도 공적인 자리에선 예의를 지켜요." },
          { title: "나를 낮추는 표현", body: "'제가', '~하겠습니다'처럼 겸손한 표현이 자연스러워요." },
          { title: "높임법 부담 없이", body: "복잡한 높임법은 완벽하지 않아도 괜찮아요. 정중한 태도가 더 중요해요.", tip: "헷갈리면 '~님, ~하십니다'로 존댓말을 유지하면 무난해요." }
        ]
      },
      {
        heading: "2. 이메일 예절",
        emoji: "✉️",
        summary: "비즈니스 이메일엔 형식이 있어요. 틀만 익히면 어렵지 않아요.",
        items: [
          { title: "명확한 제목", body: "내용이 바로 보이는 제목을 써요(예: '[○○팀] 회의 일정 문의').", tip: "제목만 봐도 용건을 알 수 있게 쓰세요." },
          { title: "기본 구조", body: "인사 → 소속·이름 → 용건 → 정중한 맺음말 순서로 써요." },
          { title: "간결하게", body: "용건을 앞에, 길지 않게. 내용이 많으면 항목으로 나눠요." },
          { title: "맺음말·서명", body: "'감사합니다.'와 함께 이름·소속·연락처 서명을 붙여요." }
        ]
      },
      {
        heading: "3. 빠르고 정중한 응답",
        emoji: "⏱️",
        summary: "'언제, 어떻게 답하느냐'가 신뢰를 만들어요.",
        items: [
          { title: "빠른 회신", body: "가능하면 하루 안에 답하는 게 예의예요." },
          { title: "늦어질 땐 미리 알리기", body: "시간이 걸리면 '확인 후 언제까지 답하겠습니다'라고 먼저 알려요.", tip: "침묵보다 '확인했습니다' 한마디가 훨씬 안심돼요." },
          { title: "메신저 반응", body: "메신저는 확인했으면 짧게라도 반응해요." },
          { title: "근무시간 존중", body: "늦은 밤·주말 연락은 급한 일이 아니면 삼가요." }
        ]
      },
      {
        heading: "4. 요청·거절·사과 표현",
        emoji: "🤝",
        summary: "완곡하지만 분명하게. 한국식 소통의 핵심이에요.",
        items: [
          { title: "정중한 요청", body: "'혹시 가능하실까요?', '부탁드려도 될까요?'처럼 부드럽게 청해요." },
          { title: "완곡한 거절", body: "'조금 어려울 것 같습니다', '이번엔 힘들 것 같아요'처럼 이유를 곁들여 거절해요." },
          { title: "빠른 사과", body: "실수했을 때 빠르게 인정하고 바로잡는 태도가 오히려 신뢰를 줘요.", tip: "변명보다 '죄송합니다, 이렇게 바로잡겠습니다'가 프로다워요." },
          { title: "감사 표현", body: "도움을 받으면 꼭 감사 인사를 해요." }
        ]
      },
      {
        heading: "5. 회의·보고 매너",
        emoji: "📊",
        summary: "팀으로 일할 때의 소통이에요.",
        items: [
          { title: "중간 보고", body: "진행 상황을 먼저 공유하면 신뢰를 얻어요." },
          { title: "결론부터 말하기", body: "보고·발언은 결론 → 이유 순서로 하면 명확해요.", tip: "'결론은 A입니다. 이유는…' 순으로 말해보세요." },
          { title: "경청", body: "상대의 말을 끊지 않고 끝까지 들어요." },
          { title: "메모 습관", body: "회의 중 요점을 메모하면 성실한 인상을 줘요." }
        ]
      }
    ],
    quiz: [
      {
        question: "비즈니스 이메일에서 좋은 제목은?",
        options: ["내용을 알 수 없는 '안녕하세요'", "용건이 바로 보이는 '[프로젝트] 회의 일정 문의'", "제목 없이 보내기", "이모지로만 표현"],
        answer: 1,
        explain: "제목만 봐도 용건을 알 수 있게 명확히 쓰는 게 좋아요."
      },
      {
        question: "답장이 늦어질 것 같을 때 바람직한 태도는?",
        options: ["다 준비될 때까지 아무 말 안 한다", "'확인 후 언제까지 답하겠다'고 먼저 알린다", "그냥 무시한다", "밤늦게라도 바로 전화한다"],
        answer: 1,
        explain: "침묵보다 '확인했고 언제까지 답하겠다'는 한마디가 신뢰를 줘요."
      },
      {
        question: "부탁을 거절할 때 한국식으로 자연스러운 표현은?",
        options: ["'싫어요'", "'조금 어려울 것 같습니다'", "'왜 저한테요?'", "대답하지 않기"],
        answer: 1,
        explain: "완곡하지만 분명하게, 이유를 곁들여 거절하는 게 자연스러워요."
      },
      {
        question: "업무 중 실수를 했을 때 바람직한 태도는?",
        options: ["변명을 길게 한다", "빠르게 인정하고 바로잡는다", "숨긴다", "남 탓을 한다"],
        answer: 1,
        explain: "빠른 사과와 바로잡는 태도가 오히려 신뢰를 줘요."
      }
    ]
  },
  w4s4: {
    id: "w4s4",
    emoji: "🤝",
    title: "면접 예절 & 입사 매너",
    intro: "면접 준비부터 태도, 팔로업, 입사 첫인상까지 자세히 배워요. 준비한 실력을 온전히 보여줄 수 있게 해줘요. 마지막 퀴즈로 확인해봐요.",
    objectives: [
      "면접 복장과 시간 약속 등 기본 매너를 알아요",
      "면접 중 태도와 답변 요령을 이해해요",
      "면접 후 팔로업(감사 메일) 방법을 알아요",
      "입사 첫인상을 좋게 만드는 법을 알아요"
    ],
    sections: [
      {
        heading: "1. 면접 전 준비",
        emoji: "🎒",
        summary: "준비가 곧 자신감이에요. 전날까지 미리 챙겨요.",
        items: [
          { title: "복장", body: "단정한 정장이나 비즈니스 캐주얼이 무난해요. 과하지 않게 깔끔하게.", tip: "회사 분위기를 모르면 조금 더 단정한 쪽이 안전해요." },
          { title: "회사·직무 조사", body: "회사와 직무를 미리 조사하면 답변의 깊이가 달라져요." },
          { title: "예상 질문 연습", body: "자기소개·지원동기·강점은 소리 내어 연습해요." },
          { title: "경로·시간 확인", body: "면접 장소 위치와 소요 시간을 미리 확인해요." }
        ]
      },
      {
        heading: "2. 시간 약속",
        emoji: "⏰",
        summary: "시간 엄수는 한국에서 가장 기본적인 신뢰예요.",
        items: [
          { title: "10분 전 도착", body: "약속 시간 10분 전 도착이 기본이에요." },
          { title: "늦을 땐 즉시 연락", body: "늦을 것 같으면 반드시 미리 연락해요.", tip: "무단 지각은 실력과 무관하게 큰 감점이에요." },
          { title: "온라인 면접 점검", body: "링크·카메라·마이크를 미리 점검하고 조용한 곳에서 참여해요." },
          { title: "여유 있게", body: "조금 일찍 도착해 마음을 가다듬어요." }
        ]
      },
      {
        heading: "3. 면접 중 태도",
        emoji: "💬",
        summary: "실력만큼 태도를 봐요. 밝고 진솔하게.",
        items: [
          { title: "밝은 첫인사", body: "밝게 인사하고 눈을 맞춰요." },
          { title: "경청·존중", body: "질문을 끝까지 듣고 답해요." },
          { title: "솔직함", body: "모르는 건 아는 척하지 말고 솔직하게. 배우려는 자세를 보여요.", tip: "'잘 모르지만 이렇게 접근하겠다'는 답이 오히려 좋게 보여요." },
          { title: "두괄식 답변", body: "결론을 먼저, 그다음 근거·경험으로 뒷받침해요." },
          { title: "역질문 준비", body: "마지막 '질문 있나요?'엔 회사·직무에 대한 관심을 보이는 질문을 준비해요." }
        ]
      },
      {
        heading: "4. 면접 후 팔로업",
        emoji: "📧",
        summary: "끝나고의 작은 정성이 인상을 남겨요.",
        items: [
          { title: "감사 메일", body: "면접 후 짧게 감사 인사를 보내면 좋은 인상을 남길 수 있어요.", tip: "당일~다음 날 안에, 간결하게 보내세요." },
          { title: "결과 기다리기", body: "결과를 재촉하지 말고 정중히 기다려요." },
          { title: "피드백 수용", body: "불합격해도 배움으로 삼아 다음을 준비해요." },
          { title: "회신 예절", body: "합격·제안 연락엔 빠르고 정중하게 답해요." }
        ]
      },
      {
        heading: "5. 입사 첫인상",
        emoji: "🌱",
        summary: "시작이 반이에요. 첫 2주가 이미지를 만들어요.",
        items: [
          { title: "먼저 인사", body: "먼저 밝게 인사하고 동료의 이름을 익혀요." },
          { title: "배우는 자세", body: "질문하며 배우려는 태도를 보여요." },
          { title: "시간·약속 지키기", body: "출근 시간·마감 약속을 지키는 게 가장 기본이에요." },
          { title: "메모 습관", body: "업무를 메모하며 익히면 신뢰를 얻어요.", tip: "같은 걸 두 번 묻지 않도록 메모하는 습관이 좋아요." }
        ]
      }
    ],
    quiz: [
      {
        question: "면접 도착 시간으로 적절한 것은?",
        options: ["정확히 시작 시간에", "약속 시간 10분 전", "5분 늦게", "1시간 일찍 입장"],
        answer: 1,
        explain: "10분 전 도착이 기본이에요. 너무 일찍 입장하기보다 근처에서 대기했다가 들어가요."
      },
      {
        question: "면접에서 모르는 질문을 받았을 때 좋은 태도는?",
        options: ["아는 척 지어낸다", "솔직히 인정하고 접근 방법을 말한다", "아무 말도 안 한다", "화제를 돌린다"],
        answer: 1,
        explain: "모르는 건 솔직하게 인정하고, 배우려는 자세와 접근 방법을 보이는 게 좋아요."
      },
      {
        question: "면접이 끝난 후 좋은 팔로업은?",
        options: ["매일 결과를 재촉한다", "짧은 감사 메일을 보낸다", "아무것도 하지 않는다", "면접관에게 SNS 친구 요청"],
        answer: 1,
        explain: "당일~다음 날 안에 보내는 간결한 감사 메일이 좋은 인상을 남겨요."
      },
      {
        question: "입사 후 첫인상을 좋게 만드는 기본은?",
        options: ["시간·약속을 지키고 배우려는 자세", "아는 것만 하고 질문 안 하기", "지각해도 실력으로 만회", "메모 없이 기억에만 의존"],
        answer: 0,
        explain: "시간 엄수와 배우려는 태도가 가장 기본이에요."
      }
    ]
  }
};

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
