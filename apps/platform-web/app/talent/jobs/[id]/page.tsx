"use client";

import { useParams } from "next/navigation";
import { JobDetailScreen } from "../../../../components/talent/screens/JobDetailScreen";

export default function TalentJobDetailRoute() {
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  return <JobDetailScreen jobId={id} />;
}
