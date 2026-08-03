// Talent 랜딩/시작 페이지의 모든 카피와 (아직 API 없는) mock 데이터를 한곳에 모은다.
// 하드코딩을 컴포넌트에 흩뿌리지 않고 여기서 관리 → 추후 i18n(로케일별 딕셔너리)로
// 확장하기 쉽게 구조화. 현재는 브랜드 카피가 한국어 기준이라 KO 로만 둔다.

// Talent 영역에서 연결하는 라우트. 리뉴얼된 이력서/자소서/공고는 /talent/* 로 연결한다.
// positions 는 로그인 없이 둘러볼 수 있는 공개 공고(히어로/푸터의 "둘러보기"용)로만 남긴다.
export const talentRoutes = {
  start: "/talent/discovery", // 시작 = 공개 자기 발견(로그인 없이)
  login: "/talent/login",
  signup: "/talent/signup",
  positions: "/positions", // 공개 둘러보기
  jobs: "/talent/jobs", // 리뉴얼된 채용공고(앱)
  resume: "/talent/career/resumes",
  coverLetter: "/talent/career/cover-letters",
  careerLaunch: "/career-launch",
  partner: "/business"
} as const;

// 상단 내비게이션(데스크톱). 리뉴얼된 Talent 경로로 연결.
export const talentNav: { label: string; href: string; external?: boolean }[] = [
  { label: "처음 시작하기", href: talentRoutes.start },
  { label: "이력서", href: talentRoutes.resume },
  { label: "자기소개서", href: talentRoutes.coverLetter },
  { label: "채용공고", href: talentRoutes.jobs },
  { label: "Career Launch", href: talentRoutes.careerLaunch }
];

export const talentBrand = {
  name: "APLY",
  // 핵심 브랜드 메시지
  slogan: "첫 이력서부터 첫 지원까지",
  subSlogan: "처음이라 막막한 취업 준비, APLY와 하나씩",
  cta: {
    login: "로그인",
    start: "무료로 시작하기"
  }
} as const;

export const heroContent = {
  // 두 줄 타이틀
  titleLines: ["첫 이력서부터", "첫 지원까지"],
  description: "처음이라 막막한 취업 준비,\nAPLY가 나의 경험을 함께 찾고 하나씩 완성해드려요.",
  primaryCta: { label: "내 첫 취업 준비 시작하기", href: talentRoutes.start },
  secondaryCta: { label: "채용공고 먼저 둘러보기", href: talentRoutes.positions },
  subInfo: "5분이면 시작할 수 있어요 · 무료로 이용 가능"
} as const;

// 히어로 우측 — 로그인 후 Talent 홈 미리보기(mock).
export const heroPreview = {
  greeting: "첫 취업 준비 진행도",
  progress: 42,
  steps: [
    { label: "관심 직무 선택", state: "done" as const },
    { label: "경험 정리", state: "doing" as const },
    { label: "첫 이력서", state: "todo" as const },
    { label: "첫 자기소개서", state: "todo" as const },
    { label: "첫 지원", state: "todo" as const },
    { label: "첫 면접", state: "todo" as const }
  ]
} as const;

// 2. 학생의 고민
export const concernSection = {
  title: "취업 준비, 이런 고민이 있나요?",
  cards: [
    "이력서에 쓸 경험이 없는 것 같아요.",
    "어떤 직무가 나와 맞는지 모르겠어요.",
    "자기소개서를 처음 써봐요.",
    "공고를 봐도 어떻게 지원해야 할지 모르겠어요."
  ],
  solutionTitle: "경험이 없는 것이 아니라,\n아직 취업에 맞게 정리하지 못한 것일 수 있어요.",
  solutionDesc: "APLY는 당신의 경험을 함께 찾고,\n취업에 사용할 수 있는 이야기로 만들어드려요."
} as const;

// 3. APLY에서 완성할 수 있는 것 (AI 전면에 내세우지 않는다)
export const outcomeSection = {
  title: "APLY에서 완성할 수 있는 것",
  cards: [
    { icon: "🧭", title: "나에게 맞는 직무", desc: "관심과 경험을 바탕으로 잘 맞는 직무 방향을 찾아요." },
    { icon: "🗂️", title: "취업에 활용할 경험", desc: "흩어진 경험을 취업에 쓸 수 있는 이야기로 정리해요." },
    { icon: "🪪", title: "첫 커리어 프로필", desc: "나를 소개하는 커리어 프로필을 처음 만들어요." },
    { icon: "📄", title: "첫 이력서", desc: "질문에 답하다 보면 이력서 한 부가 완성돼요." },
    { icon: "📝", title: "첫 자기소개서", desc: "막막한 자기소개서도 문항별로 함께 채워요." },
    { icon: "🚀", title: "첫 지원 준비", desc: "공고에 맞춰 지원과 면접 준비까지 이어가요." }
  ]
} as const;

