import type { Metadata } from "next";
import { ResumeToolEntry } from "../../../components/resume-maker/ResumeToolEntry";

// aply.global GNB 에 노출하지 않는 독립 도구 — 검색 색인 제외.
export const metadata: Metadata = {
  title: "모의 면접",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <ResumeToolEntry tool="interview" />;
}
