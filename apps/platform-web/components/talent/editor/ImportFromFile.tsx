"use client";

// 파일(PDF)·붙여넣은 텍스트에서 이력서·자소서를 가져와 **지금 쓰는 에디터 폼**으로 넣는다.
//
// 설계상 지킨 것 셋:
//  1. **기존 내용을 지우지 않는다.** 가져온 항목을 뒤에 더하기만 한다. 파일 하나로 공들여 쓴 글을
//     날리는 건 되돌릴 수 없고, 사용자는 '가져오기'를 '합치기'로 기대한다.
//  2. **적용 전에 무엇이 들어오는지 보여 준다.** 섹션별 개수를 먼저 띄우고, 사용자가 누를 때만 넣는다.
//  3. **되돌리기**를 둔다(정리·다듬기와 같은 약속).
//
// PDF 추출·구조화는 서버가 한다(/members/me/ai/import-resume, import-cover-letter).
// 여기서는 파일을 읽어 보내고, 받은 레거시 모양을 import-to-renewal 로 변환해 넘기는 일만 한다.
import { useRef, useState, type ReactNode } from "react";
import { UploadSimple, CircleNotch } from "@phosphor-icons/react";
import type { PlatformT } from "../../../lib/i18n";
import { Section, TINT_BTN } from "./editor-shared";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import type { CareerSection } from "../../../lib/talent/career-chat";

/** 가져오기 결과를 사람이 읽는 요약으로. 미리보기에 쓴다. */
export type ImportSummary = { label: string; count: number }[];

