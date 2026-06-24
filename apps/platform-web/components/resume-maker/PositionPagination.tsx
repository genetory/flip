"use client";

import { type MouseEvent } from "react";

// 스크롤되는 가장 가까운 조상(없으면 window 대용으로 null).
function scrollableAncestor(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

// 숫자 페이지 버튼(1,2,3…N). 페이지가 많으면 양끝·현재 주변만 보이고 사이는 …로 접는다.
// 텍스트가 숫자뿐이라 i18n 불필요. 공고 맞춤·모의 면접의 포지션 목록에서 공유한다.
function buildPageItems(page: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, 2, total - 1, total, page - 1, page, page + 1]);
  const pages = Array.from(set)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export function PositionPagination({
  page,
  totalPages,
  onChange
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const items = buildPageItems(page, totalPages);

  // 페이지를 바꾸면 위쪽 리스트 높이가 달라져 클릭한 버튼이 화면에서 튄다.
  // 클릭한 버튼의 뷰포트 위치를 기억했다가 리렌더 후 같은 위치로 스크롤을 보정한다.
  const change = (e: MouseEvent<HTMLButtonElement>, p: number) => {
    const el = e.currentTarget;
    const before = el.getBoundingClientRect().top;
    onChange(p);
    requestAnimationFrame(() => {
      const delta = el.getBoundingClientRect().top - before;
      if (delta === 0) return;
      const sc = scrollableAncestor(el);
      if (sc) sc.scrollTop += delta;
      else window.scrollBy(0, delta);
    });
  };

  return (
    <div className="my-8 flex flex-wrap items-center justify-center gap-3">
      {items.map((it, i) =>
        it === "ellipsis" ? (
          <span key={`e${i}`} className="text-[13px] text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={(e) => change(e, it)}
            aria-current={it === page ? "page" : undefined}
            className={`text-[13px] transition ${
              it === page ? "font-bold text-[#0B46E8]" : "font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            {it}
          </button>
        )
      )}
    </div>
  );
}
