import { PartnerPositionCreatePage } from "../../../components/pages/PartnerPositionCreatePage";

export default async function Page({ searchParams }: { searchParams: Promise<{ embedded?: string }> }) {
  const query = await searchParams;
  const embedded = query.embedded === "1";
  return <PartnerPositionCreatePage embedded={embedded} />;
}
