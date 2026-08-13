// Talent 랜딩/시작 페이지의 모든 카피와 (아직 API 없는) mock 데이터를 한곳에 모은다.
// 하드코딩을 컴포넌트에 흩뿌리지 않고 여기서 관리 → 추후 i18n(로케일별 딕셔너리)로
// 확장하기 쉽게 구조화. 현재는 브랜드 카피가 한국어 기준이라 KO 로만 둔다.

// Talent 영역에서 연결하는 라우트. 리뉴얼된 이력서/자소서/공고는 /talent/* 로 연결한다.
// positions 는 로그인 없이 둘러볼 수 있는 공개 공고(히어로/푸터의 "둘러보기"용)로만 남긴다.
export const talentRoutes = {
  start: "/talent/login", // 시작 = 로그인(가입 링크 포함) → 이후 홈으로
  login: "/talent/login",
  signup: "/talent/signup",
  positions: "/positions", // 공개 둘러보기
  jobs: "/talent/jobs", // 리뉴얼된 채용공고(앱)
  resume: "/talent/career/resumes",
  coverLetter: "/talent/career/cover-letters",
  careerLaunch: "/career-launch",
  partner: "/partner" // 리뉴얼 파트너 랜딩(레거시 /business 아님)
} as const;

// 상단 내비게이션(데스크톱). 리뉴얼된 Talent 경로로 연결.
export const talentNav: { label: string; href: string; external?: boolean }[] = [
  { label: "처음 시작하기", href: talentRoutes.start },
  { label: "이력서", href: talentRoutes.resume },
  { label: "자기소개서", href: talentRoutes.coverLetter },
  { label: "채용공고", href: talentRoutes.jobs }
];

export const talentBrand = {
  name: "APLY",
  // 핵심 브랜드 메시지
  slogan: "첫 이력서부터 첫 지원까지",
  subSlogan: "처음이라 막막한 취업 준비, APLY와 하나씩",
  cta: {
    login: "로그인",
    start: "지금 시작하기"
  }
} as const;

export const heroContent = {
  // 두 줄 타이틀
  titleLines: ["첫 이력서부터", "첫 지원까지"],
  description: "처음이라 막막한 취업 준비,\nAPLY가 나의 경험을 함께 찾고 하나씩 완성해드려요.",
  primaryCta: { label: "내 첫 취업 준비 시작하기", href: talentRoutes.start },
  secondaryCta: { label: "채용공고 먼저 둘러보기", href: talentRoutes.positions },
  subInfo: "5분이면 시작할 수 있어요"
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
  cta: { label: "지금 시작하기", href: talentRoutes.start }
} as const;

