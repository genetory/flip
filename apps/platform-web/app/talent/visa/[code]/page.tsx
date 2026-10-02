// 비자 상세(리뉴얼 경로). 레거시 /resources/visa/[code] 와 같은 데이터·화면을 쓰지만
// canonical 은 이 경로이고, 출처·검토일 표시와 공고 연결 CTA 를 함께 둔다.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VisaDetailPage } from "../../../../components/pages/resources/VisaDetailPage";
import { TalentAppShell } from "../../../../components/talent/app/TalentAppShell";
import { JsonLd } from "../../../../components/seo/JsonLd";
import { GrowthPageView } from "../../../../components/seo/GrowthPageView";
import { ContentReviewNote } from "../../../../components/seo/ContentReviewNote";
import { breadcrumbJsonLd } from "../../../../lib/seo-jsonld";
import { clampDescription, pageSeo } from "../../../../lib/seo";
import { VISA_DETAILS } from "../../../../lib/visa-details";
import { VISA_DISCLAIMER_KO, visaReviewOf } from "../../../../lib/visa-review";

type Props = { params: Promise<{ code: string }> };

/** 데이터에 있는 코드만 정적으로 만든다 — 임의 문자열로 빈 페이지가 생기지 않게. */
export function generateStaticParams() {
  return Object.keys(VISA_DETAILS).map((code) => ({ code }));
}

export const dynamicParams = false;

function titleOf(code: string): string {
  const d = VISA_DETAILS[code];
  return d?.titleKo?.trim() || d?.titleEn?.trim() || `${code} 비자`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const detail = VISA_DETAILS[code];
  if (!detail) return pageSeo({ path: `/talent/visa/${code}`, title: "비자 정보를 찾을 수 없어요", description: "요청한 비자 코드가 없어요.", noindex: true });
  const title = titleOf(code);
  // 본문 첫 줄들을 설명으로 — 같은 템플릿 문구를 코드만 바꿔 쓰지 않는다.
  const lead = (detail.descriptionKo ?? [])
    .map((l) => l.text?.trim())
    .filter(Boolean)
    .join(" ");
  const description = clampDescription(lead || `${title} 체류 자격의 대상과 요건을 정리했어요.`);
  return pageSeo({
    path: `/talent/visa/${code}`,
    title: `${title} — 대상과 요건`,
    description,
    ogType: "article"
  });
}

export default async function TalentVisaDetailRoute({ params }: Props) {
  const { code } = await params;
  if (!VISA_DETAILS[code]) notFound();

  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "비자 안내", path: "/talent/visa" },
    { name: code, path: `/talent/visa/${code}` }
  ]);

  return (
    <>
      {/* JSON-LD 와 계측은 화면에 아무것도 그리지 않으므로 셸 바깥에 두어도 된다. */}
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <GrowthPageView kind="content" surface="visa" slug={code} />
      {/* 보이는 내용은 전부 리뉴얼 셸(GNB+푸터) 안에 들어간다 — 셸 앞에 두면 GNB 위에 뜬다. */}
      <TalentAppShell allowGuest>
        <VisaDetailPage code={code} basePath="/talent/visa" chromeless />
        <div className="pb-2">
        {/* 비자 콘텐츠의 primary CTA — 읽고 끝나지 않게 공고로 연결한다.
            코드별 공고 필터는 아직 API 가 지원하지 않아 '외국인 지원 가능' 으로 연결한다. */}
          <Link
          href="/talent/jobs?foreigner=1"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white"
        >
          외국인 지원 가능 공고 보기
        </Link>
          <ContentReviewNote review={visaReviewOf(code)} disclaimer={VISA_DISCLAIMER_KO} />
        </div>
      </TalentAppShell>
    </>
  );
}
