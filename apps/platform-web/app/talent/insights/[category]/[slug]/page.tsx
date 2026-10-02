// 취업 가이드 상세 — 고유 주소를 가진 글. 본문은 기존 가이드 콘텐츠를 그대로 쓴다.
// 데이터에 있는 slug 만 페이지가 된다(키워드만 바꾼 양산 페이지를 만들지 않는다).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TalentAppShell } from "../../../../../components/talent/app/TalentAppShell";
import { InsightArticle } from "../../../../../components/talent/insights/InsightArticle";
import { InsightView } from "../../../../../components/talent/insights/InsightView";
import { JsonLd } from "../../../../../components/seo/JsonLd";
import { breadcrumbJsonLd } from "../../../../../lib/seo-jsonld";
import { SITE_URL, absoluteUrl, pageSeo } from "../../../../../lib/seo";
import { INSIGHTS, categoryLabelKo, findInsight, insightPath } from "../../../../../lib/insights/catalog";

type Props = { params: Promise<{ category: string; slug: string }> };

export function generateStaticParams() {
  return INSIGHTS.map((x) => ({ category: x.category, slug: x.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const meta = findInsight(category, slug);
  if (!meta) return pageSeo({ path: `/talent/insights/${category}/${slug}`, title: "가이드를 찾을 수 없어요", description: "요청한 글이 없어요.", noindex: true });
  return pageSeo({
    path: insightPath(meta),
    title: meta.titleKo,
    description: meta.descKo,
    ogType: "article",
    publishedTime: meta.publishedAt,
    modifiedTime: meta.reviewedAt ?? meta.publishedAt
  });
}

export default async function InsightDetailRoute({ params }: Props) {
  const { category, slug } = await params;
  const meta = findInsight(category, slug);
  if (!meta) notFound();

  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "취업 가이드", path: "/talent/insights" },
    { name: categoryLabelKo(meta.category), path: `/talent/insights#${meta.category}` },
    { name: meta.titleKo, path: insightPath(meta) }
  ]);

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.titleKo,
    description: meta.descKo,
    datePublished: meta.publishedAt,
    dateModified: meta.reviewedAt ?? meta.publishedAt,
    inLanguage: "ko",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(insightPath(meta)) },
    author: { "@type": "Organization", name: "Aply", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Aply", url: SITE_URL }
  };

  return (
    <>
      <JsonLd data={crumbs ? [crumbs, article] : [article]} />
      <InsightView slug={meta.slug} category={meta.category} />
      <TalentAppShell allowGuest maxWidth="4xl">
        <InsightArticle meta={meta} />
      </TalentAppShell>
    </>
  );
}
