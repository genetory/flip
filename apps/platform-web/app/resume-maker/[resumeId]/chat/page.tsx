import type { Metadata } from "next";
import { ResumeChatPage } from "../../../../components/resume-maker/ResumeChatPage";

export const metadata: Metadata = {
  title: "AI 이력서 만들기 · 대화형 작성",
  robots: { index: false, follow: false }
};

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ resumeId: string }>;
  searchParams: Promise<{ section?: string; expId?: string }>;
}) {
  const { resumeId } = await params;
  const { section, expId } = await searchParams;
  return <ResumeChatPage resumeId={resumeId} section={section} expId={expId} />;
}