// 푸터 — Partner 는 보조 링크로만, Admin 은 노출하지 않는다.
export const footerContent = {
  partnerLink: { label: "기업·대학·기관이신가요? Partner 서비스 알아보기", href: talentRoutes.partner },
  columns: [
    {
      title: "처음이라면",
      links: [
        { label: "처음 시작하기", href: talentRoutes.start },
        { label: "채용공고", href: talentRoutes.positions }
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

// ─────────────────────────────────────────────────────────────
// i18n 훅 — 위 한국어 상수는 그대로 두고(메타데이터/폴백용), 화면에서는 아래 훅으로
// 로케일별 카피를 렌더한다. t(ko, en, zh, vi, ja, id) 순서, 한국어 기본.
// ─────────────────────────────────────────────────────────────
import { usePlatformT } from "../i18n";

// 상단/모바일 내비 라벨(짧게 유지).
export function useTalentNav(): { label: string; href: string; external?: boolean }[] {
  const t = usePlatformT();
  return [
    { label: t("처음 시작하기", "Get started", "开始使用", "Bắt đầu", "はじめる", "Mulai"), href: talentRoutes.start },
    { label: t("이력서", "Resume", "简历", "CV", "履歴書", "CV"), href: talentRoutes.resume },
    { label: t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己PR", "Surat lamaran"), href: talentRoutes.coverLetter },
    { label: t("채용공고", "Jobs", "职位", "Việc làm", "求人", "Lowongan"), href: talentRoutes.jobs }
  ];
}

// 브랜드 CTA 라벨(짧게 유지).
export function useTalentBrandCta(): { login: string; start: string } {
  const t = usePlatformT();
  return {
    login: t("로그인", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk"),
    start: t("지금 시작하기", "Get started", "立即开始", "Bắt đầu ngay", "今すぐ始める", "Mulai sekarang")
  };
}

// 랜딩 전체 카피 — 섹션별 로컬라이즈 값. 아이콘/상태/진행도 등 비문자열은 상수 그대로 재사용.
export function useTalentLanding() {
  const t = usePlatformT();
  return {
    hero: {
      titleLines: [
        t("첫 이력서부터", "From your first resume", "从第一份简历", "Từ CV đầu tiên", "最初の履歴書から", "Dari CV pertama"),
        t("첫 지원까지", "to your first application", "到第一次投递", "đến lần ứng tuyển đầu tiên", "最初の応募まで", "hingga lamaran pertama")
      ],
      description: t(
        "처음이라 막막한 취업 준비,\nAPLY가 나의 경험을 함께 찾고 하나씩 완성해드려요.",
        "Job hunting feels overwhelming at first.\nAPLY helps you uncover your experiences and build everything, step by step.",
        "初次求职难免迷茫，\nAPLY 陪你一起发掘经历，逐步完成每一步准备。",
        "Lần đầu tìm việc thật bối rối,\nAPLY cùng bạn khám phá kinh nghiệm và hoàn thiện từng bước một.",
        "初めての就活は戸惑うもの。\nAPLYが一緒に経験を見つけ、ひとつずつ仕上げます。",
        "Mencari kerja pertama kali memang membingungkan.\nAPLY membantu menggali pengalamanmu dan menyelesaikannya langkah demi langkah."
      ),
      primaryCta: {
        label: t("내 첫 취업 준비 시작하기", "Start my first job prep", "开始我的求职准备", "Bắt đầu chuẩn bị xin việc", "初めての就活準備を始める", "Mulai persiapan kerja pertamaku"),
        href: talentRoutes.start
      },
      secondaryCta: {
        label: t("채용공고 먼저 둘러보기", "Browse jobs first", "先浏览职位", "Xem việc làm trước", "先に求人を見る", "Lihat lowongan dulu"),
        href: talentRoutes.positions
      },
      subInfo: t("5분이면 시작할 수 있어요", "You can start in 5 minutes", "5 分钟即可开始", "Chỉ 5 phút để bắt đầu", "5分で始められます", "Bisa mulai dalam 5 menit")
    },
    heroPreview: {
      greeting: t("첫 취업 준비 진행도", "Your job-prep progress", "求职准备进度", "Tiến độ chuẩn bị xin việc", "就活準備の進み具合", "Progres persiapan kerja"),
      progress: heroPreview.progress,
      steps: [
        { label: t("관심 직무 선택", "Pick a target role", "选择意向职位", "Chọn vị trí quan tâm", "希望職種を選ぶ", "Pilih posisi incaran"), state: "done" as const },
        { label: t("경험 정리", "Organize experiences", "整理经历", "Sắp xếp kinh nghiệm", "経験を整理", "Susun pengalaman"), state: "doing" as const },
        { label: t("첫 이력서", "First resume", "第一份简历", "CV đầu tiên", "最初の履歴書", "CV pertama"), state: "todo" as const },
        { label: t("첫 자기소개서", "First cover letter", "第一份自我介绍", "Thư giới thiệu đầu tiên", "最初の自己PR", "Surat lamaran pertama"), state: "todo" as const },
        { label: t("첫 지원", "First application", "第一次投递", "Lần ứng tuyển đầu tiên", "最初の応募", "Lamaran pertama"), state: "todo" as const },
        { label: t("첫 면접", "First interview", "第一次面试", "Buổi phỏng vấn đầu tiên", "最初の面接", "Wawancara pertama"), state: "todo" as const }
      ]
    },
    concern: {
      title: t("취업 준비, 이런 고민이 있나요?", "Do these job-prep worries sound familiar?", "求职准备，你也有这些烦恼吗？", "Chuẩn bị xin việc, bạn có những trăn trở này?", "就活準備、こんな悩みはありませんか？", "Persiapan kerja, punya kekhawatiran ini?"),
      cards: [
        t("이력서에 쓸 경험이 없는 것 같아요.", "I feel like I have no experience for a resume.", "感觉没有经历可以写进简历。", "Hình như tôi chẳng có kinh nghiệm gì để ghi vào CV.", "履歴書に書く経験がない気がします。", "Rasanya tak ada pengalaman untuk ditulis di CV."),
        t("어떤 직무가 나와 맞는지 모르겠어요.", "I'm not sure which role fits me.", "不知道哪个职位适合我。", "Tôi không biết vị trí nào hợp với mình.", "どの職種が自分に合うか分かりません。", "Aku tak tahu posisi mana yang cocok untukku."),
        t("자기소개서를 처음 써봐요.", "I'm writing a cover letter for the first time.", "第一次写自我介绍。", "Lần đầu tôi viết thư giới thiệu.", "自己PRを書くのは初めてです。", "Ini pertama kalinya aku menulis surat lamaran."),
        t("공고를 봐도 어떻게 지원해야 할지 모르겠어요.", "Even when I see a posting, I don't know how to apply.", "看到招聘信息也不知道怎么投递。", "Nhìn tin tuyển dụng mà chẳng biết ứng tuyển thế nào.", "求人を見ても応募の仕方が分かりません。", "Lihat lowongan pun bingung cara melamarnya.")
      ],
      solutionTitle: t(
        "경험이 없는 것이 아니라,\n아직 취업에 맞게 정리하지 못한 것일 수 있어요.",
        "It's not that you have no experience—\nyou just haven't shaped it for the job hunt yet.",
        "不是你没有经历，\n只是还没为求职整理好而已。",
        "Không phải bạn thiếu kinh nghiệm,\nchỉ là chưa sắp xếp nó cho việc xin việc thôi.",
        "経験がないのではなく、\nまだ就活向けに整理できていないだけかもしれません。",
        "Bukan tak punya pengalaman,\nhanya belum ditata untuk melamar kerja."
      ),
      solutionDesc: t(
        "APLY는 당신의 경험을 함께 찾고,\n취업에 사용할 수 있는 이야기로 만들어드려요.",
        "APLY helps you rediscover your experiences\nand turn them into stories you can use.",
        "APLY 陪你一起发掘经历，\n把它变成能用于求职的故事。",
        "APLY cùng bạn tìm lại kinh nghiệm\nvà biến chúng thành câu chuyện dùng được khi xin việc.",
        "APLYが一緒に経験を見つけ、\n就活に使えるストーリーに仕上げます。",
        "APLY membantu menemukan pengalamanmu\ndan mengubahnya jadi cerita yang bisa dipakai melamar."
      )
    },
    outcome: {
      title: t("APLY에서 완성할 수 있는 것", "What you can build with APLY", "在 APLY 你能完成的", "Những gì bạn hoàn thiện với APLY", "APLYで仕上げられること", "Yang bisa kamu selesaikan di APLY"),
      cards: [
        { icon: "🧭", title: t("나에게 맞는 직무", "A role that fits you", "适合你的职位", "Vị trí hợp với bạn", "自分に合う職種", "Posisi yang cocok"), desc: t("관심과 경험을 바탕으로 잘 맞는 직무 방향을 찾아요.", "Find the right direction based on your interests and experience.", "根据兴趣与经历，找到合适的职位方向。", "Tìm hướng nghề phù hợp dựa trên sở thích và kinh nghiệm.", "興味と経験をもとに合う職種の方向を見つけます。", "Temukan arah karier tepat dari minat dan pengalamanmu.") },
        { icon: "🗂️", title: t("취업에 활용할 경험", "Experience you can use", "可用于求职的经历", "Kinh nghiệm để xin việc", "就活に使える経験", "Pengalaman untuk melamar"), desc: t("흩어진 경험을 취업에 쓸 수 있는 이야기로 정리해요.", "Turn scattered experiences into job-ready stories.", "把零散的经历整理成能用于求职的故事。", "Sắp xếp kinh nghiệm rời rạc thành câu chuyện dùng được.", "散らばった経験を就活に使えるストーリーへ整理します。", "Rapikan pengalaman tersebar jadi cerita siap lamar.") },
        { icon: "🪪", title: t("첫 커리어 프로필", "Your first career profile", "第一份职业档案", "Hồ sơ nghề đầu tiên", "最初のキャリアプロフィール", "Profil karier pertama"), desc: t("나를 소개하는 커리어 프로필을 처음 만들어요.", "Create a career profile that introduces you.", "第一次制作介绍自己的职业档案。", "Lần đầu tạo hồ sơ nghề giới thiệu bản thân.", "自分を紹介するキャリアプロフィールを初めて作ります。", "Buat profil karier yang memperkenalkan dirimu.") },
        { icon: "📄", title: t("첫 이력서", "Your first resume", "第一份简历", "CV đầu tiên", "最初の履歴書", "CV pertama"), desc: t("질문에 답하다 보면 이력서 한 부가 완성돼요.", "Answer a few questions and a full resume takes shape.", "回答问题的过程中，一份简历就完成了。", "Chỉ cần trả lời câu hỏi, một CV hoàn chỉnh dần hình thành.", "質問に答えるうちに履歴書が一部完成します。", "Jawab beberapa pertanyaan, satu CV pun jadi.") },
        { icon: "📝", title: t("첫 자기소개서", "Your first cover letter", "第一份自我介绍", "Thư giới thiệu đầu tiên", "最初の自己PR", "Surat lamaran pertama"), desc: t("막막한 자기소개서도 문항별로 함께 채워요.", "Fill in each prompt together, one by one.", "再难的自我介绍，也逐题一起完成。", "Cùng điền từng câu hỏi, từng phần một.", "難しい自己PRも設問ごとに一緒に埋めます。", "Isi tiap pertanyaan bersama, satu per satu.") },
        { icon: "🚀", title: t("첫 지원 준비", "Ready for your first application", "第一次投递准备", "Sẵn sàng ứng tuyển", "初めての応募準備", "Siap melamar pertama"), desc: t("공고에 맞춰 지원과 면접 준비까지 이어가요.", "Prepare to apply and interview for each posting.", "针对每个职位，衔接投递与面试准备。", "Chuẩn bị ứng tuyển và phỏng vấn theo từng tin tuyển dụng.", "求人に合わせて応募と面接準備まで進めます。", "Siapkan lamaran dan wawancara sesuai lowongan.") }
      ]
    },
    step: {
      title: t("이렇게 진행돼요", "How it works", "流程如下", "Quy trình như sau", "こう進みます", "Begini alurnya"),
      steps: [
        { no: 1, title: t("내 이야기를 들려주세요", "Tell us your story", "讲讲你的故事", "Kể câu chuyện của bạn", "あなたの話を聞かせて", "Ceritakan kisahmu"), desc: t("간단한 질문에 답하며 내가 해온 일을 정리해요.", "Answer simple questions to organize what you've done.", "回答简单问题，整理你做过的事。", "Trả lời câu hỏi đơn giản để sắp xếp việc đã làm.", "簡単な質問に答えながら、やってきたことを整理します。", "Jawab pertanyaan sederhana untuk menata yang pernah kamu lakukan.") },
        { no: 2, title: t("첫 지원서를 완성해요", "Complete your first application", "完成第一份申请材料", "Hoàn thiện hồ sơ đầu tiên", "最初の応募書類を仕上げる", "Berkas lamaran pertamamu"), desc: t("정리한 경험으로 이력서와 자기소개서를 만들어요.", "Turn your experiences into a resume and cover letter.", "用整理好的经历制作简历和自我介绍。", "Biến kinh nghiệm đã sắp xếp thành CV và thư giới thiệu.", "整理した経験で履歴書と自己PRを作ります。", "Ubah pengalaman jadi CV dan surat lamaran.") },
        { no: 3, title: t("맞는 공고에 지원해요", "Apply to the right jobs", "投递合适的职位", "Ứng tuyển đúng việc", "合う求人に応募する", "Melamar lowongan yang pas"), desc: t("준비 상태에 맞는 공고를 찾아 실제 지원을 시작해요.", "Find postings that match and start applying for real.", "找到与准备匹配的职位，开始正式投递。", "Tìm tin phù hợp và bắt đầu ứng tuyển thật sự.", "準備に合う求人を見つけ、実際に応募を始めます。", "Temukan lowongan yang cocok dan mulai melamar sungguhan.") }
      ]
    },
    beforeAfter: {
      eyebrow: t("경험을 취업의 언어로", "Turn experience into job-ready language", "把经历转为求职语言", "Biến kinh nghiệm thành ngôn ngữ xin việc", "経験を就活の言葉に", "Ubah pengalaman jadi bahasa lamaran"),
      title: t("같은 경험도, 정리하면 달라져요", "The same experience reads differently once it's shaped", "同样的经历，整理后大不相同", "Cùng một kinh nghiệm, sắp xếp lại sẽ khác hẳn", "同じ経験も、整理すれば変わる", "Pengalaman sama terbaca beda setelah ditata"),
      beforeLabel: t("이렇게 말했다면", "If you said it like this", "如果你这样说", "Nếu bạn nói thế này", "こう言っていたら", "Kalau kamu bilang begini"),
      before: t(
        "카페에서 아르바이트했어요.\n손님을 응대하고 주문을 받았어요.",
        "I worked part-time at a café.\nI served customers and took orders.",
        "我在咖啡店打过工，\n负责接待客人和点单。",
        "Tôi làm thêm ở quán cà phê.\nTiếp khách và nhận gọi món.",
        "カフェでアルバイトをしました。\n接客と注文受けを担当しました。",
        "Aku kerja paruh waktu di kafe.\nMelayani tamu dan menerima pesanan."
      ),
      afterLabel: t("이렇게 정리해드려요", "Here's how we'd put it", "我们会这样整理", "Chúng tôi sẽ diễn đạt thế này", "こう整理します", "Beginilah kami menatanya"),
      after: t(
        "카페 아르바이트 중 고객 응대와 주문 관리를 담당했으며,\n혼잡 시간대 업무 순서를 정리해 주문 누락을 줄였습니다.",
        "Handled customer service and order management in a café part-time role,\nand cut missed orders by streamlining the workflow during peak hours.",
        "在咖啡店兼职期间负责客户接待与订单管理，\n并通过优化高峰时段流程减少了漏单。",
        "Phụ trách tiếp khách và quản lý đơn khi làm thêm ở quán cà phê,\ngiảm sót đơn nhờ sắp xếp quy trình vào giờ cao điểm.",
        "カフェのアルバイトで接客と注文管理を担当し、\n混雑時の業務手順を整理して注文漏れを減らしました。",
        "Menangani layanan pelanggan dan pengelolaan pesanan saat kerja paruh waktu di kafe,\nserta mengurangi pesanan terlewat dengan merapikan alur kerja saat ramai."
      )
    },
    resultPreview: {
      title: t("준비를 마치면 이런 게 남아요", "Here's what you'll have when you're done", "准备结束后，你会拥有这些", "Hoàn tất chuẩn bị, bạn sẽ có những thứ này", "準備を終えると、これが残ります", "Setelah selesai, ini yang kamu punya"),
      items: [
        { icon: "🎯", label: t("추천 직무", "Recommended roles", "推荐职位", "Vị trí gợi ý", "おすすめ職種", "Posisi rekomendasi"), value: t("마케팅 · 서비스 기획", "Marketing · Service Planning", "市场 · 服务企划", "Marketing · Lập kế hoạch dịch vụ", "マーケティング・サービス企画", "Marketing · Perencanaan Layanan") },
        { icon: "🗂️", label: t("정리한 경험", "Organized experiences", "已整理的经历", "Kinh nghiệm đã sắp xếp", "整理した経験", "Pengalaman tertata"), value: t("3건", "3", "3 项", "3 mục", "3件", "3") },
        { icon: "🪪", label: t("첫 커리어 프로필", "First career profile", "第一份职业档案", "Hồ sơ nghề đầu tiên", "最初のキャリアプロフィール", "Profil karier pertama"), value: t("완성", "Complete", "已完成", "Hoàn tất", "完成", "Selesai") },
        { icon: "📄", label: t("이력서 완성 상태", "Resume progress", "简历完成度", "Tiến độ CV", "履歴書の完成度", "Progres CV"), value: t("80%", "80%", "80%", "80%", "80%", "80%") },
        { icon: "➡️", label: t("다음 추천 행동", "Suggested next step", "下一步建议", "Bước tiếp theo gợi ý", "次のおすすめ", "Langkah berikut disarankan"), value: t("자기소개서 시작하기", "Start your cover letter", "开始写自我介绍", "Bắt đầu thư giới thiệu", "自己PRを始める", "Mulai surat lamaran") }
      ]
    },
    jobsCta: {
      message: t("준비에서 끝나지 않아요", "It doesn't stop at preparation", "不止步于准备", "Không dừng ở việc chuẩn bị", "準備で終わりません", "Tak berhenti di persiapan"),
      desc: t(
        "완성한 프로필을 바탕으로\n나에게 맞는 인턴과 신입 공고를 찾아보세요.",
        "Use your finished profile\nto find internships and entry-level jobs that fit you.",
        "以完成的档案为基础，\n找到适合你的实习与应届职位。",
        "Dựa trên hồ sơ đã hoàn thiện,\ntìm việc thực tập và vị trí mới ra trường hợp với bạn.",
        "仕上げたプロフィールをもとに、\n自分に合うインターン・新卒求人を探しましょう。",
        "Berbekal profil yang sudah jadi,\ntemukan magang dan lowongan entry-level yang cocok."
      ),
      cta: { label: t("맞춤 공고 확인하기", "See matching jobs", "查看匹配职位", "Xem việc phù hợp", "マッチ求人を見る", "Lihat lowongan cocok"), href: talentRoutes.positions }
    },
    careerLaunchCta: {
      message: t("혼자 준비하기 어렵다면", "If preparing alone feels hard", "如果独自准备有些吃力", "Nếu tự chuẩn bị thấy khó", "ひとりで準備が大変なら", "Kalau susah persiapan sendiri"),
      desc: t(
        "직무 탐색부터 이력서, 자기소개서,\n공고 지원과 면접까지 함께 완성해보세요.",
        "From exploring roles to resumes, cover letters,\napplications, and interviews—finish it all together.",
        "从职位探索到简历、自我介绍，\n再到投递与面试，一起完成。",
        "Từ khám phá nghề đến CV, thư giới thiệu,\nứng tuyển và phỏng vấn—cùng hoàn thành tất cả.",
        "職種探しから履歴書、自己PR、\n応募や面接まで一緒に仕上げましょう。",
        "Dari eksplorasi karier ke CV, surat lamaran,\nlamaran, dan wawancara—selesaikan bersama."
      ),
      cta: { label: t("Career Launch 알아보기", "Explore Career Launch", "了解 Career Launch", "Tìm hiểu Career Launch", "Career Launch を見る", "Jelajahi Career Launch"), href: talentRoutes.careerLaunch }
    },
    finalCta: {
      message: t("처음부터 잘할 필요는 없어요.", "You don't have to be great from the start.", "不必一开始就做得完美。", "Không cần giỏi ngay từ đầu.", "最初から上手くなくて大丈夫。", "Tak perlu langsung hebat dari awal."),
      desc: t("APLY와 함께 첫 취업 준비를 하나씩 시작해보세요.", "Start your first job prep, one step at a time, with APLY.", "和 APLY 一起，一步步开始首次求职准备。", "Cùng APLY bắt đầu chuẩn bị xin việc, từng bước một.", "APLYと一緒に、初めての就活準備をひとつずつ。", "Bersama APLY, mulai persiapan kerja pertamamu selangkah demi selangkah."),
      cta: { label: t("지금 시작하기", "Get started now", "立即开始", "Bắt đầu ngay", "今すぐ始める", "Mulai sekarang"), href: talentRoutes.start }
    },
    footer: {
      partnerLink: {
        label: t("기업·대학·기관이신가요? Partner 서비스 알아보기", "A company, university, or organization? Explore Partner services", "企业·高校·机构？了解 Partner 服务", "Doanh nghiệp·trường·tổ chức? Tìm hiểu dịch vụ Partner", "企業・大学・機関の方へ Partnerサービスはこちら", "Perusahaan·kampus·lembaga? Jelajahi layanan Partner"),
        href: talentRoutes.partner
      }
    }
  };
}

// /talent/start — 온보딩 진입 스캐폴드.
export const startContent = {
  eyebrow: "첫 취업 준비 시작",
  title: "내 이야기부터 시작해요",
  desc: "간단한 질문에 답하다 보면 나에게 맞는 직무와 첫 이력서가 만들어져요.\n지금은 준비 화면이에요 — 로그인하면 바로 시작할 수 있어요.",
  steps: stepSection.steps,
  primaryCta: { label: "지금 시작하기", href: talentRoutes.signup },
  secondaryCta: { label: "이미 계정이 있어요 · 로그인", href: talentRoutes.login },
  backCta: { label: "← 랜딩으로", href: "/talent" }
} as const;
