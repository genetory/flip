import type { Metadata } from "next";
import { SharedCoverLetterPage } from "../../../../components/pages/SharedCoverLetterPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let title = "자기소개서";
  const description = "Aply에서 만든 자기소개서를 한 페이지에서 확인하세요.";
  try {
    const response = await fetch(`${apiBase}/cover-letters/share/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { item?: { company?: string | null } };
      const company = payload.item?.company?.trim();
      if (company) title = `${company} 자기소개서`;
    }
  } catch {
    // 네트워크 실패 시 기본 타이틀 유지.
  }
  return {
    title: `${title} | Aply`,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description }
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <SharedCoverLetterPage slug={slug} />;
}
