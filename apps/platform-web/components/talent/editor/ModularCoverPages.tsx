"use client";

// 모듈형 자기소개서 A4 — 편집 중 구성(문항·문항별 에피소드)대로 A4 페이지로 보여준다.
// 머리·문항 제목·문단 모양은 기존 CoverA4Preview 와 같다. 문항 제목은 첫 문단과 한 덩어리로 두어
// 페이지 맨 아래에 제목만 남지 않게 한다. 편집 모드(interaction)에선 문항·문단 선택 표시를 겹쳐 그린다.
import type { ReactNode } from "react";
import type { BasicInfo } from "../../../lib/talent/basic-info";
import type { CoverDoc } from "../../../lib/talent/cover-doc";
import { answerText, type ResolvedCover } from "../../../lib/talent/cover-layout";
import { usePlatformT } from "../../../lib/i18n";
import { questionLabel } from "../career/CoverA4";
import { A4Pages, EditOverlay, Highlighted, useOffPage } from "./A4Pages";

export type CoverInteraction = {
  activeQ: number;
  selectedId: string | null;
  /**
   * 전체 점검에서 걸린 문항 — 문항 id → 본문에서 형광펜으로 칠할 구절.
   * 점검 단위는 문항이지만 표시는 답변 글자에 한다 — 제목에 표시하면 '이 문항 어딘가'까지만
   * 알려 주고, 어디를 고쳐야 하는지는 여전히 사용자가 찾아야 한다.
   * 값이 빈 배열이면 가리킬 구절이 없는 지적이라 답변 전체를 옅게 칠한다.
   */
  flaggedQuestions?: ReadonlyMap<string, string[]>;
  onActivate: (q: number) => void;
  onSelect: (q: number, id: string) => void;
};

type Props = {
  doc: CoverDoc;
  info: BasicInfo;
  layout: Pick<ResolvedCover, "questions">;
  interaction?: CoverInteraction;
};

export function ModularCoverPages({ doc, info, layout, interaction, maxScale = 1 }: Props & { maxScale?: number }) {
  return <A4Pages editing={!!interaction} maxScale={maxScale} render={() => <CoverBody doc={doc} info={info} layout={layout} interaction={interaction} />} />;
}

