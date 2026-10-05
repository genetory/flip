"use client";

// 모듈형 에디터 공용 A4 페이지 틀 — 본문을 고정 폭(794)으로 한 번 재서 페이지를 나누고, 장마다 창으로 잘라
// 보여 준다(바닥글 고정). 모양은 기존 ResumeA4Preview·CoverA4Preview 와 같다.
// 편집 모드에선 창을 위아래로 조금 더 보여 줘 선택 테두리가 잘리지 않게 하고, 여백에 비치는 이웃 페이지
// 모듈은 PageModules 로 가린다. 편집 표시는 자리를 차지하지 않게 그려야(EditOverlay) 편집 화면과 PDF 의
// 페이지 나눔이 같다.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { PdfBrandFooter } from "../career/pdf-print";

const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_PAD = 52;
const FOOTER_H = 44;
const CONTENT_H = PAGE_H - PAGE_PAD * 2 - FOOTER_H;
const EDIT_BLEED = 12;

/** 이 페이지에 속한 모듈 id. 없으면(측정용·편집 아님) 전부 보인다. */
const PageModules = createContext<Set<string> | null>(null);

/** 모듈(data-block + data-module)이 이 페이지 밖이라 여백에 비치기만 하는지 — 그렇다면 가린다. */
export function useOffPage(id: string): boolean {
  const onPage = useContext(PageModules);
  return onPage ? !onPage.has(id) : false;
}

type MeasuredBlock = { id: string | null; top: number; bottom: number };

// 여기서 끊으면 페이지 아래에 이보다 큰 빈칸이 남을 때는, 블록을 통째로 넘기지 않고 줄 사이에서 나눠 채운다
// (기존 A4 미리보기와 같은 기준). 한 블록이 한 장보다 커도 줄 사이에서 나눈다.
const KEEP_TOGETHER_MAX = 140;

/** 블록 안 문단(p)의 줄과 줄 사이 — 여기서만 블록을 나눌 수 있다(제목 바로 뒤는 제외해 제목만 남지 않게). */
function lineGaps(block: HTMLElement, rootTop: number): number[] {
  const gaps: number[] = [];
  for (const p of Array.from(block.querySelectorAll("p"))) {
    const range = document.createRange();
    range.selectNodeContents(p);
    const lines: { top: number; bottom: number }[] = [];
    for (const r of Array.from(range.getClientRects())) {
      if (r.height === 0) continue;
      const last = lines[lines.length - 1];
      if (last && Math.abs(r.top - last.top) < 3) {
        last.bottom = Math.max(last.bottom, r.bottom);
      } else {
        lines.push({ top: r.top, bottom: r.bottom });
      }
    }
    for (let i = 0; i < lines.length - 1; i++) gaps.push((lines[i].bottom + lines[i + 1].top) / 2 - rootTop);
  }
  return gaps;
}

/**
 * 여러 칸이어도 블록([data-block])이 잘리지 않게 페이지를 나눈다 — 어느 칸의 블록도 가로지르지 않는
 * 가장 먼 지점에서 끊는다. 그러면 빈칸이 크게 남거나 들어갈 자리가 없을 때만, 가로지르는 블록이 모두
 * 줄 사이인 지점에서 나눈다. 그런 지점도 없으면 경계에서 자른다.
 */
function packColumns(root: HTMLElement, contentH: number): { starts: number[]; total: number; blocks: MeasuredBlock[] } {
  // 편집 표시(선택 테두리·놓기 영역)는 절대 배치라 scrollHeight 를 늘릴 수 있다 — 실제 흐름 높이로 잰다.
  const total = root.getBoundingClientRect().height;
  const rootTop = root.getBoundingClientRect().top;
  const measured = Array.from(root.querySelectorAll<HTMLElement>("[data-block]")).map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute("data-module"), top: r.top - rootTop, bottom: r.bottom - rootTop, gaps: lineGaps(el, rootTop) };
  });
  const blocks: MeasuredBlock[] = measured.map(({ id, top, bottom }) => ({ id, top, bottom }));
  const crossing = (y: number) => measured.filter((b) => b.top < y - 0.5 && b.bottom > y + 0.5);
  const edges = Array.from(new Set(measured.flatMap((b) => [b.top, b.bottom])))
    .filter((y) => y > 0)
    .sort((a, b) => a - b);
  const splits = Array.from(new Set(measured.flatMap((b) => b.gaps))).sort((a, b) => a - b);
  // 줄 사이로 나눌 수 있는 지점 — 가로지르는 블록 모두에서 줄 사이여야 한다.
  const splittable = (y: number) => crossing(y).every((b) => b.gaps.some((g) => Math.abs(g - y) < 0.5));

  const starts = [0];
  let pageTop = 0;
  for (let guard = 0; guard < 400 && pageTop + contentH < total - 1; guard++) {
    const limit = pageTop + contentH;
    let next = -1;
    for (const y of edges) {
      if (y <= pageTop + 1) continue;
      if (y > limit) break;
      if (crossing(y).length === 0) next = y;
    }
    if (next < 0 || limit - next > KEEP_TOGETHER_MAX) {
      let split = -1;
      for (const y of splits) {
        if (y <= pageTop + 1) continue;
        if (y > limit) break;
        if (y > next && splittable(y)) split = y;
      }
      if (split > 0) next = split;
    }
    if (next < 0) next = limit;
    starts.push(next);
    pageTop = next;
  }
  return { starts, total, blocks };
}

