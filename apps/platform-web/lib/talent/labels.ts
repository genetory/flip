// Talent 도메인 표시 문구/질문 세트 — 화면에 하드코딩하지 않고 여기서 관리.
import type {
  ApplicationStatus,
  ApplyStepKey,
  ExperienceQuestionKey,
  ExperienceType,
  JourneyStepKey,
  OnboardingGoal,
  ResumeStatus
} from "./types";

export const experienceTypeLabels: Record<ExperienceType, string> = {
  "school-project": "학교 프로젝트",
  "team-project": "팀 프로젝트",
  intern: "인턴",
  "part-time": "아르바이트",
  club: "동아리",
  activity: "대외활동",
  contest: "공모전",
  volunteer: "봉사활동",
  "personal-project": "개인 프로젝트",
  freelance: "프리랜서",
  content: "콘텐츠 운영",
  startup: "창업 및 서비스 운영",
  etc: "기타 경험"
};

export const experienceTypeOptions = Object.entries(experienceTypeLabels).map(
  ([value, label]) => ({ value: value as ExperienceType, label })
);

// 경험 작성 질문(8단계, 대화형/단계형).
export const experienceQuestions: { key: ExperienceQuestionKey; label: string; placeholder: string }[] = [
  { key: "what", label: "어떤 경험인가요?", placeholder: "예) 카페에서 아르바이트를 했어요." },
  { key: "why", label: "왜 시작했나요?", placeholder: "예) 사람을 응대하는 일을 배우고 싶었어요." },
  { key: "role", label: "어떤 역할을 맡았나요?", placeholder: "예) 주문 응대와 재고 관리를 맡았어요." },
  { key: "did", label: "직접 한 일은 무엇인가요?", placeholder: "예) 혼잡 시간대 주문 처리 순서를 새로 정리했어요." },
  { key: "difficulty", label: "어려운 점은 무엇이었나요?", placeholder: "예) 바쁜 시간대에 주문이 자주 밀렸어요." },
  { key: "solution", label: "어떻게 해결했나요?", placeholder: "예) 업무 순서를 정리해 순서표를 만들었어요." },
  { key: "result", label: "결과는 어떻게 달라졌나요?", placeholder: "예) 주문 누락이 줄고 대기 시간이 짧아졌어요." },
  { key: "learned", label: "무엇을 배웠나요?", placeholder: "예) 우선순위를 정하는 법을 배웠어요." }
];

export const journeyLabels: Record<JourneyStepKey, string> = {
  interest: "관심 직무 선택",
  experiences: "경험 정리",
  profile: "첫 프로필",
  resume: "첫 이력서",
  cover: "첫 자기소개서",
  apply: "첫 지원",
  interview: "첫 면접"
};

export const resumeStatusLabels: Record<ResumeStatus, string> = {
  none: "아직 이력서가 없어요",
  draft: "기본 이력서가 완성됐어요",
  improving: "조금 더 구체적으로 만들 수 있어요",
  ready: "지원할 준비가 됐어요"
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  interested: "관심",
  preparing: "준비 중",
  applied: "지원 완료",
  interview: "면접",
  result: "결과"
};

export const applicationStatusOrder: ApplicationStatus[] = [
  "interested",
  "preparing",
  "applied",
  "interview",
  "result"
];

export const applyStepLabels: Record<ApplyStepKey, string> = {
  analyze: "공고 분석",
  resume: "맞춤 이력서",
  cover: "자기소개서",
  review: "제출 전 확인",
  submit: "지원 완료",
  interview: "면접 준비"
};

// 온보딩 첫 질문 선택지.
export const onboardingGoals: { value: OnboardingGoal; label: string }[] = [
  { value: "explore", label: "아직 어떤 일을 해야 할지 모르겠어요" },
  { value: "resume", label: "첫 이력서를 만들고 싶어요" },
  { value: "cover", label: "자기소개서를 준비하고 싶어요" },
  { value: "jobs", label: "지원할 공고를 찾고 싶어요" },
  { value: "interview", label: "면접을 준비하고 있어요" }
];

