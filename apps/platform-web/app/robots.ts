import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "https://staging.aply.global" : "https://aply.global");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Allow the public site, but keep the internal dashboards and the
        // auth/account flow out of the index so they don't compete with the
        // marketing pages for branded queries.
        allow: "/",
        disallow: ["/dashboard", "/account", "/auth", "/api"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
