// v2 취업 가이드 글 목록 — 기존 글(insights-content: 직무·노하우 / home-content: 취업 가이드)을 한 줄로 모아
// v2 읽기 화면(/v2/guide/[slug])에서 쓰는 주소·분류·읽는 시간을 붙인다. 본문은 기존 6개 언어 그대로.
import type { PlatformT } from "../i18n";
import { careerGuides, type CareerGuide } from "./home-content";
import { jobHunting, roleInsights } from "./insights-content";
import { INSIGHTS } from "../insights/catalog";
import { JOB_TAXONOMY } from "./job-taxonomy";

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
  return m ? `/talent/insights/${m.slug}` : "/talent/insights";
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
  if (href === "/talent/jobs" || href.startsWith("/talent/jobs?")) return "/talent/jobs";
  if (href.startsWith("/talent/career/interviews")) return "/talent/career/interviews";
  return href;
}

// ── 나에게 맞는 글 ─────────────────────────────
// 관심 직무(표준 직무 분류의 소분류 이름)를 대분류로 묶어 직무 글을 고른다. 예전 값(예: "DevOps/인프라")도 낱말로 잡는다.
const ROLE_GUIDE: { majors: string[]; words: RegExp; slug: string }[] = [
  { majors: ["개발", "데이터·AI"], words: /개발|devops|인프라|데이터|엔지니어|ai|ml/i, slug: "software-developer" },
  { majors: ["마케팅·광고", "미디어·콘텐츠"], words: /마케팅|마케터|광고|콘텐츠|pr|홍보/i, slug: "marketer" },
  { majors: ["디자인"], words: /디자인|디자이너|ux|ui/i, slug: "designer-portfolio" },
  { majors: ["기획·PM"], words: /기획|pm|po|프로덕트/i, slug: "product-manager" }
];
function majorOf(minor: string): string | null {
  for (const m of JOB_TAXONOMY) if (m.middles.some((mid) => mid.minors.includes(minor))) return m.label;
  return null;
}

/** 관심 직무에 맞는 직무 글 + 누구에게나 도움 되는 글. 관심 직무가 없으면 처음 시작용 글. */
export function personalGuides(guides: V2Guide[], interests: string[]): { personal: boolean; items: V2Guide[] } {
  const bySlug = (s: string) => guides.find((g) => g.slug === s);
  if (!interests.length) {
    const items = ["find-your-role", "read-job-postings", "experience-to-resume"].map(bySlug).filter((g): g is V2Guide => !!g);
    return { personal: false, items };
  }
  const roleSlugs = ROLE_GUIDE.filter((r) => interests.some((i) => { const mj = majorOf(i); return mj ? r.majors.includes(mj) : r.words.test(i); })).map((r) => r.slug);
  const slugs = [...new Set([...roleSlugs, "no-experience-appeal", "interview-preparation"])];
  return { personal: true, items: slugs.map(bySlug).filter((g): g is V2Guide => !!g).slice(0, 5) };
}

// ── 읽음 표시(이 브라우저에만) ─────────────────────────────
const READ_KEY = "aply.v2.guide.read";
export function readGuideSlugs(): string[] {
  try {
    const v = JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function markGuideRead(slug: string): void {
  try {
    const cur = readGuideSlugs();
    if (!cur.includes(slug)) window.localStorage.setItem(READ_KEY, JSON.stringify([...cur, slug]));
  } catch {
    /* 저장소를 못 쓰면 표시만 안 된다 */
  }
}