// 온보딩 이후 최소 질문 세트(한 단계씩).
export const onboardingSteps: {
  key: string;
  question: string;
  helper?: string;
  options: string[];
  allowSkip?: boolean;
}[] = [
  {
    key: "status",
    question: "지금 어떤 상태에 가장 가까운가요?",
    options: ["재학 중", "졸업 예정", "졸업 후 취업 준비 중", "이직 준비는 아니에요"]
  },
  {
    key: "field",
    question: "관심 있는 분야가 있나요?",
    options: ["기획·PM", "마케팅·콘텐츠", "디자인", "개발", "영업·CX", "경영·인사", "아직 모르겠어요"]
  },
  {
    key: "role",
    question: "희망하는 직무가 있나요?",
    helper: "아직 정하지 않았다면 건너뛰어도 좋아요.",
    options: ["콘텐츠 마케터", "서비스 기획자", "UX 디자이너", "프론트엔드 개발자", "아직 모름"],
    allowSkip: true
  },
  {
    key: "experience",
    question: "해본 경험이 있나요?",
    options: ["아르바이트", "동아리·대외활동", "학교·팀 프로젝트", "인턴", "아직 없어요"]
  },
  {
    key: "opportunity",
    question: "지금 원하는 기회는 무엇인가요?",
    options: ["인턴", "신입 정규직", "우선 경험을 쌓고 싶어요", "아직 모르겠어요"]
  }
];

// 자기소개서(공고 맞춤) 질문.
export const tailoredCoverQuestions = [
  "왜 이 직무에 지원하나요?",
  "어떤 경험을 가장 보여주고 싶나요?",
  "그 경험에서 직접 한 일은 무엇인가요?",
  "회사에서 어떤 기여를 하고 싶나요?"
];

// 이력서 생성 단계.
export const resumeFlowSteps = [
  "사용할 경험 선택",
  "지원 직무 선택",
  "강조할 역량 선택",
  "이력서 초안 생성",
  "항목별 수정",
  "디자인 선택",
  "결과 확인"
];

// ── 다국어 라벨 훅 — 화면(React 컴포넌트)에서 위 한국어 상수 대신 사용.
// 원본 상수는 키/타입/서버(personas 등)에서 계속 쓰므로 유지한다.
import { usePlatformT } from "../i18n";

export function useExperienceTypeLabel(): (k: ExperienceType) => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "school-project": return t("학교 프로젝트", "School project", "学校项目", "Dự án học tập", "学校プロジェクト", "Proyek sekolah");
      case "team-project": return t("팀 프로젝트", "Team project", "团队项目", "Dự án nhóm", "チームプロジェクト", "Proyek tim");
      case "intern": return t("인턴", "Internship", "实习", "Thực tập", "インターン", "Magang");
      case "part-time": return t("아르바이트", "Part-time", "兼职", "Bán thời gian", "アルバイト", "Paruh waktu");
      case "club": return t("동아리", "Club", "社团", "Câu lạc bộ", "サークル", "Klub");
      case "activity": return t("대외활동", "Activity", "校外活动", "Hoạt động", "課外活動", "Kegiatan");
      case "contest": return t("공모전", "Contest", "竞赛", "Cuộc thi", "コンテスト", "Kontes");
      case "volunteer": return t("봉사활동", "Volunteer", "志愿", "Tình nguyện", "ボランティア", "Sukarela");
      case "personal-project": return t("개인 프로젝트", "Personal project", "个人项目", "Dự án cá nhân", "個人プロジェクト", "Proyek pribadi");
      case "freelance": return t("프리랜서", "Freelance", "自由职业", "Freelance", "フリーランス", "Freelance");
      case "content": return t("콘텐츠 운영", "Content", "内容运营", "Nội dung", "コンテンツ運営", "Konten");
      case "startup": return t("창업 및 서비스 운영", "Startup", "创业", "Khởi nghiệp", "起業", "Startup");
      case "etc": return t("기타 경험", "Other", "其他", "Khác", "その他", "Lainnya");
      default: return experienceTypeLabels[k] ?? k;
    }
  };
}

export function useExperienceTypeOptions(): { value: ExperienceType; label: string }[] {
  const label = useExperienceTypeLabel();
  return experienceTypeOptions.map((o) => ({ value: o.value, label: label(o.value) }));
}

