import type { PlatformLocale } from "./auth-messages";

// The Korean job-role taxonomy. These exact Korean strings are what the API
// stores in Position.preferredJobRole and what the saju LLM returns, so they
// are the canonical keys — we only localize the display labels.
export const JOB_ROLE_TAXONOMY = [
  "개발",
  "디자인",
  "기획·전략",
  "마케팅·광고",
  "영업",
  "고객서비스·리테일",
  "경영·비즈니스",
  "미디어",
  "교육",
  "법률·법집행기관",
  "금융",
  "의료·제약",
  "건설·생산",
  "연구·R&D",
  "HR·인사",
  "통·번역",
  "IT 운영·관리"
] as const;

// Display-only translation for the Korean job-role taxonomy.
export const JOB_ROLE_TRANSLATIONS: Partial<Record<PlatformLocale, Record<string, string>>> = {
  en: {
    "개발": "Engineering",
    "디자인": "Design",
    "기획·전략": "Planning & Strategy",
    "마케팅·광고": "Marketing & Advertising",
    "영업": "Sales",
    "고객서비스·리테일": "Customer Service & Retail",
    "경영·비즈니스": "Business & Operations",
    "미디어": "Media",
    "교육": "Education",
    "법률·법집행기관": "Legal",
    "금융": "Finance",
    "의료·제약": "Healthcare & Pharma",
    "건설·생산": "Construction & Manufacturing",
    "연구·R&D": "Research & R&D",
    "HR·인사": "HR",
    "통·번역": "Interpretation & Translation",
    "IT 운영·관리": "IT Operations"
  },
  "zh-CN": {
    "개발": "开发",
    "디자인": "设计",
    "기획·전략": "策划与战略",
    "마케팅·광고": "市场营销与广告",
    "영업": "销售",
    "고객서비스·리테일": "客户服务与零售",
    "경영·비즈니스": "经营与商务",
    "미디어": "媒体",
    "교육": "教育",
    "법률·법집행기관": "法律",
    "금융": "金融",
    "의료·제약": "医疗与制药",
    "건설·생산": "建设与生产",
    "연구·R&D": "研究与研发",
    "HR·인사": "人力资源",
    "통·번역": "口译与翻译",
    "IT 운영·관리": "IT 运营"
  },
  vi: {
    "개발": "Phát triển",
    "디자인": "Thiết kế",
    "기획·전략": "Lập kế hoạch & Chiến lược",
    "마케팅·광고": "Marketing & Quảng cáo",
    "영업": "Kinh doanh",
    "고객서비스·리테일": "Dịch vụ khách hàng & Bán lẻ",
    "경영·비즈니스": "Quản trị & Kinh doanh",
    "미디어": "Truyền thông",
    "교육": "Giáo dục",
    "법률·법집행기관": "Pháp lý",
    "금융": "Tài chính",
    "의료·제약": "Y tế & Dược phẩm",
    "건설·생산": "Xây dựng & Sản xuất",
    "연구·R&D": "Nghiên cứu & R&D",
    "HR·인사": "Nhân sự",
    "통·번역": "Phiên dịch",
    "IT 운영·관리": "Vận hành IT"
  },
  ja: {
    "개발": "開発",
    "디자인": "デザイン",
    "기획·전략": "企画・戦略",
    "마케팅·광고": "マーケティング・広告",
    "영업": "営業",
    "고객서비스·리테일": "カスタマーサービス・小売",
    "경영·비즈니스": "経営・ビジネス",
    "미디어": "メディア",
    "교육": "教育",
    "법률·법집행기관": "法務",
    "금융": "金融",
    "의료·제약": "医療・製薬",
    "건설·생산": "建設・生産",
    "연구·R&D": "研究・R&D",
    "HR·인사": "人事",
    "통·번역": "通訳・翻訳",
    "IT 운영·관리": "IT運用"
  },
  id: {
    "개발": "Engineering",
    "디자인": "Desain",
    "기획·전략": "Perencanaan & Strategi",
    "마케팅·광고": "Pemasaran & Iklan",
    "영업": "Sales",
    "고객서비스·리테일": "Layanan Pelanggan & Ritel",
    "경영·비즈니스": "Manajemen & Bisnis",
    "미디어": "Media",
    "교육": "Pendidikan",
    "법률·법집행기관": "Hukum",
    "금융": "Keuangan",
    "의료·제약": "Kesehatan & Farmasi",
    "건설·생산": "Konstruksi & Produksi",
    "연구·R&D": "Riset & R&D",
    "HR·인사": "HR",
    "통·번역": "Penerjemahan",
    "IT 운영·관리": "Operasi IT"
  }
};

export function translateRole(role: string, locale: PlatformLocale): string {
  if (locale === "ko") return role;
  return JOB_ROLE_TRANSLATIONS[locale]?.[role] ?? role;
}
