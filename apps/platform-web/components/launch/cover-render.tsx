"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CoverData } from "../../lib/launch/cover-data";
import { CoverLetterSheet } from "../resume-maker/CoverLetterToolPreview";

// Career Launch 자기소개서를 resume-maker(자기소개서 만들기)와 동일한 A4 형식으로 렌더.
// CoverLetterSheet(순수 시트)를 컨테이너 폭에 맞춰 스케일한다(이력서 미리보기와 동일).
const A4_W = 794;
const A4_H = 1123;

export function CoverRender({ data, maxWidth }: { data: CoverData; maxWidth?: number }) {
  const items = (data.items ?? [])
    .filter((x) => (x.answer ?? "").trim())
    .map((x, i) => ({ id: String(i), prompt: x.question ?? "", answer: x.answer ?? "" }));

  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const sync = () => setScale(Math.min(1, el.clientWidth / A4_W));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    setPages(Math.max(1, Math.ceil(el.scrollHeight / A4_H)));
  });

  return (
    <div className="min-w-0 overflow-hidden [&_*]:!shadow-none" style={maxWidth ? { maxWidth } : undefined}>
      <div ref={wrapRef} className="w-full" style={{ height: A4_H * scale * pages + (pages - 1) * 8 * scale }}>
        <div style={{ position: "relative", width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <CoverLetterSheet innerRef={sheetRef} items={items} title="자기소개서" companyName={data.company ?? undefined} emptyLabel="아직 작성한 문항이 없어요." />
        </div>
      </div>
    </div>
  );
}
