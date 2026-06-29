import type { Metadata } from "next";
import { ResumeDiagnosisEntryPage } from "../../../components/resume-maker/ResumeDiagnosisEntryPage";

// aply.global GNB 에 노출하지 않는 독립 도구 — 검색 색인 제외.
export const metadata: Metadata = {
  title: "AI 진단",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <ResumeDiagnosisEntryPage />;
}
