// 5가지 Talent 상태 mock 스냅샷. 개발 중 persona 를 전환해 상태별 화면을 확인한다.
// 표시 문자열은 t(...) 로 다국어화한다. personaId / type / status 등은 데이터 키라 그대로 둔다.
import type {
  Application,
  ApplyStepKey,
  Experience,
  JourneyStep,
  JourneyStepKey,
  StepState,
  TalentPersonaId,
  TalentSnapshot
} from "../types";
import type { PlatformT } from "../../i18n";

const journeyOrder: JourneyStepKey[] = [
  "interest",
  "experiences",
  "profile",
  "resume",
  "cover",
  "apply",
  "interview"
];

// journey/applyStep 표시 라벨 — labels.ts 의 useJourneyLabel/useApplyStepLabel 과 동일 문구.
function journeyLabel(t: PlatformT, key: JourneyStepKey): string {
  switch (key) {
    case "interest": return t("관심 직무 선택", "Pick a role", "选择职务", "Chọn nghề", "職種を選ぶ", "Pilih peran");
    case "experiences": return t("경험 정리", "Organize experience", "整理经历", "Sắp xếp KN", "経験整理", "Rangkum pengalaman");
    case "profile": return t("첫 프로필", "First profile", "首份档案", "Hồ sơ đầu", "初プロフィール", "Profil pertama");
    case "resume": return t("첫 이력서", "First resume", "首份简历", "CV đầu", "初履歴書", "Resume pertama");
    case "cover": return t("첫 자기소개서", "First cover letter", "首份自荐信", "Thư đầu", "初自己PR", "Surat pertama");
    case "apply": return t("첫 지원", "First apply", "首次申请", "Nộp đầu", "初応募", "Lamaran pertama");
    case "interview": return t("첫 면접", "First interview", "首次面试", "PV đầu", "初面接", "Wawancara pertama");
  }
}

function applyStepLabel(t: PlatformT, key: ApplyStepKey): string {
  switch (key) {
    case "analyze": return t("공고 분석", "Analyze posting", "分析职位", "Phân tích tin", "求人分析", "Analisis lowongan");
    case "resume": return t("맞춤 이력서", "Tailored resume", "定制简历", "CV riêng", "履歴書調整", "Resume khusus");
    case "cover": return t("자기소개서", "Cover letter", "自荐信", "Thư giới thiệu", "自己PR", "Surat lamaran");
    case "review": return t("제출 전 확인", "Final check", "提交前确认", "Kiểm tra cuối", "提出前確認", "Cek akhir");
    case "submit": return t("지원 완료", "Submit", "提交申请", "Nộp đơn", "応募完了", "Kirim");
    case "interview": return t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị PV", "面接準備", "Persiapan wawancara");
  }
}

function buildJourney(t: PlatformT, states: Partial<Record<JourneyStepKey, StepState>>): JourneyStep[] {
  return journeyOrder.map((key) => ({
    key,
    label: journeyLabel(t, key),
    state: states[key] ?? "todo"
  }));
}

function applySteps(t: PlatformT, states: Partial<Record<ApplyStepKey, StepState>>): Application["steps"] {
  const order: ApplyStepKey[] = ["analyze", "resume", "cover", "review", "submit", "interview"];
  return order.map((key) => ({ key, label: applyStepLabel(t, key), state: states[key] ?? "todo" }));
}

