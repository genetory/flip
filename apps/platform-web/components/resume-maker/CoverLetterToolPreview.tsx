"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import type { ResumeCoverLetterItem } from "../../lib/member-profile-client";

// 자소서 섹션 전용 우측 미리보기 — 이력서와 별개 문서라 자소서를 보여주되,
// 이력서 미리보기(ResumePreview)와 동일하게 A4(794×1123) 시트로 렌더하고
// 컨테이너 폭에 맞춰 scale 한다. PDF 미리보기 화면 링크도 이력서와 동일하게 제공.
// 모든 문구는 props 로 받아 하드코딩 한국어를 두지 않는다(i18n 가드 통과).
const A4_W = 794;
const A4_H = 1123;

// 자소서 A4 시트 본문 — 화면 미리보기와 PDF(인쇄) 화면에서 동일하게 재사용.
// 인쇄 CSS 가 .cl-sheet 를 타깃하므로 클래스 유지.
export function CoverLetterSheet({
  items,
  title,
  companyName,
  emptyLabel,
  innerRef,
  noVerticalPad = false
}: {
  items: ResumeCoverLetterItem[];
  title: string;
  companyName?: string;
  emptyLabel: string;
  innerRef?: React.Ref<HTMLDivElement>;
  // 페이지 분할 미리보기·인쇄에서는 세로 패딩을 시트가 아니라 각 페이지가 준다.
  noVerticalPad?: boolean;
}) {
  // 답변을 입력한 문항만 자소서 문서에 노출(문항만 추가하고 비워 두면 안 보임).
  const filled = items.filter((it) => it.answer && it.answer.trim());
  return (
    <div
      ref={innerRef}
      className="cl-sheet bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-8px_rgba(0,0,0,0.12)]"
      style={{ width: A4_W, minHeight: noVerticalPad ? undefined : A4_H, padding: noVerticalPad ? "0 60px" : "56px 60px", fontSize: 13.5, lineHeight: 1.7 }}
    >
      <h1 className="text-center text-[22px] font-bold tracking-[0.28em] text-slate-900">{title}</h1>
      {companyName ? <p className="mt-2 text-center text-[12.5px] font-semibold text-slate-500">{companyName}</p> : null}
      {/* 답변이 있는 문항이 있을 때만 구분선 — 빈 자소서엔 유령 디바이더가 안 생기게 */}
      {filled.length === 0 ? (
        <p className="mt-16 text-center text-[13px] text-slate-300">{emptyLabel}</p>
      ) : (
        <div className="mt-7 space-y-7">
          <div className="h-px bg-slate-200" />
          {filled.map((it, i) => (
            <section key={it.id}>
              <h3 className="text-[14px] font-bold text-slate-900">
                {i + 1}. {it.prompt?.trim()}
              </h3>
              {it.answer?.trim() ? (
                <p className="mt-2 whitespace-pre-wrap text-justify leading-[1.85] text-slate-700">{it.answer.trim()}</p>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function CoverLetterToolPreview({
  items,
  title,
  previewLabel,
  emptyLabel,
  a4Label,
  companyName,
  pdfHref,
  pdfLabel
}: {
  items: ResumeCoverLetterItem[];
  title: string;
  previewLabel: string;
  emptyLabel: string;
  a4Label: (n: number) => string;
  companyName?: string;
  pdfHref?: string;
  pdfLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pages, setPages] = useState(1);
  const hasPdf = Boolean(pdfHref && pdfLabel);

  // 컨테이너 폭에 맞춰 스케일(이력서 미리보기와 동일).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const sync = () => setScale(Math.min(1, el.clientWidth / A4_W));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 콘텐츠 높이 → 페이지 수
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    setPages(Math.max(1, Math.ceil(el.scrollHeight / A4_H)));
  });

  return (
    <>
      {/* 데스크탑 — 우측 작은 미리보기(독립 스크롤) + '미리보기·PDF' 링크 */}
      <aside className="hidden border-l border-border/60 bg-muted/30 px-5 py-6 lg:block lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
        <div className="mb-2 flex items-center justify-between gap-2 text-[12px]">
          <span className="font-bold text-muted-foreground">{previewLabel}</span>
          {hasPdf ? (
            <Link
              href={pdfHref as string}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#0B46E8] shadow-card transition hover:bg-[#EDF1FD]"
            >
              <Eye weight="bold" className="h-3.5 w-3.5" /> {pdfLabel}
            </Link>
          ) : null}
        </div>
        {/* A4 페이지 수 — 이력서 미리보기와 동일하게 시트 위에 표시 */}
        <div className="mb-2 text-[12px] text-muted-foreground">{a4Label(pages)}</div>
        <div ref={wrapRef} className="w-full" style={{ height: A4_H * scale * pages + (pages - 1) * 8 * scale }}>
          <div style={{ position: "relative", width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <CoverLetterSheet innerRef={sheetRef} items={items} title={title} companyName={companyName} emptyLabel={emptyLabel} />
            {/* 페이지 경계선 */}
            {Array.from({ length: pages - 1 }).map((_, i) => (
              <div
                key={i}
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-rose-300"
                style={{ position: "absolute", top: A4_H * (i + 1) }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* 모바일 — 하단 PDF 미리보기 버튼 */}
      {hasPdf ? (
        <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={pdfHref as string}>
              <Eye weight="bold" /> {pdfLabel}
            </Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