// 4. 이용 방법 (3단계)
export const stepSection = {
  title: "이렇게 진행돼요",
  steps: [
    { no: 1, title: "내 이야기를 들려주세요", desc: "간단한 질문에 답하며 내가 해온 일을 정리해요." },
    { no: 2, title: "첫 지원서를 완성해요", desc: "정리한 경험으로 이력서와 자기소개서를 만들어요." },
    { no: 3, title: "맞는 공고에 지원해요", desc: "준비 상태에 맞는 공고를 찾아 실제 지원을 시작해요." }
  ]
} as const;

// 5. 경험 변환 Before / After (가장 중요한 차별점)
export const beforeAfterSection = {
  eyebrow: "경험을 취업의 언어로",
  title: "같은 경험도, 정리하면 달라져요",
  beforeLabel: "이렇게 말했다면",
  before: "카페에서 아르바이트했어요.\n손님을 응대하고 주문을 받았어요.",
  afterLabel: "이렇게 정리해드려요",
  after: "카페 아르바이트 중 고객 응대와 주문 관리를 담당했으며,\n혼잡 시간대 업무 순서를 정리해 주문 누락을 줄였습니다."
} as const;

// 6. 결과 미리보기
export const resultPreviewSection = {
  title: "준비를 마치면 이런 게 남아요",
  items: [
    { icon: "🎯", label: "추천 직무", value: "마케팅 · 서비스 기획" },
    { icon: "🗂️", label: "정리한 경험", value: "3건" },
    { icon: "🪪", label: "첫 커리어 프로필", value: "완성" },
    { icon: "📄", label: "이력서 완성 상태", value: "80%" },
    { icon: "➡️", label: "다음 추천 행동", value: "자기소개서 시작하기" }
  ]
} as const;

// 7. 채용공고 연결
export const jobsCtaSection = {
  message: "준비에서 끝나지 않아요",
  desc: "완성한 프로필을 바탕으로\n나에게 맞는 인턴과 신입 공고를 찾아보세요.",
  cta: { label: "맞춤 공고 확인하기", href: talentRoutes.positions }
} as const;

// 8. Career Launch
export const careerLaunchCtaSection = {
  message: "혼자 준비하기 어렵다면",
  desc: "직무 탐색부터 이력서, 자기소개서,\n공고 지원과 면접까지 함께 완성해보세요.",
  cta: { label: "Career Launch 알아보기", href: talentRoutes.careerLaunch }
} as const;

// 9. 마지막 CTA
export const finalCtaSection = {
  message: "처음부터 잘할 필요는 없어요.",
  desc: "APLY와 함께 첫 취업 준비를 하나씩 시작해보세요.",
  cta: { label: "무료로 시작하기", href: talentRoutes.start }
} as const;

// 푸터 — Partner 는 보조 링크로만, Admin 은 노출하지 않는다.
export const footerContent = {
  partnerLink: { label: "기업·대학·기관이신가요? Partner 서비스 알아보기", href: talentRoutes.partner },
  columns: [
    {
      title: "처음이라면",
      links: [
        { label: "처음 시작하기", href: talentRoutes.start },
        { label: "채용공고", href: talentRoutes.positions },
        { label: "Career Launch", href: talentRoutes.careerLaunch }
      ]
    },
    {
      title: "만들기",
      links: [
        { label: "이력서", href: talentRoutes.resume },
        { label: "자기소개서", href: talentRoutes.coverLetter }
      ]
    },
    {
      title: "약관",
      links: [
        { label: "개인정보처리방침", href: "/legal/privacy" },
        { label: "이용약관", href: "/legal/terms" }
      ]
    }
  ],
  copyright: "© APLY"
} as const;

// /talent/start — 온보딩 진입 스캐폴드.
export const startContent = {
  eyebrow: "첫 취업 준비 시작",
  title: "내 이야기부터 시작해요",
  desc: "간단한 질문에 답하다 보면 나에게 맞는 직무와 첫 이력서가 만들어져요.\n지금은 준비 화면이에요 — 로그인하면 바로 시작할 수 있어요.",
  steps: stepSection.steps,
  primaryCta: { label: "무료로 시작하기", href: talentRoutes.signup },
  secondaryCta: { label: "이미 계정이 있어요 · 로그인", href: talentRoutes.login },
  backCta: { label: "← 랜딩으로", href: "/talent" }
} as const;
