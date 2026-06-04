import type { Metadata } from "next";
import { SharedResumePage } from "../../../../components/pages/SharedResumePage";

type Props = { params: Promise<{ slug: string }> };

// 동적 메타 — 브라우저 탭 타이틀을 "{이름}의 이력서 | Aply" 형태로.
// 이름은 우선순위: 이력서 content.basicName → 작성자 User.name/realName.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let title = "이력서";
  const description = "Aply에서 만든 이력서를 한 페이지에서 확인하세요.";
  try {
    const response = await fetch(`${apiBase}/resumes/share/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as {
        item?: {
          content?: { basicName?: string | null };
          user?: { name?: string | null; realName?: string | null };
        };
      };
      const item = payload.item;
      const name = item?.content?.basicName?.trim() || item?.user?.name?.trim() || item?.user?.realName?.trim() || "";
      if (name) title = `${name}의 이력서`;
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
  return <SharedResumePage slug={slug} />;
}
