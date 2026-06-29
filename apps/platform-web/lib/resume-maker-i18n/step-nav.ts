import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  onboarding: string;
  experiences: string;
  edit: string;
  preview: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: { onboarding: "시작", experiences: "경험", edit: "편집", preview: "미리보기" },
  en: { onboarding: "Start", experiences: "Experience", edit: "Edit", preview: "Preview" },
  "zh-CN": { onboarding: "开始", experiences: "经历", edit: "编辑", preview: "预览" },
  vi: { onboarding: "Bắt đầu", experiences: "Kinh nghiệm", edit: "Chỉnh sửa", preview: "Xem trước" },
  ja: { onboarding: "開始", experiences: "経験", edit: "編集", preview: "プレビュー" },
  id: { onboarding: "Mulai", experiences: "Pengalaman", edit: "Edit", preview: "Pratinjau" }
};

export function useStepNavCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
