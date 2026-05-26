import type { Metadata } from "next";
import { ResumeHomePage } from "../../components/pages/ResumeHomePage";

export const metadata: Metadata = {
  title: "한국형 이력서 | Aply",
  description: "한국 기업이 기대하는 형식의 이력서를 만들고 관리하세요. 직무별로 여러 버전을 만들고 바로 채용 공고에 매칭할 수 있어요."
};

export default function Page() {
  return <ResumeHomePage />;
}
