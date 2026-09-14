// 대학 취업지원센터용 배포 키트 — /talent/university/<slug>/kit
// 링크·QR을 채널별로 생성. 내부 배포 도구라 항상 검색 색인 제외.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getUniversityLanding } from "../../../../../lib/talent/university-landing";
import { UniversityKitView } from "../../../../../components/talent/university/UniversityKitView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const u = getUniversityLanding(slug);
  return {
    title: u ? `${u.displayName} 배포 키트` : "Aply",
    robots: { index: false, follow: false }
  };
}

export default async function UniversityKitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUniversityLanding(slug);
  if (u) return <UniversityKitView data={u} />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F6F8FB] px-6 text-center">
      <Image src="/img_logo.webp" alt="Aply" width={84} height={28} className="h-6 w-auto" priority />
      <p className="mt-6 text-[17px] font-black text-[#191F28]">배포 키트를 찾을 수 없어요</p>
      <p className="mt-2 max-w-sm break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">등록되지 않은 대학이에요. 링크를 다시 확인해 주세요.</p>
      <Link href="/talent" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-[#E5E8EB] bg-white px-5 text-[14px] font-bold text-[#4E5968] transition hover:text-[#191F28]">
        Aply 둘러보기
      </Link>
    </main>
  );
}
