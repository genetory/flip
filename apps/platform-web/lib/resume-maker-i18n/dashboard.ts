// resume-maker i18n — 게임화 홈(커리어 퀘스트) 네임스페이스.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  greetingSub: string;
  title: string;
  completeness: string;
  ctaContinue: string;
  ctaStart: string;
  msgDone: string;
  msgAlmost: string;
  msgKeep: string;
  tickets: string;
  questTitle: string;
  questDone: string;
  questFill: string;
  journeyTitle: string;
  s1Title: string;
  s2Title: string;
  s3Title: string;
  s1Done: string;
  s1Pct: (n: number) => string;
  s2Desc: string;
  s3Desc: string;
  recommendNow: string;
  nextTodo: string;
  goNow: string;
  enter: string;
  actContinue: string;
  actTailor: string;
  fillSection: (name: string) => string;
  sec: { basic: string; intro: string; experiences: string; education: string; languages: string; skills: string; awards: string; links: string };
  lockHint: (n: number) => string;
  tourTitle1: string;
  tourDesc1: string;
  tourTitle2: string;
  tourDesc2: string;
  tourTitle3: string;
  tourDesc3: string;
  tourNext: string;
  tourDone: string;
  tourSkip: string;
  badgesTitle: string;
  b1: string;
  b2: string;
  b3: string;
  b4: string;
  b5: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    greetingSub: "오늘도 취업 준비, 가보자고 🚀",
    title: "나의 커리어 퀘스트",
    completeness: "이력서 완성도",
    ctaContinue: "이어서 채우기",
    ctaStart: "이력서 시작하기",
    msgDone: "완성! 공고에 지원해 볼까요?",
    msgAlmost: "거의 다 왔어요!",
    msgKeep: "한 칸씩 채우면 합격에 가까워져요",
    tickets: "보유한 AI 티켓",
    questTitle: "나의 커리어 퀘스트",
    questDone: "완료",
    questFill: "채우기",
    journeyTitle: "취업 준비 여정",
    s1Title: "나의 이력서",
    s2Title: "공고 맞춤",
    s3Title: "모의 면접",
    s1Done: "완성됨 🎉",
    s1Pct: (n) => `완성도 ${n}%`,
    s2Desc: "지원할 공고에 맞춰 분석·보완해요",
    s3Desc: "예상 질문으로 면접을 연습해요",
    recommendNow: "지금 추천",
    nextTodo: "다음 할 일",
    goNow: "지금 하기",
    enter: "바로가기",
    actContinue: "이력서 마저 채우기",
    actTailor: "공고에 맞춰 분석하기",
    fillSection: (name) => `${name} 채우기`,
    sec: { basic: "기본 정보", intro: "자기소개", experiences: "경험", education: "학력", languages: "어학", skills: "스킬", awards: "자격·수상", links: "링크" },
    lockHint: (n) => `이력서 ${n}% 채우면 열려요`,
    tourTitle1: "여기서 시작!",
    tourDesc1: "막히면 이거 하나만 — 지금 할 일이 여기 떠요.",
    tourTitle2: "내 진행도",
    tourDesc2: "이력서 완성도와 이번 달 AI 티켓을 한눈에.",
    tourTitle3: "3단계 여정",
    tourDesc3: "이력서 → 공고 맞춤 → 모의 면접. 채울수록 다음 단계가 열려요.",
    tourNext: "다음",
    tourDone: "시작하기",
    tourSkip: "건너뛰기",
    badgesTitle: "획득 배지",
    b1: "첫 이력서",
    b2: "완성 임박",
    b3: "공고 헌터",
    b4: "면접 마스터",
    b5: "취업 준비왕"
  },
  en: {
    greetingSub: "Let's get job-ready today 🚀",
    title: "My Career Quest",
    completeness: "Resume completeness",
    ctaContinue: "Keep filling",
    ctaStart: "Start your resume",
    msgDone: "Done! Ready to apply?",
    msgAlmost: "Almost there!",
    msgKeep: "Each section gets you closer to an offer",
    tickets: "AI tickets you have",
    questTitle: "My Career Quest",
    questDone: "Done",
    questFill: "Fill in",
    journeyTitle: "Your job-prep journey",
    s1Title: "My Resume",
    s2Title: "Job Match",
    s3Title: "Mock Interview",
    s1Done: "Complete 🎉",
    s1Pct: (n) => `${n}% complete`,
    s2Desc: "Tailor & polish for the job you want",
    s3Desc: "Practice with likely interview questions",
    recommendNow: "Up next",
    nextTodo: "Do next",
    goNow: "Let's go",
    enter: "Open",
    actContinue: "Finish your resume",
    actTailor: "Tailor to a job posting",
    fillSection: (name) => `Fill in ${name}`,
    sec: { basic: "Basic info", intro: "Introduction", experiences: "Experience", education: "Education", languages: "Languages", skills: "Skills", awards: "Certs & Awards", links: "Links" },
    lockHint: (n) => `Unlocks at ${n}% resume`,
    tourTitle1: "Start here!",
    tourDesc1: "Stuck? Just do this — your next task shows up here.",
    tourTitle2: "Your progress",
    tourDesc2: "Resume completeness and this month's AI tickets at a glance.",
    tourTitle3: "3-step journey",
    tourDesc3: "Resume → Job Match → Mock Interview. Steps unlock as you fill in.",
    tourNext: "Next",
    tourDone: "Got it",
    tourSkip: "Skip",
    badgesTitle: "Badges",
    b1: "First resume",
    b2: "Almost done",
    b3: "Job hunter",
    b4: "Interview master",
    b5: "Job-ready champ"
  },
  "zh-CN": {
    greetingSub: "今天也来准备求职吧 🚀",
    title: "我的求职任务",
    completeness: "简历完成度",
    ctaContinue: "继续填写",
    ctaStart: "开始制作简历",
    msgDone: "完成！要去投递吗？",
    msgAlmost: "就快好了！",
    msgKeep: "每填一项都离录用更近一步",
    tickets: "持有的 AI 券",
    questTitle: "我的求职任务",
    questDone: "完成",
    questFill: "去填写",
    journeyTitle: "求职准备之旅",
    s1Title: "我的简历",
    s2Title: "岗位匹配",
    s3Title: "模拟面试",
    s1Done: "已完成 🎉",
    s1Pct: (n) => `完成度 ${n}%`,
    s2Desc: "按你要应聘的岗位分析·补强",
    s3Desc: "用预测问题练习面试",
    recommendNow: "下一步",
    nextTodo: "下一步要做",
    goNow: "现在就做",
    enter: "前往",
    actContinue: "完成你的简历",
    actTailor: "按岗位优化",
    fillSection: (name) => `填写${name}`,
    sec: { basic: "基本信息", intro: "自我介绍", experiences: "经验", education: "学历", languages: "语言", skills: "技能", awards: "资格与获奖", links: "链接" },
    lockHint: (n) => `简历完成 ${n}% 后解锁`,
    tourTitle1: "从这里开始！",
    tourDesc1: "卡住了？只需做这个——下一步任务会显示在这里。",
    tourTitle2: "我的进度",
    tourDesc2: "一眼看清简历完成度和本月 AI 券。",
    tourTitle3: "三步旅程",
    tourDesc3: "简历 → 岗位匹配 → 模拟面试。填得越多越解锁。",
    tourNext: "下一步",
    tourDone: "知道了",
    tourSkip: "跳过",
    badgesTitle: "徽章",
    b1: "首份简历",
    b2: "即将完成",
    b3: "岗位猎手",
    b4: "面试大师",
    b5: "求职冠军"
  },
  vi: {
    greetingSub: "Cùng sẵn sàng xin việc hôm nay nào 🚀",
    title: "Nhiệm vụ nghề nghiệp của tôi",
    completeness: "Mức hoàn thiện hồ sơ",
    ctaContinue: "Tiếp tục điền",
    ctaStart: "Bắt đầu hồ sơ",
    msgDone: "Hoàn tất! Ứng tuyển thôi?",
    msgAlmost: "Sắp xong rồi!",
    msgKeep: "Mỗi mục giúp bạn gần hơn với lời mời làm việc",
    tickets: "Vé AI bạn có",
    questTitle: "Nhiệm vụ sự nghiệp",
    questDone: "Xong",
    questFill: "Điền",
    journeyTitle: "Hành trình chuẩn bị xin việc",
    s1Title: "Hồ sơ của tôi",
    s2Title: "Khớp tin tuyển",
    s3Title: "Phỏng vấn thử",
    s1Done: "Hoàn tất 🎉",
    s1Pct: (n) => `Hoàn thiện ${n}%`,
    s2Desc: "Tối ưu & hoàn thiện theo tin bạn ứng tuyển",
    s3Desc: "Luyện với câu hỏi phỏng vấn dự kiến",
    recommendNow: "Tiếp theo",
    nextTodo: "Việc tiếp theo",
    goNow: "Làm ngay",
    enter: "Mở",
    actContinue: "Hoàn thiện hồ sơ",
    actTailor: "Tối ưu theo tin tuyển dụng",
    fillSection: (name) => `Điền ${name}`,
    sec: { basic: "Thông tin cơ bản", intro: "Giới thiệu", experiences: "Kinh nghiệm", education: "Học vấn", languages: "Ngoại ngữ", skills: "Kỹ năng", awards: "Chứng chỉ & Giải thưởng", links: "Liên kết" },
    lockHint: (n) => `Mở khóa khi hồ sơ đạt ${n}%`,
    tourTitle1: "Bắt đầu ở đây!",
    tourDesc1: "Bí ư? Chỉ cần làm điều này — việc tiếp theo hiện ở đây.",
    tourTitle2: "Tiến độ của bạn",
    tourDesc2: "Mức hoàn thiện hồ sơ và vé AI tháng này trong nháy mắt.",
    tourTitle3: "Hành trình 3 bước",
    tourDesc3: "Hồ sơ → Khớp tin → Phỏng vấn thử. Điền càng nhiều càng mở khóa.",
    tourNext: "Tiếp",
    tourDone: "Đã hiểu",
    tourSkip: "Bỏ qua",
    badgesTitle: "Huy hiệu",
    b1: "Hồ sơ đầu tiên",
    b2: "Sắp xong",
    b3: "Thợ săn việc",
    b4: "Cao thủ phỏng vấn",
    b5: "Nhà vô địch xin việc"
  },
  ja: {
    greetingSub: "今日も就活、いきましょう 🚀",
    title: "マイ・キャリアクエスト",
    completeness: "履歴書の完成度",
    ctaContinue: "続けて入力",
    ctaStart: "履歴書を始める",
    msgDone: "完成！応募してみましょう？",
    msgAlmost: "あと少し！",
    msgKeep: "一つ埋めるごとに内定に近づきます",
    tickets: "保有 AI チケット",
    questTitle: "私のキャリアクエスト",
    questDone: "完了",
    questFill: "入力",
    journeyTitle: "就活準備のジャーニー",
    s1Title: "マイ履歴書",
    s2Title: "求人マッチ",
    s3Title: "模擬面接",
    s1Done: "完成 🎉",
    s1Pct: (n) => `完成度 ${n}%`,
    s2Desc: "応募する求人に合わせて分析・補強",
    s3Desc: "想定質問で面接を練習",
    recommendNow: "次はこれ",
    nextTodo: "次にやること",
    goNow: "今すぐやる",
    enter: "ひらく",
    actContinue: "履歴書を仕上げる",
    actTailor: "求人に合わせて分析",
    fillSection: (name) => `${name}を入力`,
    sec: { basic: "基本情報", intro: "自己紹介", experiences: "経験", education: "学歴", languages: "語学", skills: "スキル", awards: "資格・受賞", links: "リンク" },
    lockHint: (n) => `履歴書 ${n}% で解放`,
    tourTitle1: "ここから！",
    tourDesc1: "迷ったらこれだけ — 次にやることがここに出ます。",
    tourTitle2: "あなたの進捗",
    tourDesc2: "履歴書の完成度と今月の AI チケットがひと目で。",
    tourTitle3: "3ステップの旅",
    tourDesc3: "履歴書 → 求人マッチ → 模擬面接。埋めるほど次が解放。",
    tourNext: "次へ",
    tourDone: "はじめる",
    tourSkip: "スキップ",
    badgesTitle: "獲得バッジ",
    b1: "初めての履歴書",
    b2: "完成間近",
    b3: "求人ハンター",
    b4: "面接マスター",
    b5: "就活チャンピオン"
  },
  id: {
    greetingSub: "Yuk siap-siap cari kerja hari ini 🚀",
    title: "Misi Karier Saya",
    completeness: "Kelengkapan resume",
    ctaContinue: "Lanjut mengisi",
    ctaStart: "Mulai resume",
    msgDone: "Selesai! Siap melamar?",
    msgAlmost: "Hampir selesai!",
    msgKeep: "Tiap bagian mendekatkanmu ke tawaran kerja",
    tickets: "Tiket AI yang dimiliki",
    questTitle: "Misi Karier Saya",
    questDone: "Selesai",
    questFill: "Isi",
    journeyTitle: "Perjalanan persiapan kerja",
    s1Title: "Resume Saya",
    s2Title: "Cocokkan Lowongan",
    s3Title: "Wawancara Simulasi",
    s1Done: "Selesai 🎉",
    s1Pct: (n) => `Kelengkapan ${n}%`,
    s2Desc: "Sesuaikan & perkuat untuk lowongan incaranmu",
    s3Desc: "Latihan dengan pertanyaan wawancara",
    recommendNow: "Berikutnya",
    nextTodo: "Langkah berikutnya",
    goNow: "Lakukan sekarang",
    enter: "Buka",
    actContinue: "Selesaikan resume",
    actTailor: "Sesuaikan dengan lowongan",
    fillSection: (name) => `Isi ${name}`,
    sec: { basic: "Info dasar", intro: "Perkenalan", experiences: "Pengalaman", education: "Pendidikan", languages: "Bahasa", skills: "Keahlian", awards: "Sertifikat & Penghargaan", links: "Tautan" },
    lockHint: (n) => `Terbuka saat resume ${n}%`,
    tourTitle1: "Mulai di sini!",
    tourDesc1: "Bingung? Lakukan ini saja — tugas berikutnya muncul di sini.",
    tourTitle2: "Progres kamu",
    tourDesc2: "Kelengkapan resume dan tiket AI bulan ini sekilas.",
    tourTitle3: "Perjalanan 3 langkah",
    tourDesc3: "Resume → Cocokkan Lowongan → Wawancara. Terbuka saat kamu mengisi.",
    tourNext: "Lanjut",
    tourDone: "Mengerti",
    tourSkip: "Lewati",
    badgesTitle: "Lencana",
    b1: "Resume pertama",
    b2: "Hampir selesai",
    b3: "Pemburu lowongan",
    b4: "Master wawancara",
    b5: "Juara siap kerja"
  }
};

export function useDashboardCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
