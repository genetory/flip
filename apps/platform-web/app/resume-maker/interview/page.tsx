import type { Metadata } from "next";
import { ResumeToolPicker } from "../../../components/resume-maker/ResumeToolPicker";

// aply.global GNB 에 노출하지 않는 독립 도구 — 검색 색인 제외.
export const metadata: Metadata = {
  title: "모의 면접",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <ResumeToolPicker tool="interview" />;
}
