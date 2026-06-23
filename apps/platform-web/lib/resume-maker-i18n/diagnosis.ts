// resume-maker i18n — ResumeDiagnosisEntryPage 네임스페이스.
// 사이트 i18n 방식(useLanguage 의 locale)에 맞춰, 컴포넌트별로 6개 언어 사전을
// 한 파일에 담고 훅으로 노출한다. locale 미일치 시 영어(기본)로 폴백.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  bullets: [string, string, string];
  untitledResume: string;
  previewLoading: string;
  diagnoseAnother: string;
  diagnosisResultTitle: string;
  profileForCompanyTitle: string;
  registeredTitle: string;
  registeredDesc: string;
  registerCardTitle: string;
  registerCardDesc: string;
  consentLabel: string;
  registerButton: string;
  badge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDesc: string;
  loading: string;
  selectPrompt: string;
  lastEdited: (when: string) => string;
  diagnoseAction: string;
  emptyTitle: string;
  emptyDesc: string;
  goCreateResume: string;
  previewHeading: string;
  diagnosisLoadFailed: string;
  registerSuccess: string;
  registerFailed: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    bullets: [
      "지원 가능 수준인지 한눈에 점수로 확인해요",
      "부족한 항목과 보완 방법을 콕 집어 알려줘요",
      "고친 뒤 다시 진단해 완성도를 끌어올릴 수 있어요"
    ],
    untitledResume: "제목 없는 이력서",
    previewLoading: "미리보기 불러오는 중...",
    diagnoseAnother: "다른 이력서 진단",
    diagnosisResultTitle: "AI 진단 결과",
    profileForCompanyTitle: "이 이력서로 만들어지는 기업용 프로필",
    registeredTitle: "기업 추천 후보로 등록됐어요",
    registeredDesc:
      "APLY 운영팀이 검토 후, 잘 맞는 기업이 있으면 안내드려요. 프로필을 더 채울수록 추천 가능성이 올라가요.",
    registerCardTitle: "기업 추천 후보로 등록하기",
    registerCardDesc:
      "등록하면 APLY 인재풀에 추가되어, 잘 맞는 기업에 후보로 추천될 수 있어요. 기업에는 이름·국적·비자·언어·전공·희망직무·핵심 경험이 담긴 APLY Profile이 제공돼요.",
    consentLabel: "기업 추천을 위한 개인정보 제공에 동의합니다.",
    registerButton: "기업 추천 후보로 등록",
    badge: "AI 진단",
    heroTitleLine1: "내 이력서,",
    heroTitleLine2: "지원해도 될까요?",
    heroDesc: "이력서를 고르면 AI가 곧바로 완성도를 진단해드립니다.",
    loading: "불러오는 중...",
    selectPrompt: "진단할 이력서를 선택하세요",
    lastEdited: (when) => `마지막 수정 · ${when}`,
    diagnoseAction: "진단하기",
    emptyTitle: "아직 진단할 이력서가 없어요",
    emptyDesc: "먼저 이력서를 만들면 AI 진단을 받을 수 있어요.",
    goCreateResume: "이력서 만들러 가기",
    previewHeading: "이력서 미리보기",
    diagnosisLoadFailed: "진단을 불러오지 못했어요.",
    registerSuccess: "기업 추천 후보로 등록했어요.",
    registerFailed: "등록에 실패했어요. 잠시 후 다시 시도해 주세요."
  },
  en: {
    bullets: [
      "See at a glance whether your resume is ready to apply, scored out of 100",
      "Pinpoints what's missing and exactly how to improve it",
      "Fix it and run the diagnosis again to push your resume to completion"
    ],
    untitledResume: "Untitled resume",
    previewLoading: "Loading preview...",
    diagnoseAnother: "Diagnose another resume",
    diagnosisResultTitle: "AI diagnosis result",
    profileForCompanyTitle: "The employer profile built from this resume",
    registeredTitle: "Registered as a recommended candidate",
    registeredDesc:
      "The APLY team reviews your profile and reaches out when there's a good company match. The more complete your profile, the higher your chances of being recommended.",
    registerCardTitle: "Register as a recommended candidate",
    registerCardDesc:
      "Once registered, you're added to the APLY talent pool and may be recommended to companies that fit you well. Companies receive an APLY Profile with your name, nationality, visa, languages, major, desired role, and key experience.",
    consentLabel: "I agree to share my personal information for company recommendations.",
    registerButton: "Register as a candidate",
    badge: "AI diagnosis",
    heroTitleLine1: "My resume —",
    heroTitleLine2: "is it ready to apply?",
    heroDesc: "Pick a resume and AI will diagnose its completeness right away.",
    loading: "Loading...",
    selectPrompt: "Choose a resume to diagnose",
    lastEdited: (when) => `Last edited · ${when}`,
    diagnoseAction: "Diagnose",
    emptyTitle: "No resume to diagnose yet",
    emptyDesc: "Create a resume first to get an AI diagnosis.",
    goCreateResume: "Go create a resume",
    previewHeading: "Resume preview",
    diagnosisLoadFailed: "Couldn't load the diagnosis.",
    registerSuccess: "Registered as a recommended candidate.",
    registerFailed: "Registration failed. Please try again in a moment."
  },
  "zh-CN": {
    bullets: [
      "一眼通过评分了解简历是否达到可投递水平",
      "精准指出欠缺的项目和具体的改进方法",
      "修改后再次诊断，不断提升简历完成度"
    ],
    untitledResume: "未命名简历",
    previewLoading: "正在加载预览...",
    diagnoseAnother: "诊断其他简历",
    diagnosisResultTitle: "AI 诊断结果",
    profileForCompanyTitle: "由这份简历生成的企业用档案",
    registeredTitle: "已登记为推荐候选人",
    registeredDesc:
      "APLY 运营团队审核后，若有合适的企业便会通知您。档案填写得越完整，被推荐的可能性越高。",
    registerCardTitle: "登记为推荐候选人",
    registerCardDesc:
      "登记后将加入 APLY 人才库，可能被推荐给与您匹配的企业。企业将获得包含姓名、国籍、签证、语言、专业、期望职位和核心经历的 APLY Profile。",
    consentLabel: "我同意为企业推荐提供个人信息。",
    registerButton: "登记为推荐候选人",
    badge: "AI 诊断",
    heroTitleLine1: "我的简历，",
    heroTitleLine2: "可以投递了吗？",
    heroDesc: "选择一份简历，AI 会立即诊断它的完成度。",
    loading: "正在加载...",
    selectPrompt: "请选择要诊断的简历",
    lastEdited: (when) => `最近修改 · ${when}`,
    diagnoseAction: "开始诊断",
    emptyTitle: "还没有可诊断的简历",
    emptyDesc: "先创建一份简历，即可获得 AI 诊断。",
    goCreateResume: "去创建简历",
    previewHeading: "简历预览",
    diagnosisLoadFailed: "未能加载诊断结果。",
    registerSuccess: "已登记为推荐候选人。",
    registerFailed: "登记失败，请稍后再试。"
  },
  vi: {
    bullets: [
      "Xem ngay điểm số để biết hồ sơ đã đủ điều kiện ứng tuyển hay chưa",
      "Chỉ rõ những mục còn thiếu và cách bổ sung cụ thể",
      "Sửa xong rồi chẩn đoán lại để nâng cao độ hoàn thiện"
    ],
    untitledResume: "Hồ sơ chưa có tiêu đề",
    previewLoading: "Đang tải bản xem trước...",
    diagnoseAnother: "Chẩn đoán hồ sơ khác",
    diagnosisResultTitle: "Kết quả chẩn đoán AI",
    profileForCompanyTitle: "Hồ sơ dành cho doanh nghiệp được tạo từ hồ sơ này",
    registeredTitle: "Đã đăng ký làm ứng viên được giới thiệu",
    registeredDesc:
      "Đội ngũ APLY sẽ xem xét và liên hệ khi có doanh nghiệp phù hợp. Hồ sơ càng đầy đủ thì khả năng được giới thiệu càng cao.",
    registerCardTitle: "Đăng ký làm ứng viên được giới thiệu",
    registerCardDesc:
      "Sau khi đăng ký, bạn sẽ được thêm vào nguồn nhân tài APLY và có thể được giới thiệu cho các doanh nghiệp phù hợp. Doanh nghiệp sẽ nhận được APLY Profile gồm tên, quốc tịch, visa, ngôn ngữ, chuyên ngành, vị trí mong muốn và kinh nghiệm chính.",
    consentLabel: "Tôi đồng ý cung cấp thông tin cá nhân để được giới thiệu cho doanh nghiệp.",
    registerButton: "Đăng ký làm ứng viên",
    badge: "Chẩn đoán AI",
    heroTitleLine1: "Hồ sơ của tôi,",
    heroTitleLine2: "đã sẵn sàng ứng tuyển chưa?",
    heroDesc: "Chọn một hồ sơ và AI sẽ chẩn đoán độ hoàn thiện ngay lập tức.",
    loading: "Đang tải...",
    selectPrompt: "Chọn hồ sơ cần chẩn đoán",
    lastEdited: (when) => `Sửa lần cuối · ${when}`,
    diagnoseAction: "Chẩn đoán",
    emptyTitle: "Chưa có hồ sơ nào để chẩn đoán",
    emptyDesc: "Hãy tạo hồ sơ trước để nhận chẩn đoán AI.",
    goCreateResume: "Đi tạo hồ sơ",
    previewHeading: "Xem trước hồ sơ",
    diagnosisLoadFailed: "Không thể tải kết quả chẩn đoán.",
    registerSuccess: "Đã đăng ký làm ứng viên được giới thiệu.",
    registerFailed: "Đăng ký thất bại. Vui lòng thử lại sau giây lát."
  },
  ja: {
    bullets: [
      "応募できるレベルかどうかをスコアでひと目で確認できます",
      "不足している項目と補い方をピンポイントで教えてくれます",
      "修正後に再診断して完成度を高められます"
    ],
    untitledResume: "無題の履歴書",
    previewLoading: "プレビューを読み込み中...",
    diagnoseAnother: "別の履歴書を診断",
    diagnosisResultTitle: "AI診断結果",
    profileForCompanyTitle: "この履歴書から作成される企業向けプロフィール",
    registeredTitle: "企業推薦候補として登録されました",
    registeredDesc:
      "APLY運営チームが確認のうえ、相性の良い企業があればご案内します。プロフィールを充実させるほど推薦の可能性が高まります。",
    registerCardTitle: "企業推薦候補として登録する",
    registerCardDesc:
      "登録するとAPLYの人材プールに追加され、相性の良い企業に候補として推薦されることがあります。企業には氏名・国籍・ビザ・言語・専攻・希望職種・主要な経験が含まれるAPLY Profileが提供されます。",
    consentLabel: "企業推薦のための個人情報の提供に同意します。",
    registerButton: "企業推薦候補として登録",
    badge: "AI診断",
    heroTitleLine1: "私の履歴書、",
    heroTitleLine2: "応募しても大丈夫？",
    heroDesc: "履歴書を選ぶと、AIがすぐに完成度を診断します。",
    loading: "読み込み中...",
    selectPrompt: "診断する履歴書を選択してください",
    lastEdited: (when) => `最終更新 · ${when}`,
    diagnoseAction: "診断する",
    emptyTitle: "まだ診断できる履歴書がありません",
    emptyDesc: "まず履歴書を作成すると、AI診断を受けられます。",
    goCreateResume: "履歴書を作りに行く",
    previewHeading: "履歴書プレビュー",
    diagnosisLoadFailed: "診断を読み込めませんでした。",
    registerSuccess: "企業推薦候補として登録しました。",
    registerFailed: "登録に失敗しました。しばらくしてからもう一度お試しください。"
  },
  id: {
    bullets: [
      "Lihat sekilas lewat skor apakah resume sudah layak untuk melamar",
      "Menunjukkan dengan tepat bagian yang kurang dan cara memperbaikinya",
      "Perbaiki lalu diagnosis ulang untuk meningkatkan kelengkapannya"
    ],
    untitledResume: "Resume tanpa judul",
    previewLoading: "Memuat pratinjau...",
    diagnoseAnother: "Diagnosis resume lain",
    diagnosisResultTitle: "Hasil diagnosis AI",
    profileForCompanyTitle: "Profil untuk perusahaan yang dibuat dari resume ini",
    registeredTitle: "Terdaftar sebagai kandidat rekomendasi",
    registeredDesc:
      "Tim APLY akan meninjau dan menghubungi Anda bila ada perusahaan yang cocok. Semakin lengkap profil Anda, semakin besar peluang direkomendasikan.",
    registerCardTitle: "Daftar sebagai kandidat rekomendasi",
    registerCardDesc:
      "Setelah terdaftar, Anda ditambahkan ke kumpulan talenta APLY dan dapat direkomendasikan ke perusahaan yang cocok. Perusahaan menerima APLY Profile berisi nama, kewarganegaraan, visa, bahasa, jurusan, posisi yang diinginkan, dan pengalaman utama Anda.",
    consentLabel: "Saya setuju memberikan data pribadi untuk rekomendasi perusahaan.",
    registerButton: "Daftar sebagai kandidat",
    badge: "Diagnosis AI",
    heroTitleLine1: "Resume saya,",
    heroTitleLine2: "apakah sudah siap melamar?",
    heroDesc: "Pilih sebuah resume dan AI akan langsung mendiagnosis kelengkapannya.",
    loading: "Memuat...",
    selectPrompt: "Pilih resume yang ingin didiagnosis",
    lastEdited: (when) => `Terakhir diubah · ${when}`,
    diagnoseAction: "Diagnosis",
    emptyTitle: "Belum ada resume untuk didiagnosis",
    emptyDesc: "Buat resume terlebih dahulu untuk mendapatkan diagnosis AI.",
    goCreateResume: "Buat resume",
    previewHeading: "Pratinjau resume",
    diagnosisLoadFailed: "Tidak dapat memuat diagnosis.",
    registerSuccess: "Terdaftar sebagai kandidat rekomendasi.",
    registerFailed: "Pendaftaran gagal. Silakan coba lagi sebentar."
  }
};

export function useDiagnosisCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
