// 자기소개서 컬렉션(목록 + 편집 chrome) i18n. 문항 편집기 내부 문구는 editor.ts(cl*) 사용.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  // 목록
  listTitle: string;
  listDesc: string;
  newCta: string;
  emptyTitle: string;
  emptyDesc: string;
  // 생성 모달
  createTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  linkResumeLabel: string;
  linkResumeHint: string;
  linkResumeNone: string;
  create: string;
  cancel: string;
  nameRequired: string;
  // 카드
  basedOn: (resumeTitle: string) => string;
  noLinkedResume: string;
  answeredCount: (done: number, total: number) => string;
  edit: string;
  remove: string;
  deleteConfirm: string;
  untitled: string;
  // 편집
  back: string;
  linkedResume: string;
  loadFailed: string;
  createFailed: string;
  deleteFailed: string;
  loading: string;
  settings: string;
  addPromptTitle: string;
  newPrompt: string;
  switchTitle: string;
  goList: string;
  draftsTitle: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  importCta: string;
  importTitle: string;
  importDesc: string;
  importPick: string;
  importRun: string;
  importReading: string;
  importDisclaimer: string;
  removeFile: string;
  importFailed: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    listTitle: "나의 자기소개서",
    listDesc: "회사마다 다르게 제출하는 자기소개서를 따로 관리해요. 이력서 하나로 여러 개를 만들 수 있어요.",
    newCta: "새 자기소개서",
    emptyTitle: "아직 자기소개서가 없어요",
    emptyDesc: "지원할 회사별로 자기소개서를 만들어 보세요. 연결한 이력서를 바탕으로 AI가 초안을 써 드려요.",
    createTitle: "새 자기소개서",
    nameLabel: "이름",
    namePlaceholder: "예: 삼성전자 — 마케팅",
    linkResumeLabel: "연결할 이력서 (선택)",
    linkResumeHint: "연결하면 AI가 그 이력서의 경력을 바탕으로 자소서를 써 드려요.",
    linkResumeNone: "연결 안 함",
    create: "만들기",
    cancel: "취소",
    nameRequired: "이름을 입력해 주세요.",
    basedOn: (r) => `이력서: ${r}`,
    noLinkedResume: "연결된 이력서 없음",
    answeredCount: (done, total) => `${done}/${total} 문항 작성`,
    edit: "편집",
    remove: "삭제",
    deleteConfirm: "이 자기소개서를 삭제할까요?",
    untitled: "제목 없는 자기소개서",
    back: "뒤로",
    linkedResume: "연결 이력서",
    loadFailed: "자기소개서를 불러오지 못했어요.",
    createFailed: "자기소개서 생성에 실패했어요.",
    deleteFailed: "삭제에 실패했어요.",
    loading: "불러오는 중...",
    settings: "기본 설정",
    addPromptTitle: "문항 추가",
    newPrompt: "새 문항",
    switchTitle: "자기소개서 변경",
    goList: "자기소개서 목록",
    heroBadge: "AI 자기소개서",
    heroTitle: "회사마다 다른 자기소개서를\n손쉽게 만들어요",
    heroSubtitle: "이력서 하나로 지원 회사마다 다른 자소서를 AI가 써 드려요.",
    draftsTitle: "나의 자기소개서",
    importCta: "기존 자기소개서 수정하기",
    importTitle: "기존 자기소개서 가져오기",
    importDesc: "PDF를 올리면 AI가 문항·답변으로 정리해 새로 만들어 드려요.",
    importPick: "PDF 선택",
    importRun: "AI로 가져오기",
    importReading: "읽는 중…",
    importDisclaimer: "스캔본(이미지)은 인식이 어려울 수 있어요.",
    removeFile: "파일 제거",
    importFailed: "가져오기에 실패했어요."
  },
  en: {
    listTitle: "My cover letters",
    listDesc: "Manage cover letters separately — they differ per company. Make several from one resume.",
    newCta: "New cover letter",
    emptyTitle: "No cover letters yet",
    emptyDesc: "Create one per company you apply to. AI drafts from the resume you link.",
    createTitle: "New cover letter",
    nameLabel: "Name",
    namePlaceholder: "e.g. Samsung — Marketing",
    linkResumeLabel: "Link a resume (optional)",
    linkResumeHint: "Linking lets AI draft from that resume's experience.",
    linkResumeNone: "Don't link",
    create: "Create",
    cancel: "Cancel",
    nameRequired: "Please enter a name.",
    basedOn: (r) => `Resume: ${r}`,
    noLinkedResume: "No linked resume",
    answeredCount: (done, total) => `${done}/${total} answered`,
    edit: "Edit",
    remove: "Delete",
    deleteConfirm: "Delete this cover letter?",
    untitled: "Untitled cover letter",
    back: "Back",
    linkedResume: "Linked resume",
    loadFailed: "Couldn't load the cover letter.",
    createFailed: "Couldn't create the cover letter.",
    deleteFailed: "Couldn't delete it.",
    loading: "Loading...",
    settings: "Settings",
    addPromptTitle: "Add prompt",
    newPrompt: "New prompt",
    switchTitle: "Switch cover letter",
    goList: "Cover letter list",
    heroBadge: "AI cover letter",
    heroTitle: "A tailored cover letter\nfor every company",
    heroSubtitle: "From one resume, AI writes a tailored cover letter per company.",
    draftsTitle: "My cover letters",
    importCta: "Import an existing one",
    importTitle: "Import a cover letter",
    importDesc: "Upload a PDF and AI organizes it into prompts and answers.",
    importPick: "Choose PDF",
    importRun: "Import with AI",
    importReading: "Reading…",
    importDisclaimer: "Scanned images may not be recognized.",
    removeFile: "Remove file",
    importFailed: "Import failed."
  },
  "zh-CN": {
    listTitle: "我的自荐信",
    listDesc: "自荐信因公司而异，单独管理。用一份简历可生成多封。",
    newCta: "新建自荐信",
    emptyTitle: "还没有自荐信",
    emptyDesc: "为每家应聘公司创建一封。AI 会根据你关联的简历生成初稿。",
    createTitle: "新建自荐信",
    nameLabel: "名称",
    namePlaceholder: "例：三星 — 市场营销",
    linkResumeLabel: "关联简历（可选）",
    linkResumeHint: "关联后，AI 会根据该简历的经历撰写。",
    linkResumeNone: "不关联",
    create: "创建",
    cancel: "取消",
    nameRequired: "请输入名称。",
    basedOn: (r) => `简历：${r}`,
    noLinkedResume: "未关联简历",
    answeredCount: (done, total) => `已填写 ${done}/${total} 题`,
    edit: "编辑",
    remove: "删除",
    deleteConfirm: "要删除这封自荐信吗？",
    untitled: "未命名自荐信",
    back: "返回",
    linkedResume: "关联简历",
    loadFailed: "无法加载自荐信。",
    createFailed: "创建自荐信失败。",
    deleteFailed: "删除失败。",
    loading: "加载中...",
    settings: "基本设置",
    addPromptTitle: "添加题目",
    newPrompt: "新题目",
    switchTitle: "切换自荐信",
    goList: "自荐信列表",
    heroBadge: "AI 自荐信",
    heroTitle: "为每家公司\n轻松撰写自荐信",
    heroSubtitle: "用一份简历，AI 为每家公司量身撰写自荐信。",
    draftsTitle: "我的自荐信",
    importCta: "导入已有自荐信",
    importTitle: "导入自荐信",
    importDesc: "上传 PDF，AI 会整理成题目和答案并新建。",
    importPick: "选择 PDF",
    importRun: "用 AI 导入",
    importReading: "读取中…",
    importDisclaimer: "扫描件（图片）可能无法识别。",
    removeFile: "移除文件",
    importFailed: "导入失败。"
  },
  vi: {
    listTitle: "Thư giới thiệu của tôi",
    listDesc: "Quản lý riêng các thư giới thiệu — mỗi công ty một khác. Tạo nhiều thư từ một hồ sơ.",
    newCta: "Thư giới thiệu mới",
    emptyTitle: "Chưa có thư giới thiệu",
    emptyDesc: "Tạo một thư cho mỗi công ty bạn ứng tuyển. AI soạn nháp từ hồ sơ bạn liên kết.",
    createTitle: "Thư giới thiệu mới",
    nameLabel: "Tên",
    namePlaceholder: "VD: Samsung — Marketing",
    linkResumeLabel: "Liên kết hồ sơ (tùy chọn)",
    linkResumeHint: "Liên kết để AI soạn từ kinh nghiệm trong hồ sơ đó.",
    linkResumeNone: "Không liên kết",
    create: "Tạo",
    cancel: "Hủy",
    nameRequired: "Vui lòng nhập tên.",
    basedOn: (r) => `Hồ sơ: ${r}`,
    noLinkedResume: "Chưa liên kết hồ sơ",
    answeredCount: (done, total) => `Đã viết ${done}/${total} câu`,
    edit: "Sửa",
    remove: "Xóa",
    deleteConfirm: "Xóa thư giới thiệu này?",
    untitled: "Thư giới thiệu chưa đặt tên",
    back: "Quay lại",
    linkedResume: "Hồ sơ liên kết",
    loadFailed: "Không tải được thư giới thiệu.",
    createFailed: "Không tạo được thư giới thiệu.",
    deleteFailed: "Không xóa được.",
    loading: "Đang tải...",
    settings: "Cài đặt",
    addPromptTitle: "Thêm câu hỏi",
    newPrompt: "Câu hỏi mới",
    switchTitle: "Đổi thư giới thiệu",
    goList: "Danh sách thư",
    heroBadge: "Thư AI",
    heroTitle: "Thư giới thiệu riêng\ncho từng công ty",
    heroSubtitle: "Từ một hồ sơ, AI viết thư riêng cho từng công ty.",
    draftsTitle: "Thư của tôi",
    importCta: "Nhập thư đã có",
    importTitle: "Nhập thư giới thiệu",
    importDesc: "Tải PDF lên, AI sẽ sắp xếp thành câu hỏi và câu trả lời.",
    importPick: "Chọn PDF",
    importRun: "Nhập bằng AI",
    importReading: "Đang đọc…",
    importDisclaimer: "Bản scan (hình ảnh) có thể không nhận dạng được.",
    removeFile: "Xóa tệp",
    importFailed: "Nhập thất bại."
  },
  ja: {
    listTitle: "自己PR書一覧",
    listDesc: "企業ごとに異なる自己PR書を別々に管理。1つの履歴書から複数作成できます。",
    newCta: "新規作成",
    emptyTitle: "まだ自己PR書がありません",
    emptyDesc: "応募する企業ごとに作成しましょう。連携した履歴書をもとにAIが下書きします。",
    createTitle: "新規作成",
    nameLabel: "名前",
    namePlaceholder: "例：サムスン — マーケティング",
    linkResumeLabel: "連携する履歴書（任意）",
    linkResumeHint: "連携するとAIがその履歴書の経歴をもとに作成します。",
    linkResumeNone: "連携しない",
    create: "作成",
    cancel: "キャンセル",
    nameRequired: "名前を入力してください。",
    basedOn: (r) => `履歴書：${r}`,
    noLinkedResume: "連携した履歴書なし",
    answeredCount: (done, total) => `${done}/${total} 設問を作成`,
    edit: "編集",
    remove: "削除",
    deleteConfirm: "この自己PR書を削除しますか？",
    untitled: "無題の自己PR書",
    back: "戻る",
    linkedResume: "連携履歴書",
    loadFailed: "自己PR書を読み込めませんでした。",
    createFailed: "自己PR書の作成に失敗しました。",
    deleteFailed: "削除に失敗しました。",
    loading: "読み込み中...",
    settings: "基本設定",
    addPromptTitle: "設問を追加",
    newPrompt: "新しい設問",
    switchTitle: "自己PR書を切替",
    goList: "自己PR書一覧",
    heroBadge: "AI自己PR書",
    heroTitle: "企業ごとの自己PR書を\n手軽に作成",
    heroSubtitle: "履歴書ひとつで、企業ごとの自己PR書をAIが作成します。",
    draftsTitle: "マイ自己PR書",
    importCta: "既存の自己PR書を取り込む",
    importTitle: "自己PR書を取り込む",
    importDesc: "PDFをアップロードするとAIが設問・回答に整理して作成します。",
    importPick: "PDFを選択",
    importRun: "AIで取り込む",
    importReading: "読み込み中…",
    importDisclaimer: "スキャン（画像）は認識できない場合があります。",
    removeFile: "ファイルを削除",
    importFailed: "取り込みに失敗しました。"
  },
  id: {
    listTitle: "Surat lamaran saya",
    listDesc: "Kelola surat lamaran terpisah — beda tiap perusahaan. Buat beberapa dari satu resume.",
    newCta: "Surat lamaran baru",
    emptyTitle: "Belum ada surat lamaran",
    emptyDesc: "Buat satu untuk tiap perusahaan. AI membuat draf dari resume yang Anda tautkan.",
    createTitle: "Surat lamaran baru",
    nameLabel: "Nama",
    namePlaceholder: "mis. Samsung — Marketing",
    linkResumeLabel: "Tautkan resume (opsional)",
    linkResumeHint: "Menautkan membuat AI menulis dari pengalaman resume itu.",
    linkResumeNone: "Jangan tautkan",
    create: "Buat",
    cancel: "Batal",
    nameRequired: "Masukkan nama.",
    basedOn: (r) => `Resume: ${r}`,
    noLinkedResume: "Tidak ada resume tertaut",
    answeredCount: (done, total) => `${done}/${total} terjawab`,
    edit: "Edit",
    remove: "Hapus",
    deleteConfirm: "Hapus surat lamaran ini?",
    untitled: "Surat lamaran tanpa judul",
    back: "Kembali",
    linkedResume: "Resume tertaut",
    loadFailed: "Gagal memuat surat lamaran.",
    createFailed: "Gagal membuat surat lamaran.",
    deleteFailed: "Gagal menghapus.",
    loading: "Memuat...",
    settings: "Pengaturan",
    addPromptTitle: "Tambah pertanyaan",
    newPrompt: "Pertanyaan baru",
    switchTitle: "Ganti surat lamaran",
    goList: "Daftar surat lamaran",
    heroBadge: "Surat lamaran AI",
    heroTitle: "Surat lamaran khusus\nuntuk tiap perusahaan",
    heroSubtitle: "Dari satu resume, AI menulis surat untuk tiap perusahaan.",
    draftsTitle: "Surat lamaran saya",
    importCta: "Impor yang sudah ada",
    importTitle: "Impor surat lamaran",
    importDesc: "Unggah PDF, AI menyusunnya jadi pertanyaan dan jawaban.",
    importPick: "Pilih PDF",
    importRun: "Impor dengan AI",
    importReading: "Membaca…",
    importDisclaimer: "Hasil pindai (gambar) mungkin tidak terbaca.",
    removeFile: "Hapus file",
    importFailed: "Impor gagal."
  }
};

export function useCoverLetterCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