export function useExperienceQuestions(): { key: ExperienceQuestionKey; label: string; placeholder: string }[] {
  const t = usePlatformT();
  return [
    { key: "what", label: t("어떤 경험인가요?", "What experience is it?", "这是什么经历？", "Đây là trải nghiệm gì?", "どんな経験ですか？", "Pengalaman apa itu?"), placeholder: t("예) 카페에서 아르바이트를 했어요.", "e.g. I worked part-time at a cafe.", "例）在咖啡店做过兼职。", "VD) Tôi làm thêm ở quán cà phê.", "例）カフェでアルバイトをしました。", "cth) Saya kerja paruh waktu di kafe.") },
    { key: "why", label: t("왜 시작했나요?", "Why did you start?", "为什么开始？", "Vì sao bạn bắt đầu?", "なぜ始めましたか？", "Kenapa kamu mulai?"), placeholder: t("예) 사람을 응대하는 일을 배우고 싶었어요.", "e.g. I wanted to learn customer service.", "例）想学习待客服务。", "VD) Tôi muốn học cách phục vụ khách.", "例）接客の仕事を学びたかったです。", "cth) Ingin belajar melayani pelanggan.") },
    { key: "role", label: t("어떤 역할을 맡았나요?", "What was your role?", "你担任什么角色？", "Vai trò của bạn là gì?", "どんな役割でしたか？", "Apa peranmu?"), placeholder: t("예) 주문 응대와 재고 관리를 맡았어요.", "e.g. I handled orders and inventory.", "例）负责点单和库存管理。", "VD) Tôi phụ trách nhận đơn và kho.", "例）注文対応と在庫管理を担当しました。", "cth) Menangani pesanan dan stok.") },
    { key: "did", label: t("직접 한 일은 무엇인가요?", "What did you do yourself?", "你亲自做了什么？", "Bạn đã trực tiếp làm gì?", "自分でやったことは？", "Apa yang kamu lakukan sendiri?"), placeholder: t("예) 혼잡 시간대 주문 처리 순서를 새로 정리했어요.", "e.g. I reorganized order flow at peak hours.", "例）重新整理了高峰时段的下单流程。", "VD) Tôi sắp xếp lại quy trình giờ cao điểm.", "例）混雑時間帯の注文処理順を整理しました。", "cth) Menata ulang alur pesanan saat ramai.") },
    { key: "difficulty", label: t("어려운 점은 무엇이었나요?", "What was hard?", "有什么困难？", "Điều gì khó khăn?", "難しかった点は？", "Apa yang sulit?"), placeholder: t("예) 바쁜 시간대에 주문이 자주 밀렸어요.", "e.g. Orders piled up during busy hours.", "例）繁忙时段订单常常积压。", "VD) Giờ bận đơn thường bị dồn.", "例）忙しい時間帯に注文がよく滞りました。", "cth) Pesanan menumpuk saat sibuk.") },
    { key: "solution", label: t("어떻게 해결했나요?", "How did you solve it?", "你如何解决？", "Bạn giải quyết thế nào?", "どう解決しましたか？", "Bagaimana kamu mengatasinya?"), placeholder: t("예) 업무 순서를 정리해 순서표를 만들었어요.", "e.g. I made a checklist to order the work.", "例）整理流程并制作了顺序表。", "VD) Tôi lập bảng trình tự công việc.", "例）作業順を整理し順序表を作りました。", "cth) Membuat daftar urutan kerja.") },
    { key: "result", label: t("결과는 어떻게 달라졌나요?", "How did results change?", "结果有什么变化？", "Kết quả thay đổi ra sao?", "結果はどう変わりましたか？", "Bagaimana hasilnya berubah?"), placeholder: t("예) 주문 누락이 줄고 대기 시간이 짧아졌어요.", "e.g. Fewer missed orders and shorter waits.", "例）漏单减少，等待时间缩短。", "VD) Ít sót đơn, chờ ngắn hơn.", "例）注文漏れが減り待ち時間が短縮。", "cth) Pesanan terlewat berkurang, antre singkat.") },
    { key: "learned", label: t("무엇을 배웠나요?", "What did you learn?", "你学到了什么？", "Bạn học được gì?", "何を学びましたか？", "Apa yang kamu pelajari?"), placeholder: t("예) 우선순위를 정하는 법을 배웠어요.", "e.g. I learned how to set priorities.", "例）学会了确定优先级。", "VD) Tôi học cách đặt ưu tiên.", "例）優先順位の付け方を学びました。", "cth) Belajar menetapkan prioritas.") }
  ];
}