// 경험 mock 풀 — 상태별로 필요한 만큼 잘라 사용.
function experiencePool(t: PlatformT): Experience[] {
  return [
    {
      id: "exp-cafe",
      type: "part-time",
      title: t("카페 아르바이트", "Cafe part-time job", "咖啡店兼职", "Làm thêm quán cà phê", "カフェのアルバイト", "Kerja paruh waktu kafe"),
      period: "2024.03 – 2024.12",
      summary: t("고객 응대와 주문 관리를 담당하며 혼잡 시간대 업무 순서를 정리해 주문 누락을 줄였습니다.", "Handled customer service and orders, reorganizing peak-hour workflow to reduce missed orders.", "负责客户接待和订单管理，整理高峰时段流程，减少了漏单。", "Phụ trách tiếp khách và quản lý đơn, sắp xếp quy trình giờ cao điểm để giảm sót đơn.", "接客と注文管理を担当し、混雑時間帯の作業順を整理して注文漏れを減らしました。", "Menangani layanan dan pesanan, menata alur jam sibuk untuk mengurangi pesanan terlewat."),
      createdAt: "2026-07-10",
      answers: {
        what: t("동네 카페에서 아르바이트를 했어요.", "I worked part-time at a local cafe.", "我在附近的咖啡店做兼职。", "Tôi làm thêm ở quán cà phê gần nhà.", "近所のカフェでアルバイトをしました。", "Saya kerja paruh waktu di kafe dekat rumah."),
        role: t("주문 응대와 재고 관리를 담당했어요.", "I handled orders and inventory.", "我负责点单和库存管理。", "Tôi phụ trách nhận đơn và quản lý kho.", "注文対応と在庫管理を担当しました。", "Saya menangani pesanan dan stok."),
        difficulty: t("바쁜 시간대에 주문이 자주 밀렸어요.", "Orders often piled up during busy hours.", "繁忙时段订单常常积压。", "Giờ bận đơn thường bị dồn.", "忙しい時間帯に注文がよく滞りました。", "Pesanan sering menumpuk saat sibuk."),
        solution: t("업무 순서를 정리한 순서표를 만들었어요.", "I made a checklist ordering the work.", "我制作了整理流程的顺序表。", "Tôi lập bảng trình tự công việc.", "作業順を整理した順序表を作りました。", "Saya membuat daftar urutan kerja."),
        result: t("주문 누락이 줄고 대기 시간이 짧아졌어요.", "Missed orders dropped and waits got shorter.", "漏单减少，等待时间缩短。", "Sót đơn giảm và thời gian chờ ngắn hơn.", "注文漏れが減り待ち時間が短縮しました。", "Pesanan terlewat berkurang, antre lebih singkat.")
      }
    },
    {
      id: "exp-club",
      type: "club",
      title: t("교내 마케팅 동아리", "Campus marketing club", "校内营销社团", "CLB marketing trong trường", "学内マーケティングサークル", "Klub marketing kampus"),
      period: "2024.09 – 2025.06",
      summary: t("동아리 SNS 채널을 운영하며 3개월간 팔로워를 1.5배 늘렸습니다.", "Ran the club's social channels and grew followers 1.5x in 3 months.", "运营社团的社交账号，3个月内粉丝增长1.5倍。", "Vận hành kênh MXH của CLB, tăng người theo dõi 1,5 lần trong 3 tháng.", "サークルのSNSを運営し、3か月でフォロワーを1.5倍に増やしました。", "Mengelola akun sosial klub, menaikkan pengikut 1,5x dalam 3 bulan."),
      createdAt: "2026-07-11"
    },
    {
      id: "exp-project",
      type: "team-project",
      title: t("브랜드 리뉴얼 팀 프로젝트", "Brand renewal team project", "品牌焕新团队项目", "Dự án nhóm làm mới thương hiệu", "ブランドリニューアルのチームプロジェクト", "Proyek tim pembaruan merek"),
      period: "2025.03 – 2025.06",
      summary: t("4인 팀에서 기획을 맡아 사용자 인터뷰를 진행하고 개선안을 도출했습니다.", "Led planning in a 4-person team, ran user interviews and derived improvements.", "在4人团队中负责策划，进行用户访谈并提出改进方案。", "Phụ trách lên kế hoạch trong nhóm 4 người, phỏng vấn người dùng và đề xuất cải tiến.", "4人チームで企画を担当し、ユーザーインタビューを行い改善案を導きました。", "Memimpin perencanaan di tim 4 orang, mewawancarai pengguna dan menyusun perbaikan."),
      createdAt: "2026-07-12"
    }
  ];
}

