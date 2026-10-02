import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // 내부 콘솔 — 브랜드 검색에서 공개 페이지와 경쟁하지 않게 한다.
          "/dashboard",
          "/admin",
          "/career-launch/ops",
          "/career-launch/ops-report",
          "/career-launch/ops-print",
          // 계정·인증 흐름
          "/account",
          "/auth",
          "/api",
          "/verify-email",
          // 개인 문서 공유 링크 — 토큰만 알면 열리는 사적 콘텐츠다. 색인되면 안 된다.
          "/p/",
          "/resume/share",
          "/cover-letter/share"
        ]
      }
    ],
    // sitemap index 하나만 알린다 — 하위 sitemap 은 index 안에서 가리킨다.
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
