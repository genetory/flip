import { V2CompanyDetailScreen } from "../../../../components/v2/screens/V2CompanyDetailScreen";

// v2 회사 상세 — 회사는 이름으로 찾는다(기존 /talent/company/[name] 과 같은 주소 규칙).
export default async function V2CompanyDetailRoute({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <V2CompanyDetailScreen name={decodeURIComponent(name)} />;
}
