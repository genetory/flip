// 공개 페이지 SEO 공용 헬퍼.
//
// 왜 필요한가: app/layout.tsx 가 `alternates.canonical = "/"` 를 들고 있었고 Next.js 는
// 부모의 canonical 을 자식이 그대로 상속한다. 그래서 공개 페이지 전부(공고 12,000여 개 포함)가
// 홈페이지를 canonical 로 선언했고 검색엔진이 전부 "홈의 중복"으로 처리했다.
// 페이지마다 자기 canonical 을 선언하게 만드는 것이 이 파일의 목적이다.
import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "https://staging.aply.global" : "https://aply.global");

/** 사이트 기본 OG 이미지(1200×630). 페이지가 따로 주지 않으면 이걸 쓴다. */
export const DEFAULT_OG_IMAGE = "/img_meta_home.webp";

/** 경로(앞에 /) → 절대 URL. 쿼리스트링은 canonical 에서 의도적으로 제거한다. */
export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean === "/" ? "" : clean}`;
}

export type PageSeoInput = {
  /** canonical 로 쓸 경로. 예: "/talent/jobs" */
  path: string;
  /** <title>. 루트 template("%s | Aply")이 붙으므로 "| Aply" 를 직접 넣지 않는다. */
  title: string;
  description: string;
  /** 절대 경로(/img_x.webp) 또는 완전한 URL. */
  ogImage?: string;
  /** 색인 제외 — 내용이 부족한 공고, 개인 공유 페이지 등. */
  noindex?: boolean;
  ogType?: "website" | "article";
  /**
   * 로케일별 URL 이 생긴 뒤에만 채운다. 같은 URL 을 ko/en 양쪽으로 가리키면
   * Search Console 의 "hreflang return tag" 경고가 다시 생기므로, 서로 다른 URL 이
   * 실제로 있을 때만 넘긴다. 예: { ko: "/ko/jobs", en: "/en/jobs" }
   */
  languages?: Partial<Record<"ko" | "en", string>>;
  /** 기사형 콘텐츠의 발행·수정 시각(있으면 OG article 로 내보낸다). */
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * 공개 페이지용 Metadata. canonical·OG·Twitter·robots 를 한 번에 맞춘다.
 * noindex 일 때는 canonical 을 함께 주더라도 색인하지 않는다(내용 부족 공고 등).
 */
export function pageSeo(input: PageSeoInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = input.ogImage ?? DEFAULT_OG_IMAGE;
  const languages = input.languages
    ? Object.fromEntries(Object.entries(input.languages).map(([k, v]) => [k, absoluteUrl(v as string)]))
    : undefined;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
      ...(languages ? { languages } : {})
    },
    ...(input.noindex
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    openGraph: {
      type: input.ogType ?? "website",
      siteName: "Aply",
      title: input.title,
      description: input.description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image]
    }
  };
}

/** 사람이 읽을 길이로 자른다(검색결과 잘림 방지). 문장 중간이면 말줄임. */
export function clampDescription(text: string, max = 155): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}
