import { redirect } from "next/navigation";

// 이력서 화면은 resume-maker 로 통합. 옛 미리보기 경로로 들어오면 resume-maker
// 미리보기로 리다이렉트한다.
type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  redirect(`/resume-maker/${id}/preview`);
}