// ── 모바일 목록 ──────────────────────────────────────────────
// A4 를 390px 로 줄이면 답변 글씨가 6px 이 된다. 모바일에서는 문항 하나를 카드 하나로,
// 줄이지 않은 글씨로 보여준다. 문단을 누르면 그 에피소드를, 제목을 누르면 문항을 고른다.
// 데스크톱에서는 쓰이지 않는다.
export function CoverMobileList({
  doc,
  layout,
  flaggedQuestions,
  activeQ,
  selectedId,
  onActivate,
  onSelect
}: {
  doc: CoverDoc;
  layout: Pick<ResolvedCover, "questions">;
  flaggedQuestions?: ReadonlyMap<string, string[]>;
  activeQ: number;
  selectedId: string | null;
  onActivate: (q: number) => void;
  onSelect: (q: number, id: string) => void;
}) {
  const t = usePlatformT();
  const textOf = (id: string) => doc.items.find((i) => i.id === id)?.text ?? "";

  if (!layout.questions.length) {
    return (
      <p className="rounded-[14px] bg-white px-4 py-8 text-center text-[13.5px] leading-relaxed text-[#8B95A1] ring-1 ring-[#E5E8EB]">
        {t(
          "문항을 추가하고 에피소드를 넣으면 여기에 자기소개서로 정리돼요.",
          "Add questions and episodes and they'll appear here as your cover letter.",
          "添加题目和经历后会在此整理成自我介绍。",
          "Thêm câu hỏi và đoạn kể để hiển thị thành thư giới thiệu tại đây.",
          "設問とエピソードを入れると、ここに自己紹介書として整理されます。",
          "Tambahkan pertanyaan dan episode, akan tersusun di sini."
        )}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {layout.questions.map((question, q) => {
        const quotes = flaggedQuestions?.get(question.id);
        const count = answerText(question.blocks.map(textOf)).length;
        const over = question.limit ? count > question.limit : false;
        const selected = activeQ === q;
        return (
          <li key={question.id}>
            <div className={`rounded-[14px] bg-white px-4 py-4 ring-1 transition ${selected ? "ring-2 ring-[#0B46E8]" : "ring-[#E5E8EB]"}`}>
              <h2
                role="button"
                tabIndex={0}
                onClick={() => onActivate(q)}
                onKeyDown={(e) => e.key === "Enter" && onActivate(q)}
                className="border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black leading-snug tracking-[-0.01em] text-[#0B1227]"
              >
                {questionLabel(t, question.prompt) || t("(문항 없음)", "(no prompt)")}
              </h2>

              {question.blocks.length ? (
                <div className="mt-3 flex flex-col gap-2.5">
                  {question.blocks.map((id) => (
                    <p
                      key={id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(q, id)}
                      onKeyDown={(e) => e.key === "Enter" && onSelect(q, id)}
                      className={`whitespace-pre-line break-keep rounded-[8px] text-[13.5px] leading-[1.9] text-[#333D4B] ${
                        selectedId === id ? "bg-[#F4F7FF] px-2 py-1.5" : ""
                      }`}
                    >
                      {textOf(id).trim() ? (
                        quotes ? (
                          <Highlighted text={textOf(id)} quotes={quotes} />
                        ) : (
                          textOf(id)
                        )
                      ) : (
                        <span className="text-[#B0B8C1]">{t("(내용 없음)", "(empty)")}</span>
                      )}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[12.5px] leading-relaxed text-[#B0B8C1]">
                  {t(
                    "‘에피소드 넣기’ 에서 골라 이 문항에 넣어 보세요",
                    "Pick an episode from ‘Add episodes’ to put it here",
                    "在“插入经历”中选择后放入此题目",
                    "Chọn một đoạn kể ở ‘Thêm đoạn kể’ để thêm vào đây",
                    "「エピソードを入れる」から選んでこの設問に入れてください",
                    "Pilih episode dari ‘Tambah episode’ untuk ditambahkan"
                  )}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F2F4F6] pt-2.5">
                <span className="flex items-center gap-1.5">
                  <span className={`text-[12px] font-semibold tabular-nums ${over ? "text-[#F04452]" : "text-[#8B95A1]"}`}>
                    {question.limit ? `${count.toLocaleString()} / ${question.limit.toLocaleString()}` : count.toLocaleString()}
                    {t("자", " chars", " 字", " ký tự", " 字", " karakter")}
                  </span>
                  {quotes ? (
                    <span className="rounded-full bg-[#FFF6D6] px-2 py-1 text-[11.5px] font-bold leading-none text-[#8A6D00]">
                      {t("점검 필요", "Needs a look", "需检查", "Cần xem lại", "要チェック", "Perlu dicek")}
                    </span>
                  ) : null}
                </span>
                <button type="button" onClick={() => onActivate(q)} className="rounded-full px-2 py-1 text-[13px] font-bold leading-none text-[#0B46E8]">
                  {t("고치기", "Edit", "修改", "Sửa", "編集", "Ubah")}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CoverBody({ doc, info, layout, interaction: ix }: Props) {
  const t = usePlatformT();
  const contact = [info.email, info.phone, info.address].filter(Boolean);
  const textOf = (id: string) => doc.items.find((i) => i.id === id)?.text ?? "";
  return (
    <div className="w-full bg-white px-[56px] text-[#191F28]">
      {/* 헤더 — 이력서와 동일 */}
      <header data-block className="flex items-start gap-6 border-b border-[#E5E8EB] pb-6">
        {info.photoUrl && doc.showPhoto === true ? (
          <span className="h-[104px] w-[84px] shrink-0 overflow-hidden rounded-[6px] border border-[#E5E8EB] bg-[#F2F4F6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.photoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[32px] font-black leading-tight tracking-[-0.02em] text-[#0B1227]">{info.realName || t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")}</p>
          <div className="mt-4 flex flex-col gap-1 text-[13px] leading-relaxed text-[#4E5968]">
            {contact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-8 pb-2">
        {layout.questions.length === 0 ? (
          <p className="text-[13.5px] text-[#B0B8C1]">{t("문항을 추가하고 에피소드를 넣으면 여기에 자기소개서로 정리돼요.", "Add questions and episodes and they'll appear here as your cover letter.", "添加题目和经历后会在此整理成自我介绍。", "Thêm câu hỏi và đoạn kể để hiển thị thành thư giới thiệu tại đây.", "設問とエピソードを入れると、ここに自己紹介書として整理されます。", "Tambahkan pertanyaan dan episode, akan tersusun di sini.")}</p>
        ) : null}
        {layout.questions.map((question, q) => {
          const title = (
            <QuestionTitle
              q={q}
              title={questionLabel(t, question.prompt) || t("(문항 없음)", "(no prompt)")}
              empty={question.blocks.length === 0}
              ix={ix}
            />
          );
          const top = q === 0 ? "" : "mt-7";
          if (question.blocks.length === 0) {
            return (
              <Block key={question.id} id={question.id} className={top}>
                {title}
              </Block>
            );
          }
          return question.blocks.map((id, i) => (
            // 같은 에피소드가 여러 문항에 들어갈 수 있어 블록 id 는 문항과 묶는다.
            <Block key={`${question.id}:${id}`} id={`${question.id}:${id}`} className={i === 0 ? top : "mt-2.5"}>
              {i === 0 ? title : null}
              <Paragraph q={q} id={id} text={textOf(id)} ix={ix} highlight={ix?.flaggedQuestions?.get(question.id)} className={i === 0 ? "mt-3" : ""} />
            </Block>
          ));
        })}
      </div>
    </div>
  );
}

function Block({ id, className, children }: { id: string; className: string; children: ReactNode }) {
  const offPage = useOffPage(id);
  return (
    <div data-block data-module={id} className={`${className} ${offPage ? "invisible" : ""}`}>
      {children}
    </div>
  );
}

function QuestionTitle({ q, title, empty, ix }: { q: number; title: string; empty: boolean; ix?: CoverInteraction }) {
  const t = usePlatformT();
  const h2 = <h2 className="relative border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{title}</h2>;
  if (!ix) return h2;
  return (
    <div role="button" tabIndex={0} aria-label={t(`문항 ${q + 1}`, `Question ${q + 1}`, `题目 ${q + 1}`, `Câu ${q + 1}`, `設問 ${q + 1}`, `Pertanyaan ${q + 1}`)} onClick={() => ix.onActivate(q)} onKeyDown={(e) => e.key === "Enter" && ix.onActivate(q)} className="group relative cursor-pointer">
      <EditOverlay selected={ix.activeQ === q && !ix.selectedId} />
      {h2}
      {empty ? (
        // 빈 문항 안내 — 다음 문항과의 간격 안에 겹쳐 그려 자리를 차지하지 않는다(PDF 와 페이지 나눔이 같게).
        <span className="pointer-events-none absolute left-3 top-full mt-1.5 whitespace-nowrap text-[12px] text-[#B0B8C1] print:hidden">
          {t("왼쪽에서 에피소드를 골라 이 문항에 넣어 보세요", "Pick an episode on the left to add it here", "从左侧选择经历放入此题目", "Chọn một đoạn kể bên trái để thêm vào đây", "左からエピソードを選んでこの設問に入れてください", "Pilih episode di kiri untuk ditambahkan")}
        </span>
      ) : null}
    </div>
  );
}

function Paragraph({ q, id, text, ix, highlight, className }: { q: number; id: string; text: string; ix?: CoverInteraction; highlight?: string[]; className: string }) {
  const t = usePlatformT();
  const body = text.trim() ? (
    highlight ? <Highlighted text={text} quotes={highlight} /> : text
  ) : (
    <span className="text-[#B0B8C1]">{t("(내용 없음)", "(empty)")}</span>
  );
  const p = <p className="relative whitespace-pre-line break-keep text-[13.5px] leading-[1.9] text-[#333D4B]">{body}</p>;
  if (!ix) return <div className={className}>{p}</div>;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => ix.onSelect(q, id)}
      onKeyDown={(e) => e.key === "Enter" && ix.onSelect(q, id)}
      className={`group relative cursor-pointer ${className}`}
    >
      <EditOverlay selected={ix.activeQ === q && ix.selectedId === id} />
      {p}
    </div>
  );
}