export function useJourneyLabel(): (k: JourneyStepKey) => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "interest": return t("관심 직무 선택", "Pick a role", "选择职务", "Chọn nghề", "職種を選ぶ", "Pilih peran");
      case "experiences": return t("경험 정리", "Organize experience", "整理经历", "Sắp xếp KN", "経験整理", "Rangkum pengalaman");
      case "profile": return t("첫 프로필", "First profile", "首份档案", "Hồ sơ đầu", "初プロフィール", "Profil pertama");
      case "resume": return t("첫 이력서", "First resume", "首份简历", "CV đầu", "初履歴書", "Resume pertama");
      case "cover": return t("첫 자기소개서", "First cover letter", "首份自荐信", "Thư đầu", "初自己PR", "Surat pertama");
      case "apply": return t("첫 지원", "First apply", "首次申请", "Nộp đầu", "初応募", "Lamaran pertama");
      case "interview": return t("첫 면접", "First interview", "首次面试", "PV đầu", "初面接", "Wawancara pertama");
      default: return journeyLabels[k] ?? k;
    }
  };
}

export function useResumeStatusLabel(): (k: ResumeStatus) => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "none": return t("아직 이력서가 없어요", "No resume yet", "还没有简历", "Chưa có CV", "まだ履歴書がありません", "Belum ada resume");
      case "draft": return t("기본 이력서가 완성됐어요", "Basic resume ready", "基础简历已完成", "CV cơ bản đã xong", "基本履歴書が完成", "Resume dasar siap");
      case "improving": return t("조금 더 구체적으로 만들 수 있어요", "You can add more detail", "可以更具体一些", "Có thể chi tiết hơn", "もっと具体化できます", "Bisa lebih rinci");
      case "ready": return t("지원할 준비가 됐어요", "Ready to apply", "可以申请了", "Sẵn sàng nộp", "応募の準備完了", "Siap melamar");
      default: return resumeStatusLabels[k] ?? k;
    }
  };
}

export function useApplicationStatusLabel(): (k: ApplicationStatus) => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "interested": return t("관심", "Interested", "感兴趣", "Quan tâm", "興味あり", "Tertarik");
      case "preparing": return t("준비 중", "Preparing", "准备中", "Đang chuẩn bị", "準備中", "Menyiapkan");
      case "applied": return t("지원 완료", "Applied", "已申请", "Đã nộp", "応募済み", "Terkirim");
      case "interview": return t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara");
      case "result": return t("결과", "Result", "结果", "Kết quả", "結果", "Hasil");
      default: return applicationStatusLabels[k] ?? k;
    }
  };
}

export function useApplyStepLabel(): (k: ApplyStepKey) => string {
  const t = usePlatformT();
  return (k) => {
    switch (k) {
      case "analyze": return t("공고 분석", "Analyze posting", "分析职位", "Phân tích tin", "求人分析", "Analisis lowongan");
      case "resume": return t("맞춤 이력서", "Tailored resume", "定制简历", "CV riêng", "履歴書調整", "Resume khusus");
      case "cover": return t("자기소개서", "Cover letter", "自荐信", "Thư giới thiệu", "自己PR", "Surat lamaran");
      case "review": return t("제출 전 확인", "Final check", "提交前确认", "Kiểm tra cuối", "提出前確認", "Cek akhir");
      case "submit": return t("지원 완료", "Submit", "提交申请", "Nộp đơn", "応募完了", "Kirim");
      case "interview": return t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị PV", "面接準備", "Persiapan wawancara");
      default: return applyStepLabels[k] ?? k;
    }
  };
}

