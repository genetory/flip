import type { Metadata } from "next";
import { ResumeListPage } from "../../../components/resume-maker/ResumeListPage";

export const metadata: Metadata = {
  title: "이력서",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <ResumeListPage />;
}
