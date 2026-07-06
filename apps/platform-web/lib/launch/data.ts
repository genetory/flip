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
        desc: "선택한 직무에 맞춘 질문에 채팅하듯 답하면, 그대로 이력서 재료가 돼요. 다음 주 이력서 작성이 훨씬 수월해져요.",
        action: { label: "채팅으로 정리하기", href: "/career-launch/materials" }
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
