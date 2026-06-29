import type { Metadata } from "next";
import { CoverLetterEditorPage } from "../../../../components/resume-maker/CoverLetterEditorPage";

export const metadata: Metadata = {
  title: "자기소개서 · 편집",
  robots: { index: false, follow: false }
};

export default async function Page({ params }: { params: Promise<{ coverLetterId: string }> }) {
  const { coverLetterId } = await params;
  return <CoverLetterEditorPage coverLetterId={coverLetterId} />;
}