export function useOnboardingGoals(): { value: OnboardingGoal; label: string }[] {
  const t = usePlatformT();
  return [
    { value: "explore", label: t("아직 어떤 일을 해야 할지 모르겠어요", "I'm not sure what to do yet", "还不确定要做什么", "Chưa biết nên làm gì", "まだ何をすべきか分かりません", "Belum tahu mau kerja apa") },
    { value: "resume", label: t("첫 이력서를 만들고 싶어요", "I want to build my first resume", "想制作第一份简历", "Muốn làm CV đầu tiên", "初めての履歴書を作りたい", "Ingin membuat resume pertama") },
    { value: "cover", label: t("자기소개서를 준비하고 싶어요", "I want to prepare a cover letter", "想准备自荐信", "Muốn chuẩn bị thư giới thiệu", "自己PRを準備したい", "Ingin menyiapkan surat lamaran") },
    { value: "jobs", label: t("지원할 공고를 찾고 싶어요", "I want to find jobs to apply to", "想找可申请的职位", "Muốn tìm tin để nộp", "応募する求人を探したい", "Ingin mencari lowongan") },
    { value: "interview", label: t("면접을 준비하고 있어요", "I'm preparing for interviews", "正在准备面试", "Đang chuẩn bị phỏng vấn", "面接を準備しています", "Sedang menyiapkan wawancara") }
  ];
}

export function useOnboardingSteps(): { key: string; question: string; helper?: string; options: string[]; allowSkip?: boolean }[] {
  const t = usePlatformT();
  return [
    {
      key: "status",
      question: t("지금 어떤 상태에 가장 가까운가요?", "Which best describes you now?", "现在最接近哪种状态？", "Hiện bạn gần nhất với trạng thái nào?", "今どの状態に近いですか？", "Mana yang paling sesuai denganmu?"),
      options: [
        t("재학 중", "In school", "在读", "Đang học", "在学中", "Masih kuliah"),
        t("졸업 예정", "Graduating soon", "即将毕业", "Sắp tốt nghiệp", "卒業予定", "Segera lulus"),
        t("졸업 후 취업 준비 중", "Job-seeking after graduation", "毕业后求职中", "Tìm việc sau tốt nghiệp", "卒業後就活中", "Cari kerja setelah lulus"),
        t("이직 준비는 아니에요", "Not job-hunting", "不是在换工作", "Không tìm việc mới", "転職活動ではない", "Bukan cari kerja")
      ]
    },
    {
      key: "field",
      question: t("관심 있는 분야가 있나요?", "Any field you're interested in?", "有感兴趣的领域吗？", "Bạn quan tâm lĩnh vực nào?", "興味のある分野は？", "Ada bidang yang menarik?"),
      options: [
        t("기획·PM", "Planning·PM", "策划·PM", "Kế hoạch·PM", "企画・PM", "Perencanaan·PM"),
        t("마케팅·콘텐츠", "Marketing·Content", "营销·内容", "Marketing·Nội dung", "マーケ・コンテンツ", "Marketing·Konten"),
        t("디자인", "Design", "设计", "Thiết kế", "デザイン", "Desain"),
        t("개발", "Development", "开发", "Lập trình", "開発", "Pengembangan"),
        t("영업·CX", "Sales·CX", "销售·CX", "Kinh doanh·CX", "営業・CX", "Sales·CX"),
        t("경영·인사", "Ops·HR", "经营·人事", "Quản lý·Nhân sự", "経営・人事", "Manajemen·HR"),
        t("아직 모르겠어요", "Not sure yet", "还不确定", "Chưa rõ", "まだ分かりません", "Belum tahu")
      ]
    },
    {
      key: "role",
      question: t("희망하는 직무가 있나요?", "Any role you want?", "有想做的职务吗？", "Bạn muốn vị trí nào?", "希望する職種は？", "Ada peran yang diinginkan?"),
      helper: t("아직 정하지 않았다면 건너뛰어도 좋아요.", "If undecided, feel free to skip.", "还没决定可以跳过。", "Chưa quyết định thì bỏ qua cũng được.", "未定ならスキップしてOKです。", "Kalau belum yakin, boleh lewati."),
      options: [
        t("콘텐츠 마케터", "Content marketer", "内容营销", "Content marketer", "コンテンツマーケター", "Content marketer"),
        t("서비스 기획자", "Product planner", "服务策划", "Product planner", "サービス企画", "Perencana produk"),
        t("UX 디자이너", "UX designer", "UX设计", "UX designer", "UXデザイナー", "Desainer UX"),
        t("프론트엔드 개발자", "Frontend dev", "前端开发", "Frontend dev", "フロント開発", "Frontend dev"),
        t("아직 모름", "Not sure", "还不确定", "Chưa rõ", "未定", "Belum tahu")
      ],
      allowSkip: true
    },
    {
      key: "experience",
      question: t("해본 경험이 있나요?", "Any experience so far?", "有过相关经历吗？", "Bạn đã có kinh nghiệm nào?", "経験はありますか？", "Sudah punya pengalaman?"),
      options: [
        t("아르바이트", "Part-time", "兼职", "Bán thời gian", "アルバイト", "Paruh waktu"),
        t("동아리·대외활동", "Club·Activity", "社团·活动", "CLB·Hoạt động", "サークル・課外", "Klub·Kegiatan"),
        t("학교·팀 프로젝트", "School·Team project", "学校·团队项目", "Dự án học·nhóm", "学校・チーム", "Proyek sekolah·tim"),
        t("인턴", "Internship", "实习", "Thực tập", "インターン", "Magang"),
        t("아직 없어요", "None yet", "还没有", "Chưa có", "まだありません", "Belum ada")
      ]
    },
    {
      key: "opportunity",
      question: t("지금 원하는 기회는 무엇인가요?", "What opportunity do you want now?", "现在想要什么机会？", "Bạn muốn cơ hội nào lúc này?", "今欲しい機会は？", "Peluang apa yang kamu mau?"),
      options: [
        t("인턴", "Internship", "实习", "Thực tập", "インターン", "Magang"),
        t("신입 정규직", "Entry-level role", "应届正职", "Toàn thời gian mới", "新卒正社員", "Full-time pemula"),
        t("우선 경험을 쌓고 싶어요", "Gain experience first", "先积累经验", "Muốn tích lũy KN trước", "まず経験を積みたい", "Ingin cari pengalaman dulu"),
        t("아직 모르겠어요", "Not sure yet", "还不确定", "Chưa rõ", "まだ分かりません", "Belum tahu")
      ]
    }
  ];
}

