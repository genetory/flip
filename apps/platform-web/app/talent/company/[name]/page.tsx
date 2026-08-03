import { CompanyDetailScreen } from "../../../../components/talent/screens/CompanyDetailScreen";

export default async function TalentCompanyRoute({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <CompanyDetailScreen name={decodeURIComponent(name)} />;
}
