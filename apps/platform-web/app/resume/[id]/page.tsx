import { ResumeCoachListPage } from "../../../components/pages/ResumeCoachListPage";

// 같은 통합 코칭 페이지를 보여주되, URL 의 [id] 가 자동으로 선택됨.
// 즉 /resume/abc 로 직접 진입해도 리스트 + 해당 이력서의 코치 정보가 펼쳐짐.
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ResumeCoachListPage selectedResumeId={id} />;
}
