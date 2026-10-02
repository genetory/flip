// 취업 가이드 공개 주소 목록(서버에서 쓰는 메타).
//
// 본문은 lib/talent/insights-content.ts 에 이미 6개 언어로 작성돼 있다 — 지금까지는 팝업으로만
// 보여 줘서 주소도 검색 노출도 없었다. 여기서 slug 별 메타(제목·설명·발행일·검토일·관련 항목)를
// 두고, 상세 페이지가 그 본문을 같은 내용으로 렌더한다.
//
// 키워드만 바꾼 양산 페이지를 만들지 않는다 — 실제로 쓰여 있는 글에만 주소를 준다.

export type InsightCategory = "jobs" | "resume" | "interview" | "visa";

export type InsightMeta = {
  slug: string;
  category: InsightCategory;
  /** 검색결과용 제목(한국어). 화면 제목과 같은 내용을 쓴다. */
  titleKo: string;
  descKo: string;
  /** 글이 처음 공개된 날(ISO). 추정하지 않는다. */
  publishedAt: string;
  /** 사람이 마지막으로 내용을 확인한 날. 없으면 화면에 "미확인"으로 적는다. */
  reviewedAt: string | null;
  reviewedBy: string | null;
  /** 관련 비자 코드 — 상세에서 비자 안내로 연결한다. */
  relatedVisas?: string[];
  /** 관련 공고를 찾을 검색어 — 상세 CTA 가 이 검색어로 공고 목록을 연다. */
  relatedJobQuery?: string;
};

export const INSIGHTS: InsightMeta[] = [
  {
    slug: "software-developer",
    category: "jobs",
    titleKo: "개발자는 무슨 일을 하나요?",
    descKo: "개발자가 실제로 하는 일과, 신입이 준비하면 좋은 것들을 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null,
    relatedJobQuery: "개발"
  },
  {
    slug: "marketer",
    category: "jobs",
    titleKo: "마케터는 무슨 일을 하나요?",
    descKo: "마케터의 실제 업무와 준비 방법을 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null,
    relatedJobQuery: "마케팅"
  },
  {
    slug: "designer-portfolio",
    category: "resume",
    titleKo: "디자이너 포트폴리오, 뭘 넣죠?",
    descKo: "포트폴리오에 무엇을 담아야 하는지, 어떤 순서로 보여줄지 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null,
    relatedJobQuery: "디자인"
  },
  {
    slug: "product-manager",
    category: "jobs",
    titleKo: "기획·PM은 무슨 일을 하나요?",
    descKo: "기획자·PM 이 하는 일과 신입이 준비할 것을 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null,
    relatedJobQuery: "기획"
  },
  {
    slug: "choosing-first-job",
    category: "jobs",
    titleKo: "첫 직장, 어떻게 고르죠?",
    descKo: "연봉보다 먼저 봐야 할 것들 — 첫 직장을 고르는 기준을 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null
  },
  {
    slug: "no-experience-appeal",
    category: "resume",
    titleKo: "경력이 없는데 어떻게 어필하죠?",
    descKo: "경력이 없을 때 이력서에서 무엇을 보여줄 수 있는지 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null
  },
  {
    slug: "is-internship-needed",
    category: "jobs",
    titleKo: "인턴, 꼭 해야 할까요?",
    descKo: "인턴 경험이 필요한 경우와 대체할 수 있는 방법을 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null,
    relatedVisas: ["D-2", "D-10"]
  },
  {
    slug: "interview-preparation",
    category: "interview",
    titleKo: "면접, 뭘 준비하죠?",
    descKo: "면접에서 자주 묻는 것과 준비 순서를 정리했어요.",
    publishedAt: "2026-08-13",
    reviewedAt: null,
    reviewedBy: null
  }
];

export const INSIGHT_CATEGORIES: InsightCategory[] = ["jobs", "resume", "interview", "visa"];

export function insightsByCategory(category: InsightCategory): InsightMeta[] {
  return INSIGHTS.filter((x) => x.category === category);
}

export function findInsight(category: string, slug: string): InsightMeta | null {
  return INSIGHTS.find((x) => x.category === category && x.slug === slug) ?? null;
}

export function categoryLabelKo(c: InsightCategory): string {
  return c === "jobs" ? "직무" : c === "resume" ? "이력서" : c === "interview" ? "면접" : "비자";
}

export function insightPath(x: InsightMeta): string {
  return `/talent/insights/${x.category}/${x.slug}`;
}
