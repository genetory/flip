import type { Metadata } from "next";
import { CoverLetterPreviewPage } from "../../../../../components/resume-maker/CoverLetterPreviewPage";

export const metadata: Metadata = {
  title: "자기소개서 · 미리보기",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ coverLetterId: string }> }) {
  const { coverLetterId } = await params;
  return <CoverLetterPreviewPage coverLetterId={coverLetterId} />;
}
