// resume-maker i18n — ResumeExperienceInterviewPage 네임스페이스.
// 사이트 i18n 방식(useLanguage 의 locale)에 맞춰, 컴포넌트별로 6개 언어 사전을
// 한 파일에 담고 훅으로 노출한다. locale 미일치 시 영어(기본)로 폴백.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  // periodText
  inProgress: string;
  // answerToText
  notSureExactly: string;
  // generating phrases
  generatingPhrase1: string;
  generatingPhrase2: string;
  generatingPhrase3: string;
  // tone buttons
  toneSimplerLabel: string;
  toneSimplerHints: string;
  toneProfessionalLabel: string;
  toneProfessionalHints: string;
  toneResultsLabel: string;
  toneResultsHints: string;
  toneShorterLabel: string;
  toneShorterHints: string;
  toneSpecificLabel: string;
  toneSpecificHints: string;
  // toasts / errors
  questionsLoadError: string;
  resumeLoadError: string;
  answerAtLeastOne: string;
  sentenceGenerateError: string;
  sentenceRewriteError: string;
  selectAtLeastOne: string;
  savedApproved: string;
  // states
  loading: string;
  experienceNotFound: string;
  backToList: string;
  experienceListBack: string;
  preparingQuestions: string;
  generatingNote: string;
  // interview view
  questionsLoadFailed: string;
  retry: string;
  questionProgress: (idx: number, total: number) => string;
  answeredCount: (n: number) => string;
  answerUnknown: string;
  answerNotRemember: string;
  answerSkip: string;
  previous: string;
  next: string;
  makeSentences: string;
  numberHint: string;
  // answer input placeholders
  longTextPlaceholder: string;
  numberPlaceholder: string;
  shortTextPlaceholder: string;
  customInputPlaceholder: string;
  // review view
  reviewTitle: string;
  reviewDesc: string;
  rawInputLabel: string;
  needsReviewBadge: string;
  editDone: string;
  editManual: string;
  changedBefore: string;
  extractedSkills: string;
  askAgain: (n: number) => string;
  saveSelected: (n: number) => string;
  approveUse: string;
  approveUnuse: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    inProgress: "진행 중",
    notSureExactly: "정확히 기억나지 않음",
    generatingPhrase1: "답변에서 핵심 경험을 찾고 있어요.",
    generatingPhrase2: "이력서에 적합한 문장으로 정리하고 있어요.",
    generatingPhrase3: "과장된 표현이 없는지 확인하고 있어요.",
    toneSimplerLabel: "더 담백하게",
    toneSimplerHints: "더 담백하고 간결하게, 과장 없이",
    toneProfessionalLabel: "더 전문적으로",
    toneProfessionalHints: "더 전문적인 어조로",
    toneResultsLabel: "성과 중심으로",
    toneResultsHints: "성과와 결과 중심으로 (없는 수치는 만들지 말 것)",
    toneShorterLabel: "더 짧게",
    toneShorterHints: "한 문장으로 더 짧게",
    toneSpecificLabel: "더 구체적으로",
    toneSpecificHints: "행동과 역할을 더 구체적으로 (없는 사실 추가 금지)",
    questionsLoadError: "질문을 불러오지 못했어요.",
    resumeLoadError: "이력서를 불러오지 못했어요.",
    answerAtLeastOne: "최소 한 가지 질문에는 답해 주세요. 모르면 '잘 모르겠어요'도 괜찮아요.",
    sentenceGenerateError: "문장을 만들지 못했어요.",
    sentenceRewriteError: "문장을 다시 쓰지 못했어요.",
    selectAtLeastOne: "이력서에 사용할 문장을 한 개 이상 선택해 주세요.",
    savedApproved: "승인한 문장을 경험에 저장했어요.",
    loading: "불러오는 중...",
    experienceNotFound: "경험을 찾을 수 없어요.",
    backToList: "경험 목록으로",
    experienceListBack: "경험 목록",
    preparingQuestions: "질문을 준비하고 있어요...",
    generatingNote: "말하지 않은 내용은 추가하지 않을게요.",
    questionsLoadFailed: "질문을 불러오지 못했어요.",
    retry: "다시 시도",
    questionProgress: (idx, total) => `질문 ${idx} / ${total}`,
    answeredCount: (n) => `${n}개 답변함`,
    answerUnknown: "잘 모르겠어요",
    answerNotRemember: "기억나지 않아요",
    answerSkip: "건너뛰기",
    previous: "이전",
    next: "다음",
    makeSentences: "이력서 문장 만들기",
    numberHint: "정확한 숫자를 모르면 넘어가도 괜찮아요.",
    longTextPlaceholder: "편하게 적어주세요.",
    numberPlaceholder: "숫자 (모르면 넘어가도 돼요)",
    shortTextPlaceholder: "편하게 적어주세요.",
    customInputPlaceholder: "직접 입력",
    reviewTitle: "AI가 정리한 문장",
    reviewDesc: "사용할 문장을 선택하고 필요하면 다듬어 주세요. 승인한 문장만 이력서에 반영돼요.",
    rawInputLabel: "원래 입력",
    needsReviewBadge: "확인 필요",
    editDone: "완료",
    editManual: "직접 수정",
    changedBefore: "변경 전",
    extractedSkills: "추출된 스킬",
    askAgain: (n) => `더 정확하게 — 다시 질문받기 (${n})`,
    saveSelected: (n) => `선택한 문장 저장 (${n})`,
    approveUse: "이 문장 사용",
    approveUnuse: "사용 해제"
  },
  en: {
    inProgress: "Present",
    notSureExactly: "Don't remember exactly",
    generatingPhrase1: "Finding the key experiences in your answers.",
    generatingPhrase2: "Shaping them into resume-ready sentences.",
    generatingPhrase3: "Checking for any exaggerated wording.",
    toneSimplerLabel: "More plain",
    toneSimplerHints: "More plain and concise, no exaggeration",
    toneProfessionalLabel: "More professional",
    toneProfessionalHints: "In a more professional tone",
    toneResultsLabel: "Results-focused",
    toneResultsHints: "Focus on outcomes and results (do not invent numbers that aren't there)",
    toneShorterLabel: "Shorter",
    toneShorterHints: "Shorter, in a single sentence",
    toneSpecificLabel: "More specific",
    toneSpecificHints: "More specific about actions and role (do not add facts that aren't there)",
    questionsLoadError: "Couldn't load the questions.",
    resumeLoadError: "Couldn't load the resume.",
    answerAtLeastOne: "Please answer at least one question. If you're unsure, \"I'm not sure\" is fine too.",
    sentenceGenerateError: "Couldn't create the sentences.",
    sentenceRewriteError: "Couldn't rewrite the sentence.",
    selectAtLeastOne: "Please select at least one sentence to use in your resume.",
    savedApproved: "Saved the approved sentences to this experience.",
    loading: "Loading...",
    experienceNotFound: "We couldn't find this experience.",
    backToList: "Back to experiences",
    experienceListBack: "Experiences",
    preparingQuestions: "Preparing your questions...",
    generatingNote: "We won't add anything you didn't mention.",
    questionsLoadFailed: "Couldn't load the questions.",
    retry: "Retry",
    questionProgress: (idx, total) => `Question ${idx} / ${total}`,
    answeredCount: (n) => `${n} answered`,
    answerUnknown: "I'm not sure",
    answerNotRemember: "I don't remember",
    answerSkip: "Skip",
    previous: "Previous",
    next: "Next",
    makeSentences: "Create resume sentences",
    numberHint: "If you don't know the exact number, it's fine to skip.",
    longTextPlaceholder: "Feel free to write here.",
    numberPlaceholder: "Number (skip if you don't know)",
    shortTextPlaceholder: "Feel free to write here.",
    customInputPlaceholder: "Type your own",
    reviewTitle: "Sentences drafted by AI",
    reviewDesc: "Select the sentences to use and refine them if needed. Only approved sentences go into your resume.",
    rawInputLabel: "Original input",
    needsReviewBadge: "Needs review",
    editDone: "Done",
    editManual: "Edit manually",
    changedBefore: "Before",
    extractedSkills: "Extracted skills",
    askAgain: (n) => `Get more precise — answer more questions (${n})`,
    saveSelected: (n) => `Save selected sentences (${n})`,
    approveUse: "Use this sentence",
    approveUnuse: "Stop using"
  },
  "zh-CN": {
    inProgress: "至今",
    notSureExactly: "记不太清楚",
    generatingPhrase1: "正在从你的回答中提取关键经历。",
    generatingPhrase2: "正在整理成适合简历的句子。",
    generatingPhrase3: "正在检查是否有夸大的表述。",
    toneSimplerLabel: "更朴实",
    toneSimplerHints: "更朴实简洁，不夸张",
    toneProfessionalLabel: "更专业",
    toneProfessionalHints: "用更专业的语气",
    toneResultsLabel: "突出成果",
    toneResultsHints: "以成果和结果为中心（不要编造不存在的数字）",
    toneShorterLabel: "更简短",
    toneShorterHints: "用一句话更简短地表达",
    toneSpecificLabel: "更具体",
    toneSpecificHints: "更具体地说明行动和角色（不要添加不存在的事实）",
    questionsLoadError: "无法加载问题。",
    resumeLoadError: "无法加载简历。",
    answerAtLeastOne: "请至少回答一个问题。不知道的话，选择“不太清楚”也可以。",
    sentenceGenerateError: "无法生成句子。",
    sentenceRewriteError: "无法重写句子。",
    selectAtLeastOne: "请至少选择一句要用于简历的句子。",
    savedApproved: "已将确认的句子保存到该经历。",
    loading: "加载中...",
    experienceNotFound: "找不到该经历。",
    backToList: "返回经历列表",
    experienceListBack: "经历列表",
    preparingQuestions: "正在准备问题...",
    generatingNote: "不会添加你没有提到的内容。",
    questionsLoadFailed: "无法加载问题。",
    retry: "重试",
    questionProgress: (idx, total) => `问题 ${idx} / ${total}`,
    answeredCount: (n) => `已回答 ${n} 个`,
    answerUnknown: "不太清楚",
    answerNotRemember: "记不起来了",
    answerSkip: "跳过",
    previous: "上一题",
    next: "下一题",
    makeSentences: "生成简历句子",
    numberHint: "如果不知道确切数字，跳过也没关系。",
    longTextPlaceholder: "请随意填写。",
    numberPlaceholder: "数字（不知道可跳过）",
    shortTextPlaceholder: "请随意填写。",
    customInputPlaceholder: "自行输入",
    reviewTitle: "AI 整理的句子",
    reviewDesc: "选择要使用的句子，必要时进行润色。只有确认的句子才会反映到简历中。",
    rawInputLabel: "原始输入",
    needsReviewBadge: "需确认",
    editDone: "完成",
    editManual: "手动修改",
    changedBefore: "修改前",
    extractedSkills: "提取的技能",
    askAgain: (n) => `更精确 — 再回答几个问题 (${n})`,
    saveSelected: (n) => `保存所选句子 (${n})`,
    approveUse: "使用这句",
    approveUnuse: "取消使用"
  },
  vi: {
    inProgress: "Đang làm",
    notSureExactly: "Không nhớ chính xác",
    generatingPhrase1: "Đang tìm những kinh nghiệm quan trọng trong câu trả lời của bạn.",
    generatingPhrase2: "Đang chuyển thành câu phù hợp cho hồ sơ.",
    generatingPhrase3: "Đang kiểm tra xem có cách diễn đạt phóng đại nào không.",
    toneSimplerLabel: "Mộc mạc hơn",
    toneSimplerHints: "Mộc mạc và súc tích hơn, không phóng đại",
    toneProfessionalLabel: "Chuyên nghiệp hơn",
    toneProfessionalHints: "Với giọng điệu chuyên nghiệp hơn",
    toneResultsLabel: "Tập trung vào kết quả",
    toneResultsHints: "Tập trung vào thành quả và kết quả (không bịa ra con số không có)",
    toneShorterLabel: "Ngắn hơn",
    toneShorterHints: "Ngắn hơn, trong một câu",
    toneSpecificLabel: "Cụ thể hơn",
    toneSpecificHints: "Cụ thể hơn về hành động và vai trò (không thêm sự thật không có)",
    questionsLoadError: "Không tải được câu hỏi.",
    resumeLoadError: "Không tải được hồ sơ.",
    answerAtLeastOne: "Vui lòng trả lời ít nhất một câu hỏi. Nếu không chắc, chọn \"Tôi không chắc\" cũng được.",
    sentenceGenerateError: "Không tạo được câu.",
    sentenceRewriteError: "Không viết lại được câu.",
    selectAtLeastOne: "Vui lòng chọn ít nhất một câu để dùng trong hồ sơ.",
    savedApproved: "Đã lưu các câu đã duyệt vào kinh nghiệm này.",
    loading: "Đang tải...",
    experienceNotFound: "Không tìm thấy kinh nghiệm này.",
    backToList: "Về danh sách kinh nghiệm",
    experienceListBack: "Danh sách kinh nghiệm",
    preparingQuestions: "Đang chuẩn bị câu hỏi...",
    generatingNote: "Chúng tôi sẽ không thêm những gì bạn không nhắc đến.",
    questionsLoadFailed: "Không tải được câu hỏi.",
    retry: "Thử lại",
    questionProgress: (idx, total) => `Câu hỏi ${idx} / ${total}`,
    answeredCount: (n) => `Đã trả lời ${n}`,
    answerUnknown: "Tôi không chắc",
    answerNotRemember: "Tôi không nhớ",
    answerSkip: "Bỏ qua",
    previous: "Trước",
    next: "Tiếp",
    makeSentences: "Tạo câu cho hồ sơ",
    numberHint: "Nếu không biết con số chính xác, bỏ qua cũng không sao.",
    longTextPlaceholder: "Cứ thoải mái viết nhé.",
    numberPlaceholder: "Con số (bỏ qua nếu không biết)",
    shortTextPlaceholder: "Cứ thoải mái viết nhé.",
    customInputPlaceholder: "Tự nhập",
    reviewTitle: "Câu do AI soạn",
    reviewDesc: "Chọn câu để dùng và chỉnh lại nếu cần. Chỉ những câu đã duyệt mới được đưa vào hồ sơ.",
    rawInputLabel: "Nội dung gốc",
    needsReviewBadge: "Cần kiểm tra",
    editDone: "Xong",
    editManual: "Chỉnh thủ công",
    changedBefore: "Trước khi sửa",
    extractedSkills: "Kỹ năng được trích xuất",
    askAgain: (n) => `Chính xác hơn — trả lời thêm câu hỏi (${n})`,
    saveSelected: (n) => `Lưu các câu đã chọn (${n})`,
    approveUse: "Dùng câu này",
    approveUnuse: "Bỏ dùng"
  },
  ja: {
    inProgress: "在籍中",
    notSureExactly: "正確には覚えていない",
    generatingPhrase1: "回答から重要な経験を探しています。",
    generatingPhrase2: "履歴書に適した文章に整えています。",
    generatingPhrase3: "誇張した表現がないか確認しています。",
    toneSimplerLabel: "もっと淡白に",
    toneSimplerHints: "より淡白で簡潔に、誇張なしで",
    toneProfessionalLabel: "もっと専門的に",
    toneProfessionalHints: "より専門的な口調で",
    toneResultsLabel: "成果を中心に",
    toneResultsHints: "成果と結果を中心に（存在しない数値は作らないこと）",
    toneShorterLabel: "もっと短く",
    toneShorterHints: "一文でもっと短く",
    toneSpecificLabel: "もっと具体的に",
    toneSpecificHints: "行動と役割をより具体的に（存在しない事実は追加しないこと）",
    questionsLoadError: "質問を読み込めませんでした。",
    resumeLoadError: "履歴書を読み込めませんでした。",
    answerAtLeastOne: "最低でも1つの質問に答えてください。わからなければ「よくわかりません」でも大丈夫です。",
    sentenceGenerateError: "文章を作成できませんでした。",
    sentenceRewriteError: "文章を書き直せませんでした。",
    selectAtLeastOne: "履歴書に使う文章を1つ以上選んでください。",
    savedApproved: "承認した文章を経験に保存しました。",
    loading: "読み込み中...",
    experienceNotFound: "経験が見つかりません。",
    backToList: "経験一覧へ",
    experienceListBack: "経験一覧",
    preparingQuestions: "質問を準備しています...",
    generatingNote: "話していない内容は追加しません。",
    questionsLoadFailed: "質問を読み込めませんでした。",
    retry: "再試行",
    questionProgress: (idx, total) => `質問 ${idx} / ${total}`,
    answeredCount: (n) => `${n}件回答済み`,
    answerUnknown: "よくわかりません",
    answerNotRemember: "覚えていません",
    answerSkip: "スキップ",
    previous: "前へ",
    next: "次へ",
    makeSentences: "履歴書の文章を作成",
    numberHint: "正確な数字がわからなければ飛ばしても大丈夫です。",
    longTextPlaceholder: "気軽に書いてください。",
    numberPlaceholder: "数字（わからなければ飛ばしてもOK）",
    shortTextPlaceholder: "気軽に書いてください。",
    customInputPlaceholder: "自由入力",
    reviewTitle: "AIが整理した文章",
    reviewDesc: "使う文章を選び、必要なら整えてください。承認した文章だけが履歴書に反映されます。",
    rawInputLabel: "元の入力",
    needsReviewBadge: "要確認",
    editDone: "完了",
    editManual: "手動で修正",
    changedBefore: "変更前",
    extractedSkills: "抽出されたスキル",
    askAgain: (n) => `より正確に — もう一度質問を受ける (${n})`,
    saveSelected: (n) => `選んだ文章を保存 (${n})`,
    approveUse: "この文章を使う",
    approveUnuse: "使用を解除"
  },
  id: {
    inProgress: "Sekarang",
    notSureExactly: "Tidak ingat persisnya",
    generatingPhrase1: "Mencari pengalaman penting dari jawaban Anda.",
    generatingPhrase2: "Menyusunnya menjadi kalimat yang cocok untuk resume.",
    generatingPhrase3: "Memeriksa apakah ada ungkapan yang berlebihan.",
    toneSimplerLabel: "Lebih sederhana",
    toneSimplerHints: "Lebih sederhana dan ringkas, tanpa melebih-lebihkan",
    toneProfessionalLabel: "Lebih profesional",
    toneProfessionalHints: "Dengan nada yang lebih profesional",
    toneResultsLabel: "Fokus pada hasil",
    toneResultsHints: "Fokus pada pencapaian dan hasil (jangan mengarang angka yang tidak ada)",
    toneShorterLabel: "Lebih singkat",
    toneShorterHints: "Lebih singkat, dalam satu kalimat",
    toneSpecificLabel: "Lebih spesifik",
    toneSpecificHints: "Lebih spesifik tentang tindakan dan peran (jangan menambah fakta yang tidak ada)",
    questionsLoadError: "Tidak dapat memuat pertanyaan.",
    resumeLoadError: "Tidak dapat memuat resume.",
    answerAtLeastOne: "Mohon jawab setidaknya satu pertanyaan. Jika tidak yakin, \"Saya tidak yakin\" juga boleh.",
    sentenceGenerateError: "Tidak dapat membuat kalimat.",
    sentenceRewriteError: "Tidak dapat menulis ulang kalimat.",
    selectAtLeastOne: "Mohon pilih setidaknya satu kalimat untuk digunakan di resume.",
    savedApproved: "Kalimat yang disetujui telah disimpan ke pengalaman ini.",
    loading: "Memuat...",
    experienceNotFound: "Pengalaman tidak ditemukan.",
    backToList: "Kembali ke daftar pengalaman",
    experienceListBack: "Daftar pengalaman",
    preparingQuestions: "Menyiapkan pertanyaan...",
    generatingNote: "Kami tidak akan menambahkan hal yang tidak Anda sebutkan.",
    questionsLoadFailed: "Tidak dapat memuat pertanyaan.",
    retry: "Coba lagi",
    questionProgress: (idx, total) => `Pertanyaan ${idx} / ${total}`,
    answeredCount: (n) => `${n} terjawab`,
    answerUnknown: "Saya tidak yakin",
    answerNotRemember: "Saya tidak ingat",
    answerSkip: "Lewati",
    previous: "Sebelumnya",
    next: "Berikutnya",
    makeSentences: "Buat kalimat resume",
    numberHint: "Jika tidak tahu angka pastinya, melewatinya juga tidak masalah.",
    longTextPlaceholder: "Tulis dengan santai.",
    numberPlaceholder: "Angka (lewati jika tidak tahu)",
    shortTextPlaceholder: "Tulis dengan santai.",
    customInputPlaceholder: "Masukkan sendiri",
    reviewTitle: "Kalimat yang disusun AI",
    reviewDesc: "Pilih kalimat yang akan digunakan dan perbaiki jika perlu. Hanya kalimat yang disetujui yang masuk ke resume.",
    rawInputLabel: "Input asli",
    needsReviewBadge: "Perlu diperiksa",
    editDone: "Selesai",
    editManual: "Edit manual",
    changedBefore: "Sebelumnya",
    extractedSkills: "Keterampilan yang diekstrak",
    askAgain: (n) => `Lebih akurat — jawab pertanyaan lagi (${n})`,
    saveSelected: (n) => `Simpan kalimat terpilih (${n})`,
    approveUse: "Gunakan kalimat ini",
    approveUnuse: "Berhenti gunakan"
  }
};

export function useInterviewCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
