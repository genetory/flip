// 로그인 후 Talent 앱의 내비게이션 구조.
// 핵심 탭 4개(홈/내 커리어/포지션 탐색/취업 소식) + 계정 설정(프로필 메뉴).
import { House, Compass, Briefcase, Newspaper, ClipboardText, Heart, type Icon } from "@phosphor-icons/react";

export const talentAppRoutes = {
  // 홈(GNB 대시보드)과 랜딩(공개)을 분리. /talent = 랜딩, /talent/home = 홈.
  home: "/talent/home",
  onboarding: "/talent/onboarding",
  career: "/talent/career",
  experiences: "/talent/career/experiences",
  profile: "/talent/career/profile",
  history: "/talent/career/history",
  resume: "/talent/career/resume",
  resumePreview: "/talent/career/resume/preview",
  resumes: "/talent/career/resumes",
  cover: "/talent/career/cover",
  coverPreview: "/talent/career/cover/preview",
  coverLetters: "/talent/career/cover-letters",
  interviews: "/talent/career/interviews",
  feed: "/talent/feed",
  jobs: "/talent/jobs",
  insights: "/talent/insights",
  applications: "/talent/applications",
  connections: "/talent/connections",
  assignments: "/talent/assignments",
  programs: "/talent/programs",
  notifications: "/talent/notifications",
  settings: "/talent/settings"
} as const;

export type TalentTabKey = "feed" | "home" | "career" | "jobs" | "insights" | "applications";

export interface TalentNavItem {
  key: TalentTabKey;
  label: string;
  href: string;
  icon: Icon;
}

// 하단/상단 공용 메인 탭.
// 피드 자리는 '나에게 관심 준 회사'(관심)로 대체 — 라우트는 /talent/feed 재사용.
export const talentMainNav: TalentNavItem[] = [
  { key: "home", label: "홈", href: talentAppRoutes.home, icon: House },
  { key: "career", label: "내 커리어", href: talentAppRoutes.career, icon: Compass },
  { key: "jobs", label: "포지션 탐색", href: talentAppRoutes.jobs, icon: Briefcase },
  { key: "applications", label: "지원 현황", href: talentAppRoutes.applications, icon: ClipboardText },
  { key: "feed", label: "관심 회사", href: talentAppRoutes.feed, icon: Heart },
  { key: "insights", label: "취업 가이드", href: talentAppRoutes.insights, icon: Newspaper }
];

// 현재 경로가 해당 탭에 속하는지 판단.
export function isTabActive(pathname: string, href: string): boolean {
  if (href === talentAppRoutes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// GNB 네비 라벨 다국어 — 데이터의 한국어 label 대신 화면에서 이 훅으로 번역해 노출.
import { usePlatformT } from "../i18n";
export function useTalentNavLabel(): (key: TalentTabKey) => string {
  const t = usePlatformT();
  return (key) => {
    switch (key) {
      case "home":
        return t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda");
      case "career":
        return t("내 커리어", "Career", "我的职业", "Sự nghiệp", "キャリア", "Karier");
      case "jobs":
        return t("포지션 탐색", "Jobs", "职位", "Việc làm", "求人", "Lowongan");
      case "applications":
        return t("지원 현황", "Applied", "申请", "Ứng tuyển", "応募", "Lamaran");
      case "insights":
        return t("취업 가이드", "Guide", "指南", "Hướng dẫn", "ガイド", "Panduan");
      case "feed":
        return t("관심 회사", "Interested", "关注公司", "Công ty QT", "関心企業", "Perusahaan");
      default:
        return key;
    }
  };
}
