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
