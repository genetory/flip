import type { Metadata } from "next";
import { VisaResultPage } from "../../../../../components/pages/VisaResultPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let title = "내가 받을 수 있는 한국 비자";
  let description = "Aply가 진단해주는 한국 취업 비자 가능성과 매칭 채용 공고";
  try {
    const response = await fetch(`${apiBase}/visa/result/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as {
        result?: { name?: string | null; nationality?: string };
      };
      const name = payload.result?.name?.trim();
      const nat = payload.result?.nationality;
      if (name && nat) title = `${name}(${nat})의 한국 비자 진단 결과`;
      else if (nat) title = `${nat} 국적의 한국 비자 진단 결과`;
    }
  } catch {
    // fall back
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
          url: "/img_meta_visa.webp",
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
      images: ["/img_meta_visa.webp"]
    }
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <VisaResultPage slug={slug} />;
}
