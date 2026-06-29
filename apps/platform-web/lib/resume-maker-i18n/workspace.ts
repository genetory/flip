import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  previewPlaceholder: string;
  previewPdf: string;
  previewResume: string;
  preview: string;
  close: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    previewPlaceholder: "미리보기가 여기에 표시돼요.",
    previewPdf: "미리보기·PDF",
    previewResume: "이력서 미리보기",
    preview: "미리보기",
    close: "닫기"
  },
  en: {
    previewPlaceholder: "Your preview will appear here.",
    previewPdf: "Preview · PDF",
    previewResume: "Preview resume",
    preview: "Preview",
    close: "Close"
  },
  "zh-CN": {
    previewPlaceholder: "预览将显示在这里。",
    previewPdf: "预览·PDF",
    previewResume: "预览简历",
    preview: "预览",
    close: "关闭"
  },
  vi: {
    previewPlaceholder: "Bản xem trước sẽ hiển thị ở đây.",
    previewPdf: "Xem trước · PDF",
    previewResume: "Xem trước hồ sơ",
    preview: "Xem trước",
    close: "Đóng"
  },
  ja: {
    previewPlaceholder: "プレビューがここに表示されます。",
    previewPdf: "プレビュー・PDF",
    previewResume: "履歴書をプレビュー",
    preview: "プレビュー",
    close: "閉じる"
  },
  id: {
    previewPlaceholder: "Pratinjau akan muncul di sini.",
    previewPdf: "Pratinjau · PDF",
    previewResume: "Pratinjau resume",
    preview: "Pratinjau",
    close: "Tutup"
  }
};

export function useWorkspaceCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
