import type { Metadata } from "next";
import { SajuResultPage } from "../../../../../components/pages/SajuResultPage";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let title = "오행 사주가 풀어주는 미래 직업";
  let description = "Aply가 풀어주는 오행 사주 기반 직업 적성 + 매칭 채용 공고를 확인하세요.";
  try {
    const response = await fetch(`${apiBase}/saju/result/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as {
        prediction?: { name?: string; interpretation?: string };
      };
      const name = payload.prediction?.name?.trim();
      const interpretation = payload.prediction?.interpretation?.trim() ?? "";
      if (name) title = `${name}님의 사주가 말하는 미래 직업은?`;
      if (interpretation) {
        description = interpretation.length > 110 ? `${interpretation.slice(0, 110)}…` : interpretation;
      }
    }
  } catch {
    // fall back to defaults
  }
  return {
    title: `${title} | Aply`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: "/img_meta_saju.webp",
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/img_meta_saju.webp"]
    }
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <SajuResultPage slug={slug} />;
}
