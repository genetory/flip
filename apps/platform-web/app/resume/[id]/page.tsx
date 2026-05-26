import { ResumeDetailPage } from "../../../components/pages/ResumeDetailPage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ResumeDetailPage resumeId={id} />;
}
