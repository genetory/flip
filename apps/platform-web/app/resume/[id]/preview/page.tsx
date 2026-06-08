import { ResumeDetailPage } from "../../../../components/pages/ResumeDetailPage";

// 이력서 미리보기 / PDF 다운로드 / 공유 링크 복사. 기존 /resume/[id] 이
// 했던 역할을 /preview 로 옮겼다. /resume/[id] 는 이제 Coach 가 차지.
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ResumeDetailPage resumeId={id} />;
}