export function ImportFromFile<T>({
  t,
  title,
  hint,
  parse,
  summarize,
  onApply,
  onUndo
}: {
  t: PlatformT;
  title: string;
  hint: string;
  /** 파일(dataUrl) 또는 붙여넣은 텍스트 → 가져온 결과. 서버 호출은 여기서 한다. */
  parse: (input: { pdfBase64?: string; text?: string }) => Promise<T>;
  /** 결과 → "무엇이 몇 개 들어오는지". 빈 배열이면 '가져올 내용 없음'으로 본다. */
  summarize: (parsed: T) => ImportSummary;
  onApply: (parsed: T) => void;
  /** 적용 직후에만 노출. 누르면 가져오기 전으로 되돌린다. */
  onUndo?: (() => void) | null;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ parsed: T; summary: ImportSummary } | null>(null);
  const [applied, setApplied] = useState(false);

  const run = async (input: { pdfBase64?: string; text?: string }) => {
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const parsed = await parse(input);
      const summary = summarize(parsed);
      if (summary.length === 0) {
        setError(t("가져올 내용을 찾지 못했어요. 스캔한 이미지 PDF면 내용을 직접 붙여넣어 주세요.", "Couldn't find anything to import. If it's a scanned PDF, paste the text instead.", "没有找到可导入的内容。若为扫描版 PDF，请直接粘贴文本。", "Không tìm thấy nội dung. Nếu là PDF scan, hãy dán nội dung trực tiếp.", "取り込める内容が見つかりませんでした。スキャンPDFの場合は本文を貼り付けてください。", "Tidak menemukan isi untuk diimpor. Jika PDF hasil pindai, tempel teksnya."));
        return;
      }
      setPreview({ parsed, summary });
    } catch (err) {
      // 한도·포인트 안내는 aiPost 가 따로 띄운다. 여기서는 읽기 실패만.
      setError(err instanceof Error && err.message ? err.message : t("파일을 읽지 못했어요.", "Couldn't read the file.", "无法读取文件。", "Không đọc được tệp.", "ファイルを読み取れませんでした。", "Tidak bisa membaca berkas."));
    } finally {
      setBusy(false);
    }
  };

  const pickFile = (file: File | null) => {
    if (!file) return;
    // 서버가 12MB 에서 거절한다 — 올리기 전에 먼저 알려 준다(업로드 기다렸다 실패하면 답답하다).
    if (file.size > 12 * 1024 * 1024) {
      setError(t("파일이 너무 커요(12MB 이하).", "File is too large (max 12MB).", "文件过大（最大 12MB）。", "Tệp quá lớn (tối đa 12MB).", "ファイルが大きすぎます（12MB以下）。", "Berkas terlalu besar (maks 12MB)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => void run({ pdfBase64: typeof reader.result === "string" ? reader.result : "" });
    reader.onerror = () => setError(t("파일을 읽지 못했어요.", "Couldn't read the file.", "无法读取文件。", "Không đọc được tệp.", "ファイルを読み取れませんでした。", "Tidak bisa membaca berkas."));
    reader.readAsDataURL(file);
  };

  const row = (children: ReactNode) => <p className="text-[11.5px] leading-[1.6] text-[#8B95A1]">{children}</p>;

  return (
    <Section title={title}>
      <p className="text-[11.5px] leading-[1.6] text-[#8B95A1]">{hint}</p>

      {preview ? (
        <>
          {row(
            t(
              "아래 내용이 지금 문서에 더해져요. 기존 항목은 그대로 둬요.",
              "These will be added to your current document. Nothing existing is removed.",
              "以下内容将添加到当前文档。现有条目保持不变。",
              "Những mục này sẽ được thêm vào tài liệu hiện tại. Mục cũ được giữ nguyên.",
              "以下が今の文書に追加されます。既存の項目はそのままです。",
              "Berikut akan ditambahkan ke dokumen saat ini. Yang lama tetap ada."
            )
          )}
          <ul className="flex flex-col gap-1">
            {preview.summary.map((s) => (
              <li key={s.label} className="flex items-center justify-between text-[12px] text-[#333D4B]">
                <span className="truncate">{s.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-[#0B46E8]">{s.count}</span>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onApply(preview.parsed);
                setPreview(null);
                setApplied(true);
              }}
              className={`${TINT_BTN} h-9 rounded-[10px] text-[13px] font-semibold leading-none`}
            >
              {t("넣기", "Add", "添加", "Thêm", "追加", "Tambah")}
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="h-9 rounded-[10px] bg-white text-[12.5px] font-semibold text-[#4E5968] ring-1 ring-[#E5E8EB] transition hover:bg-[#F7F8FA]"
            >
              {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf,.txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = ""; // 같은 파일을 다시 고를 수 있게
              pickFile(f);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className={`${TINT_BTN} flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold leading-none`}
          >
            {busy ? <CircleNotch size={14} weight="bold" className="animate-spin" /> : <UploadSimple size={14} weight="bold" />}
            <span>{busy ? t("읽는 중…", "Reading…", "读取中…", "Đang đọc…", "読み取り中…", "Membaca…") : t("파일 고르기 (PDF)", "Choose a file (PDF)", "选择文件 (PDF)", "Chọn tệp (PDF)", "ファイルを選ぶ (PDF)", "Pilih berkas (PDF)")}</span>
          </button>
          <PasteBox t={t} busy={busy} onSubmit={(text) => void run({ text })} />
        </>
      )}

      {error ? <p className="text-[11.5px] leading-relaxed text-[#F04452]">{error}</p> : null}
      {applied && onUndo ? (
        <button
          type="button"
          onClick={() => {
            onUndo();
            setApplied(false);
          }}
          className="h-9 w-full rounded-[10px] bg-white text-[12.5px] font-semibold text-[#4E5968] ring-1 ring-[#E5E8EB] transition hover:text-[#F04452]"
        >
          {t("가져오기 되돌리기", "Undo import", "撤销导入", "Hoàn tác nhập", "取り込みを元に戻す", "Batalkan impor")}
        </button>
      ) : null}
    </Section>
  );
}

/** 스캔 PDF 처럼 텍스트가 안 뽑히는 경우의 대안 — 서버 안내문과 같은 길을 열어 둔다. */
function PasteBox({ t, busy, onSubmit }: { t: PlatformT; busy: boolean; onSubmit: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-[11.5px] text-[#8B95A1] underline-offset-2 hover:text-[#4E5968] hover:underline">
        {t("내용을 직접 붙여넣기", "Paste the text instead", "直接粘贴内容", "Dán nội dung trực tiếp", "本文を貼り付ける", "Tempel teksnya")}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={t("이력서 내용을 붙여넣어 주세요.", "Paste your resume text here.", "在此粘贴简历内容。", "Dán nội dung hồ sơ vào đây.", "履歴書の内容を貼り付けてください。", "Tempel isi resume di sini.")}
        className="w-full rounded-[10px] bg-[#F7F8FA] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#191F28] outline-none ring-1 ring-[#E5E8EB] placeholder:text-[#B0B8C1] focus:ring-[#0B46E8]"
      />
      <button
        type="button"
        disabled={busy || text.trim().length < 20}
        onClick={() => onSubmit(text.trim())}
        className={`${TINT_BTN} h-9 rounded-[10px] text-[13px] font-semibold leading-none`}
      >
        {t("이 내용으로 가져오기", "Import this text", "用此内容导入", "Nhập nội dung này", "この内容で取り込む", "Impor teks ini")}
      </button>
    </div>
  );
}

/** 이력서 섹션별 개수를 사람이 읽는 요약으로. */
export function resumeImportSummary(t: PlatformT, counts: { section: CareerSection; count: number }[]): ImportSummary {
  return counts.map((c) => ({ label: sectionLabelOf(t, c.section), count: c.count }));
}
