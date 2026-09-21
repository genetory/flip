"use client";

// 모듈형 이력서 A4 — 버전 구성(칸·순서)대로 모듈을 배치해 A4 페이지로 보여준다.
// 치수·글꼴·섹션 모양은 기존 ResumeA4 와 같다(같은 이력서가 다른 화면에서 달라 보이지 않게).
// 편집 모드(interaction)에서는 모듈 선택·드래그·놓을 위치 표시를 함께 그린다.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type DragEvent, type ReactNode } from "react";
import type { CareerSection } from "../../../lib/talent/career-chat";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import { FIXED_MODULES, type Overrides } from "../../../lib/talent/doc-versions";
import { displayMonth, normalizeUrl, type ResumeDoc, type ResumeItem } from "../../../lib/talent/resume-doc";
import type { ResolvedLayout } from "../../../lib/talent/resume-layout";
import type { BasicInfo } from "../../../lib/talent/basic-info";
import { usePlatformT } from "../../../lib/i18n";
import { PdfBrandFooter } from "../career/pdf-print";

export const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_PAD = 52;
const FOOTER_H = 44;
const CONTENT_H = PAGE_H - PAGE_PAD * 2 - FOOTER_H;
// 편집 모드에서 페이지 창을 위아래로 이만큼 더 보여 준다 — 페이지 맨 위·아래 모듈의 선택 테두리와
// '이 버전용' 표시가 창 경계에서 잘리지 않게. 여백에 비치는 이웃 페이지 모듈은 PageModules 로 가린다.
const EDIT_BLEED = 12;

/** 이 페이지에 속한 모듈 id. 없으면(측정용·편집 아님) 전부 보인다. */
const PageModules = createContext<Set<string> | null>(null);

type MeasuredBlock = { id: string | null; top: number; bottom: number };

/** 놓을 자리 — col 칸의 index 번째 앞. */
export type DropSlot = { col: number; index: number };

export type EditorInteraction = {
  selectedId: string | null;
  dragId: string | null;
  hover: DropSlot | null;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onHover: (slot: DropSlot) => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

type Props = {
  doc: ResumeDoc;
  info: BasicInfo;
  layout: ResolvedLayout;
  overrides: Overrides;
  interaction?: EditorInteraction;
};

/**
 * 여러 칸이어도 항목이 잘리지 않게 페이지를 나눈다 — 어느 칸의 블록도 가로지르지 않는
 * 가장 먼 지점에서 끊는다. 한 블록이 한 장보다 크면 어쩔 수 없이 경계에서 자른다.
 */
function packColumns(root: HTMLElement, contentH: number): { starts: number[]; total: number; blocks: MeasuredBlock[] } {
  const total = root.scrollHeight;
  const rootTop = root.getBoundingClientRect().top;
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-block]")).map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute("data-module"), top: r.top - rootTop, bottom: r.bottom - rootTop };
  });
  const straddles = (y: number) => blocks.some((b) => b.top < y - 0.5 && b.bottom > y + 0.5);
  const candidates = Array.from(new Set(blocks.flatMap((b) => [b.top, b.bottom])))
    .filter((y) => y > 0)
    .sort((a, b) => a - b);

  const starts = [0];
  let pageTop = 0;
  for (let guard = 0; guard < 200 && pageTop + contentH < total - 1; guard++) {
    const limit = pageTop + contentH;
    let next = -1;
    for (const y of candidates) {
      if (y <= pageTop + 1) continue;
      if (y > limit) break;
      if (!straddles(y)) next = y;
    }
    if (next < 0) next = limit;
    starts.push(next);
    pageTop = next;
  }
  return { starts, total, blocks };
}

