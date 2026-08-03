import { ActivityDetailScreen } from "../../../../components/talent/screens/ActivityDetailScreen";

export default async function TalentActivityRoute({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <ActivityDetailScreen type={type} />;
}
