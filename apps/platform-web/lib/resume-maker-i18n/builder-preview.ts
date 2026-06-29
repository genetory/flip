import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  back: string;
  viewOriginal: string;
  loading: string;
  slogan: string;
  resumeFallback: string;
  translateFailed: string;
  loadFailed: string;
  pdfFailed: string;
  langHint: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    back: "뒤로",
    viewOriginal: "원문",
    loading: "불러오는 중...",
    slogan: "커리어의 시작 · aply.global",
    resumeFallback: "이력서",
    translateFailed: "번역에 실패했어요.",
    loadFailed: "이력서를 불러오지 못했어요.",
    pdfFailed: "PDF 생성에 실패했어요. 다시 시도해 주세요.",
    langHint: "한국 기업 지원엔 한국어 이력서가 유리해요 — 위에서 ‘한국어’로 전환하면 자동 번역됩니다."
  },
  en: {
    back: "Back",
    viewOriginal: "Original",
    loading: "Loading...",
    slogan: "Where your career begins · aply.global",
    resumeFallback: "Resume",
    translateFailed: "Translation failed.",
    loadFailed: "Couldn't load the resume.",
    pdfFailed: "Failed to generate the PDF. Please try again.",
    langHint: "Korean employers prefer a Korean resume — switch to ‘한국어’ above to auto-translate."
  },
  "zh-CN": {
    back: "返回",
    viewOriginal: "原文",
    loading: "加载中...",
    slogan: "职业生涯的起点 · aply.global",
    resumeFallback: "简历",
    translateFailed: "翻译失败。",
    loadFailed: "无法加载简历。",
    pdfFailed: "PDF 生成失败，请重试。",
    langHint: "申请韩国企业时韩语简历更有利 — 在上方切换为‘한국어’即可自动翻译。"
  },
  vi: {
    back: "Quay lại",
    viewOriginal: "Bản gốc",
    loading: "Đang tải...",
    slogan: "Khởi đầu sự nghiệp · aply.global",
    resumeFallback: "Hồ sơ",
    translateFailed: "Dịch thất bại.",
    loadFailed: "Không thể tải hồ sơ.",
    pdfFailed: "Tạo PDF thất bại. Vui lòng thử lại.",
    langHint: "Nhà tuyển dụng Hàn Quốc thích hồ sơ tiếng Hàn — chuyển sang ‘한국어’ ở trên để tự động dịch."
  },
  ja: {
    back: "戻る",
    viewOriginal: "原文",
    loading: "読み込み中...",
    slogan: "キャリアのはじまり · aply.global",
    resumeFallback: "履歴書",
    translateFailed: "翻訳に失敗しました。",
    loadFailed: "履歴書を読み込めませんでした。",
    pdfFailed: "PDFの生成に失敗しました。もう一度お試しください。",
    langHint: "韓国企業への応募は韓国語の履歴書が有利です — 上で「한국어」に切り替えると自動翻訳されます。"
  },
  id: {
    back: "Kembali",
    viewOriginal: "Asli",
    loading: "Memuat...",
    slogan: "Awal karier Anda · aply.global",
    resumeFallback: "Resume",
    translateFailed: "Penerjemahan gagal.",
    loadFailed: "Gagal memuat resume.",
    pdfFailed: "Gagal membuat PDF. Silakan coba lagi.",
    langHint: "Perusahaan Korea lebih menyukai resume berbahasa Korea — beralih ke ‘한국어’ di atas untuk terjemahan otomatis."
  }
};

export function useBuilderPreviewCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