export function useTailoredCoverQuestions(): string[] {
  const t = usePlatformT();
  return [
    t("왜 이 직무에 지원하나요?", "Why are you applying for this role?", "为什么申请这个职位？", "Vì sao bạn ứng tuyển vị trí này?", "なぜこの職務に応募しますか？", "Kenapa melamar posisi ini?"),
    t("어떤 경험을 가장 보여주고 싶나요?", "Which experience do you most want to show?", "最想展示哪段经历？", "Bạn muốn thể hiện kinh nghiệm nào nhất?", "最も見せたい経験は？", "Pengalaman mana yang ingin ditonjolkan?"),
    t("그 경험에서 직접 한 일은 무엇인가요?", "What did you do in that experience?", "在那段经历中你做了什么？", "Bạn đã làm gì trong trải nghiệm đó?", "その経験で自分がやったことは？", "Apa yang kamu lakukan di pengalaman itu?"),
    t("회사에서 어떤 기여를 하고 싶나요?", "How do you want to contribute?", "想为公司做出什么贡献？", "Bạn muốn đóng góp gì cho công ty?", "会社でどんな貢献をしたいですか？", "Kontribusi apa yang ingin kamu beri?")
  ];
}

export function useResumeFlowSteps(): string[] {
  const t = usePlatformT();
  return [
    t("사용할 경험 선택", "Pick experiences", "选择经历", "Chọn kinh nghiệm", "経験を選択", "Pilih pengalaman"),
    t("지원 직무 선택", "Pick target role", "选择职务", "Chọn vị trí", "職種を選択", "Pilih peran"),
    t("강조할 역량 선택", "Pick strengths", "选择优势", "Chọn thế mạnh", "強みを選択", "Pilih keunggulan"),
    t("이력서 초안 생성", "Generate draft", "生成草稿", "Tạo bản nháp", "下書き生成", "Buat draf"),
    t("항목별 수정", "Edit sections", "逐项修改", "Sửa từng mục", "項目別編集", "Edit bagian"),
    t("디자인 선택", "Pick design", "选择设计", "Chọn thiết kế", "デザイン選択", "Pilih desain"),
    t("결과 확인", "Review result", "查看结果", "Xem kết quả", "結果確認", "Lihat hasil")
  ];
}