/** render 는 측정용 한 번 + 장마다 한 번 불린다. 같은 본문을 돌려줘야 한다. */
export function A4Pages({ render, editing, maxScale = 1 }: { render: () => ReactNode; editing: boolean; maxScale?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [starts, setStarts] = useState<number[]>([0]);
  const [total, setTotal] = useState(CONTENT_H);
  const [blocks, setBlocks] = useState<MeasuredBlock[]>([]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const { starts: s, total: tt, blocks: b } = packColumns(el, CONTENT_H);
    setStarts((prev) => (prev.length === s.length && prev.every((v, i) => Math.abs(v - s[i]) < 0.5) ? prev : s));
    setTotal(tt);
    setBlocks((prev) =>
      prev.length === b.length && prev.every((v, i) => v.id === b[i].id && Math.abs(v.top - b[i].top) < 0.5 && Math.abs(v.bottom - b[i].bottom) < 0.5) ? prev : b
    );
  });

  const scale = w > 0 ? Math.min(w / PAGE_W, maxScale) : 0;
  // 블록을 줄 사이에서 나눈 경계엔 여백을 더 보여 주지 않는다 — 이웃 줄 조각이 비치지 않게.
  const splitAt = (y: number) => blocks.some((b) => b.top < y - 0.5 && b.bottom > y + 0.5);

  return (
    <div ref={wrapRef} className="w-full">
      {/* 높이 측정용 숨김 시트 */}
      <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: PAGE_W, visibility: "hidden" }}>
        <div ref={sheetRef}>{render()}</div>
      </div>

      {scale ? (
        <div className="flex flex-col gap-3">
          {starts.map((startPx, i) => {
            const endPx = i < starts.length - 1 ? starts[i + 1] : total;
            const windowH = Math.min(endPx - startPx, CONTENT_H);
            const bleedTop = editing && !splitAt(startPx) ? EDIT_BLEED : 0;
            const bleedBottom = editing && !splitAt(startPx + windowH) ? EDIT_BLEED : 0;
            // 이 페이지 창과 겹치는 모듈만 — 앞 페이지 끝·다음 페이지 첫 모듈이 여백(bleed)에 비치지 않게.
            const onPage = editing ? new Set(blocks.filter((b) => b.id && b.bottom > startPx + 0.5 && b.top < startPx + windowH - 0.5).map((b) => b.id as string)) : null;
            return (
              <div
                key={i}
                className="relative mx-auto overflow-hidden rounded-[8px] border border-[#E5E8EB] bg-white shadow-[0_8px_28px_rgba(11,18,39,0.10)]"
                style={{ width: PAGE_W * scale, height: PAGE_H * scale }}
              >
                <div className="absolute left-0 overflow-hidden" style={{ top: (PAGE_PAD - bleedTop) * scale, width: PAGE_W * scale, height: (windowH + bleedTop + bleedBottom) * scale }}>
                  <div style={{ position: "absolute", top: -((startPx - bleedTop) * scale), width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                    <PageModules.Provider value={onPage}>{render()}</PageModules.Provider>
                  </div>
                </div>
                <div className="absolute inset-x-0" style={{ bottom: PAGE_PAD * scale }}>
                  <div className="px-[56px]" style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "bottom left" }}>
                    <PdfBrandFooter />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** 선택·호버 표시 — 자리를 차지하지 않게 블록 바깥으로 겹쳐 그린다. 부모에 `group relative` 가 필요하다. */
/**
 * flagged = 전체 점검이 "고쳐 볼 만하다"고 표시한 블록. 선택 표시(파랑)보다 약하게 그려
 * 지금 편집 중인 블록을 가리지 않는다. 선택되면 선택 표시가 우선한다.
 * 이 표시도 자리를 차지하지 않고 print 에서 빠진다 — 미리보기·PDF 의 페이지 나눔이 같도록.
 */
export function EditOverlay({ selected, subtle, flagged }: { selected: boolean; subtle?: boolean; flagged?: boolean }) {
  const base = "pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-[6px] transition-colors print:hidden";
  if (selected) {
    return <span aria-hidden className={`${base} ${subtle ? "bg-[#FFFBF2]" : "bg-[#F5F8FF] outline outline-2 outline-[#0B46E8]"}`} />;
  }
  if (flagged) {
    // 점검에 걸린 블록 — 호버 때는 기존과 같은 반응을 유지한다.
    return <span aria-hidden className={`${base} bg-[#FFFBF2] outline outline-1 outline-[#F0C27B] group-hover:outline-[#C77700]`} />;
  }
  return (
    <span
      aria-hidden
      className={`${base} group-hover:bg-[#F7F9FC] group-hover:outline group-hover:outline-1 group-hover:outline-[#D7DCE3]`}
    />
  );
}
