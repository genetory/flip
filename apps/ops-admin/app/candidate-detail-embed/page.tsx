"use client";

import { Suspense } from "react";
import CandidateManagementPage from "../dashboard/operations/candidates/page";

export default function CandidateDetailEmbedPage() {
  return (
    <Suspense fallback={null}>
      <CandidateManagementPage />
    </Suspense>
  );
}
