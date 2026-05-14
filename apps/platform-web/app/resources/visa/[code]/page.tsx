import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VisaDetailPage } from "../../../../components/pages/resources/VisaDetailPage";
import { VISA_DETAILS } from "../../../../lib/visa-details";

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const detail = VISA_DETAILS[code];
  if (!detail) {
    return {
      title: "비자 정보를 찾을 수 없음",
      robots: { index: false }
    };
  }
  const titleKo = detail.titleKo?.trim();
  const titleEn = detail.titleEn?.trim();
  const title = titleKo || titleEn || `${code} 비자`;
  const description =
    titleEn
      ? `${titleKo ?? title} — ${titleEn}. 자격 요건, 신청 방법, 체류 기간을 한국어 외 다국어로 안내합니다.`
      : `${title} 비자의 자격 요건, 신청 방법, 체류 기간을 한국어 외 다국어로 안내합니다.`;
  return {
    title,
    description,
    alternates: { canonical: `/resources/visa/${code}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/resources/visa/${code}`
    }
  };
}

export default async function Page({ params }: Props) {
  const { code } = await params;
  if (!VISA_DETAILS[code]) {
    notFound();
  }
  return <VisaDetailPage code={code} />;
}
