import type { Metadata } from "next";
import { SharedPassportView } from "../../../components/pages/SharedPassportView";

type Props = { params: Promise<{ token: string }> };

const TIER_LABEL: Record<string, string> = {
  preparing: "준비 중",
  bronze: "Verified Bronze",
  silver: "Verified Silver",
  gold: "Verified Gold"
};

// 공유 링크 미리보기(카톡·SNS) — 이름·티어·준비도가 담긴 리치 카드로 노출한다.
// (OG 이미지는 같은 라우트의 opengraph-image 가 동적으로 생성)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  let title = "APLY Talent Passport";
  let description = "APLY Career Launch로 검증된 인재 프로필을 확인하세요.";
  try {
    const res = await fetch(`${apiBase}/career-launch/passport/shared/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (res.ok) {
      const d = (await res.json()) as { passport?: { name?: string | null; tier?: string; readiness?: number } };
      const p = d.passport;
      if (p) {
        const name = p.name?.trim() || "익명 인재";
        const tier = TIER_LABEL[p.tier ?? ""] ?? "";
        title = `${name} · ${tier} · 취업 준비도 ${p.readiness ?? ""}`.replace(/ · $/, "");
        description = `${name}님의 APLY Talent Passport — 방향·이력서·자소서·면접·경험까지 검증된 취업 준비도 ${p.readiness ?? ""}점. 나도 무료로 만들어보세요.`;
      }
    }
  } catch {
    // 네트워크 실패 시 기본 문구 유지
  }
  return {
    title: `${title} | Aply`,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function Page({ params }: Props) {
  const { token } = await params;
  return <SharedPassportView token={token} />;
}
