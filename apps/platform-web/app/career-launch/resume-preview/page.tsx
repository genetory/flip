"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { toResumeContent } from "../../../components/launch/resume-render";
import type { ResumeContent } from "../../../lib/member-profile-client";
import { ResumeBuilderPreviewPage } from "../../../components/resume-maker/ResumeBuilderPreviewPage";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerPdfDownload } from "../../../lib/analytics";

// 대화로 쌓은 이력서를 resume-maker 의 이력서 미리보기/PDF 화면 그대로 보여준다.
export default function ResumePreviewPage() {
  const { isReady } = useAuthSession();
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    if (!isReady) return;
    void (async () => {
      try {
        const { data } = await fetchResumeData();
        if (hasResumeContent(data)) {
          setContent(toResumeContent(data));
          setState("ready");
        } else {
          setState("empty");
        }
      } catch {
        setState("empty");
      }
    })();
  }, [isReady]);

  // 완성본이 있으면 resume-maker 미리보기/PDF 화면(embedded)으로 렌더.
  // [&_*]:!shadow-none — A4 페이지 카드 그림자(하단 실선처럼 보임) 제거.
  if (state === "ready" && content) {
    return (
      <div className="[&_*]:!shadow-none">
        <ResumeBuilderPreviewPage resumeId="" embedded preloadedContent={content} onPdf={() => trackCareerPdfDownload("resume")} />
      </div>
    );
  }

  // 로딩·빈 상태 — 사이트 셸로 안내.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← 대시보드
          </Link>
          <div className="mt-6">
            {state === "loading" ? (
              <div className="rounded-2xl border border-[#E5E8EB] bg-white p-8 text-center text-[14px] text-[#8B95A1]">불러오는 중…</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D7DCE3] bg-white p-8 text-center">
                <p className="text-[14px] font-semibold text-[#4E5968]">아직 채운 이력서 정보가 없어요.</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">AI와 대화하면 이력서가 자동으로 만들어져요.</p>
                <Link
                  href="/career-launch/resume-collect"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  대화로 이력서 채우기 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
