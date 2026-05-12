import type { PlatformLocale } from "./auth-messages";

/**
 * Broad job-role categories used as the single source of truth for the
 * `preferredJobRole` field on a Position. Internal (Aply) positions pick one of
 * these via a select; the Wanted importer normalizes `category_tags.parent_tag.title`
 * onto the same Korean labels, so the public `/positions` filter chips end up
 * aligned across sources.
 *
 * Stored values are the Korean labels (same as Wanted parent_tag.title) — the
 * `jobCategoryLabel()` helper renders the localized display name.
 */
export const JOB_CATEGORIES = [
  "개발",
  "경영·비즈니스",
  "마케팅·광고",
  "디자인",
  "영업",
  "고객 서비스",
  "미디어·콘텐츠",
  "게임 제작",
  "HR·총무",
  "금융",
  "제조·생산",
  "의료·바이오",
  "교육",
  "법률·법무",
  "식음료",
  "건설·시설",
  "물류·무역",
  "엔지니어링",
  "공공·복지",
  "기타"
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

const JOB_CATEGORY_LABELS: Record<JobCategory, Record<PlatformLocale, string>> = {
  "개발": { ko: "개발", en: "Development", "zh-CN": "开发", vi: "Phát triển", ja: "開発", id: "Pengembangan" },
  "경영·비즈니스": { ko: "경영·비즈니스", en: "Management & Business", "zh-CN": "管理与商业", vi: "Quản lý & Kinh doanh", ja: "経営・ビジネス", id: "Manajemen & Bisnis" },
  "마케팅·광고": { ko: "마케팅·광고", en: "Marketing & Advertising", "zh-CN": "市场营销与广告", vi: "Marketing & Quảng cáo", ja: "マーケティング・広告", id: "Pemasaran & Periklanan" },
  "디자인": { ko: "디자인", en: "Design", "zh-CN": "设计", vi: "Thiết kế", ja: "デザイン", id: "Desain" },
  "영업": { ko: "영업", en: "Sales", "zh-CN": "销售", vi: "Kinh doanh", ja: "営業", id: "Penjualan" },
  "고객 서비스": { ko: "고객 서비스", en: "Customer Service", "zh-CN": "客户服务", vi: "Dịch vụ khách hàng", ja: "カスタマーサービス", id: "Layanan Pelanggan" },
  "미디어·콘텐츠": { ko: "미디어·콘텐츠", en: "Media & Content", "zh-CN": "媒体与内容", vi: "Truyền thông & Nội dung", ja: "メディア・コンテンツ", id: "Media & Konten" },
  "게임 제작": { ko: "게임 제작", en: "Game Development", "zh-CN": "游戏开发", vi: "Phát triển Game", ja: "ゲーム制作", id: "Pengembangan Game" },
  "HR·총무": { ko: "HR·총무", en: "HR & General Affairs", "zh-CN": "人力资源与总务", vi: "Nhân sự & Hành chính", ja: "HR・総務", id: "HR & Administrasi" },
  "금융": { ko: "금융", en: "Finance", "zh-CN": "金融", vi: "Tài chính", ja: "金融", id: "Keuangan" },
  "제조·생산": { ko: "제조·생산", en: "Manufacturing", "zh-CN": "制造与生产", vi: "Sản xuất", ja: "製造・生産", id: "Manufaktur" },
  "의료·바이오": { ko: "의료·바이오", en: "Medical & Bio", "zh-CN": "医疗与生物", vi: "Y tế & Sinh học", ja: "医療・バイオ", id: "Medis & Bio" },
  "교육": { ko: "교육", en: "Education", "zh-CN": "教育", vi: "Giáo dục", ja: "教育", id: "Pendidikan" },
  "법률·법무": { ko: "법률·법무", en: "Legal", "zh-CN": "法律", vi: "Pháp lý", ja: "法律・法務", id: "Hukum" },
  "식음료": { ko: "식음료", en: "Food & Beverage", "zh-CN": "餐饮", vi: "Thực phẩm & Đồ uống", ja: "食品・飲料", id: "Makanan & Minuman" },
  "건설·시설": { ko: "건설·시설", en: "Construction & Facilities", "zh-CN": "建筑与设施", vi: "Xây dựng & Cơ sở", ja: "建設・施設", id: "Konstruksi & Fasilitas" },
  "물류·무역": { ko: "물류·무역", en: "Logistics & Trade", "zh-CN": "物流与贸易", vi: "Logistics & Thương mại", ja: "物流・貿易", id: "Logistik & Perdagangan" },
  "엔지니어링": { ko: "엔지니어링", en: "Engineering", "zh-CN": "工程", vi: "Kỹ thuật", ja: "エンジニアリング", id: "Teknik" },
  "공공·복지": { ko: "공공·복지", en: "Public & Welfare", "zh-CN": "公共与福利", vi: "Công cộng & Phúc lợi", ja: "公共・福祉", id: "Publik & Kesejahteraan" },
  "기타": { ko: "기타", en: "Other", "zh-CN": "其他", vi: "Khác", ja: "その他", id: "Lainnya" }
};

export function jobCategoryLabel(category: string | null | undefined, locale: PlatformLocale): string {
  if (!category) return "";
  if ((JOB_CATEGORIES as readonly string[]).includes(category)) {
    return JOB_CATEGORY_LABELS[category as JobCategory][locale];
  }
  return category;
}
