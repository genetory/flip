// resume-maker i18n — AutoSaveIndicator 네임스페이스.
// 사이트 i18n 방식(useLanguage 의 locale)에 맞춰, 컴포넌트별로 6개 언어 사전을
// 한 파일에 담고 훅으로 노출한다. locale 미일치 시 영어(기본)로 폴백.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  saving: string;
  saved: string;
  failed: string;
  retry: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: { saving: "저장 중...", saved: "저장됨", failed: "저장 실패", retry: "다시 시도" },
  en: { saving: "Saving...", saved: "Saved", failed: "Save failed", retry: "Retry" },
  "zh-CN": { saving: "保存中...", saved: "已保存", failed: "保存失败", retry: "重试" },
  vi: { saving: "Đang lưu...", saved: "Đã lưu", failed: "Lưu thất bại", retry: "Thử lại" },
  ja: { saving: "保存中...", saved: "保存しました", failed: "保存に失敗", retry: "再試行" },
  id: { saving: "Menyimpan...", saved: "Tersimpan", failed: "Gagal menyimpan", retry: "Coba lagi" }
};

export function useAutoSaveCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
