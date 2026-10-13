// v2 취업 가이드 글 목록 — 기존 글(insights-content: 직무·노하우 / home-content: 취업 가이드)을 한 줄로 모아
// v2 읽기 화면(/v2/guide/[slug])에서 쓰는 주소·분류·읽는 시간을 붙인다. 본문은 기존 6개 언어 그대로.
import type { PlatformT } from "../i18n";
import { careerGuides, type CareerGuide } from "./home-content";
import { jobHunting, roleInsights } from "./insights-content";
import { INSIGHTS } from "../insights/catalog";

export type GuideCat = "jobs" | "apply" | "interview";
export type V2Guide = { slug: string; cat: GuideCat; minutes: number; guide: CareerGuide };

// home-content 의 취업 가이드는 주소가 없어 v2 에서만 쓰는 slug 를 붙인다(순서 그대로).
const CAREER_GUIDE_META: { slug: string; cat: GuideCat }[] = [
  { slug: "find-your-role", cat: "jobs" },
  { slug: "read-job-postings", cat: "apply" },
  { slug: "experience-to-resume", cat: "apply" },
  { slug: "cover-letter-prompts", cat: "apply" },
  { slug: "interview-question-prep", cat: "interview" }
];

/** 홈의 취업 가이드 목록(careerGuides 순서)에서 바로 글로 가는 주소. */
export function careerGuideHref(i: number): string {
  const m = CAREER_GUIDE_META[i];
  return m ? `/v2/guide/${m.slug}` : "/v2/guide";
}

/** 읽는 시간(분) — 한국어 기준 분당 약 500자, 최소 1분. */
function readMinutes(g: CareerGuide): number {
  const chars = g.body.reduce((n, b) => n + b.heading.length + b.text.length, 0);
  return Math.max(1, Math.round(chars / 500));
}

export function v2Guides(t: PlatformT): V2Guide[] {
  // 공개 글(insights)은 카탈로그 분류를 따른다 — resume 는 '지원 노하우'로.
  const catOf = (slug: string): GuideCat => {
    const c = INSIGHTS.find((x) => x.slug === slug)?.category;
    return c === "interview" ? "interview" : c === "resume" ? "apply" : "jobs";
  };
  const insights = [...roleInsights(t), ...jobHunting(t)].filter((g) => g.slug).map((g) => ({ slug: g.slug!, cat: catOf(g.slug!), minutes: readMinutes(g), guide: g }));
  const home = careerGuides(t)
    .slice(0, CAREER_GUIDE_META.length)
    .map((g, i) => ({ ...CAREER_GUIDE_META[i], minutes: readMinutes(g), guide: g }));
  return [...home, ...insights];
}

export function guideCatLabel(t: PlatformT, c: GuideCat): string {
  if (c === "jobs") return t("직무", "Roles", "职位", "Nghề", "職種", "Peran");
  if (c === "apply") return t("지원 노하우", "Applying", "求职技巧", "Ứng tuyển", "応募のコツ", "Melamar");
  return t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara");
}

/** 분류별 색 — 카드·표지 바탕(연한 파스텔)과 글자 강조색. */
export const GUIDE_TONE: Record<GuideCat, { bg: string; ink: string }> = {
  jobs: { bg: "bg-[#edf1fd]", ink: "text-[#0b46e8]" },
  apply: { bg: "bg-[#f3eeff]", ink: "text-[#6d28d9]" },
  interview: { bg: "bg-[#fff4e8]", ink: "text-[#c2410c]" }
};

/** 글 끝 버튼 주소 — 기존 화면 주소를 v2 화면이 있으면 v2 로. */
export function toV2Href(href: string | undefined): string | undefined {
  if (!href) return undefined;
  if (href === "/talent/jobs" || href.startsWith("/talent/jobs?")) return "/v2/jobs";
  if (href.startsWith("/talent/career/interviews")) return "/v2/interviews";
  return href;
}
