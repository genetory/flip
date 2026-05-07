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
    title: "채용 관리",
    links: [
      { label: "포지션 관리", href: "/dashboard/positions" },
      { label: "지원자 관리", href: "/dashboard/applicants" }
    ]
  },
  {
    title: "회사 관리",
    links: [{ label: "회사 정보/검증", href: "/dashboard/company" }]
  }
];
