import { PartnerPositionEditorScreen } from "../../../../../components/partner-app/screens/PartnerPositionEditorScreen";

export default async function PartnerPositionEditRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartnerPositionEditorScreen positionId={id} />;
}
