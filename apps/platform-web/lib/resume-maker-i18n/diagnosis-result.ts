// resume-maker i18n — ResumeDiagnosisResult 네임스페이스.
// 사이트 i18n 방식(useLanguage 의 locale)에 맞춰, 컴포넌트별로 6개 언어 사전을
// 한 파일에 담고 훅으로 노출한다. locale 미일치 시 영어(기본)로 폴백.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  diagnosing: string;
  loadFailed: string;
  retry: string;
  levelSubmittable: string;
  levelNeedsPolish: string;
  levelNotSubmittable: string;
  qualityScore: (n: number) => string;
  readinessScore: (n: number) => string;
  groupRequired: string;
  groupRecommended: string;
  groupOptional: string;
  disclaimer: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    diagnosing: "진단하는 중...",
    loadFailed: "진단을 불러오지 못했어요.",
    retry: "다시 시도",
    levelSubmittable: "지원 가능",
    levelNeedsPolish: "보완 후 지원 가능",
    levelNotSubmittable: "아직 보완 필요",
    qualityScore: (n) => `완성도 ${n}점`,
    readinessScore: (n) => `제출 준비 ${n}점`,
    groupRequired: "필수 수정",
    groupRecommended: "추천 수정",
    groupOptional: "선택 수정",
    disclaimer: "합격을 보장하지 않으며, 더 나은 지원을 돕는 가이드예요."
  },
  en: {
    diagnosing: "Analyzing...",
    loadFailed: "Couldn't load the diagnosis.",
    retry: "Try again",
    levelSubmittable: "Ready to apply",
    levelNeedsPolish: "Ready after a few fixes",
    levelNotSubmittable: "Still needs work",
    qualityScore: (n) => `Completeness ${n} pts`,
    readinessScore: (n) => `Apply-readiness ${n} pts`,
    groupRequired: "Must fix",
    groupRecommended: "Recommended",
    groupOptional: "Optional",
    disclaimer: "This doesn't guarantee an offer—it's a guide to help you apply better."
  },
  "zh-CN": {
    diagnosing: "诊断中...",
    loadFailed: "无法加载诊断结果。",
    retry: "重试",
    levelSubmittable: "可以投递",
    levelNeedsPolish: "完善后可投递",
    levelNotSubmittable: "仍需完善",
    qualityScore: (n) => `完整度 ${n} 分`,
    readinessScore: (n) => `投递准备 ${n} 分`,
    groupRequired: "必须修改",
    groupRecommended: "推荐修改",
    groupOptional: "可选修改",
    disclaimer: "本结果不保证录用，仅为帮助你更好地投递提供参考。"
  },
  vi: {
    diagnosing: "Đang phân tích...",
    loadFailed: "Không thể tải kết quả phân tích.",
    retry: "Thử lại",
    levelSubmittable: "Sẵn sàng ứng tuyển",
    levelNeedsPolish: "Sẵn sàng sau khi chỉnh sửa",
    levelNotSubmittable: "Vẫn cần hoàn thiện",
    qualityScore: (n) => `Mức độ hoàn thiện ${n} điểm`,
    readinessScore: (n) => `Sẵn sàng nộp ${n} điểm`,
    groupRequired: "Cần sửa bắt buộc",
    groupRecommended: "Nên sửa",
    groupOptional: "Tùy chọn",
    disclaimer: "Kết quả này không đảm bảo trúng tuyển, chỉ là hướng dẫn giúp bạn ứng tuyển tốt hơn."
  },
  ja: {
    diagnosing: "診断中...",
    loadFailed: "診断を読み込めませんでした。",
    retry: "再試行",
    levelSubmittable: "応募可能",
    levelNeedsPolish: "改善すれば応募可能",
    levelNotSubmittable: "まだ改善が必要",
    qualityScore: (n) => `完成度 ${n}点`,
    readinessScore: (n) => `応募準備 ${n}点`,
    groupRequired: "必須の修正",
    groupRecommended: "おすすめの修正",
    groupOptional: "任意の修正",
    disclaimer: "合格を保証するものではなく、より良い応募を助けるためのガイドです。"
  },
  id: {
    diagnosing: "Menganalisis...",
    loadFailed: "Tidak dapat memuat hasil diagnosis.",
    retry: "Coba lagi",
    levelSubmittable: "Siap melamar",
    levelNeedsPolish: "Siap setelah diperbaiki",
    levelNotSubmittable: "Masih perlu diperbaiki",
    qualityScore: (n) => `Kelengkapan ${n} poin`,
    readinessScore: (n) => `Kesiapan melamar ${n} poin`,
    groupRequired: "Wajib diperbaiki",
    groupRecommended: "Disarankan",
    groupOptional: "Opsional",
    disclaimer: "Ini tidak menjamin diterima, hanya panduan untuk membantu Anda melamar lebih baik."
  }
};

export function useDiagnosisResultCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}
