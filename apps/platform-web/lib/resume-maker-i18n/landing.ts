import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  heroBullets: string[];
  fileReadError: string;
  fileTooLarge: string;
  importNeedInput: string;
  importedResumeTitle: (name: string) => string;
  importedResumeFallback: string;
  importFailed: string;
  deleteFailed: string;
  newResumeFallbackTitle: string;
  startFailed: string;
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  newResumeCta: string;
  newResumeSub: string;
  importSub: string;
  importCta: string;
  newNameTitle: string;
  newNameDesc: string;
  newNamePlaceholder: string;
  startSimple: string;
  buildDetailed: string;
  startSimpleHint: string;
  importTitle: string;
  importDesc: string;
  removeFile: string;
  uploadPdf: string;
  uploadPdfHint: string;
  orPaste: string;
  pastePlaceholder: string;
  importReading: string;
  importAi: string;
  importDisclaimer: string;
  loading: string;
  draftsTitle: string;
  untitledResume: string;
  lastEdited: string;
  continueWriting: string;
  selectCta: string;
  deleteResume: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  cancel: string;
  delete: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    heroBullets: [
      "경험이 없어도 질문으로 찾아드려요",
      "10분 안에 첫 이력서 초안을 만들 수 있어요",
      "완성한 이력서는 PDF로 다운로드할 수 있어요"
    ],
    fileReadError: "파일을 읽지 못했어요.",
    fileTooLarge: "파일이 너무 커요. 12MB 이하 PDF를 올려주세요.",
    importNeedInput: "PDF 파일을 올리거나 이력서 내용을 붙여넣어 주세요.",
    importedResumeTitle: (name) => `${name} 이력서`,
    importedResumeFallback: "가져온 이력서",
    importFailed: "이력서를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
    deleteFailed: "삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
    newResumeFallbackTitle: "내 이력서",
    startFailed: "이력서를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
    heroBadge: "AI 이력서 만들기",
    heroTitleLine1: "이력서를 쓰지 말고,",
    heroTitleLine2: "질문에 답하세요.",
    heroSubtitle: "AI가 내 경험을 찾아 지원 가능한 이력서로 만들어드립니다.",
    newResumeCta: "새 이력서 만들기",
    newResumeSub: "처음부터 시작",
    importSub: "PDF·내용 붙여넣기",
    importCta: "이미 만든 이력서가 있나요? 파일로 가져오기",
    newNameTitle: "이력서 이름을 정해주세요",
    newNameDesc: "나중에 ‘작성 중인 이력서’ 목록에서 구분하기 쉬워요.",
    newNamePlaceholder: "예: 마케팅 신입 이력서",
    startSimple: "간단하게 시작",
    buildDetailed: "자세히 만들기",
    startSimpleHint: "‘간단하게 시작’ — 폼에 바로 입력하며 옆에서 미리보기로 확인해요.",
    importTitle: "기존 이력서 가져오기",
    importDesc: "PDF를 올리거나 내용을 붙여넣으면 AI가 읽어서 자동으로 채워드려요. 가져온 뒤 편집 화면에서 다듬을 수 있어요.",
    removeFile: "파일 제거",
    uploadPdf: "PDF 파일 올리기",
    uploadPdfHint: "텍스트가 들어 있는 PDF만 가능해요 (스캔본 제외)",
    orPaste: "또는 내용 붙여넣기",
    pastePlaceholder: "이력서 내용을 붙여넣어 주세요. (이름·연락처·경력·학력·자기소개 등)",
    importReading: "내용을 읽는 중...",
    importAi: "AI로 가져오기",
    importDisclaimer: "정확하지 않을 수 있어요 — 가져온 뒤 꼭 확인하고 다듬어 주세요.",
    loading: "불러오는 중...",
    draftsTitle: "작성 중인 이력서",
    untitledResume: "제목 없는 이력서",
    lastEdited: "마지막 수정",
    continueWriting: "이어서 작성",
    selectCta: "선택",
    deleteResume: "이력서 삭제",
    deleteConfirmTitle: "이력서를 삭제할까요?",
    deleteConfirmDesc: "삭제하면 작성 중인 내용을 되돌릴 수 없어요.",
    cancel: "취소",
    delete: "삭제"
  },
  en: {
    heroBullets: [
      "No experience? We'll find it through questions",
      "Create your first resume draft in under 10 minutes",
      "Download your finished resume as a PDF"
    ],
    fileReadError: "Couldn't read the file.",
    fileTooLarge: "The file is too large. Please upload a PDF of 12MB or less.",
    importNeedInput: "Please upload a PDF file or paste your resume content.",
    importedResumeTitle: (name) => `${name}'s Resume`,
    importedResumeFallback: "Imported Resume",
    importFailed: "Couldn't import the resume. Please try again in a moment.",
    deleteFailed: "Couldn't delete it. Please try again in a moment.",
    newResumeFallbackTitle: "My Resume",
    startFailed: "Couldn't start the resume. Please try again in a moment.",
    heroBadge: "AI Resume Builder",
    heroTitleLine1: "Don't write a resume—",
    heroTitleLine2: "just answer questions.",
    heroSubtitle: "AI finds your experience and turns it into a resume ready to apply with.",
    newResumeCta: "Create a New Resume",
    newResumeSub: "Start from scratch",
    importSub: "PDF or paste text",
    importCta: "Already have a resume? Import it from a file",
    newNameTitle: "Give your resume a name",
    newNameDesc: "It'll be easier to tell apart later in your “In-progress resumes” list.",
    newNamePlaceholder: "e.g. Marketing Entry-Level Resume",
    startSimple: "Start Simple",
    buildDetailed: "Build in Detail",
    startSimpleHint: "“Start Simple” — fill in the form directly and check it in the live preview beside you.",
    importTitle: "Import an Existing Resume",
    importDesc: "Upload a PDF or paste your content, and AI will read it and fill things in automatically. You can refine it on the edit screen afterward.",
    removeFile: "Remove file",
    uploadPdf: "Upload a PDF file",
    uploadPdfHint: "Only PDFs that contain text work (no scanned copies)",
    orPaste: "or paste content",
    pastePlaceholder: "Please paste your resume content. (name, contact, experience, education, summary, etc.)",
    importReading: "Reading the content...",
    importAi: "Import with AI",
    importDisclaimer: "It may not be accurate — be sure to review and refine after importing.",
    loading: "Loading...",
    draftsTitle: "In-progress resumes",
    untitledResume: "Untitled resume",
    lastEdited: "Last edited",
    continueWriting: "Continue",
    selectCta: "Select",
    deleteResume: "Delete resume",
    deleteConfirmTitle: "Delete this resume?",
    deleteConfirmDesc: "Once deleted, your in-progress content can't be recovered.",
    cancel: "Cancel",
    delete: "Delete"
  },
  "zh-CN": {
    heroBullets: [
      "没有经验也没关系，我们会通过提问帮你找出来",
      "10 分钟内即可生成第一份简历初稿",
      "完成的简历可下载为 PDF"
    ],
    fileReadError: "无法读取文件。",
    fileTooLarge: "文件太大。请上传 12MB 以内的 PDF。",
    importNeedInput: "请上传 PDF 文件或粘贴简历内容。",
    importedResumeTitle: (name) => `${name}的简历`,
    importedResumeFallback: "导入的简历",
    importFailed: "无法导入简历。请稍后再试。",
    deleteFailed: "删除失败。请稍后再试。",
    newResumeFallbackTitle: "我的简历",
    startFailed: "无法开始创建简历。请稍后再试。",
    heroBadge: "AI 简历生成",
    heroTitleLine1: "不用写简历，",
    heroTitleLine2: "回答问题就好。",
    heroSubtitle: "AI 会发掘你的经历，生成可直接投递的简历。",
    newResumeCta: "创建新简历",
    newResumeSub: "从头开始",
    importSub: "PDF 或粘贴内容",
    importCta: "已经有简历了？从文件导入",
    newNameTitle: "给简历起个名字",
    newNameDesc: "稍后在“正在编写的简历”列表中更容易区分。",
    newNamePlaceholder: "例如：市场营销应届简历",
    startSimple: "快速开始",
    buildDetailed: "详细创建",
    startSimpleHint: "“快速开始” —— 直接在表单中填写，旁边实时预览即时查看。",
    importTitle: "导入已有简历",
    importDesc: "上传 PDF 或粘贴内容，AI 会读取并自动填充。导入后可在编辑界面进行调整。",
    removeFile: "移除文件",
    uploadPdf: "上传 PDF 文件",
    uploadPdfHint: "仅支持含文本的 PDF（不支持扫描件）",
    orPaste: "或粘贴内容",
    pastePlaceholder: "请粘贴简历内容。（姓名、联系方式、工作经历、教育背景、自我介绍等）",
    importReading: "正在读取内容...",
    importAi: "用 AI 导入",
    importDisclaimer: "可能不够准确 —— 导入后请务必检查并完善。",
    loading: "加载中...",
    draftsTitle: "正在编写的简历",
    untitledResume: "无标题简历",
    lastEdited: "最后修改",
    continueWriting: "继续编写",
    selectCta: "选择",
    deleteResume: "删除简历",
    deleteConfirmTitle: "要删除这份简历吗？",
    deleteConfirmDesc: "删除后，正在编写的内容将无法恢复。",
    cancel: "取消",
    delete: "删除"
  },
  vi: {
    heroBullets: [
      "Chưa có kinh nghiệm? Chúng tôi sẽ giúp bạn tìm ra qua các câu hỏi",
      "Tạo bản nháp hồ sơ đầu tiên trong vòng 10 phút",
      "Tải hồ sơ đã hoàn thành dưới dạng PDF"
    ],
    fileReadError: "Không đọc được tệp.",
    fileTooLarge: "Tệp quá lớn. Vui lòng tải lên PDF từ 12MB trở xuống.",
    importNeedInput: "Vui lòng tải lên tệp PDF hoặc dán nội dung hồ sơ.",
    importedResumeTitle: (name) => `Hồ sơ của ${name}`,
    importedResumeFallback: "Hồ sơ đã nhập",
    importFailed: "Không nhập được hồ sơ. Vui lòng thử lại sau giây lát.",
    deleteFailed: "Không xóa được. Vui lòng thử lại sau giây lát.",
    newResumeFallbackTitle: "Hồ sơ của tôi",
    startFailed: "Không bắt đầu được hồ sơ. Vui lòng thử lại sau giây lát.",
    heroBadge: "Tạo hồ sơ bằng AI",
    heroTitleLine1: "Đừng viết hồ sơ,",
    heroTitleLine2: "hãy trả lời câu hỏi.",
    heroSubtitle: "AI tìm ra kinh nghiệm của bạn và biến nó thành hồ sơ sẵn sàng để ứng tuyển.",
    newResumeCta: "Tạo hồ sơ mới",
    newResumeSub: "Bắt đầu từ đầu",
    importSub: "PDF hoặc dán nội dung",
    importCta: "Đã có hồ sơ rồi? Nhập từ tệp",
    newNameTitle: "Đặt tên cho hồ sơ của bạn",
    newNameDesc: "Sau này sẽ dễ phân biệt trong danh sách “Hồ sơ đang soạn”.",
    newNamePlaceholder: "VD: Hồ sơ Marketing mới ra trường",
    startSimple: "Bắt đầu đơn giản",
    buildDetailed: "Tạo chi tiết",
    startSimpleHint: "“Bắt đầu đơn giản” — nhập thẳng vào biểu mẫu và xem trước trực tiếp ngay bên cạnh.",
    importTitle: "Nhập hồ sơ có sẵn",
    importDesc: "Tải lên PDF hoặc dán nội dung, AI sẽ đọc và tự động điền giúp bạn. Sau khi nhập, bạn có thể chỉnh sửa ở màn hình biên tập.",
    removeFile: "Gỡ tệp",
    uploadPdf: "Tải lên tệp PDF",
    uploadPdfHint: "Chỉ hỗ trợ PDF có chứa văn bản (không nhận bản scan)",
    orPaste: "hoặc dán nội dung",
    pastePlaceholder: "Vui lòng dán nội dung hồ sơ. (tên, liên hệ, kinh nghiệm, học vấn, giới thiệu bản thân, v.v.)",
    importReading: "Đang đọc nội dung...",
    importAi: "Nhập bằng AI",
    importDisclaimer: "Có thể không chính xác — hãy kiểm tra và chỉnh sửa sau khi nhập.",
    loading: "Đang tải...",
    draftsTitle: "Hồ sơ đang soạn",
    untitledResume: "Hồ sơ chưa đặt tên",
    lastEdited: "Sửa lần cuối",
    continueWriting: "Tiếp tục",
    selectCta: "Chọn",
    deleteResume: "Xóa hồ sơ",
    deleteConfirmTitle: "Xóa hồ sơ này?",
    deleteConfirmDesc: "Sau khi xóa, nội dung đang soạn sẽ không thể khôi phục.",
    cancel: "Hủy",
    delete: "Xóa"
  },
  ja: {
    heroBullets: [
      "経験がなくても、質問で見つけ出します",
      "10分で最初の履歴書の下書きを作成できます",
      "完成した履歴書はPDFでダウンロードできます"
    ],
    fileReadError: "ファイルを読み込めませんでした。",
    fileTooLarge: "ファイルが大きすぎます。12MB以下のPDFをアップロードしてください。",
    importNeedInput: "PDFファイルをアップロードするか、履歴書の内容を貼り付けてください。",
    importedResumeTitle: (name) => `${name}さんの履歴書`,
    importedResumeFallback: "取り込んだ履歴書",
    importFailed: "履歴書を取り込めませんでした。しばらくしてから再度お試しください。",
    deleteFailed: "削除できませんでした。しばらくしてから再度お試しください。",
    newResumeFallbackTitle: "私の履歴書",
    startFailed: "履歴書を開始できませんでした。しばらくしてから再度お試しください。",
    heroBadge: "AI履歴書作成",
    heroTitleLine1: "履歴書を書くのではなく、",
    heroTitleLine2: "質問に答えましょう。",
    heroSubtitle: "AIがあなたの経験を見つけ出し、応募できる履歴書に仕上げます。",
    newResumeCta: "新しい履歴書を作成",
    newResumeSub: "ゼロから始める",
    importSub: "PDF・内容を貼り付け",
    importCta: "すでに履歴書をお持ちですか？ ファイルから取り込む",
    newNameTitle: "履歴書の名前を決めましょう",
    newNameDesc: "あとで「作成中の履歴書」一覧で見分けやすくなります。",
    newNamePlaceholder: "例: マーケティング新卒向け履歴書",
    startSimple: "かんたんに始める",
    buildDetailed: "詳しく作成する",
    startSimpleHint: "「かんたんに始める」— フォームに直接入力しながら、隣のプレビューで確認できます。",
    importTitle: "既存の履歴書を取り込む",
    importDesc: "PDFをアップロードするか内容を貼り付けると、AIが読み取って自動で入力します。取り込んだ後、編集画面で整えられます。",
    removeFile: "ファイルを削除",
    uploadPdf: "PDFファイルをアップロード",
    uploadPdfHint: "テキストが含まれるPDFのみ対応（スキャン版は不可）",
    orPaste: "または内容を貼り付け",
    pastePlaceholder: "履歴書の内容を貼り付けてください。（氏名・連絡先・職歴・学歴・自己紹介など）",
    importReading: "内容を読み取り中...",
    importAi: "AIで取り込む",
    importDisclaimer: "正確でない場合があります — 取り込んだ後、必ず確認して整えてください。",
    loading: "読み込み中...",
    draftsTitle: "作成中の履歴書",
    untitledResume: "無題の履歴書",
    lastEdited: "最終更新",
    continueWriting: "続きを書く",
    selectCta: "選択",
    deleteResume: "履歴書を削除",
    deleteConfirmTitle: "履歴書を削除しますか？",
    deleteConfirmDesc: "削除すると、作成中の内容は元に戻せません。",
    cancel: "キャンセル",
    delete: "削除"
  },
  id: {
    heroBullets: [
      "Belum punya pengalaman? Kami bantu temukan lewat pertanyaan",
      "Buat draf resume pertama Anda dalam waktu kurang dari 10 menit",
      "Unduh resume yang sudah jadi sebagai PDF"
    ],
    fileReadError: "Tidak dapat membaca file.",
    fileTooLarge: "File terlalu besar. Silakan unggah PDF maksimal 12MB.",
    importNeedInput: "Silakan unggah file PDF atau tempel isi resume Anda.",
    importedResumeTitle: (name) => `Resume ${name}`,
    importedResumeFallback: "Resume yang diimpor",
    importFailed: "Tidak dapat mengimpor resume. Silakan coba lagi sebentar lagi.",
    deleteFailed: "Tidak dapat menghapus. Silakan coba lagi sebentar lagi.",
    newResumeFallbackTitle: "Resume Saya",
    startFailed: "Tidak dapat memulai resume. Silakan coba lagi sebentar lagi.",
    heroBadge: "Pembuat Resume AI",
    heroTitleLine1: "Jangan menulis resume,",
    heroTitleLine2: "cukup jawab pertanyaan.",
    heroSubtitle: "AI menemukan pengalaman Anda dan mengubahnya menjadi resume yang siap untuk melamar.",
    newResumeCta: "Buat Resume Baru",
    newResumeSub: "Mulai dari awal",
    importSub: "PDF atau tempel teks",
    importCta: "Sudah punya resume? Impor dari file",
    newNameTitle: "Beri nama resume Anda",
    newNameDesc: "Akan lebih mudah dibedakan nanti di daftar “Resume sedang dibuat”.",
    newNamePlaceholder: "Mis: Resume Marketing Fresh Graduate",
    startSimple: "Mulai dengan Cepat",
    buildDetailed: "Buat Secara Rinci",
    startSimpleHint: "“Mulai dengan Cepat” — isi langsung di formulir dan periksa lewat pratinjau langsung di sebelahnya.",
    importTitle: "Impor Resume yang Sudah Ada",
    importDesc: "Unggah PDF atau tempel isinya, lalu AI akan membacanya dan mengisi secara otomatis. Setelah diimpor, Anda bisa menyempurnakannya di layar edit.",
    removeFile: "Hapus file",
    uploadPdf: "Unggah file PDF",
    uploadPdfHint: "Hanya PDF yang berisi teks (bukan hasil pindai)",
    orPaste: "atau tempel isi",
    pastePlaceholder: "Silakan tempel isi resume Anda. (nama, kontak, pengalaman, pendidikan, ringkasan diri, dll.)",
    importReading: "Membaca isi...",
    importAi: "Impor dengan AI",
    importDisclaimer: "Bisa jadi tidak akurat — pastikan untuk memeriksa dan menyempurnakan setelah diimpor.",
    loading: "Memuat...",
    draftsTitle: "Resume sedang dibuat",
    untitledResume: "Resume tanpa judul",
    lastEdited: "Terakhir diubah",
    continueWriting: "Lanjutkan",
    selectCta: "Pilih",
    deleteResume: "Hapus resume",
    deleteConfirmTitle: "Hapus resume ini?",
    deleteConfirmDesc: "Setelah dihapus, isi yang sedang dibuat tidak dapat dikembalikan.",
    cancel: "Batal",
    delete: "Hapus"
  }
};

export function useLandingCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
