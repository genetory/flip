"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import type { ResumeCoverLetterItem } from "../../../lib/member-profile-client";
import { CoverLetterPreviewPage } from "../../../components/resume-maker/CoverLetterPreviewPage";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerPdfDownload } from "../../../lib/analytics";

// 대화로 쓴 자기소개서를 resume-maker 의 자소서 미리보기/PDF 화면 그대로 보여준다.
export default function CoverPreviewPage() {
  const { isReady } = useAuthSession();
  const [items, setItems] = useState<ResumeCoverLetterItem[] | null>(null);
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    if (!isReady) return;
    void (async () => {
      try {
        const { data } = await fetchCoverData();
        if (hasCoverContent(data)) {
          const mapped = (data.items ?? [])
            .filter((x) => (x.answer ?? "").trim())
            .map((x, i) => ({ id: String(i), prompt: x.question ?? "", answer: x.answer ?? "" }));
          setItems(mapped);
          setCompany(data.company ?? "");
          setState("ready");
        } else {
          setState("empty");
        }
      } catch {
        setState("empty");
      }
    })();
  }, [isReady]);

  // 완성본이 있으면 resume-maker 자소서 미리보기/PDF 화면(embedded)으로 렌더.
  // [&_*]:!shadow-none — A4 페이지 카드 그림자(하단 실선처럼 보임) 제거.
  if (state === "ready" && items) {
    return (
      <div className="[&_*]:!shadow-none">
        <CoverLetterPreviewPage embedded preloadedItems={items} preloadedCompany={company} onPdf={() => trackCareerPdfDownload("cover")} />
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
                <p className="text-[14px] font-semibold text-[#4E5968]">아직 작성한 자기소개서가 없어요.</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">AI와 대화하면 자기소개서가 자동으로 만들어져요.</p>
                <Link
                  href="/career-launch/cover-collect"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  대화로 자기소개서 쓰기 →
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