function baseProfile(t: PlatformT, displayName: string, interests: string[]): TalentSnapshot["profile"] {
  return {
    displayName,
    headline: interests.length
      ? t(`${interests[0]}에 관심 있는 첫 취업 준비생`, `First-time job seeker interested in ${interests[0]}`, `对${interests[0]}感兴趣的首次求职者`, `Người tìm việc lần đầu quan tâm đến ${interests[0]}`, `${interests[0]}に関心のある新卒求職者`, `Pencari kerja pemula yang tertarik pada ${interests[0]}`)
      : undefined,
    interests,
    isForeigner: false,
    education: [{
      school: t("한국대학교", "Korea University", "韩国大学", "Đại học Hàn Quốc", "韓国大学", "Universitas Korea"),
      major: t("경영학과", "Business Administration", "工商管理", "Quản trị kinh doanh", "経営学科", "Manajemen Bisnis"),
      period: "2021 – 2026"
    }],
    skills: [
      t("문서 작성", "Writing", "文档撰写", "Soạn thảo", "文書作成", "Menulis dokumen"),
      t("SNS 운영", "Social media", "社交运营", "Vận hành MXH", "SNS運営", "Kelola media sosial")
    ],
    languages: [
      t("한국어(모국어)", "Korean (native)", "韩语（母语）", "Tiếng Hàn (bản ngữ)", "韓国語（母語）", "Korea (asli)"),
      t("영어(비즈니스)", "English (business)", "英语（商务）", "Tiếng Anh (thương mại)", "英語（ビジネス）", "Inggris (bisnis)")
    ]
  };
}

