export type MenuLink = {
  label: string;
  href: string;
};

export type MenuGroup = {
  title: string;
  links: MenuLink[];
};

export const opsDashboardMenuGroups: MenuGroup[] = [
  {
    title: "대시보드",
    links: [{ label: "대시보드 홈", href: "/dashboard/ops" }]
  },
  {
    title: "파트너",
    links: [
      { label: "파트너 관리", href: "/dashboard/ops/partners/management" },
      { label: "파트너 사용자 관리", href: "/dashboard/ops/partners/users" }
    ]
  },
  {
    title: "운영",
    links: [
      { label: "검수 큐", href: "/dashboard/ops/operations/review-queue" },
      { label: "이슈 리포트", href: "/dashboard/ops/operations/issues" },
      { label: "전체 지원 현황", href: "/dashboard/ops/operations/applications" },
      { label: "후보자 관리", href: "/dashboard/ops/operations/candidates" },
      { label: "사주 이벤트 후보 Pool", href: "/dashboard/ops/operations/saju-leads" },
      { label: "프리미엄 포지션 관리", href: "/dashboard/ops/operations/premium-positions" },
      { label: "포지션 관리", href: "/dashboard/ops/operations/positions" },
      { label: "포지션 수정 관리", href: "/dashboard/ops/operations/position-revisions" },
      { label: "매칭 관리", href: "/dashboard/ops/operations/matching" },
      { label: "인터뷰/진행 현황", href: "/dashboard/ops/operations/interviews" },
      { label: "과제 진행 현황", href: "/dashboard/ops/operations/assignments" },
      { label: "프로그램 진행", href: "/dashboard/ops/operations/programs" },
      { label: "학점 인정 검토", href: "/dashboard/ops/operations/school-credit" },
      { label: "공지사항 관리", href: "/dashboard/ops/operations/announcements" }
    ]
  },
  {
    title: "운영 지원",
    links: [
      { label: "전체 사용자 관리", href: "/dashboard/ops/support/users" },
      { label: "유입 경로 관리", href: "/dashboard/ops/support/inflow" },
      { label: "이메일 관리", href: "/dashboard/ops/support/emails" },
      { label: "리포트", href: "/dashboard/ops/support/reports" },
      { label: "매칭 로그", href: "/dashboard/ops/support/matching-logs" }
    ]
  },
  {
    title: "시스템",
    links: [
      { label: "관리자 사용자 관리", href: "/dashboard/ops/system/admin-users" },
      { label: "감사 로그", href: "/dashboard/ops/system/audit-log" },
      { label: "결제 관리", href: "/dashboard/ops/system/payments" },
      { label: "설정값 관리", href: "/dashboard/ops/system/settings" },
      { label: "크롤링", href: "/dashboard/ops/system/crawlers" },
      { label: "데이터 관리", href: "/dashboard/ops/system/data-management" }
    ]
  }
];
