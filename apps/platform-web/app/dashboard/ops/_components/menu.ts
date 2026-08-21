// 아이콘은 Phosphor 로 통일. 기존 lucide 이름으로 alias 해 사용처는 그대로 둔다.
import {
  Warning as AlertTriangle,
  ChartBar as BarChart3,
  Robot as Bot,
  Briefcase,
  Buildings as Building2,
  ListChecks as ClipboardCheck,
  ClipboardText as ClipboardList,
  Database,
  FileText,
  ReadCvLogo as FileUser,
  GraduationCap,
  Handshake,
  House as Home,
  Tray as Inbox,
  Megaphone,
  Scroll as ScrollText,
  Gear as Settings,
  Shield,
  Globe,
  Sparkle as Sparkles,
  Stamp,
  Star,
  Target,
  UserCheck,
  Users,
  Wallet,
  FlowArrow as Workflow,
  type Icon as LucideIcon
} from "@phosphor-icons/react";

export type MenuLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type MenuGroup = {
  title: string;
  links: MenuLink[];
};

// Ops console menu — deduped + grouped by semantic concern.
//
// Hierarchy:
//   홈                — landing page
//   오늘 할 일          — inbox-style pages an operator checks every day
//   이벤트              — campaign/event pages (separated so new events stand out)
//   사용자              — every "who" page (all users / partner users)
//   파트너 & 포지션      — partner orgs + the positions they post
//   채용 진행            — post-match workflow (applications, interviews, …)
//   분석 & 소통          — analytics + outbound communications
//   시스템              — infra + admin tools (auto-collapsed by default)
//
// Removed from menu:
//   "관리자 사용자" — same /ops/users endpoint as "전체 사용자"; the simpler
//     page is reachable by direct URL when needed but no longer listed.
//   "후보자" — separate candidate-detail page kept in the repo (reachable by
//     direct URL at /dashboard/ops/operations/candidates) but unlisted —
//     STUDENT users are already filterable from "전체 사용자", so the extra
//     menu entry was duplication. Drill into a STUDENT row to reach the
//     candidate-detail editor.
//   "매칭 로그" / "이메일" — pages kept under /dashboard/ops/support/matching-logs
//     and /dashboard/ops/support/emails for direct-URL access, but no longer
//     in the sidebar — current ops workflow doesn't reach for them.
export const opsDashboardMenuGroups: MenuGroup[] = [
  {
    title: "홈",
    links: [{ label: "대시보드", href: "/dashboard/ops", icon: Home }]
  },
  {
    // Career Launch 운영 — 별도 콘솔(/career-launch/ops)을 메인 운영콘솔 메뉴로 편입.
    title: "Career Launch",
    links: [
      { label: "Career Launch 대시보드", href: "/career-launch/ops", icon: GraduationCap },
      { label: "수강생", href: "/career-launch/ops/students", icon: Users },
      { label: "기수", href: "/career-launch/ops/cohorts", icon: ScrollText },
      { label: "콘텐츠", href: "/career-launch/ops/content", icon: FileText },
      { label: "프롬프트", href: "/career-launch/ops/prompts", icon: Sparkles },
      { label: "성과 리포트", href: "/career-launch/ops/report", icon: BarChart3 }
    ]
  },
  {
    title: "오늘 할 일",
    links: [
      { label: "검수 큐", href: "/dashboard/ops/operations/review-queue", icon: ClipboardCheck },
      { label: "포지션 수정 요청", href: "/dashboard/ops/operations/position-revisions", icon: Stamp },
      { label: "이슈 리포트", href: "/dashboard/ops/operations/issues", icon: AlertTriangle },
      { label: "매칭", href: "/dashboard/ops/operations/matching", icon: Target }
    ]
  },
  {
    title: "이벤트",
    links: [
      { label: "사주 이벤트", href: "/dashboard/ops/operations/saju-leads", icon: Sparkles },
      { label: "비자 이벤트", href: "/dashboard/ops/operations/visa-leads", icon: Globe },
      { label: "SGC × Aply 일경험 이벤트", href: "/dashboard/ops/operations/sgc-applications", icon: Handshake },
      { label: "한패스 × Aply 설문 이벤트", href: "/dashboard/ops/operations/hanpass-survey", icon: ClipboardList }
    ]
  },
  {
    title: "사용자",
    links: [
      { label: "전체 사용자", href: "/dashboard/ops/support/users", icon: Users },
      { label: "이력서", href: "/dashboard/ops/support/resumes", icon: FileUser },
      { label: "이력서 인재풀", href: "/dashboard/ops/operations/resume-pool", icon: UserCheck }
    ]
  },
  {
    title: "파트너 & 포지션",
    links: [
      { label: "파트너", href: "/dashboard/ops/partners/management", icon: Building2 },
      { label: "파트너 사용자", href: "/dashboard/ops/partners/users", icon: Users },
      { label: "직접등록 포지션", href: "/dashboard/ops/operations/direct-positions", icon: Briefcase },
      { label: "포지션", href: "/dashboard/ops/operations/positions", icon: Briefcase },
      { label: "프리미엄 포지션", href: "/dashboard/ops/operations/premium-positions", icon: Star }
    ]
  },
  {
    title: "채용 진행",
    links: [
      { label: "전체 지원 현황", href: "/dashboard/ops/operations/applications", icon: Inbox },
      { label: "인터뷰·진행", href: "/dashboard/ops/operations/interviews", icon: Workflow },
      { label: "과제 진행", href: "/dashboard/ops/operations/assignments", icon: FileText },
      { label: "프로그램", href: "/dashboard/ops/operations/programs", icon: ScrollText },
      { label: "학점 인정", href: "/dashboard/ops/operations/school-credit", icon: GraduationCap }
    ]
  },
  {
    title: "분석 & 소통",
    links: [
      { label: "커넥션 트래킹", href: "/dashboard/ops/support/connections", icon: Handshake },
      { label: "유입 경로", href: "/dashboard/ops/support/inflow", icon: BarChart3 },
      { label: "리포트", href: "/dashboard/ops/support/reports", icon: BarChart3 },
      { label: "공지사항", href: "/dashboard/ops/operations/announcements", icon: Megaphone }
    ]
  },
  {
    title: "시스템",
    links: [
      { label: "감사 로그", href: "/dashboard/ops/system/audit-log", icon: Shield },
      { label: "결제", href: "/dashboard/ops/system/payments", icon: Wallet },
      { label: "설정값", href: "/dashboard/ops/system/settings", icon: Settings },
      { label: "크롤링", href: "/dashboard/ops/system/crawlers", icon: Bot },
      { label: "데이터", href: "/dashboard/ops/system/data-management", icon: Database }
    ]
  }
];
