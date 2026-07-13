"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../../lib/launch/resume-data";
import { ResumeRender } from "../../../components/launch/resume-render";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerPdfDownload } from "../../../lib/analytics";

// 대화로 쌓은 이력서 데이터를 실제 이력서로 보여주는 페이지.
export default function ResumePreviewPage() {
  const { isReady } = useAuthSession();
  const [data, setData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    void (async () => {
      try {
        const { data: d } = await fetchResumeData();
        setData(d);
      } catch {
        setData({});
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady]);

  const filled = hasResumeContent(data);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:pt-10">
          <div className="launch-no-print flex items-center justify-between gap-3">
            <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← 대시보드
            </Link>
            <div className="flex items-center gap-3">
              {filled ? (
                <button type="button" onClick={() => { trackCareerPdfDownload("resume"); window.print(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                  PDF 다운로드
                </button>
              ) : null}
              <Link href="/career-launch/resume-collect" className="text-[13px] font-bold text-[#0B46E8] transition hover:underline">
                이어서 채우기 →
              </Link>
            </div>
          </div>

          <div className="launch-no-print mt-3">
            <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">내 이력서</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">대화로 쌓은 정보를 이력서 형태로 보여줘요. ‘PDF 다운로드’로 저장할 수 있어요.</p>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="rounded-2xl border border-[#E5E8EB] bg-white p-8 text-center text-[14px] text-[#8B95A1]">불러오는 중…</div>
            ) : filled && data ? (
              <div className="launch-print-area">
                <ResumeRender data={data} />
              </div>
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
      {/* 인쇄(PDF) 시 사이트 헤더·푸터·툴바 숨기고 문서만 출력 */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { background: #ffffff !important; }
          header, nav, footer, .launch-no-print { display: none !important; }
          main { padding: 0 !important; }
          .launch-print-area { overflow: visible !important; }
          .resume-sheet, .cl-sheet { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
