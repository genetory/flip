import { VisaDetailPage } from "../../../../components/pages/resources/VisaDetailPage";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function Page({ params }: Props) {
  const { code } = await params;
  return <VisaDetailPage code={code} />;
}
