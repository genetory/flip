"use client";

import { useParams } from "next/navigation";
import { ApplicationDetailScreen } from "../../../../components/talent/screens/ApplicationDetailScreen";

export default function TalentApplicationDetailRoute() {
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  return <ApplicationDetailScreen appId={id} />;
}
