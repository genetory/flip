import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

// 이력서 편집은 resume-maker 로 통합. 옛 편집 경로로 들어오면 resume-maker 편집기로
// 리다이렉트한다. "new" 센티널은 resume-maker 목록(생성 진입)으로 보낸다.
export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!id || id === "new") redirect("/resume-maker/resumes");
  redirect(`/resume-maker/${id}/edit`);
}
