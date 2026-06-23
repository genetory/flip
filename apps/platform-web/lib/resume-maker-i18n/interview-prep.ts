// resume-maker i18n — AI 모의 면접(ResumeInterviewPage) 네임스페이스.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  title: string;
  desc: string;
  jobLabel: string;
  jobPlaceholder: string;
  start: string;
  generating: string;
  failedQuestions: string;
  loadFailed: string;
  intentLabel: string;
  questionProgress: (i: number, n: number) => string;
  answerLabel: string;
  answerPlaceholder: string;
  evaluate: string;
  evaluating: string;
  needAnswer: string;
  evalFailed: string;
  scoreLabel: string;
  strengthsTitle: string;
  improvementsTitle: string;
  sampleTitle: string;
  copy: string;
  copiedToast: string;
  next: string;
  finishTitle: string;
  finishDesc: string;
  restart: string;
  jobRoleLabel: string;
  jobRolePlaceholder: string;
  generate: string;
  listTitle: string;
  practiceThis: string;
  regenerate: string;
  backToList: string;
  catIntro: string;
  catExperience: string;
  catCompetency: string;
  catWeakness: string;
  catOther: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    title: "AI 모의 면접",
    desc: "이력서를 바탕으로 예상 질문을 만들고, 답변을 코칭해 드려요.",
    jobLabel: "지원 공고 (선택)",
    jobPlaceholder: "맞춤 질문을 원하면 공고 내용을 붙여넣으세요.",
    start: "면접 시작",
    generating: "질문 만드는 중...",
    failedQuestions: "면접 질문을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
    loadFailed: "이력서를 불러오지 못했어요.",
    intentLabel: "면접관 의도",
    questionProgress: (i, n) => `질문 ${i} / ${n}`,
    answerLabel: "내 답변",
    answerPlaceholder: "실제 면접처럼 답변을 적어보세요.",
    evaluate: "답변 평가",
    evaluating: "평가 중...",
    needAnswer: "먼저 답변을 적어 주세요.",
    evalFailed: "평가에 실패했어요. 잠시 후 다시 시도해 주세요.",
    scoreLabel: "답변 점수",
    strengthsTitle: "좋았던 점",
    improvementsTitle: "개선하면 좋은 점",
    sampleTitle: "모범답안 예시",
    copy: "복사",
    copiedToast: "복사했어요.",
    next: "다음 질문",
    finishTitle: "수고했어요! 모든 질문을 마쳤어요.",
    finishDesc: "답변을 다듬어 실제 면접을 준비해 보세요.",
    restart: "다시 연습",
    jobRoleLabel: "직무",
    jobRolePlaceholder: "예: 백엔드 개발자",
    generate: "예상 질문 만들기",
    listTitle: "예상 질문",
    practiceThis: "이 질문으로 연습",
    regenerate: "질문 다시 만들기",
    backToList: "목록으로",
    catIntro: "자기소개 · 지원동기",
    catExperience: "경험",
    catCompetency: "직무 역량",
    catWeakness: "상황 · 약점",
    catOther: "기타"
  },
  en: {
    title: "AI mock interview",
    desc: "We generate likely questions from your resume and coach your answers.",
    jobLabel: "Job posting (optional)",
    jobPlaceholder: "Paste a posting for tailored questions.",
    start: "Start interview",
    generating: "Generating questions...",
    failedQuestions: "Couldn't generate questions. Please try again shortly.",
    loadFailed: "Couldn't load the resume.",
    intentLabel: "What the interviewer looks for",
    questionProgress: (i, n) => `Question ${i} / ${n}`,
    answerLabel: "Your answer",
    answerPlaceholder: "Answer as you would in a real interview.",
    evaluate: "Evaluate answer",
    evaluating: "Evaluating...",
    needAnswer: "Please write your answer first.",
    evalFailed: "Evaluation failed. Please try again shortly.",
    scoreLabel: "Answer score",
    strengthsTitle: "What was good",
    improvementsTitle: "What to improve",
    sampleTitle: "Model answer",
    copy: "Copy",
    copiedToast: "Copied.",
    next: "Next question",
    finishTitle: "Well done! You finished all the questions.",
    finishDesc: "Refine your answers to get ready for the real interview.",
    restart: "Practice again",
    jobRoleLabel: "Job role",
    jobRolePlaceholder: "e.g., Backend Developer",
    generate: "Generate questions",
    listTitle: "Expected questions",
    practiceThis: "Practice this",
    regenerate: "Regenerate",
    backToList: "Back to list",
    catIntro: "Intro & Motivation",
    catExperience: "Experience",
    catCompetency: "Job competency",
    catWeakness: "Situational & Weakness",
    catOther: "Other"
  },
  "zh-CN": {
    title: "AI 模拟面试",
    desc: "根据简历生成可能的问题，并为你的回答提供辅导。",
    jobLabel: "招聘启事（可选）",
    jobPlaceholder: "想要定制化问题可粘贴招聘启事。",
    start: "开始面试",
    generating: "正在生成问题...",
    failedQuestions: "无法生成问题，请稍后重试。",
    loadFailed: "无法加载简历。",
    intentLabel: "面试官想考察什么",
    questionProgress: (i, n) => `问题 ${i} / ${n}`,
    answerLabel: "我的回答",
    answerPlaceholder: "像真实面试一样作答。",
    evaluate: "评估回答",
    evaluating: "评估中...",
    needAnswer: "请先写下你的回答。",
    evalFailed: "评估失败，请稍后重试。",
    scoreLabel: "回答得分",
    strengthsTitle: "做得好的地方",
    improvementsTitle: "可改进之处",
    sampleTitle: "示范回答",
    copy: "复制",
    copiedToast: "已复制。",
    next: "下一题",
    finishTitle: "辛苦了！你完成了所有问题。",
    finishDesc: "打磨你的回答，为真实面试做准备。",
    restart: "再练一次",
    jobRoleLabel: "职务",
    jobRolePlaceholder: "例如：后端开发",
    generate: "生成预测问题",
    listTitle: "预测问题",
    practiceThis: "练习此题",
    regenerate: "重新生成",
    backToList: "返回列表",
    catIntro: "自我介绍·动机",
    catExperience: "经验",
    catCompetency: "岗位能力",
    catWeakness: "情境·弱点",
    catOther: "其他"
  },
  vi: {
    title: "Phỏng vấn thử với AI",
    desc: "Tạo câu hỏi có thể gặp từ hồ sơ của bạn và huấn luyện câu trả lời.",
    jobLabel: "Tin tuyển dụng (tùy chọn)",
    jobPlaceholder: "Dán tin tuyển dụng để có câu hỏi phù hợp.",
    start: "Bắt đầu phỏng vấn",
    generating: "Đang tạo câu hỏi...",
    failedQuestions: "Không tạo được câu hỏi. Vui lòng thử lại sau.",
    loadFailed: "Không tải được hồ sơ.",
    intentLabel: "Điều nhà tuyển dụng muốn thấy",
    questionProgress: (i, n) => `Câu hỏi ${i} / ${n}`,
    answerLabel: "Câu trả lời của bạn",
    answerPlaceholder: "Trả lời như trong phỏng vấn thật.",
    evaluate: "Đánh giá câu trả lời",
    evaluating: "Đang đánh giá...",
    needAnswer: "Vui lòng viết câu trả lời trước.",
    evalFailed: "Đánh giá thất bại. Vui lòng thử lại sau.",
    scoreLabel: "Điểm câu trả lời",
    strengthsTitle: "Điểm tốt",
    improvementsTitle: "Điểm cần cải thiện",
    sampleTitle: "Câu trả lời mẫu",
    copy: "Sao chép",
    copiedToast: "Đã sao chép.",
    next: "Câu hỏi tiếp",
    finishTitle: "Làm tốt lắm! Bạn đã hoàn thành tất cả câu hỏi.",
    finishDesc: "Trau chuốt câu trả lời để sẵn sàng cho phỏng vấn thật.",
    restart: "Luyện lại",
    jobRoleLabel: "Vị trí công việc",
    jobRolePlaceholder: "VD: Lập trình viên Backend",
    generate: "Tạo câu hỏi dự kiến",
    listTitle: "Câu hỏi dự kiến",
    practiceThis: "Luyện câu này",
    regenerate: "Tạo lại",
    backToList: "Về danh sách",
    catIntro: "Giới thiệu & Động lực",
    catExperience: "Kinh nghiệm",
    catCompetency: "Năng lực công việc",
    catWeakness: "Tình huống & Điểm yếu",
    catOther: "Khác"
  },
  ja: {
    title: "AI模擬面接",
    desc: "履歴書をもとに想定質問を作り、回答をコーチングします。",
    jobLabel: "応募求人（任意）",
    jobPlaceholder: "求人を貼り付けると質問が最適化されます。",
    start: "面接を始める",
    generating: "質問を作成中...",
    failedQuestions: "質問を作成できませんでした。しばらくして再度お試しください。",
    loadFailed: "履歴書を読み込めませんでした。",
    intentLabel: "面接官が見たいポイント",
    questionProgress: (i, n) => `質問 ${i} / ${n}`,
    answerLabel: "あなたの回答",
    answerPlaceholder: "実際の面接のように答えてみましょう。",
    evaluate: "回答を評価",
    evaluating: "評価中...",
    needAnswer: "先に回答を入力してください。",
    evalFailed: "評価に失敗しました。しばらくして再度お試しください。",
    scoreLabel: "回答スコア",
    strengthsTitle: "良かった点",
    improvementsTitle: "改善するとよい点",
    sampleTitle: "模範回答",
    copy: "コピー",
    copiedToast: "コピーしました。",
    next: "次の質問",
    finishTitle: "お疲れさまでした！すべての質問が終わりました。",
    finishDesc: "回答を磨いて本番の面接に備えましょう。",
    restart: "もう一度練習",
    jobRoleLabel: "職種",
    jobRolePlaceholder: "例: バックエンドエンジニア",
    generate: "想定質問を作成",
    listTitle: "想定質問",
    practiceThis: "この質問で練習",
    regenerate: "作り直す",
    backToList: "一覧へ",
    catIntro: "自己紹介・志望動機",
    catExperience: "経験",
    catCompetency: "職務能力",
    catWeakness: "状況・弱み",
    catOther: "その他"
  },
  id: {
    title: "Wawancara simulasi AI",
    desc: "Kami membuat pertanyaan yang mungkin muncul dari resume Anda dan melatih jawaban Anda.",
    jobLabel: "Lowongan (opsional)",
    jobPlaceholder: "Tempel lowongan untuk pertanyaan yang disesuaikan.",
    start: "Mulai wawancara",
    generating: "Membuat pertanyaan...",
    failedQuestions: "Tidak dapat membuat pertanyaan. Silakan coba lagi sebentar.",
    loadFailed: "Tidak dapat memuat resume.",
    intentLabel: "Yang dinilai pewawancara",
    questionProgress: (i, n) => `Pertanyaan ${i} / ${n}`,
    answerLabel: "Jawaban Anda",
    answerPlaceholder: "Jawab seperti dalam wawancara sungguhan.",
    evaluate: "Evaluasi jawaban",
    evaluating: "Mengevaluasi...",
    needAnswer: "Tulis jawaban Anda terlebih dahulu.",
    evalFailed: "Evaluasi gagal. Silakan coba lagi sebentar.",
    scoreLabel: "Skor jawaban",
    strengthsTitle: "Yang sudah baik",
    improvementsTitle: "Yang perlu diperbaiki",
    sampleTitle: "Contoh jawaban",
    copy: "Salin",
    copiedToast: "Tersalin.",
    next: "Pertanyaan berikutnya",
    finishTitle: "Kerja bagus! Anda menyelesaikan semua pertanyaan.",
    finishDesc: "Sempurnakan jawaban Anda untuk wawancara sungguhan.",
    restart: "Latihan lagi",
    jobRoleLabel: "Posisi",
    jobRolePlaceholder: "mis. Backend Developer",
    generate: "Buat pertanyaan",
    listTitle: "Pertanyaan yang mungkin",
    practiceThis: "Latih ini",
    regenerate: "Buat ulang",
    backToList: "Ke daftar",
    catIntro: "Perkenalan & Motivasi",
    catExperience: "Pengalaman",
    catCompetency: "Kompetensi",
    catWeakness: "Situasional & Kelemahan",
    catOther: "Lainnya"
  }
};

export function useInterviewPrepCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
