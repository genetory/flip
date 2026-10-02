// 무료 비자·직무 진단(공개). 로그인 없이 끝까지 쓸 수 있다.
// 계산은 전부 규칙 — LLM 을 호출하지 않는다(lib/tools/visa-job-fit).
// 보이는 내용은 TalentAppShell(GNB+푸터) 안에 들어간다.
import type { Metadata } from "next";
import { TalentAppShell } from "../../../components/talent/app/TalentAppShell";
import { VisaJobFitWizard } from "../../../components/tools/VisaJobFitWizard";
import { JsonLd } from "../../../components/seo/JsonLd";
import { breadcrumbJsonLd } from "../../../lib/seo-jsonld";
import { pageSeo } from "../../../lib/seo";

export const metadata: Metadata = pageSeo({
  path: "/tools/visa-job-fit",
  title: "무료 비자·직무 진단 — 내 비자로 지원 가능한 직무 찾기",
  description:
    "체류자격·전공·경력·관심 직무를 고르면 지원 가능성이 높은 직무와 확인해야 할 비자 조건을 알려드려요. 로그인 없이 무료로 이용하세요."
});

export default function VisaJobFitRoute() {
  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "무료 진단", path: "/tools/visa-job-fit" }
  ]);
  return (
    <>
      {crumbs ? <JsonLd data={crumbs} /> : null}
      <TalentAppShell allowGuest maxWidth="4xl">
        <header className="mb-5">
          <h1 className="break-keep text-[23px] font-black leading-snug tracking-[-0.025em] text-[#191F28] md:text-[27px]">
            내 비자로 지원 가능한 직무 찾기
          </h1>
          <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
            4단계만 고르면 됩니다. 로그인하지 않아도 결과를 볼 수 있고, 입력한 내용은 이 브라우저에만 저장돼요.
          </p>
        </header>
        <VisaJobFitWizard />
      </TalentAppShell>
    </>
  );
}
