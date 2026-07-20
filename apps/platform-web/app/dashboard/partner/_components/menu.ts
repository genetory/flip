export type MenuLink = {
  label: string;
  href: string;
};

export type MenuGroup = {
  title: string;
  links: MenuLink[];
};

export const partnerDashboardMenuGroups: MenuGroup[] = [
  {
    title: "대시보드",
    links: [{ label: "대시보드 홈", href: "/dashboard/partner" }]
  },
  {
    title: "채용 관리",
    links: [
      { label: "포지션 관리", href: "/dashboard/partner/positions" },
      { label: "지원자 관리", href: "/dashboard/partner/applicants" },
      { label: "면접 일정", href: "/dashboard/partner/interviews" },
      { label: "과제 관리", href: "/dashboard/partner/assignments" },
      { label: "프로그램 관리", href: "/dashboard/partner/programs" }
    ]
  },
  {
    title: "분석",
    links: [{ label: "채용 리포트", href: "/dashboard/partner/reports" }]
  },
  {
    title: "회사 관리",
    links: [
      { label: "회사 정보/검증", href: "/dashboard/partner/company" },
      { label: "팀 멤버", href: "/dashboard/partner/team" },
      { label: "이슈 리포트", href: "/dashboard/partner/issues" },
      { label: "알림 설정", href: "/profile/notifications" }
    ]
  }
];
