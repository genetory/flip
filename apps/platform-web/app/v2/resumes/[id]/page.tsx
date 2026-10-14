"use client";

import { useParams } from "next/navigation";
import { V2ResumeDetailScreen } from "../../../../components/v2/screens/V2ResumeDetailScreen";

export default function V2ResumeDetailRoute() {
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  return <V2ResumeDetailScreen resumeId={id} />;
}
