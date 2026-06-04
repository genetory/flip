import type { Metadata } from "next";
import { MbtiResultPage } from "../../../../../components/pages/MbtiResultPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let title = "내 MBTI가 어울리는 한국 직장은?";
  let description = "Aply가 매칭해주는 MBTI × 한국 직장 적합도";
  try {
    const response = await fetch(`${apiBase}/mbti/result/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as {
        prediction?: { mbtiType?: string; name?: string; interpretation?: string };
      };
      const name = payload.prediction?.name?.trim();
      const mbti = payload.prediction?.mbtiType ?? "";
      if (name && mbti) title = `${name}(${mbti})에게 어울리는 한국 직장`;
      else if (mbti) title = `${mbti}에게 어울리는 한국 직장`;
      const interp = payload.prediction?.interpretation?.trim() ?? "";
      if (interp) description = interp.length > 110 ? `${interp.slice(0, 110)}…` : interp;
    }
  } catch {
    // fall back
  }
  return {
    title: `${title} | Aply`,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <MbtiResultPage slug={slug} />;
}
