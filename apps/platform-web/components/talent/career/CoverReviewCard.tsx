"use client";

// 제출 전 최종 점검 — 글자 수·필수 소재·상투어·문항 간 중복을 한 화면에 모은다.
// 흩어져 있으면 사용자가 스크롤하며 하나씩 확인해야 하고, 결국 그냥 제출한다.
import { CheckCircle, WarningCircle, NotePencil, Ruler, Tag, Copy } from "@phosphor-icons/react";
import { reviewCover } from "../../../lib/talent/cover-review";
import type { CoverIssue } from "../../../lib/talent/cover-review";
import type { CoverDoc } from "../../../lib/talent/cover-doc";
import { usePlatformT } from "../../../lib/i18n";

function IssueIcon({ kind }: { kind: CoverIssue["kind"] }) {
  const cls = "h-4 w-4 shrink-0";
  if (kind === "empty") return <NotePencil className={`${cls} text-[#8B95A1]`} weight="fill" />;
  if (kind === "under" || kind === "over") return <Ruler className={`${cls} text-[#C79A00]`} weight="fill" />;
  if (kind === "keyword") return <Tag className={`${cls} text-[#F04452]`} weight="fill" />;
  if (kind === "overlap") return <Copy className={`${cls} text-[#C79A00]`} weight="fill" />;
  return <WarningCircle className={`${cls} text-[#C79A00]`} weight="fill" />;
}

export function CoverReviewCard({ doc }: { doc: CoverDoc }) {
  const t = usePlatformT();
  const { issues, filledPercent } = reviewCover(doc);

  // 표시 문구는 여기서 만든다(계산 모듈은 숫자·이름만 넘긴다).
  function describe(i: CoverIssue): string {
    switch (i.kind) {
      case "empty":
        return `${i.question} — ${t("아직 작성하지 않았어요","Not written yet","尚未填写","Chưa viết","未記入です","Belum ditulis")}`;
      case "under":
        return `${i.question} — ${i.length}${t("자",""," 字"," ký tự","字"," krt")} · ${t("목표까지","to target","距目标","tới mục tiêu","目標まで","ke target")} ${i.short}${t("자 부족"," short"," 字"," ký tự","字不足"," kurang")}`;
      case "over":
        return `${i.question} — ${i.length}${t("자",""," 字"," ký tự","字"," krt")} · ${t("상한 초과","over limit","超出上限","vượt hạn","上限超過","lewat batas")} ${i.excess}${t("자",""," 字"," ký tự","字"," krt")}`;
      case "cliche":
        return `${i.question} — ${t("다시 볼 표현","Phrases to revisit","可再斟酌的表达","Cụm nên xem lại","見直したい表現","Frasa perlu ditinjau")} ${i.phrases.slice(0, 3).map((p) => `「${p}」`).join(" ")}`;
      case "keyword":
        return `${t("소재","Point","素材","Nội dung","要素","Poin")} 「${i.keyword}」 ${t("가 본문에 없어요","is missing from the text","未出现在正文","không có trong bài","が本文にありません","tidak ada di teks")}`;
      case "overlap":
        return `${t("‘{a}’과 ‘{b}’에 같은 내용","Same content in ‘{a}’ and ‘{b}’","‘{a}’与‘{b}’内容重复","‘{a}’ và ‘{b}’ trùng nội dung","‘{a}’と‘{b}’に同じ内容","‘{a}’ & ‘{b}’ sama")
          .replace("{a}", i.aQuestion)
          .replace("{b}", i.bQuestion)}${i.shared.length ? ` — ${i.shared.slice(0, 3).join(", ")}` : ""}`;
    }
  }

  const clean = issues.length === 0;
  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <div className="flex items-center gap-2">
        {clean ? (
          <CheckCircle className="h-4 w-4 shrink-0 text-[#00C473]" weight="fill" />
        ) : (
          <WarningCircle className="h-4 w-4 shrink-0 text-[#C79A00]" weight="fill" />
        )}
        <span className="flex-1 text-[13.5px] font-bold text-[#0B1227]">
          {t("제출 전 최종 점검","Final check","提交前检查","Kiểm tra cuối","提出前チェック","Cek akhir")}
        </span>
        <span className="shrink-0 text-[11.5px] font-bold text-[#8B95A1] tabular-nums">
          {t("작성","Written","已写","Đã viết","記入","Terisi")} {filledPercent}%
        </span>
      </div>
      {clean ? (
        <p className="mt-2 text-[12.5px] text-[#00854A]">
          {t("확인할 항목이 없어요. 제출할 준비가 됐습니다.","Nothing to fix — ready to submit.","没有待修项，可以提交了。","Không có gì cần sửa — sẵn sàng gửi.","修正点はありません。提出できます。","Tidak ada perbaikan — siap kirim.")}
        </p>
      ) : (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {issues.map((i, idx) => (
            <li key={`${i.kind}-${idx}`} className="flex items-start gap-1.5">
              <span className="mt-[2px]"><IssueIcon kind={i.kind} /></span>
              <span className="min-w-0 break-anywhere text-[12.5px] leading-[1.6] text-[#4E5968]">{describe(i)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
