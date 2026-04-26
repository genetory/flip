import { PartnerPositionEditPage } from "../../../../components/pages/PartnerPositionEditPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerPositionEditPage positionId={id} />;
}
