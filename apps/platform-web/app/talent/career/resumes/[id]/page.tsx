"use client";

import { useParams } from "next/navigation";
import { ResumeDetailScreen } from "../../../../../components/talent/screens/ResumeDetailScreen";

export default function TalentResumeDetailRoute() {
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  return <ResumeDetailScreen resumeId={id} />;
}
