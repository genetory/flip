export type MenuLink = {
  label: string;
  href: string;
};

export type MenuGroup = {
  title: string;
  links: MenuLink[];
};

export const dashboardMenuGroups: MenuGroup[] = [
  {
    title: "대시보드",
    links: [{ label: "대시보드 홈", href: "/dashboard" }]
  },
  {
    title: "파트너",
    links: [
      { label: "파트너 관리", href: "/dashboard/partners/management" },
      { label: "파트너 사용자 관리", href: "/dashboard/partners/users" }
    ]
  },
  {
    title: "운영",
    links: [
      { label: "후보자 관리", href: "/dashboard/operations/candidates" },
      { label: "프리미엄 포지션 관리", href: "/dashboard/operations/premium-positions" },
      { label: "포지션 관리", href: "/dashboard/operations/positions" },
      { label: "포지션 수정 관리", href: "/dashboard/operations/position-revisions" },
      { label: "매칭 관리", href: "/dashboard/operations/matching" },
      { label: "인터뷰/진행 현황", href: "/dashboard/operations/interviews" }
    ]
  },
  {
    title: "운영 지원",
    links: [
      { label: "전체 사용자 관리", href: "/dashboard/support/users" },
      { label: "유입 경로 관리", href: "/dashboard/support/inflow" },
      { label: "이메일 관리", href: "/dashboard/support/emails" },
      { label: "리포트", href: "/dashboard/support/reports" },
      { label: "매칭 로그", href: "/dashboard/support/matching-logs" }
    ]
  },
  {
    title: "시스템",
    links: [
      { label: "관리자 사용자 관리", href: "/dashboard/system/admin-users" },
      { label: "결제 관리", href: "/dashboard/system/payments" },
      { label: "설정값 관리", href: "/dashboard/system/settings" }
    ]
  }
];
