// 비자 안내 목록(리뉴얼 경로). 레거시 /resources/visa 는 정책상 차단된 상태로 두고,
// 공개 콘텐츠는 /talent/visa 로 발행한다.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/seo/JsonLd";
import { GrowthPageView } from "../../../components/seo/GrowthPageView";
import { breadcrumbJsonLd } from "../../../lib/seo-jsonld";
import { pageSeo } from "../../../lib/seo";
import { VISA_DETAILS } from "../../../lib/visa-details";
import { VISA_DISCLAIMER_KO } from "../../../lib/visa-review";

export const metadata: Metadata = pageSeo({
  path: "/talent/visa",
  title: "한국 비자 종류 안내 — 체류 자격별 정리",
  description:
    "E-7, D-2, F-2 등 한국 체류 자격을 코드별로 정리했어요. 자격 요건과 대상을 확인하고 지원 가능한 공고로 이어가세요."
});

/** 코드 접두사별 묶음 — 39개를 한 줄로 늘어놓지 않고 성격별로 모아 보여 준다. */
const GROUPS: { label: string; prefixes: string[] }[] = [
  { label: "유학·연수 (D)", prefixes: ["D-2", "D-4", "D-10"] },
  { label: "취업 (E)", prefixes: ["E-"] },
  { label: "거주·동반 (F)", prefixes: ["F-"] },
  { label: "방문·단기 (A·B·C)", prefixes: ["A-", "B-", "C-"] },
  { label: "그 외", prefixes: [] }
];

export default function TalentVisaIndexPage() {
  const codes = Object.keys(VISA_DETAILS);
  const used = new Set<string>();
  const grouped = GROUPS.map((g) => {
    const items = g.prefixes.length
      ? codes.filter((c) => !used.has(c) && g.prefixes.some((p) => c.startsWith(p)))
      : codes.filter((c) => !used.has(c));
    items.forEach((c) => used.add(c));
    return { label: g.label, items };
  }).filter((g) => g.items.length > 0);

  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "비자 안내", path: "/talent/visa" }
  ]);

  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-6">
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <GrowthPageView kind="content" surface="visa" slug="index" />

      <h1 className="text-[20px] font-black leading-snug tracking-[-0.02em] text-[#191F28]">한국 비자 종류 안내</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968]">
        체류 자격 코드별로 대상과 요건을 정리했어요. 내 상황에 맞는 코드를 찾아보세요.
      </p>

      {grouped.map((g) => (
        <section key={g.label} className="mt-5">
          <h2 className="text-[14px] font-bold text-[#191F28]">{g.label}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {g.items.map((code) => {
              const d = VISA_DETAILS[code];
              const label = d?.titleKo?.trim() || d?.titleEn?.trim() || code;
              return (
                <li key={code}>
                  <Link
                    href={`/talent/visa/${encodeURIComponent(code)}`}
                    className="inline-flex items-center rounded-full border border-[#E5E8EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#333D4B] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
                    title={label}
                  >
                    {code}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* 비자 콘텐츠의 primary CTA 는 하나 — 공고로 이어진다. */}
      <Link
        href="/talent/jobs?foreigner=1"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white"
      >
        외국인 지원 가능 공고 보기
      </Link>

      <p className="mt-4 text-[11.5px] leading-relaxed text-[#8B95A1]">{VISA_DISCLAIMER_KO}</p>
    </main>
  );
}
