// 파트너(기업) 모던 서비스 라우트/내비 — 탤런트(/talent/*)와 같은 결의 파트너 앱(/partner/*).
export const partnerRoutes = {
  landing: "/partner", // 공개 파트너 랜딩(로그인 전)
  home: "/partner/home", // 앱 홈(로그인 후)
  talent: "/partner/talent", // 인재 검색(인재풀)
  positions: "/partner/positions",
  positionNew: "/partner/positions/new",
  applicants: "/partner/applicants",
  company: "/partner/company",
  notifications: "/partner/notifications",
  settings: "/partner/settings", // 내 프로필(개인 계정)
  profile: "/partner/profile" // 개인 프로필 상세(계정 기본 정보)
} as const;

export interface PartnerNavItem {
  key: string;
  label: string;
  href: string;
}

export const partnerMainNav: PartnerNavItem[] = [
  { key: "home", label: "홈", href: partnerRoutes.home },
  { key: "talent", label: "인재 검색", href: partnerRoutes.talent },
  { key: "positions", label: "공고 관리", href: partnerRoutes.positions },
  { key: "applicants", label: "지원자 관리", href: partnerRoutes.applicants },
  { key: "company", label: "회사 프로필", href: partnerRoutes.company }
];

export function isPartnerTabActive(pathname: string, href: string): boolean {
  if (href === partnerRoutes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 파트너 GNB 네비 라벨 다국어(공간 고려 짧게).
import { usePlatformT } from "../i18n";
export function usePartnerNavLabel(): (key: string) => string {
  const t = usePlatformT();
  return (key) => {
    switch (key) {
      case "home":
        return t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda");
      case "talent":
        return t("인재 검색", "Talent", "人才搜索", "Nhân tài", "人材検索", "Talenta");
      case "positions":
        return t("공고 관리", "Jobs", "职位管理", "Tin đăng", "求人管理", "Lowongan");
      case "applicants":
        return t("지원자 관리", "Applicants", "申请人", "Ứng viên", "応募者", "Pelamar");
      case "company":
        return t("회사 프로필", "Company", "公司资料", "Công ty", "会社情報", "Perusahaan");
      default:
        return key;
    }
  };
}
