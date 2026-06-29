import type { Metadata } from "next";
import { CoverLetterListPage } from "../../../components/resume-maker/CoverLetterListPage";

export const metadata: Metadata = {
  title: "자기소개서",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <CoverLetterListPage />;
}
