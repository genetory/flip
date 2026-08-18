"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { CoverLetterSheet } from "../resume-maker/CoverLetterToolPreview";
import { computePageBreaks } from "../resume-maker/ResumePreview";
import { getSharedCoverLetter, type SharedCoverLetter } from "../../lib/cover-letter-client";
import { usePlatformT } from "../../lib/i18n";

// 공개(로그인 불필요) 자기소개서 읽기 전용 뷰. 이력서 공유 페이지의 자소서 버전.
// resume-maker 와 동일한 CoverLetterSheet 로 렌더 → 언제나 최신·동일한 모습.
const A4_W = 794;
const A4_H = 1123;
const PAGE_PAD = 56;
const PAGE_CONTENT_H = A4_H - PAGE_PAD * 2;

export function SharedCoverLetterPage({ slug }: { slug: string }) {
  const t = usePlatformT();
  const [cl, setCl] = useState<SharedCoverLetter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [starts, setStarts] = useState<number[]>([0]);
  const [contentH, setContentH] = useState(A4_H);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await getSharedCoverLetter(slug);
        if (alive) setCl(r);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : t("자기소개서를 불러오지 못했어요.", "Couldn't load the cover letter.", "无法加载求职信。", "Không thể tải thư giới thiệu.", "自己紹介書を読み込めませんでした。", "Gagal memuat surat lamaran."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const compute = () => {
      const avail = outerRef.current?.clientWidth;
      const el = sheetRef.current;
      if (!avail || !el || !el.offsetHeight) return;
      setScale(Math.min(1, avail / A4_W));
      const { starts: st, total } = computePageBreaks(el, PAGE_CONTENT_H);
      setStarts((prev) => (prev.length === st.length && prev.every((v, i) => v === st[i]) ? prev : st));
      setContentH(total);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (outerRef.current) ro.observe(outerRef.current);
    if (sheetRef.current) ro.observe(sheetRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [cl]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F4F6] px-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (!cl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F4F6]">
        <span className="text-sm text-muted-foreground">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </div>
    );
  }

  const title = t("자기소개서", "Cover letter", "求职信", "Thư giới thiệu", "自己紹介書", "Surat lamaran");

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      {/* 인쇄 스타일 — 이력서/자소서 PDF 와 동일하게 각 페이지 개별 A4 장 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .rm-print-hide { display: none !important; }
          .rm-print-pages { display: block !important; }
          .rm-print-page, .rm-print-page * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .rm-print-page .cl-sheet { box-shadow: none !important; }
          .rm-print-page { break-after: page; page-break-after: always; }
          .rm-print-page:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <div className="rm-print-hide sticky top-0 z-20 border-b border-[#F2F4F6] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[794px] items-center justify-end px-4 py-2.5">
          <button
            type="button"
            onClick={() => typeof window !== "undefined" && window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0B46E8] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0A3ECB]"
          >
            <DownloadSimple weight="bold" className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {/* 높이 측정용 숨김 시트 */}
      <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: A4_W, visibility: "hidden" }}>
        <CoverLetterSheet innerRef={sheetRef} items={cl.items} title={title} companyName={cl.company?.trim() || undefined} emptyLabel="" noVerticalPad />
      </div>

      {/* 화면 표시 — A4 페이지 카드 */}
      <section className="rm-print-hide px-4 py-8">
        <div ref={outerRef} className="mx-auto w-full max-w-[794px] space-y-3">
          {starts.map((startPx, i) => {
            const endPx = i < starts.length - 1 ? starts[i + 1] : contentH;
            const windowH = Math.min(endPx - startPx, PAGE_CONTENT_H);
            return (
              <div
                key={i}
                className="relative mx-auto overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_10px_30px_-10px_rgba(0,0,0,0.15)]"
                style={{ width: A4_W * scale, height: A4_H * scale }}
              >
                <div className="absolute left-0 overflow-hidden" style={{ top: PAGE_PAD * scale, width: A4_W * scale, height: windowH * scale }}>
                  <div style={{ position: "absolute", top: -(startPx * scale), width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                    <CoverLetterSheet items={cl.items} title={title} companyName={cl.company?.trim() || undefined} emptyLabel="" noVerticalPad />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 인쇄 전용 — 개별 A4 장 */}
      <div className="rm-print-pages" style={{ display: "none" }}>
        {starts.map((startPx, i) => {
          const endPx = i < starts.length - 1 ? starts[i + 1] : contentH;
          const windowH = Math.min(endPx - startPx, PAGE_CONTENT_H);
          return (
            <div key={i} className="rm-print-page relative overflow-hidden bg-white" style={{ width: A4_W, height: A4_H }}>
              <div style={{ position: "absolute", left: 0, top: PAGE_PAD - startPx, width: A4_W }}>
                <CoverLetterSheet items={cl.items} title={title} companyName={cl.company?.trim() || undefined} emptyLabel="" noVerticalPad />
              </div>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: PAGE_PAD, background: "#fff" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: PAGE_PAD + windowH, background: "#fff" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: "5mm", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img_logo.webp" alt="Aply" style={{ height: 12, width: "auto", opacity: 0.7 }} />
                <span style={{ fontSize: 9.5, letterSpacing: "0.02em", color: "#94a3b8" }}>{t("커리어의 시작", "Start your career", "职业起点", "Khởi đầu sự nghiệp", "キャリアの始まり", "Awal karier")} · aply.global</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
