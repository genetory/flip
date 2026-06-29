// resume-maker i18n — ResumeExperiencesPage 네임스페이스.
// 사이트 i18n 방식(useLanguage 의 locale)에 맞춰, 컴포넌트별로 6개 언어 사전을
// 한 파일에 담고 훅으로 노출한다. locale 미일치 시 영어(기본)로 폴백.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  rawPlaceholder: string;
  inProgress: string;
  newExperienceFallback: string;
  loadFailed: string;
  taskHintEmpty: string;
  taskCreateFailed: string;
  polishHintEmpty: string;
  polishFailed: string;
  titleHintEmpty: string;
  titleSuggestFailed: string;
  submitHintEmpty: string;
  loadingText: string;
  heading: string;
  registeredCount: (total: number, ready: number) => string;
  add: string;
  fillWithAi: string;
  editHeading: string;
  newHeading: string;
  formIntro: string;
  whatExperienceLabel: string;
  resumeSentenceLabel: string;
  whatDidYouDoLabel: string;
  suggestAgain: string;
  suggestTasks: string;
  polishIntro: string;
  aiPolishedLabel: (style: string) => string;
  adoptPolished: string;
  close: string;
  tryOtherStyle: string;
  noMoreSuggestions: string;
  experienceNameLabel: string;
  optional: string;
  aiSuggest: string;
  experienceNamePlaceholder: string;
  periodLabel: string;
  periodWhen: string;
  startMonthAria: string;
  endMonthAria: string;
  periodHint: string;
  detailsLabel: string;
  orgLabel: string;
  orgPlaceholder: string;
  roleLabel: string;
  rolePlaceholder: string;
  rankLabel: string;
  rankPlaceholder: string;
  cancel: string;
  save: string;
  addAndGetQuestions: string;
  emptyTitle: string;
  emptyDescLine1: string;
  emptyDescLine2: string;
  allTab: string;
  noExperienceInCategory: string;
  periodMissing: string;
  editAria: string;
  deleteAria: string;
  fillWithAiChat: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  delete: string;
  adoptToast: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    rawPlaceholder: "카페에서 1년 동안 일했고 주문, 음료 제조, 신규 직원 교육을 했어요.",
    inProgress: "진행 중",
    newExperienceFallback: "새 경험",
    loadFailed: "이력서를 불러오지 못했어요.",
    taskHintEmpty: "경험명이나 한 일을 한 줄만 적어 주세요. 어떤 일을 했는지 추천해 드릴게요.",
    taskCreateFailed: "추천 항목을 만들지 못했어요.",
    polishHintEmpty: "먼저 ‘한 일’을 적어 주세요. 내용을 보고 다듬어 드릴게요.",
    polishFailed: "내용을 다듬지 못했어요.",
    titleHintEmpty: "먼저 ‘한 일’을 적어 주세요. 내용을 보고 지어드릴게요.",
    titleSuggestFailed: "경험명을 추천하지 못했어요.",
    submitHintEmpty: "이 경험에서 한 일을 한두 문장으로 적어 주세요.",
    loadingText: "불러오는 중...",
    heading: "경험",
    registeredCount: (total, ready) =>
      `등록된 경험 ${total}개 · 이력서 사용 가능 ${ready}개`,
    add: "추가",
    fillWithAi: "경험을 AI와 대화하며 채우기",
    editHeading: "경험 수정",
    newHeading: "새 경험 추가",
    formIntro: "편하게 적어주세요. AI가 이력서에 필요한 내용을 추가로 질문할게요.",
    whatExperienceLabel: "어떤 경험인가요?",
    resumeSentenceLabel: "이력서 문장 (한 줄에 하나씩 — 이력서에 그대로 나와요)",
    whatDidYouDoLabel: "이 경험에서 한 일",
    suggestAgain: "다시 추천",
    suggestTasks: "할 일 후보 추천",
    polishIntro: "한 문장만 적어도 돼요. AI가 다듬어 드릴게요 — 형식을 골라보세요",
    aiPolishedLabel: (style) => `AI가 다듬은 내용 · ${style}`,
    adoptPolished: "이 내용으로 채택",
    close: "닫기",
    tryOtherStyle: "위에서 다른 형식도 시도해 볼 수 있어요.",
    noMoreSuggestions: "더 추천할 항목이 없어요. 위 칸에 직접 적어도 좋아요.",
    experienceNameLabel: "경험명",
    optional: "(선택)",
    aiSuggest: "AI 추천",
    experienceNamePlaceholder: "비워두면 ‘한 일’을 보고 AI가 지어줘요",
    periodLabel: "기간",
    periodWhen: "· 언제 했나요?",
    startMonthAria: "시작 월",
    endMonthAria: "종료 월 (진행 중이면 비워두세요)",
    periodHint: "진행 중이면 종료는 비워두세요.",
    detailsLabel: "세부 정보 (선택)",
    orgLabel: "조직 또는 프로젝트명",
    orgPlaceholder: "예: 스타벅스 OO점",
    roleLabel: "직무",
    rolePlaceholder: "예: 백엔드 개발",
    rankLabel: "직급",
    rankPlaceholder: "예: 사원 · 인턴 · 팀장",
    cancel: "취소",
    save: "저장",
    addAndGetQuestions: "추가하고 질문받기",
    emptyTitle: "첫 경험을 추가해 볼까요?",
    emptyDescLine1: "아르바이트, 학교 프로젝트, 동아리 등 무엇이든 좋아요.",
    emptyDescLine2: "짧게 적으면 AI가 이어서 질문할게요.",
    allTab: "전체",
    noExperienceInCategory: "이 카테고리에 경험이 없어요.",
    periodMissing: "기간 미입력 — 이력서에 포함되지 않아요",
    editAria: "경험 수정",
    deleteAria: "경험 삭제",
    fillWithAiChat: "AI와 대화로 채우기",
    deleteConfirmTitle: "경험을 삭제할까요?",
    deleteConfirmDesc: "이 경험과 작성한 답변·문장이 함께 삭제돼요.",
    delete: "삭제",
    adoptToast: "다듬은 내용으로 채택했어요."
  },
  en: {
    rawPlaceholder: "I worked at a cafe for a year, taking orders, making drinks, and training new staff.",
    inProgress: "In progress",
    newExperienceFallback: "New experience",
    loadFailed: "We couldn't load your resume.",
    taskHintEmpty: "Just write one line about the experience or what you did. We'll suggest what you might have done.",
    taskCreateFailed: "We couldn't generate suggestions.",
    polishHintEmpty: "First, write what you did. We'll polish it based on what you wrote.",
    polishFailed: "We couldn't polish the content.",
    titleHintEmpty: "First, write what you did. We'll come up with a name based on it.",
    titleSuggestFailed: "We couldn't suggest a name.",
    submitHintEmpty: "Write one or two sentences about what you did in this experience.",
    loadingText: "Loading...",
    heading: "Experience",
    registeredCount: (total, ready) =>
      `${total} experiences registered · ${ready} ready for your resume`,
    add: "Add",
    fillWithAi: "Fill in your experience by chatting with AI",
    editHeading: "Edit experience",
    newHeading: "Add new experience",
    formIntro: "Write freely. AI will ask follow-up questions for what your resume needs.",
    whatExperienceLabel: "What kind of experience is this?",
    resumeSentenceLabel: "Resume sentences (one per line — shown as-is on your resume)",
    whatDidYouDoLabel: "What you did in this experience",
    suggestAgain: "Suggest again",
    suggestTasks: "Suggest tasks",
    polishIntro: "Even one sentence is fine. AI will polish it for you — pick a style",
    aiPolishedLabel: (style) => `AI-polished content · ${style}`,
    adoptPolished: "Use this version",
    close: "Close",
    tryOtherStyle: "You can also try other styles above.",
    noMoreSuggestions: "No more suggestions. Feel free to write your own in the box above.",
    experienceNameLabel: "Experience name",
    optional: "(optional)",
    aiSuggest: "AI suggest",
    experienceNamePlaceholder: "Leave blank and AI will name it based on what you did",
    periodLabel: "Period",
    periodWhen: "· When did you do this?",
    startMonthAria: "Start month",
    endMonthAria: "End month (leave blank if ongoing)",
    periodHint: "If it's ongoing, leave the end date blank.",
    detailsLabel: "Details (optional)",
    orgLabel: "Organization or project name",
    orgPlaceholder: "e.g. Starbucks XX Branch",
    roleLabel: "Role",
    rolePlaceholder: "e.g. Backend development",
    rankLabel: "Position",
    rankPlaceholder: "e.g. Staff · Intern · Team lead",
    cancel: "Cancel",
    save: "Save",
    addAndGetQuestions: "Add and get questions",
    emptyTitle: "Shall we add your first experience?",
    emptyDescLine1: "A part-time job, school project, club — anything works.",
    emptyDescLine2: "Write a little and AI will follow up with questions.",
    allTab: "All",
    noExperienceInCategory: "No experiences in this category.",
    periodMissing: "No period entered — won't be included in your resume",
    editAria: "Edit experience",
    deleteAria: "Delete experience",
    fillWithAiChat: "Fill in by chatting with AI",
    deleteConfirmTitle: "Delete this experience?",
    deleteConfirmDesc: "This experience and the answers and sentences you wrote will be deleted together.",
    delete: "Delete",
    adoptToast: "Adopted the polished content."
  },
  "zh-CN": {
    rawPlaceholder: "我在咖啡店工作了一年，负责点单、制作饮品和培训新员工。",
    inProgress: "进行中",
    newExperienceFallback: "新经历",
    loadFailed: "未能加载您的简历。",
    taskHintEmpty: "只需写一行经历名称或做过的事。我们会为您推荐做过哪些工作。",
    taskCreateFailed: "未能生成推荐项。",
    polishHintEmpty: "请先填写“做过的事”。我们会根据内容帮您润色。",
    polishFailed: "未能润色内容。",
    titleHintEmpty: "请先填写“做过的事”。我们会根据内容为您命名。",
    titleSuggestFailed: "未能推荐经历名称。",
    submitHintEmpty: "请用一两句话写下您在这段经历中做了什么。",
    loadingText: "加载中...",
    heading: "经历",
    registeredCount: (total, ready) =>
      `已登记 ${total} 段经历 · ${ready} 段可用于简历`,
    add: "添加",
    fillWithAi: "通过与 AI 对话填写经历",
    editHeading: "编辑经历",
    newHeading: "添加新经历",
    formIntro: "随意填写即可。AI 会就简历所需内容追加提问。",
    whatExperienceLabel: "这是什么类型的经历？",
    resumeSentenceLabel: "简历语句（每行一句 — 将原样显示在简历上）",
    whatDidYouDoLabel: "在这段经历中做的事",
    suggestAgain: "重新推荐",
    suggestTasks: "推荐工作内容",
    polishIntro: "只写一句也可以。AI 会帮您润色 — 请选择一种风格",
    aiPolishedLabel: (style) => `AI 润色后的内容 · ${style}`,
    adoptPolished: "采用此内容",
    close: "关闭",
    tryOtherStyle: "您也可以在上方尝试其他风格。",
    noMoreSuggestions: "没有更多推荐项了。也可以在上方框中直接填写。",
    experienceNameLabel: "经历名称",
    optional: "（可选）",
    aiSuggest: "AI 推荐",
    experienceNamePlaceholder: "留空的话，AI 会根据“做过的事”为您命名",
    periodLabel: "时间段",
    periodWhen: "· 什么时候做的？",
    startMonthAria: "开始月份",
    endMonthAria: "结束月份（进行中请留空）",
    periodHint: "如果仍在进行中，请将结束时间留空。",
    detailsLabel: "详细信息（可选）",
    orgLabel: "组织或项目名称",
    orgPlaceholder: "例：星巴克 XX 店",
    roleLabel: "职务",
    rolePlaceholder: "例：后端开发",
    rankLabel: "职级",
    rankPlaceholder: "例：员工 · 实习生 · 组长",
    cancel: "取消",
    save: "保存",
    addAndGetQuestions: "添加并接受提问",
    emptyTitle: "要不要添加您的第一段经历？",
    emptyDescLine1: "兼职、学校项目、社团等，任何经历都可以。",
    emptyDescLine2: "简单写几句，AI 会接着提问。",
    allTab: "全部",
    noExperienceInCategory: "此类别下没有经历。",
    periodMissing: "未填写时间段 — 不会包含在简历中",
    editAria: "编辑经历",
    deleteAria: "删除经历",
    fillWithAiChat: "通过与 AI 对话填写",
    deleteConfirmTitle: "要删除这段经历吗？",
    deleteConfirmDesc: "这段经历以及您填写的回答和语句将一并删除。",
    delete: "删除",
    adoptToast: "已采用润色后的内容。"
  },
  vi: {
    rawPlaceholder: "Tôi đã làm việc tại một quán cà phê trong một năm, nhận đơn, pha chế đồ uống và đào tạo nhân viên mới.",
    inProgress: "Đang diễn ra",
    newExperienceFallback: "Kinh nghiệm mới",
    loadFailed: "Không thể tải hồ sơ của bạn.",
    taskHintEmpty: "Chỉ cần viết một dòng về kinh nghiệm hoặc việc bạn đã làm. Chúng tôi sẽ gợi ý những việc bạn có thể đã làm.",
    taskCreateFailed: "Không thể tạo gợi ý.",
    polishHintEmpty: "Trước tiên, hãy viết việc bạn đã làm. Chúng tôi sẽ trau chuốt dựa trên nội dung đó.",
    polishFailed: "Không thể trau chuốt nội dung.",
    titleHintEmpty: "Trước tiên, hãy viết việc bạn đã làm. Chúng tôi sẽ đặt tên dựa trên nội dung đó.",
    titleSuggestFailed: "Không thể gợi ý tên kinh nghiệm.",
    submitHintEmpty: "Hãy viết một hai câu về việc bạn đã làm trong kinh nghiệm này.",
    loadingText: "Đang tải...",
    heading: "Kinh nghiệm",
    registeredCount: (total, ready) =>
      `Đã đăng ký ${total} kinh nghiệm · ${ready} sẵn sàng cho hồ sơ`,
    add: "Thêm",
    fillWithAi: "Điền kinh nghiệm bằng cách trò chuyện với AI",
    editHeading: "Sửa kinh nghiệm",
    newHeading: "Thêm kinh nghiệm mới",
    formIntro: "Cứ viết thoải mái. AI sẽ hỏi thêm những gì hồ sơ của bạn cần.",
    whatExperienceLabel: "Đây là loại kinh nghiệm gì?",
    resumeSentenceLabel: "Câu cho hồ sơ (mỗi dòng một câu — hiển thị nguyên văn trên hồ sơ)",
    whatDidYouDoLabel: "Việc bạn đã làm trong kinh nghiệm này",
    suggestAgain: "Gợi ý lại",
    suggestTasks: "Gợi ý công việc",
    polishIntro: "Chỉ một câu cũng được. AI sẽ trau chuốt cho bạn — hãy chọn một phong cách",
    aiPolishedLabel: (style) => `Nội dung AI trau chuốt · ${style}`,
    adoptPolished: "Dùng phiên bản này",
    close: "Đóng",
    tryOtherStyle: "Bạn cũng có thể thử các phong cách khác ở trên.",
    noMoreSuggestions: "Không còn gợi ý nào nữa. Bạn có thể tự viết vào ô bên trên.",
    experienceNameLabel: "Tên kinh nghiệm",
    optional: "(tùy chọn)",
    aiSuggest: "AI gợi ý",
    experienceNamePlaceholder: "Để trống thì AI sẽ đặt tên dựa trên việc bạn đã làm",
    periodLabel: "Thời gian",
    periodWhen: "· Bạn làm khi nào?",
    startMonthAria: "Tháng bắt đầu",
    endMonthAria: "Tháng kết thúc (để trống nếu đang diễn ra)",
    periodHint: "Nếu đang diễn ra, hãy để trống ngày kết thúc.",
    detailsLabel: "Thông tin chi tiết (tùy chọn)",
    orgLabel: "Tên tổ chức hoặc dự án",
    orgPlaceholder: "VD: Starbucks Chi nhánh XX",
    roleLabel: "Vị trí công việc",
    rolePlaceholder: "VD: Phát triển backend",
    rankLabel: "Chức vụ",
    rankPlaceholder: "VD: Nhân viên · Thực tập sinh · Trưởng nhóm",
    cancel: "Hủy",
    save: "Lưu",
    addAndGetQuestions: "Thêm và nhận câu hỏi",
    emptyTitle: "Cùng thêm kinh nghiệm đầu tiên của bạn nhé?",
    emptyDescLine1: "Việc làm thêm, dự án ở trường, câu lạc bộ — gì cũng được.",
    emptyDescLine2: "Viết ngắn gọn và AI sẽ hỏi tiếp.",
    allTab: "Tất cả",
    noExperienceInCategory: "Không có kinh nghiệm nào trong danh mục này.",
    periodMissing: "Chưa nhập thời gian — sẽ không có trong hồ sơ",
    editAria: "Sửa kinh nghiệm",
    deleteAria: "Xóa kinh nghiệm",
    fillWithAiChat: "Điền bằng cách trò chuyện với AI",
    deleteConfirmTitle: "Xóa kinh nghiệm này?",
    deleteConfirmDesc: "Kinh nghiệm này cùng các câu trả lời và câu văn bạn đã viết sẽ bị xóa cùng nhau.",
    delete: "Xóa",
    adoptToast: "Đã dùng nội dung đã trau chuốt."
  },
  ja: {
    rawPlaceholder: "カフェで1年間働き、注文の受付、ドリンクの製造、新人スタッフの教育を担当しました。",
    inProgress: "進行中",
    newExperienceFallback: "新しい経験",
    loadFailed: "履歴書を読み込めませんでした。",
    taskHintEmpty: "経験名やしたことを一行だけ書いてください。どんなことをしたか提案します。",
    taskCreateFailed: "提案を作成できませんでした。",
    polishHintEmpty: "まず「したこと」を書いてください。内容を見て整えます。",
    polishFailed: "内容を整えられませんでした。",
    titleHintEmpty: "まず「したこと」を書いてください。内容を見て名前を付けます。",
    titleSuggestFailed: "経験名を提案できませんでした。",
    submitHintEmpty: "この経験でしたことを1〜2文で書いてください。",
    loadingText: "読み込み中...",
    heading: "経験",
    registeredCount: (total, ready) =>
      `登録済みの経験 ${total}件 · 履歴書で使用可能 ${ready}件`,
    add: "追加",
    fillWithAi: "AIと対話しながら経験を埋める",
    editHeading: "経験を編集",
    newHeading: "新しい経験を追加",
    formIntro: "気軽に書いてください。AIが履歴書に必要な内容を追加で質問します。",
    whatExperienceLabel: "どんな経験ですか？",
    resumeSentenceLabel: "履歴書の文（1行に1つ — 履歴書にそのまま表示されます）",
    whatDidYouDoLabel: "この経験でしたこと",
    suggestAgain: "もう一度提案",
    suggestTasks: "業務候補を提案",
    polishIntro: "一文だけでも大丈夫です。AIが整えます — 形式を選んでください",
    aiPolishedLabel: (style) => `AIが整えた内容 · ${style}`,
    adoptPolished: "この内容を採用",
    close: "閉じる",
    tryOtherStyle: "上で別の形式も試せます。",
    noMoreSuggestions: "提案できる項目がもうありません。上の欄に直接書いても大丈夫です。",
    experienceNameLabel: "経験名",
    optional: "（任意）",
    aiSuggest: "AI提案",
    experienceNamePlaceholder: "空欄にすると「したこと」を見てAIが名前を付けます",
    periodLabel: "期間",
    periodWhen: "· いつ行いましたか？",
    startMonthAria: "開始月",
    endMonthAria: "終了月（進行中なら空欄にしてください）",
    periodHint: "進行中の場合、終了は空欄にしてください。",
    detailsLabel: "詳細情報（任意）",
    orgLabel: "組織またはプロジェクト名",
    orgPlaceholder: "例：スターバックス OO店",
    roleLabel: "職務",
    rolePlaceholder: "例：バックエンド開発",
    rankLabel: "役職",
    rankPlaceholder: "例：社員 · インターン · チームリーダー",
    cancel: "キャンセル",
    save: "保存",
    addAndGetQuestions: "追加して質問を受ける",
    emptyTitle: "最初の経験を追加してみましょうか？",
    emptyDescLine1: "アルバイト、学校のプロジェクト、サークルなど何でも構いません。",
    emptyDescLine2: "短く書けばAIが続けて質問します。",
    allTab: "すべて",
    noExperienceInCategory: "このカテゴリーに経験はありません。",
    periodMissing: "期間未入力 — 履歴書には含まれません",
    editAria: "経験を編集",
    deleteAria: "経験を削除",
    fillWithAiChat: "AIと対話で埋める",
    deleteConfirmTitle: "経験を削除しますか？",
    deleteConfirmDesc: "この経験と、書いた回答・文も一緒に削除されます。",
    delete: "削除",
    adoptToast: "整えた内容を採用しました。"
  },
  id: {
    rawPlaceholder: "Saya bekerja di kafe selama satu tahun, menerima pesanan, membuat minuman, dan melatih staf baru.",
    inProgress: "Sedang berjalan",
    newExperienceFallback: "Pengalaman baru",
    loadFailed: "Kami tidak dapat memuat resume Anda.",
    taskHintEmpty: "Cukup tulis satu baris tentang pengalaman atau hal yang Anda lakukan. Kami akan menyarankan apa yang mungkin Anda kerjakan.",
    taskCreateFailed: "Kami tidak dapat membuat saran.",
    polishHintEmpty: "Tulis dulu hal yang Anda lakukan. Kami akan menyempurnakannya berdasarkan itu.",
    polishFailed: "Kami tidak dapat menyempurnakan konten.",
    titleHintEmpty: "Tulis dulu hal yang Anda lakukan. Kami akan membuat nama berdasarkan itu.",
    titleSuggestFailed: "Kami tidak dapat menyarankan nama pengalaman.",
    submitHintEmpty: "Tulis satu atau dua kalimat tentang hal yang Anda lakukan dalam pengalaman ini.",
    loadingText: "Memuat...",
    heading: "Pengalaman",
    registeredCount: (total, ready) =>
      `${total} pengalaman terdaftar · ${ready} siap untuk resume`,
    add: "Tambah",
    fillWithAi: "Isi pengalaman dengan mengobrol bersama AI",
    editHeading: "Edit pengalaman",
    newHeading: "Tambah pengalaman baru",
    formIntro: "Tulis dengan bebas. AI akan menanyakan hal lanjutan yang dibutuhkan resume Anda.",
    whatExperienceLabel: "Pengalaman jenis apa ini?",
    resumeSentenceLabel: "Kalimat resume (satu per baris — ditampilkan apa adanya di resume)",
    whatDidYouDoLabel: "Hal yang Anda lakukan dalam pengalaman ini",
    suggestAgain: "Sarankan lagi",
    suggestTasks: "Sarankan tugas",
    polishIntro: "Satu kalimat pun tidak apa-apa. AI akan menyempurnakannya — pilih sebuah gaya",
    aiPolishedLabel: (style) => `Konten yang disempurnakan AI · ${style}`,
    adoptPolished: "Gunakan versi ini",
    close: "Tutup",
    tryOtherStyle: "Anda juga bisa mencoba gaya lain di atas.",
    noMoreSuggestions: "Tidak ada saran lagi. Silakan tulis sendiri di kotak di atas.",
    experienceNameLabel: "Nama pengalaman",
    optional: "(opsional)",
    aiSuggest: "Saran AI",
    experienceNamePlaceholder: "Biarkan kosong dan AI akan menamainya berdasarkan hal yang Anda lakukan",
    periodLabel: "Periode",
    periodWhen: "· Kapan Anda melakukannya?",
    startMonthAria: "Bulan mulai",
    endMonthAria: "Bulan selesai (kosongkan jika masih berjalan)",
    periodHint: "Jika masih berjalan, kosongkan tanggal selesai.",
    detailsLabel: "Detail (opsional)",
    orgLabel: "Nama organisasi atau proyek",
    orgPlaceholder: "mis. Starbucks Cabang XX",
    roleLabel: "Peran",
    rolePlaceholder: "mis. Pengembangan backend",
    rankLabel: "Jabatan",
    rankPlaceholder: "mis. Staf · Magang · Ketua tim",
    cancel: "Batal",
    save: "Simpan",
    addAndGetQuestions: "Tambah dan dapatkan pertanyaan",
    emptyTitle: "Mari tambahkan pengalaman pertama Anda?",
    emptyDescLine1: "Kerja paruh waktu, proyek sekolah, klub — apa pun boleh.",
    emptyDescLine2: "Tulis sedikit dan AI akan menanyakan lebih lanjut.",
    allTab: "Semua",
    noExperienceInCategory: "Tidak ada pengalaman di kategori ini.",
    periodMissing: "Periode belum diisi — tidak akan dimasukkan ke resume",
    editAria: "Edit pengalaman",
    deleteAria: "Hapus pengalaman",
    fillWithAiChat: "Isi dengan mengobrol bersama AI",
    deleteConfirmTitle: "Hapus pengalaman ini?",
    deleteConfirmDesc: "Pengalaman ini beserta jawaban dan kalimat yang Anda tulis akan dihapus bersamaan.",
    delete: "Hapus",
    adoptToast: "Konten yang disempurnakan telah digunakan."
  }
};

export function useExperiencesCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
