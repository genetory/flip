// 대학별 공개 랜딩 — 메뉴 미노출, slug 로만 진입: /talent/university/<slug>
// 등록되지 않은 slug 는 끊기지 않게 안내 + Aply 둘러보기 폴백을 보여준다.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getUniversityLanding } from "../../../../lib/talent/university-landing";
import { UniversityLandingView } from "../../../../components/talent/university/UniversityLandingView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const u = getUniversityLanding(slug);
  if (!u) return { title: "Aply", robots: { index: false, follow: false } };
  return {
    title: `${u.displayName} × Aply`,
    description: `${u.shortName} 학생을 위한 커리어 시작 — AI 이력서·자소서, 모의면접, 실제 지원까지.`,
    // 메뉴 미노출 단계에선 검색 색인 제외(원할 때 noindex=false 로 색인 허용).
    robots: u.noindex === false ? undefined : { index: false, follow: false }
  };
}

export default async function UniversityLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUniversityLanding(slug);
  if (u) return <UniversityLandingView data={u} />;

  // 미등록 대학 slug — 404 대신 부드럽게 안내하고 일반 진입점으로 유도.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F6F8FB] px-6 text-center">
      <Image src="/img_logo.webp" alt="Aply" width={84} height={28} className="h-6 w-auto" priority />
      <p className="mt-6 text-[17px] font-black text-[#191F28]">아직 준비 중인 페이지예요</p>
      <p className="mt-2 max-w-sm break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">
        이 대학 전용 페이지는 아직 열리지 않았어요. Aply에서 바로 커리어를 시작할 수 있어요.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link href="/talent/signup" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
          무료로 시작하기
        </Link>
        <Link href="/talent" className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E5E8EB] bg-white px-5 text-[14px] font-bold text-[#4E5968] transition hover:text-[#191F28]">
          Aply 둘러보기
        </Link>
      </div>
    </main>
  );
}