export function ModularResumePages({ doc, info, layout, overrides, interaction, maxScale = 1 }: Props & { maxScale?: number }) {
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
  const bleed = interaction ? EDIT_BLEED : 0;

  return (
    <div ref={wrapRef} className="w-full">
      {/* 높이 측정용 숨김 시트 — 편집 표시는 빼고 잰다 */}
      <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: PAGE_W, visibility: "hidden" }}>
        <div ref={sheetRef}>
          <ResumeBody doc={doc} info={info} layout={layout} overrides={overrides} interaction={interaction} measure />
        </div>
      </div>

      {scale ? (
        <div className="flex flex-col gap-3">
          {starts.map((startPx, i) => {
            const endPx = i < starts.length - 1 ? starts[i + 1] : total;
            const windowH = Math.min(endPx - startPx, CONTENT_H);
            // 이 페이지 창과 겹치는 모듈만 — 앞 페이지 끝·다음 페이지 첫 모듈이 여백(bleed)에 비치지 않게.
            const onPage = bleed ? new Set(blocks.filter((b) => b.id && b.bottom > startPx + 0.5 && b.top < startPx + windowH - 0.5).map((b) => b.id as string)) : null;
            return (
              <div
                key={i}
                className="relative mx-auto overflow-hidden rounded-[8px] border border-[#E5E8EB] bg-white shadow-[0_8px_28px_rgba(11,18,39,0.10)]"
                style={{ width: PAGE_W * scale, height: PAGE_H * scale }}
              >
                <div className="absolute left-0 overflow-hidden" style={{ top: (PAGE_PAD - bleed) * scale, width: PAGE_W * scale, height: (windowH + bleed * 2) * scale }}>
                  <div style={{ position: "absolute", top: -((startPx - bleed) * scale), width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                    <PageModules.Provider value={onPage}>
                      <ResumeBody doc={doc} info={info} layout={layout} overrides={overrides} interaction={interaction} />
                    </PageModules.Provider>
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

// ── A4 본문 ──────────────────────────────────────────────────

function ResumeBody({
  doc,
  info,
  layout,
  overrides,
  interaction,
  measure
}: Props & { measure?: boolean }) {
  const t = usePlatformT();
  const two = layout.cols.length === 2;
  // 측정용 사본도 편집 여백(모듈 패딩·놓기 영역)을 똑같이 그려야 페이지 높이가 맞는다 —
  // 빼고 재면 실제 화면보다 짧게 재서 페이지 아래가 잘린다. 사본은 화면 밖·pointer-events 없음.
  const ix = interaction;
  const empty = layout.cols.every((c) => c.length === 0);
  return (
    <div className="w-full bg-white px-[56px] text-[#191F28]">
      <div className={two ? "grid grid-cols-[212px_minmax(0,1fr)] gap-x-9" : "flex flex-col"}>
        {layout.cols.map((col, c) => (
          <Column key={c} col={c} ids={col} narrow={two && c === 0} doc={doc} info={info} overrides={overrides} ix={ix} measure={measure} />
        ))}
      </div>
      {empty ? (
        <p className="text-[13.5px] text-[#B0B8C1]">
          {t("왼쪽에서 모듈을 넣으면 여기에 이력서로 정리돼요.", "Add modules from the left and they'll appear here.", "从左侧添加模块后会在此整理成简历。", "Thêm mô-đun từ bên trái để hiển thị tại đây.", "左からモジュールを入れると、ここに履歴書として整理されます。", "Tambahkan modul dari kiri, akan tersusun di sini.")}
        </p>
      ) : null}
    </div>
  );
}

function Column({
  col,
  ids,
  narrow,
  doc,
  info,
  overrides,
  ix,
  measure
}: {
  col: number;
  ids: string[];
  narrow: boolean;
  doc: ResumeDoc;
  info: BasicInfo;
  overrides: Overrides;
  ix?: EditorInteraction;
  measure?: boolean;
}) {
  const t = usePlatformT();
  const itemById = new Map(doc.items.map((i) => [i.id, i]));
  let prevSection: CareerSection | "@" | null = null;

  const indicator = (index: number) =>
    ix?.dragId && ix.hover && ix.hover.col === col && ix.hover.index === index ? (
      <div className="relative h-0" aria-hidden>
        <div className="absolute inset-x-0 -top-[4px] h-[3px] rounded-full bg-[#0B46E8]" />
      </div>
    ) : null;

  return (
    <div className="flex min-w-0 flex-col">
      {ids.map((id, index) => {
        const item = itemById.get(id);
        const section: CareerSection | "@" = item ? item.section : "@";
        const showTitle = !!item && section !== prevSection;
        prevSection = section;
        const content = renderModule({ id, item, doc, info, overrides, narrow, t, showTitle });
        if (!content) return null;
        return (
          <div key={id}>
            {indicator(index)}
            <ModuleBlock id={id} col={col} index={index} ix={ix} forked={!!overrides[id] && !measure} gapTop={index > 0 && (showTitle || id === FIXED_MODULES.summary || id === FIXED_MODULES.links)}>
              {content}
            </ModuleBlock>
          </div>
        );
      })}
      {indicator(ids.length)}
      {ix ? <EndZone col={col} index={ids.length} ix={ix} /> : null}
    </div>
  );
}

function ModuleBlock({
  id,
  col,
  index,
  ix,
  forked,
  gapTop,
  children
}: {
  id: string;
  col: number;
  index: number;
  ix?: EditorInteraction;
  forked: boolean;
  gapTop: boolean;
  children: ReactNode;
}) {
  const t = usePlatformT();
  const pageModules = useContext(PageModules);
  const spacing = gapTop ? "mt-7" : "mt-2.5";
  if (!ix) {
    return (
      <div data-block className={index === 0 ? "" : spacing}>
        {children}
      </div>
    );
  }
  const selected = ix.selectedId === id;
  const dragging = ix.dragId === id;
  const offPage = pageModules ? !pageModules.has(id) : false;
  const over = (e: DragEvent<HTMLDivElement>) => {
    if (!ix.dragId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const r = e.currentTarget.getBoundingClientRect();
    ix.onHover({ col, index: e.clientY > r.top + r.height / 2 ? index + 1 : index });
  };
  return (
    <div
      data-block
      data-module={id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
        ix.onDragStart(id);
      }}
      onDragEnd={ix.onDragEnd}
      onDragOver={over}
      onDrop={(e) => {
        e.preventDefault();
        ix.onDrop();
      }}
      onClick={() => ix.onSelect(id)}
      className={`relative -mx-2 cursor-grab rounded-[6px] px-2 py-1 transition-colors print:m-0 print:bg-transparent print:p-0 print:outline-0 ${index === 0 ? "" : spacing} ${
        selected ? "bg-[#F5F8FF] outline outline-2 outline-[#0B46E8]" : "hover:bg-[#F7F9FC] hover:outline hover:outline-1 hover:outline-[#D7DCE3]"
      } ${dragging ? "opacity-40" : ""} ${offPage ? "invisible" : ""}`}
    >
      {forked ? (
        <span className="absolute -top-2 right-2 rounded-[4px] bg-[#FFF6E5] px-1.5 py-[1px] text-[10px] font-bold text-[#B25E09] print:hidden">
          {t("이 버전용", "This version", "本版本专用", "Riêng bản này", "このバージョン用", "Versi ini")}
        </span>
      ) : null}
      {children}
    </div>
  );
}

function EndZone({ col, index, ix }: { col: number; index: number; ix: EditorInteraction }) {
  const t = usePlatformT();
  return (
    <div
      onDragOver={(e) => {
        if (!ix.dragId) return;
        e.preventDefault();
        ix.onHover({ col, index });
      }}
      onDrop={(e) => {
        e.preventDefault();
        ix.onDrop();
      }}
      className={`mt-3 flex min-h-[36px] items-center justify-center rounded-[6px] text-[11px] font-semibold print:hidden ${
        ix.dragId ? "border border-dashed border-[#C9CDD2] text-[#8B95A1]" : "text-transparent"
      }`}
    >
      {t("여기에 놓기", "Drop here", "放在这里", "Thả vào đây", "ここにドロップ", "Letakkan di sini")}
    </div>
  );
}

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="mb-3 border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{children}</h2>
);

function renderModule({
  id,
  item,
  doc,
  info,
  overrides,
  narrow,
  t,
  showTitle
}: {
  id: string;
  item: ResumeItem | undefined;
  doc: ResumeDoc;
  info: BasicInfo;
  overrides: Overrides;
  narrow: boolean;
  t: ReturnType<typeof usePlatformT>;
  showTitle: boolean;
}): ReactNode {
  const ov = overrides[id] ?? {};
  if (id === FIXED_MODULES.basic) {
    const contact = [info.email, info.phone, info.address].filter(Boolean);
    const photo = info.photoUrl && doc.showPhoto === true;
    return (
      <header className={`flex ${narrow ? "flex-col gap-4" : "items-start gap-6"} border-b border-[#E5E8EB] pb-6`}>
        {photo ? (
          <span className="h-[104px] w-[84px] shrink-0 overflow-hidden rounded-[6px] border border-[#E5E8EB] bg-[#F2F4F6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.photoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={`${narrow ? "text-[24px]" : "text-[32px]"} font-black leading-tight tracking-[-0.02em] text-[#0B1227]`}>
            {info.realName || t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")}
          </p>
          {doc.targetRole?.trim() ? <p className="mt-1.5 text-[13px] font-bold text-[#0B46E8]">{doc.targetRole.trim()}</p> : null}
          <div className="mt-3 flex flex-col gap-1 break-all text-[13px] leading-relaxed text-[#4E5968]">
            {contact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        </div>
      </header>
    );
  }
  if (id === FIXED_MODULES.summary) {
    const text = (ov.text ?? doc.summary ?? "").trim();
    if (!text) return null;
    return (
      <section>
        <H2>{t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang")}</H2>
        <p className="whitespace-pre-line break-keep text-[13.5px] leading-relaxed text-[#333D4B]">{text}</p>
      </section>
    );
  }
  if (id === FIXED_MODULES.links) {
    const links = (doc.links ?? []).filter((l) => l.url?.trim());
    if (!links.length) return null;
    return (
      <section>
        <H2>{t("링크·포트폴리오", "Links & portfolio", "链接·作品集", "Liên kết & portfolio", "リンク・ポートフォリオ", "Tautan & portofolio")}</H2>
        <ul className="flex flex-col gap-2.5">
          {links.map((l, i) => (
            <li key={i} className="break-keep text-[13.5px] leading-relaxed text-[#333D4B]">
              {l.label?.trim() ? <span className="block font-bold text-[#191F28]">{l.label.trim()}</span> : null}
              <a href={normalizeUrl(l.url)} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-[#0B46E8] underline">
                {l.url.trim()}
              </a>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (!item) return null;
  const company = (ov.company ?? item.company ?? "").trim();
  const text = (ov.text ?? item.text ?? "").trim();
  if (!company && !text) return null;
  const range = [item.startDate, item.endDate].map((d) => displayMonth(d ?? "")).filter(Boolean).join(" – ");
  return (
    <div>
      {showTitle ? <H2>{sectionLabelOf(t, item.section)}</H2> : null}
      <div className={`flex ${narrow ? "flex-col gap-0.5" : "items-start gap-3"} break-keep text-[13.5px] leading-relaxed text-[#333D4B]`}>
        {!narrow ? <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden /> : null}
        <span className="min-w-0 flex-1">
          {company ? <span className="block font-bold text-[#191F28]">{company}</span> : null}
          {text ? <span className={`whitespace-pre-line ${company ? "mt-0.5 block text-[#4E5968]" : ""}`}>{text}</span> : null}
        </span>
        {range ? <span className="shrink-0 text-[12px] font-medium text-[#8B95A1]">{range}</span> : null}
      </div>
    </div>
  );
}
