import type { Metadata } from "next";
import { ResumeToolPickerPage } from "../../../components/resume-maker/ResumeToolPickerPage";

// aply.global GNB 에 노출하지 않는 독립 도구 — 검색 색인 제외.
export const metadata: Metadata = {
  title: "공고 맞춤",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <ResumeToolPickerPage tool="tailor" />;
}
