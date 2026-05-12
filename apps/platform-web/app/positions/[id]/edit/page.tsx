import { PartnerPositionEditPage } from "../../../../components/pages/PartnerPositionEditPage";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ embedded?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const embedded = query.embedded === "1";
  return <PartnerPositionEditPage positionId={id} embedded={embedded} />;
}
