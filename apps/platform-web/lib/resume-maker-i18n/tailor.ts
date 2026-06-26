// resume-maker i18n — 공고 맞춤 최적화(ResumeTailorPage) 네임스페이스.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  title: string;
  desc: string;
  pickTitle: string;
  pickDesc: string;
  jdLabel: string;
  jdPlaceholder: string;
  modeText: string;
  modePosition: string;
  positionSearchPlaceholder: string;
  positionEmpty: string;
  positionFailed: string;
  searchBtn: string;
  popularSearch: string;
  prevPage: string;
  nextPage: string;
  pageLabel: string; // "{n}" 자리에 현재 페이지 번호
  analyze: string;
  analyzing: string;
  fetchingUrl: string;
  reanalyze: string;
  needInput: string;
  failed: string;
  urlFailed: string;
  loadFailed: string;
  emptyHint: string;
  analyzedJob: string;
  changeJob: string;
  scoreLabel: string;
  verdictGreat: string;
  verdictGood: string;
  verdictFair: string;
  verdictLow: string;
  matchedTitle: string;
  missingTitle: string;
  summaryTitle: string;
  adoptSummary: string;
  adoptedToast: string;
  addToIntro: string;
  introAddedToast: string;
  suggestionsTitle: string;
  copy: string;
  copiedToast: string;
  applyTitle: string;
  summaryField: string;
  introField: string;
  save: string;
  cancel: string;
  appliedToast: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    title: "공고 맞춤 최적화",
    desc: "지원할 채용 공고를 붙여넣으면, 이력서 적합도와 보완점을 분석해 드려요.",
    pickTitle: "공고에 맞출\n이력서를 선택하세요",
    pickDesc: "고른 이력서를 지원할 공고에 맞춰 다듬어 드려요.",
    jdLabel: "채용 공고 (내용 또는 URL)",
    jdPlaceholder: "공고 URL을 붙여넣거나, 직무 내용·자격요건을 붙여넣으세요.",
    modeText: "직접 입력",
    modePosition: "Aply 포지션",
    positionSearchPlaceholder: "회사·직무로 포지션 검색",
    positionEmpty: "포지션을 찾지 못했어요.",
    positionFailed: "포지션을 불러오지 못했어요.",
    searchBtn: "검색",
    popularSearch: "인기 검색",
    prevPage: "이전",
    nextPage: "다음",
    pageLabel: "{n} 페이지",
    analyze: "분석하기",
    analyzing: "분석 중...",
    fetchingUrl: "공고 불러오는 중...",
    reanalyze: "다시 분석",
    needInput: "먼저 공고 내용을 붙여넣어 주세요.",
    failed: "분석에 실패했어요. 잠시 후 다시 시도해 주세요.",
    urlFailed: "공고를 불러오지 못했어요. 내용을 직접 붙여넣어 주세요.",
    loadFailed: "이력서를 불러오지 못했어요.",
    emptyHint: "공고를 붙여넣고 ‘분석하기’를 누르면 적합도와 맞춤 제안이 나와요.",
    analyzedJob: "분석한 공고",
    changeJob: "공고 변경",
    scoreLabel: "공고 적합도",
    verdictGreat: "공고와 잘 맞아요",
    verdictGood: "조금만 보완하면 좋아요",
    verdictFair: "보완이 필요해요",
    verdictLow: "아직 거리가 있어요",
    matchedTitle: "이미 잘 갖춘 부분",
    missingTitle: "보완하면 좋은 부분",
    summaryTitle: "이 공고에 맞춘 요약 제안",
    adoptSummary: "요약으로 채택",
    adoptedToast: "요약에 넣었어요.",
    addToIntro: "자기소개에 추가",
    introAddedToast: "자기소개에 추가했어요.",
    suggestionsTitle: "맞춤 제안",
    copy: "복사",
    copiedToast: "복사했어요.",
    applyTitle: "이력서에 반영",
    summaryField: "한 줄 요약",
    introField: "자기소개",
    save: "저장",
    cancel: "취소",
    appliedToast: "이력서에 반영했어요."
  },
  en: {
    title: "Tailor to a job posting",
    desc: "Paste the job posting you're applying to and get a fit score and what to improve.",
    pickTitle: "Pick a resume\nto tailor to a job",
    pickDesc: "We'll tailor the resume you choose to the job you're applying to.",
    jdLabel: "Job posting (text or URL)",
    jdPlaceholder: "Paste the posting URL, or paste the role and requirements.",
    modeText: "Enter manually",
    modePosition: "Aply positions",
    positionSearchPlaceholder: "Search positions by company or role",
    positionEmpty: "No positions found.",
    positionFailed: "Couldn't load positions.",
    searchBtn: "Search",
    popularSearch: "Popular searches",
    prevPage: "Prev",
    nextPage: "Next",
    pageLabel: "Page {n}",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    fetchingUrl: "Fetching the posting...",
    reanalyze: "Re-analyze",
    needInput: "Please paste the job posting first.",
    failed: "Analysis failed. Please try again shortly.",
    urlFailed: "Couldn't load the posting. Please paste the text instead.",
    loadFailed: "Couldn't load the resume.",
    emptyHint: "Paste a posting and tap ‘Analyze’ to see your fit score and tailored tips.",
    analyzedJob: "Analyzed posting",
    changeJob: "Change posting",
    scoreLabel: "Job fit",
    verdictGreat: "Strong match",
    verdictGood: "Close — a little polish",
    verdictFair: "Needs some work",
    verdictLow: "Quite a gap",
    matchedTitle: "What you already cover",
    missingTitle: "What to strengthen",
    summaryTitle: "Summary tailored to this posting",
    adoptSummary: "Use as summary",
    adoptedToast: "Added to the summary.",
    addToIntro: "Add to intro",
    introAddedToast: "Added to your introduction.",
    suggestionsTitle: "Tailored suggestions",
    copy: "Copy",
    copiedToast: "Copied.",
    applyTitle: "Apply to resume",
    summaryField: "One-line summary",
    introField: "Introduction",
    save: "Save",
    cancel: "Cancel",
    appliedToast: "Applied to your resume."
  },
  "zh-CN": {
    title: "按招聘启事优化",
    desc: "粘贴你要应聘的招聘启事，分析简历匹配度和待补强之处。",
    pickTitle: "选择要按岗位\n优化的简历",
    pickDesc: "我们会按你应聘的岗位优化所选简历。",
    jdLabel: "招聘启事（内容或网址）",
    jdPlaceholder: "粘贴启事网址，或粘贴职务内容和任职要求。",
    modeText: "手动输入",
    modePosition: "Aply 职位",
    positionSearchPlaceholder: "按公司或职务搜索职位",
    positionEmpty: "未找到职位。",
    positionFailed: "无法加载职位。",
    searchBtn: "搜索",
    popularSearch: "热门搜索",
    prevPage: "上一页",
    nextPage: "下一页",
    pageLabel: "第 {n} 页",
    analyze: "分析",
    analyzing: "分析中...",
    fetchingUrl: "正在获取启事...",
    reanalyze: "重新分析",
    needInput: "请先粘贴招聘启事内容。",
    failed: "分析失败，请稍后重试。",
    urlFailed: "无法获取启事，请直接粘贴内容。",
    loadFailed: "无法加载简历。",
    emptyHint: "粘贴启事并点击‘分析’，即可看到匹配度和定制建议。",
    analyzedJob: "已分析的招聘",
    changeJob: "更换招聘",
    scoreLabel: "岗位匹配度",
    verdictGreat: "非常匹配",
    verdictGood: "稍加完善即可",
    verdictFair: "需要补强",
    verdictLow: "差距较大",
    matchedTitle: "你已具备的部分",
    missingTitle: "建议补强的部分",
    summaryTitle: "针对此岗位的摘要建议",
    adoptSummary: "用作摘要",
    adoptedToast: "已放入摘要。",
    addToIntro: "加入自我介绍",
    introAddedToast: "已加入自我介绍。",
    suggestionsTitle: "定制建议",
    copy: "复制",
    copiedToast: "已复制。",
    applyTitle: "应用到简历",
    summaryField: "一句话摘要",
    introField: "自我介绍",
    save: "保存",
    cancel: "取消",
    appliedToast: "已应用到简历。"
  },
  vi: {
    title: "Tối ưu theo tin tuyển dụng",
    desc: "Dán tin tuyển dụng bạn muốn ứng tuyển để xem mức độ phù hợp và điểm cần cải thiện.",
    pickTitle: "Chọn hồ sơ\nđể khớp với tin tuyển dụng",
    pickDesc: "Chúng tôi sẽ tối ưu hồ sơ bạn chọn theo tin tuyển dụng.",
    jdLabel: "Tin tuyển dụng (nội dung hoặc URL)",
    jdPlaceholder: "Dán URL tin tuyển dụng, hoặc dán mô tả và yêu cầu công việc.",
    modeText: "Nhập trực tiếp",
    modePosition: "Vị trí Aply",
    positionSearchPlaceholder: "Tìm vị trí theo công ty hoặc vai trò",
    positionEmpty: "Không tìm thấy vị trí.",
    positionFailed: "Không tải được vị trí.",
    searchBtn: "Tìm kiếm",
    popularSearch: "Tìm kiếm phổ biến",
    prevPage: "Trước",
    nextPage: "Sau",
    pageLabel: "Trang {n}",
    analyze: "Phân tích",
    analyzing: "Đang phân tích...",
    fetchingUrl: "Đang tải tin tuyển dụng...",
    reanalyze: "Phân tích lại",
    needInput: "Vui lòng dán nội dung tin tuyển dụng trước.",
    failed: "Phân tích thất bại. Vui lòng thử lại sau.",
    urlFailed: "Không tải được tin tuyển dụng. Vui lòng dán nội dung.",
    loadFailed: "Không tải được hồ sơ.",
    emptyHint: "Dán tin tuyển dụng và nhấn ‘Phân tích’ để xem độ phù hợp và gợi ý.",
    analyzedJob: "Tin đã phân tích",
    changeJob: "Đổi tin tuyển dụng",
    scoreLabel: "Độ phù hợp",
    verdictGreat: "Rất phù hợp",
    verdictGood: "Gần đạt, chỉnh chút nữa",
    verdictFair: "Cần cải thiện",
    verdictLow: "Còn khá chênh lệch",
    matchedTitle: "Phần bạn đã đáp ứng",
    missingTitle: "Phần nên cải thiện",
    summaryTitle: "Tóm tắt theo tin tuyển dụng này",
    adoptSummary: "Dùng làm tóm tắt",
    adoptedToast: "Đã đưa vào tóm tắt.",
    addToIntro: "Thêm vào giới thiệu",
    introAddedToast: "Đã thêm vào phần giới thiệu.",
    suggestionsTitle: "Gợi ý phù hợp",
    copy: "Sao chép",
    copiedToast: "Đã sao chép.",
    applyTitle: "Áp dụng vào hồ sơ",
    summaryField: "Tóm tắt một dòng",
    introField: "Giới thiệu",
    save: "Lưu",
    cancel: "Hủy",
    appliedToast: "Đã áp dụng vào hồ sơ."
  },
  ja: {
    title: "求人に合わせて最適化",
    desc: "応募する求人を貼り付けると、履歴書の適合度と改善点を分析します。",
    pickTitle: "求人に合わせる\n履歴書を選んでください",
    pickDesc: "選んだ履歴書を応募する求人に合わせて整えます。",
    jdLabel: "求人（内容またはURL）",
    jdPlaceholder: "求人URLを貼り付けるか、職務内容・応募資格を貼り付けてください。",
    modeText: "直接入力",
    modePosition: "Aply求人",
    positionSearchPlaceholder: "会社・職種で求人を検索",
    positionEmpty: "求人が見つかりません。",
    positionFailed: "求人を読み込めませんでした。",
    searchBtn: "検索",
    popularSearch: "人気の検索",
    prevPage: "前へ",
    nextPage: "次へ",
    pageLabel: "{n} ページ",
    analyze: "分析する",
    analyzing: "分析中...",
    fetchingUrl: "求人を取得中...",
    reanalyze: "再分析",
    needInput: "先に求人内容を貼り付けてください。",
    failed: "分析に失敗しました。しばらくして再度お試しください。",
    urlFailed: "求人を取得できませんでした。内容を貼り付けてください。",
    loadFailed: "履歴書を読み込めませんでした。",
    emptyHint: "求人を貼り付けて「分析する」を押すと、適合度とおすすめが表示されます。",
    analyzedJob: "分析した求人",
    changeJob: "求人を変更",
    scoreLabel: "求人適合度",
    verdictGreat: "とてもマッチ",
    verdictGood: "あと少しで好印象",
    verdictFair: "補強が必要",
    verdictLow: "まだギャップあり",
    matchedTitle: "すでに満たしている点",
    missingTitle: "補強したい点",
    summaryTitle: "この求人に合わせた要約案",
    adoptSummary: "要約として採用",
    adoptedToast: "要約に入れました。",
    addToIntro: "自己紹介に追加",
    introAddedToast: "自己紹介に追加しました。",
    suggestionsTitle: "おすすめの提案",
    copy: "コピー",
    copiedToast: "コピーしました。",
    applyTitle: "履歴書に反映",
    summaryField: "一行要約",
    introField: "自己紹介",
    save: "保存",
    cancel: "キャンセル",
    appliedToast: "履歴書に反映しました。"
  },
  id: {
    title: "Sesuaikan dengan lowongan",
    desc: "Tempel lowongan yang Anda lamar untuk melihat skor kecocokan dan yang perlu diperkuat.",
    pickTitle: "Pilih resume\nuntuk dicocokkan dengan lowongan",
    pickDesc: "Kami akan menyesuaikan resume pilihan Anda dengan lowongan yang dilamar.",
    jdLabel: "Lowongan (teks atau URL)",
    jdPlaceholder: "Tempel URL lowongan, atau tempel deskripsi dan persyaratan.",
    modeText: "Input manual",
    modePosition: "Posisi Aply",
    positionSearchPlaceholder: "Cari posisi berdasarkan perusahaan atau peran",
    positionEmpty: "Tidak ada posisi ditemukan.",
    positionFailed: "Tidak dapat memuat posisi.",
    searchBtn: "Cari",
    popularSearch: "Pencarian populer",
    prevPage: "Sebelumnya",
    nextPage: "Berikutnya",
    pageLabel: "Halaman {n}",
    analyze: "Analisis",
    analyzing: "Menganalisis...",
    fetchingUrl: "Mengambil lowongan...",
    reanalyze: "Analisis ulang",
    needInput: "Tempel isi lowongan terlebih dahulu.",
    failed: "Analisis gagal. Silakan coba lagi sebentar.",
    urlFailed: "Tidak dapat memuat lowongan. Tempel teksnya saja.",
    loadFailed: "Tidak dapat memuat resume.",
    emptyHint: "Tempel lowongan dan ketuk ‘Analisis’ untuk melihat kecocokan dan saran.",
    analyzedJob: "Lowongan dianalisis",
    changeJob: "Ganti lowongan",
    scoreLabel: "Kecocokan",
    verdictGreat: "Sangat cocok",
    verdictGood: "Hampir, sedikit lagi",
    verdictFair: "Perlu diperkuat",
    verdictLow: "Masih cukup jauh",
    matchedTitle: "Yang sudah Anda penuhi",
    missingTitle: "Yang perlu diperkuat",
    summaryTitle: "Ringkasan sesuai lowongan ini",
    adoptSummary: "Pakai sebagai ringkasan",
    adoptedToast: "Dimasukkan ke ringkasan.",
    addToIntro: "Tambah ke perkenalan",
    introAddedToast: "Ditambahkan ke perkenalan.",
    suggestionsTitle: "Saran yang disesuaikan",
    copy: "Salin",
    copiedToast: "Tersalin.",
    applyTitle: "Terapkan ke resume",
    summaryField: "Ringkasan satu baris",
    introField: "Perkenalan",
    save: "Simpan",
    cancel: "Batal",
    appliedToast: "Diterapkan ke resume."
  }
};

export function useTailorCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
