"use client";

// 모듈형 이력서 A4 — 버전 구성(칸·순서)대로 모듈을 배치해 A4 페이지로 보여준다.
// 치수·글꼴·섹션 모양은 기존 ResumeA4 와 같다(같은 이력서가 다른 화면에서 달라 보이지 않게).
// 편집 모드(interaction)에서는 모듈 선택·드래그·놓을 위치 표시를 함께 그린다. 페이지 틀은 A4Pages.
import { type DragEvent, type ReactNode } from "react";
import type { CareerSection } from "../../../lib/talent/career-chat";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import { FIXED_MODULES } from "../../../lib/talent/doc-versions";
import { displayMonth, normalizeUrl, type ResumeDoc, type ResumeItem } from "../../../lib/talent/resume-doc";
import type { ResolvedLayout } from "../../../lib/talent/resume-layout";
import type { BasicInfo } from "../../../lib/talent/basic-info";
import { usePlatformT } from "../../../lib/i18n";
import { A4Pages, EditOverlay, useOffPage } from "./A4Pages";

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
  interaction?: EditorInteraction;
};

export function ModularResumePages({ doc, info, layout, interaction, maxScale = 1 }: Props & { maxScale?: number }) {
  return <A4Pages editing={!!interaction} maxScale={maxScale} render={() => <ResumeBody doc={doc} info={info} layout={layout} interaction={interaction} />} />;
}

// ── A4 본문 ──────────────────────────────────────────────────

function ResumeBody({
  doc,
  info,
  layout,
  interaction
}: Props) {
  const t = usePlatformT();
  const two = layout.cols.length === 2;
  // 편집 표시(선택 테두리·놓기 자리)는 자리를 차지하지 않게 그린다 — 편집 화면과 PDF 가 같은 곳에서 페이지를 나눈다.
  const ix = interaction;
  const empty = layout.cols.every((c) => c.length === 0);
  return (
    <div className="w-full bg-white px-[56px] text-[#191F28]">
      <div className={two ? "grid grid-cols-[212px_minmax(0,1fr)] gap-x-9" : "flex flex-col"}>
        {layout.cols.map((col, c) => (
          <Column key={c} col={c} ids={col} narrow={two && c === 0} doc={doc} info={info} ix={ix} />
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
  ix
}: {
  col: number;
  ids: string[];
  narrow: boolean;
  doc: ResumeDoc;
  info: BasicInfo;
  ix?: EditorInteraction;
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
        const content = renderModule({ id, item, doc, info, narrow, t, showTitle });
        if (!content) return null;
        return (
          <div key={id}>
            {indicator(index)}
            <ModuleBlock id={id} col={col} index={index} ix={ix} gapTop={index > 0 && (showTitle || id === FIXED_MODULES.summary || id === FIXED_MODULES.links)}>
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
  gapTop,
  children
}: {
  id: string;
  col: number;
  index: number;
  ix?: EditorInteraction;
  gapTop: boolean;
  children: ReactNode;
}) {
  const offPage = useOffPage(id);
  const spacing = gapTop ? "mt-7" : "mt-2.5";
  if (!ix) {
    return (
      <div data-block data-module={id} className={index === 0 ? "" : spacing}>
        {children}
      </div>
    );
  }
  const selected = ix.selectedId === id;
  const dragging = ix.dragId === id;
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
      // 편집 표시는 자리를 차지하지 않는다(여백·테두리를 바깥 층으로) — 미리보기와 PDF 의 페이지 나눔이 같도록.
      className={`group relative cursor-grab ${index === 0 ? "" : spacing} ${dragging ? "opacity-40" : ""} ${offPage ? "invisible" : ""}`}
    >
      <EditOverlay selected={selected} />
      <div className="relative">{children}</div>
    </div>
  );
}

function EndZone({ col, index, ix }: { col: number; index: number; ix: EditorInteraction }) {
  const t = usePlatformT();
  return (
    // 칸 끝에 놓는 자리 — 높이 0 으로 두고 겹쳐 그려 페이지 나눔에 영향을 주지 않는다.
    <div className="relative h-0 print:hidden">
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
        className={`absolute inset-x-0 top-3 flex h-9 items-center justify-center rounded-[6px] text-[11px] font-semibold ${
          ix.dragId ? "border border-dashed border-[#C9CDD2] bg-white text-[#8B95A1]" : "pointer-events-none text-transparent"
        }`}
      >
        {t("여기에 놓기", "Drop here", "放在这里", "Thả vào đây", "ここにドロップ", "Letakkan di sini")}
      </div>
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
  narrow,
  t,
  showTitle
}: {
  id: string;
  item: ResumeItem | undefined;
  doc: ResumeDoc;
  info: BasicInfo;
  narrow: boolean;
  t: ReturnType<typeof usePlatformT>;
  showTitle: boolean;
}): ReactNode {
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
    const text = (doc.summary ?? "").trim();
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
  const company = (item.company ?? "").trim();
  const text = (item.text ?? "").trim();
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
