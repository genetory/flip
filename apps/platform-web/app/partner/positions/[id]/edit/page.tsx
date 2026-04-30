import { PartnerPositionEditPage } from "../../../../../components/pages/PartnerPositionEditPage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PartnerPositionEditRoute({ params }: Props) {
  const { id } = await params;
  return <PartnerPositionEditPage positionId={id} />;
}
