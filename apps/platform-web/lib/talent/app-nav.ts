// 로그인 후 Talent 앱의 내비게이션 구조.
// 핵심 탭 4개(홈/내 커리어/채용공고/지원) + 계정 설정(프로필 메뉴).
import { House, Compass, Briefcase, PaperPlaneTilt, ChatCircleText, type Icon } from "@phosphor-icons/react";

export const talentAppRoutes = {
  // 홈(GNB 대시보드)과 랜딩(공개)을 분리. /talent = 랜딩, /talent/home = 홈.
  home: "/talent/home",
  onboarding: "/talent/onboarding",
  career: "/talent/career",
  chat: "/talent/career/chat",
  experiences: "/talent/career/experiences",
  profile: "/talent/career/profile",
  resume: "/talent/career/resume",
  resumePreview: "/talent/career/resume/preview",
  resumes: "/talent/career/resumes",
  cover: "/talent/career/cover",
  coverPreview: "/talent/career/cover/preview",
  coverLetters: "/talent/career/cover-letters",
  interviews: "/talent/career/interviews",
  feed: "/talent/feed",
  jobs: "/talent/jobs",
  applications: "/talent/applications",
  notifications: "/talent/notifications",
  settings: "/talent/settings"
} as const;

export type TalentTabKey = "feed" | "home" | "career" | "jobs" | "applications";

export interface TalentNavItem {
  key: TalentTabKey;
  label: string;
  href: string;
  icon: Icon;
}

// 하단/상단 공용 메인 탭.
export const talentMainNav: TalentNavItem[] = [
  { key: "home", label: "홈", href: talentAppRoutes.home, icon: House },
  { key: "feed", label: "피드", href: talentAppRoutes.feed, icon: ChatCircleText },
  { key: "career", label: "내 커리어", href: talentAppRoutes.career, icon: Compass },
  { key: "jobs", label: "채용공고", href: talentAppRoutes.jobs, icon: Briefcase },
  { key: "applications", label: "지원", href: talentAppRoutes.applications, icon: PaperPlaneTilt }
];

// 현재 경로가 해당 탭에 속하는지 판단.
export function isTabActive(pathname: string, href: string): boolean {
  if (href === talentAppRoutes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