export function personaSnapshots(t: PlatformT): Record<TalentPersonaId, TalentSnapshot> {
  const pool = experiencePool(t);
  const marketing = t("마케팅", "Marketing", "营销", "Marketing", "マーケティング", "Marketing");
  const servicePlanning = t("서비스 기획", "Product planning", "服务策划", "Lập kế hoạch dịch vụ", "サービス企画", "Perencanaan produk");
  const contentMarketing = t("콘텐츠 마케팅", "Content marketing", "内容营销", "Content marketing", "コンテンツマーケティング", "Content marketing");
  const contentInternTitle = t("콘텐츠 마케팅 인턴", "Content Marketing Intern", "内容营销实习生", "Thực tập Content Marketing", "コンテンツマーケティングインターン", "Magang Content Marketing");
  const plannerTitle = t("서비스 기획 신입", "Junior Service Planner", "服务策划应届", "Nhân viên mới lập kế hoạch dịch vụ", "サービス企画新卒", "Perencana Layanan Junior");
  const movementLab = t("무브먼트랩", "Movement Lab", "Movement Lab", "Movement Lab", "ムーブメントラボ", "Movement Lab");
  const finbird = t("핀버드", "Finbird", "Finbird", "Finbird", "フィンバード", "Finbird");
  const resumeTitle = t("마케팅 지원용 이력서", "Resume for marketing", "营销申请用简历", "CV cho vị trí marketing", "マーケティング応募用の履歴書", "Resume untuk marketing");
  const coverTitle = t("무브먼트랩 콘텐츠 마케팅 인턴", "Movement Lab Content Marketing Intern", "Movement Lab 内容营销实习", "TT Content Marketing Movement Lab", "ムーブメントラボ コンテンツマーケインターン", "Magang Content Marketing Movement Lab");

  const NEW: TalentSnapshot = {
    personaId: "new",
    greetingName: "지훈",
    stageLabel: t("이제 막 시작했어요", "Just getting started", "刚刚开始", "Vừa mới bắt đầu", "始めたばかりです", "Baru saja mulai"),
    progress: 8,
    onboardingDone: false,
    journey: buildJourney(t, { interest: "doing" }),
    weeklyTasks: [
      { id: "t1", label: t("관심 직무 방향 정해보기", "Decide on a role direction", "确定感兴趣的职务方向", "Xác định hướng nghề", "関心のある職種の方向を決める", "Tentukan arah peran"), done: false },
      { id: "t2", label: t("내 경험 1개 정리하기", "Organize one experience", "整理1个经历", "Sắp xếp 1 kinh nghiệm", "経験を1つ整理する", "Susun 1 pengalaman"), done: false }
    ],
    profile: baseProfile(t, "김지훈", []),
    experiences: [],
    resumes: [],
    coverLetters: [],
    applications: []
  };

  const EXPERIENCES: TalentSnapshot = {
    personaId: "experiences",
    greetingName: "지훈",
    stageLabel: t("경험을 정리하고 있어요", "Organizing my experiences", "正在整理经历", "Đang sắp xếp kinh nghiệm", "経験を整理しています", "Sedang menyusun pengalaman"),
    progress: 32,
    onboardingDone: true,
    journey: buildJourney(t, { interest: "done", experiences: "doing" }),
    weeklyTasks: [
      { id: "t1", label: t("경험 1개 더 정리하기", "Organize one more experience", "再整理1个经历", "Sắp xếp thêm 1 kinh nghiệm", "経験をもう1つ整理する", "Susun 1 pengalaman lagi"), done: false },
      { id: "t2", label: t("첫 이력서 만들어보기", "Create your first resume", "制作第一份简历", "Tạo CV đầu tiên", "初めての履歴書を作る", "Buat resume pertama"), done: false }
    ],
    profile: baseProfile(t, "김지훈", [marketing]),
    experiences: pool.slice(0, 2),
    resumes: [],
    coverLetters: [],
    applications: []
  };

  const RESUME: TalentSnapshot = {
    personaId: "resume",
    greetingName: "지훈",
    stageLabel: t("첫 이력서를 완성했어요", "Finished my first resume", "完成了第一份简历", "Đã hoàn thành CV đầu tiên", "初めての履歴書を完成しました", "Selesai membuat resume pertama"),
    progress: 58,
    onboardingDone: true,
    journey: buildJourney(t, {
      interest: "done",
      experiences: "done",
      profile: "done",
      resume: "done",
      cover: "doing"
    }),
    weeklyTasks: [
      { id: "t1", label: t("첫 자기소개서 시작하기", "Start your first cover letter", "开始第一份自荐信", "Bắt đầu thư giới thiệu đầu tiên", "初めての自己PRを始める", "Mulai surat lamaran pertama"), done: false },
      { id: "t2", label: t("관심 공고 3개 저장하기", "Save 3 postings you like", "保存3个感兴趣的职位", "Lưu 3 tin bạn quan tâm", "気になる求人を3件保存する", "Simpan 3 lowongan menarik"), done: false }
    ],
    profile: baseProfile(t, "김지훈", [marketing, servicePlanning]),
    experiences: pool.slice(0, 3),
    resumes: [{ id: "res-1", title: resumeTitle, status: "ready", targetRole: contentMarketing, updatedAt: "2026-07-25" }],
    coverLetters: [],
    applications: [
      {
        id: "app-1",
        jobId: "job-content-intern",
        jobTitle: contentInternTitle,
        company: movementLab,
        status: "interested",
        steps: applySteps(t, {}),
        updatedAt: "2026-07-26"
      }
    ]
  };

  const APPLYING: TalentSnapshot = {
    personaId: "applying",
    greetingName: "지훈",
    stageLabel: t("첫 지원을 준비하고 있어요", "Preparing my first application", "正在准备首次申请", "Đang chuẩn bị lần nộp đầu", "初めての応募を準備しています", "Menyiapkan lamaran pertama"),
    progress: 74,
    onboardingDone: true,
    journey: buildJourney(t, {
      interest: "done",
      experiences: "done",
      profile: "done",
      resume: "done",
      cover: "doing",
      apply: "doing"
    }),
    weeklyTasks: [
      { id: "t1", label: t("지원 동기 작성 마무리", "Finish your motivation statement", "完成申请动机撰写", "Hoàn tất phần động cơ ứng tuyển", "志望動機の作成を仕上げる", "Selesaikan alasan melamar"), done: false },
      { id: "t2", label: t("예상 면접 질문 살펴보기", "Review likely interview questions", "查看预期面试问题", "Xem trước câu hỏi phỏng vấn", "想定面接質問を確認する", "Tinjau kemungkinan pertanyaan wawancara"), done: false }
    ],
    profile: baseProfile(t, "김지훈", [marketing]),
    experiences: pool.slice(0, 3),
    resumes: [{ id: "res-1", title: resumeTitle, status: "ready", targetRole: contentMarketing, updatedAt: "2026-07-27" }],
    coverLetters: [
      { id: "cov-1", type: "tailored", title: coverTitle, jobTitle: contentInternTitle, company: movementLab, status: "draft", updatedAt: "2026-07-28" }
    ],
    applications: [
      {
        id: "app-1",
        jobId: "job-content-intern",
        jobTitle: contentInternTitle,
        company: movementLab,
        status: "preparing",
        steps: applySteps(t, { analyze: "done", resume: "done", cover: "doing" }),
        updatedAt: "2026-07-28"
      },
      {
        id: "app-2",
        jobId: "job-service-planner",
        jobTitle: plannerTitle,
        company: finbird,
        status: "interested",
        steps: applySteps(t, {}),
        updatedAt: "2026-07-24"
      }
    ]
  };

  const INTERVIEW: TalentSnapshot = {
    personaId: "interview",
    greetingName: "지훈",
    stageLabel: t("면접을 준비하고 있어요", "Preparing for interviews", "正在准备面试", "Đang chuẩn bị phỏng vấn", "面接を準備しています", "Menyiapkan wawancara"),
    progress: 88,
    onboardingDone: true,
    journey: buildJourney(t, {
      interest: "done",
      experiences: "done",
      profile: "done",
      resume: "done",
      cover: "done",
      apply: "done",
      interview: "doing"
    }),
    weeklyTasks: [
      { id: "t1", label: t("예상 면접 질문 5개 답변 정리", "Prepare answers to 5 likely questions", "整理5个预期面试问题的答案", "Chuẩn bị câu trả lời cho 5 câu hỏi", "想定面接質問5つの回答を整理", "Siapkan jawaban 5 pertanyaan"), done: false },
      { id: "t2", label: t("1분 자기소개 연습", "Practice a 1-minute intro", "练习1分钟自我介绍", "Luyện giới thiệu 1 phút", "1分間の自己紹介を練習", "Latihan intro 1 menit"), done: true }
    ],
    profile: baseProfile(t, "김지훈", [marketing]),
    experiences: pool.slice(0, 3),
    resumes: [{ id: "res-1", title: resumeTitle, status: "ready", targetRole: contentMarketing, updatedAt: "2026-07-29" }],
    coverLetters: [
      { id: "cov-1", type: "tailored", title: coverTitle, jobTitle: contentInternTitle, company: movementLab, status: "ready", updatedAt: "2026-07-29" }
    ],
    applications: [
      {
        id: "app-1",
        jobId: "job-content-intern",
        jobTitle: contentInternTitle,
        company: movementLab,
        status: "interview",
        steps: applySteps(t, { analyze: "done", resume: "done", cover: "done", review: "done", submit: "done", interview: "doing" }),
        updatedAt: "2026-07-29"
      },
      {
        id: "app-2",
        jobId: "job-service-planner",
        jobTitle: plannerTitle,
        company: finbird,
        status: "applied",
        steps: applySteps(t, { analyze: "done", resume: "done", cover: "done", review: "done", submit: "done" }),
        updatedAt: "2026-07-27"
      }
    ]
  };

  return {
    new: NEW,
    experiences: EXPERIENCES,
    resume: RESUME,
    applying: APPLYING,
    interview: INTERVIEW
  };
}

export function personaOptions(t: PlatformT): { id: TalentPersonaId; label: string }[] {
  return [
    { id: "new", label: t("신규", "New", "新建", "Mới", "新規", "Baru") },
    { id: "experiences", label: t("경험 2개", "2 experiences", "2个经历", "2 kinh nghiệm", "経験2つ", "2 pengalaman") },
    { id: "resume", label: t("이력서 완성", "Resume done", "简历完成", "CV xong", "履歴書完成", "Resume selesai") },
    { id: "applying", label: t("지원 준비", "Applying", "准备申请", "Chuẩn bị nộp", "応募準備", "Menyiapkan lamaran") },
    { id: "interview", label: t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị PV", "面接準備", "Persiapan wawancara") }
  ];
}

export const defaultPersona: TalentPersonaId = "experiences";
