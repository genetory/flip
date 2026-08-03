// "처음 시작하기 = 나를 알아가는" 자기 발견 페이지 콘텐츠.
// 진단/점수가 아니라, 답을 모으면 "관심 직무 방향 · 강점 · 정리할 경험"을 부드럽게 도출한다.

// 각 선택지는 강점 태그를 가진다 → 마지막에 합산해 상위 강점 3개를 뽑는다.
export interface DiscoveryOption {
  label: string;
  strengths: string[];
}
export interface DiscoveryQuestion {
  key: string;
  question: string;
  helper?: string;
  options: DiscoveryOption[];
}

export const discoveryQuestions: DiscoveryQuestion[] = [
  {
    key: "flow",
    question: "시간 가는 줄 모르고 몰입했던 순간은 언제였나요?",
    options: [
      { label: "새로운 아이디어를 떠올리고 기획할 때", strengths: ["기획력", "창의성"] },
      { label: "사람들과 이야기하고 도와줄 때", strengths: ["공감", "커뮤니케이션"] },
      { label: "정보를 분석하고 정리할 때", strengths: ["분석력", "꼼꼼함"] },
      { label: "직접 무언가를 만들어 완성할 때", strengths: ["실행력", "몰입"] }
    ]
  },
  {
    key: "praise",
    question: "사람들이 나에게 자주 하는 말은?",
    options: [
      { label: "\"정리를 참 잘한다\"", strengths: ["꼼꼼함", "체계성"] },
      { label: "\"이야기를 잘 들어준다\"", strengths: ["공감", "커뮤니케이션"] },
      { label: "\"추진력이 있다\"", strengths: ["실행력", "리더십"] },
      { label: "\"아이디어가 많다\"", strengths: ["창의성", "기획력"] }
    ]
  },
  {
    key: "env",
    question: "어떤 방식으로 일할 때 편한가요?",
    options: [
      { label: "혼자 깊게 집중하는 편", strengths: ["집중력"] },
      { label: "팀으로 함께 만드는 편", strengths: ["협업"] },
      { label: "새로운 사람·상황을 만나는 편", strengths: ["적응력"] }
    ]
  },
  {
    key: "value",
    question: "지금 나에게 가장 끌리는 건?",
    helper: "정답은 없어요. 지금 마음이 가는 대로 골라주세요.",
    options: [
      { label: "빠르게 성장하는 것", strengths: ["도전"] },
      { label: "안정적으로 해내는 것", strengths: ["성실"] },
      { label: "사람들과 함께하는 것", strengths: ["공감"] },
      { label: "자유롭게 내 방식대로", strengths: ["자기주도"] }
    ]
  }
];

// 관심 직무 카드 — 관심있음 / 모르겠음 / 아니요 로 표시.
export interface JobCard {
  key: string;
  emoji: string;
  title: string;
  fit: string;
}
export const discoveryJobCards: JobCard[] = [
  { key: "planner", emoji: "🧭", title: "서비스 기획", fit: "문제를 정의하고 풀어가는 걸 좋아하는 분" },
  { key: "marketing", emoji: "📣", title: "마케팅·콘텐츠", fit: "사람의 마음을 움직이는 걸 좋아하는 분" },
  { key: "design", emoji: "🎨", title: "디자인", fit: "보이는 경험을 만드는 걸 좋아하는 분" },
  { key: "dev", emoji: "💻", title: "개발", fit: "직접 만들어 작동시키는 걸 좋아하는 분" },
  { key: "cx", emoji: "🤝", title: "영업·고객경험(CX)", fit: "사람과 소통하며 돕는 걸 좋아하는 분" },
  { key: "data", emoji: "📊", title: "데이터·분석", fit: "숫자로 인사이트를 찾는 걸 좋아하는 분" }
];

// 경험 인벤토리 체크리스트.
export const discoveryExperienceItems: string[] = [
  "아르바이트",
  "동아리",
  "학교·팀 프로젝트",
  "공모전",
  "대외활동",
  "인턴",
  "봉사활동",
  "개인 프로젝트",
  "콘텐츠 운영(SNS·블로그)"
];

export const discoveryCopy = {
  intro: {
    eyebrow: "처음 시작하기",
    title: "나를 알아가는 것부터\n시작해볼까요?",
    desc: "무엇을 잘하는지, 어떤 일이 맞는지\n몇 가지 질문으로 함께 찾아볼게요. 정답은 없어요.",
    cta: "시작하기",
    time: "3분이면 충분해요 · 언제든 나갈 수 있어요"
  },
  jobStep: {
    title: "이런 직무는 어떤가요?",
    helper: "끌리는 정도만 편하게 표시해주세요.",
    like: "관심 있어요",
    maybe: "잘 모르겠어요",
    no: "아니에요"
  },
  expStep: {
    title: "해본 경험을 골라주세요",
    helper: "작아 보여도 다 취업에 쓸 수 있는 재료예요. 여러 개 선택해도 좋아요."
  },
  result: {
    eyebrow: "이렇게 정리했어요",
    strengthTitle: "나의 강점",
    interestTitle: "관심 직무 방향",
    experienceTitle: "정리하면 좋은 경험",
    noInterest: "아직 탐색 중",
    noExperience: "지금부터 하나씩 쌓아가요"
  }
} as const;
