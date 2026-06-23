import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  loadFailed: string;
  loading: string;
  onboarding: string;
  foreignerQuestion: string;
  foreignerHelp: string;
  foreignerYes: string;
  foreignerNo: string;
  purposeTitle: string;
  purposeDesc: string;
  jobTitle: string;
  jobDesc: string;
  jobPlaceholder: string;
  startTitle: string;
  startDesc: string;
  startMethodNotice: string;
  prev: string;
  next: string;
  goAddExperience: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    loadFailed: "이력서를 불러오지 못했어요.",
    loading: "불러오는 중...",
    onboarding: "온보딩",
    foreignerQuestion: "한국 국적이 아닌 외국인이신가요?",
    foreignerHelp: "외국인이면 기본 정보에 비자 항목을 추가해 드려요.",
    foreignerYes: "네, 외국인이에요",
    foreignerNo: "아니요",
    purposeTitle: "어떤 상황에서 사용할 이력서인가요?",
    purposeDesc: "상황에 맞춰 질문과 문장 톤을 조절해 드려요.",
    jobTitle: "어떤 일을 하고 싶나요?",
    jobDesc: "고를 필요 없이 편하게 적어주세요. 아직 잘 모르겠다면 그렇게 적어도 괜찮아요.",
    jobPlaceholder: "예: 외국인 대상 서비스 기획을 해보고 싶어요. / 마케팅이나 콘텐츠 쪽이요. / 아직 잘 모르겠어요.",
    startTitle: "현재 작성된 자료가 있나요?",
    startDesc: "없어도 괜찮아요. 질문에 답하며 처음부터 만들 수 있어요.",
    startMethodNotice: "업로드·붙여넣기 연동은 다음 단계에서 이어집니다. 지금은 선택만 저장돼요.",
    prev: "이전",
    next: "다음",
    goAddExperience: "경험 추가하러 가기"
  },
  en: {
    loadFailed: "We couldn't load your resume.",
    loading: "Loading...",
    onboarding: "Onboarding",
    foreignerQuestion: "Are you a foreign national (not a Korean citizen)?",
    foreignerHelp: "If you're a foreigner, we'll add a visa field to your basic info.",
    foreignerYes: "Yes, I'm a foreigner",
    foreignerNo: "No",
    purposeTitle: "What will you use this resume for?",
    purposeDesc: "We'll tailor the questions and tone to your situation.",
    jobTitle: "What kind of work do you want to do?",
    jobDesc: "No need to pick from a list—just write freely. If you're not sure yet, it's fine to say so.",
    jobPlaceholder: "e.g. I'd like to work on product planning for services for foreigners. / Something in marketing or content. / I'm not sure yet.",
    startTitle: "Do you already have any materials prepared?",
    startDesc: "It's fine if you don't. You can build everything from scratch by answering the questions.",
    startMethodNotice: "Upload and paste integration continues in the next step. For now, only your selection is saved.",
    prev: "Back",
    next: "Next",
    goAddExperience: "Go add experiences"
  },
  "zh-CN": {
    loadFailed: "无法加载您的简历。",
    loading: "加载中...",
    onboarding: "引导设置",
    foreignerQuestion: "您是非韩国国籍的外国人吗？",
    foreignerHelp: "如果您是外国人，我们会在基本信息中添加签证项。",
    foreignerYes: "是的，我是外国人",
    foreignerNo: "不是",
    purposeTitle: "这份简历将用于什么场景？",
    purposeDesc: "我们会根据您的情况调整问题和语气。",
    jobTitle: "您想从事什么样的工作？",
    jobDesc: "无需从列表中选择，随意填写即可。如果还不确定，直接这么写也没关系。",
    jobPlaceholder: "例如：我想做面向外国人的服务策划。/ 营销或内容方面。/ 我还不太确定。",
    startTitle: "您现在有已准备好的资料吗？",
    startDesc: "没有也没关系。您可以通过回答问题从头开始制作。",
    startMethodNotice: "上传与粘贴功能将在下一步继续。目前仅保存您的选择。",
    prev: "上一步",
    next: "下一步",
    goAddExperience: "去添加经历"
  },
  vi: {
    loadFailed: "Không thể tải hồ sơ của bạn.",
    loading: "Đang tải...",
    onboarding: "Thiết lập ban đầu",
    foreignerQuestion: "Bạn có phải là người nước ngoài (không mang quốc tịch Hàn Quốc) không?",
    foreignerHelp: "Nếu bạn là người nước ngoài, chúng tôi sẽ thêm mục thị thực vào thông tin cơ bản.",
    foreignerYes: "Vâng, tôi là người nước ngoài",
    foreignerNo: "Không",
    purposeTitle: "Bạn sẽ dùng hồ sơ này cho mục đích gì?",
    purposeDesc: "Chúng tôi sẽ điều chỉnh câu hỏi và giọng văn cho phù hợp với tình huống của bạn.",
    jobTitle: "Bạn muốn làm công việc gì?",
    jobDesc: "Không cần chọn từ danh sách, cứ viết thoải mái. Nếu chưa chắc chắn, bạn cũng có thể ghi như vậy.",
    jobPlaceholder: "Ví dụ: Tôi muốn lập kế hoạch dịch vụ dành cho người nước ngoài. / Lĩnh vực marketing hoặc nội dung. / Tôi vẫn chưa chắc chắn.",
    startTitle: "Bạn đã có tài liệu nào được chuẩn bị sẵn chưa?",
    startDesc: "Không có cũng không sao. Bạn có thể tạo từ đầu bằng cách trả lời các câu hỏi.",
    startMethodNotice: "Việc tải lên và dán sẽ được tiếp tục ở bước sau. Hiện tại chỉ lưu lựa chọn của bạn.",
    prev: "Quay lại",
    next: "Tiếp theo",
    goAddExperience: "Đi thêm kinh nghiệm"
  },
  ja: {
    loadFailed: "履歴書を読み込めませんでした。",
    loading: "読み込み中...",
    onboarding: "オンボーディング",
    foreignerQuestion: "韓国国籍ではない外国人の方ですか？",
    foreignerHelp: "外国人の方には、基本情報にビザの項目を追加します。",
    foreignerYes: "はい、外国人です",
    foreignerNo: "いいえ",
    purposeTitle: "どのような場面で使う履歴書ですか？",
    purposeDesc: "状況に合わせて質問や文章のトーンを調整します。",
    jobTitle: "どんな仕事をしたいですか？",
    jobDesc: "選ぶ必要はありません。気軽に書いてください。まだよく分からない場合は、そのまま書いても大丈夫です。",
    jobPlaceholder: "例：外国人向けサービスの企画をしてみたいです。/ マーケティングやコンテンツ系がいいです。/ まだよく分かりません。",
    startTitle: "現在、すでに作成した資料はありますか？",
    startDesc: "なくても大丈夫です。質問に答えながら最初から作成できます。",
    startMethodNotice: "アップロード・貼り付けの連携は次のステップで続きます。今は選択のみ保存されます。",
    prev: "戻る",
    next: "次へ",
    goAddExperience: "経験を追加しに行く"
  },
  id: {
    loadFailed: "Kami tidak dapat memuat resume Anda.",
    loading: "Memuat...",
    onboarding: "Pengenalan",
    foreignerQuestion: "Apakah Anda warga negara asing (bukan warga negara Korea)?",
    foreignerHelp: "Jika Anda warga negara asing, kami akan menambahkan kolom visa ke informasi dasar Anda.",
    foreignerYes: "Ya, saya warga negara asing",
    foreignerNo: "Tidak",
    purposeTitle: "Untuk keperluan apa resume ini akan digunakan?",
    purposeDesc: "Kami akan menyesuaikan pertanyaan dan nada kalimat dengan situasi Anda.",
    jobTitle: "Pekerjaan seperti apa yang ingin Anda lakukan?",
    jobDesc: "Tidak perlu memilih dari daftar, tulis saja dengan bebas. Jika Anda belum yakin, tidak masalah untuk menuliskannya begitu saja.",
    jobPlaceholder: "Contoh: Saya ingin merencanakan layanan untuk warga asing. / Bidang pemasaran atau konten. / Saya belum yakin.",
    startTitle: "Apakah Anda sudah memiliki materi yang disiapkan?",
    startDesc: "Tidak punya pun tidak masalah. Anda bisa membuatnya dari awal dengan menjawab pertanyaan.",
    startMethodNotice: "Integrasi unggah dan tempel akan dilanjutkan pada langkah berikutnya. Untuk saat ini hanya pilihan Anda yang disimpan.",
    prev: "Kembali",
    next: "Berikutnya",
    goAddExperience: "Tambah pengalaman"
  }
};

export function useOnboardingCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
