"use client";

// 이력서·자소서가 아직 없을 때 에디터 앞에 띄우는 '어떻게 시작할까요?' 화면.
// 빈 문서로 바로 들어가면, 이미 다른 곳에 써 둔 이력서·자소서가 있는 사람도 처음부터 다시
// 쳐야 하는 줄 안다(가져오기는 편집 패널 안쪽에 있어 눈에 띄지 않는다). 그래서 갈래를 먼저 고르게 한다.
//  - 새로 만들기: 빈 문서로 에디터를 연다(저장은 첫 편집 때).
//  - 써 둔 것으로 만들기: PDF·텍스트를 가져와 채운 뒤 에디터를 연다. 가져오기 자체는 ImportFromFile 그대로.
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, FileArrowUp, PencilSimpleLine } from "@phosphor-icons/react";
import type { PlatformT } from "../../../lib/i18n";
import { trackEditor } from "../../../lib/analytics";

export function StartChooser({
  t,
  kind,
  exitHref,
  onNew,
  importPanel
}: {
  t: PlatformT;
  kind: "resume" | "cover";
  exitHref: string;
  onNew: () => void;
  /** '써 둔 것으로 만들기'를 고르면 펼쳐지는 가져오기 패널. 적용되면 문서가 생겨 에디터로 넘어간다. */
  importPanel: ReactNode;
}) {
  const [importing, setImporting] = useState(false);
  const resume = kind === "resume";

  const option = (active: boolean) =>
    `flex w-full items-start gap-4 rounded-2xl border bg-white p-5 text-left transition ${
      active ? "border-[#0B46E8] shadow-[0_8px_24px_-12px_rgba(11,70,232,0.35)]" : "border-[#E5E8EB] hover:border-[#0B46E8]/50"
    }`;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="border-b border-[#EEF1F5] bg-white">
        <div className="mx-auto flex h-14 max-w-[640px] items-center px-4">
          <Link href={exitHref} className="flex items-center gap-1.5 text-[14px] font-semibold text-[#4E5968] hover:text-[#191F28]">
            <ArrowLeft size={18} weight="bold" />
            {t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-4 pb-16 pt-8">
        <h1 className="break-keep text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">
          {resume
            ? t("이력서를 어떻게 시작할까요?", "How do you want to start your resume?", "要如何开始写简历？", "Bạn muốn bắt đầu CV thế nào?", "履歴書をどう始めますか？", "Mau mulai CV dari mana?")
            : t("자기소개서를 어떻게 시작할까요?", "How do you want to start your cover letter?", "要如何开始写自我介绍？", "Bạn muốn bắt đầu thư giới thiệu thế nào?", "自己紹介書をどう始めますか？", "Mau mulai surat lamaran dari mana?")}
        </h1>
        <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#8B95A1]">
          {t("어느 쪽으로 시작해도 나중에 얼마든지 고칠 수 있어요.", "Either way, you can edit everything later.", "无论选哪种，之后都可以随时修改。", "Chọn cách nào cũng có thể sửa sau.", "どちらで始めても、あとで自由に直せます。", "Pilih yang mana pun, nanti tetap bisa diubah.")}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              trackEditor("editor_start_selected", { doc: kind, method: "new" });
              onNew();
            }}
            className={option(false)}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[#0B46E8]">
              <PencilSimpleLine size={22} weight="bold" />
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] font-bold text-[#191F28]">{t("새로 만들기", "Start from scratch", "从头开始", "Tạo mới", "新しく作る", "Buat baru")}</span>
              <span className="mt-0.5 block break-keep text-[13px] leading-relaxed text-[#8B95A1]">
                {resume
                  ? t("빈 이력서에서 경력·학력·자격을 하나씩 채워요.", "Fill in your experience, education, and skills one by one.", "在空白简历上逐项填写经历、学历和资格。", "Điền từng mục kinh nghiệm, học vấn, chứng chỉ.", "白紙の履歴書に職歴・学歴・資格を一つずつ入力します。", "Isi pengalaman, pendidikan, dan keahlian satu per satu.")
                  : t("문항을 고르고 답변을 처음부터 써요.", "Pick the questions and write your answers from the start.", "选择题目，从头开始写答案。", "Chọn câu hỏi và viết câu trả lời từ đầu.", "設問を選び、回答を最初から書きます。", "Pilih pertanyaan dan tulis jawaban dari awal.")}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!importing) trackEditor("editor_start_selected", { doc: kind, method: "import" });
              setImporting(true);
            }}
            aria-expanded={importing}
            className={option(importing)}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[#0B46E8]">
              <FileArrowUp size={22} weight="bold" />
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] font-bold text-[#191F28]">
                {resume
                  ? t("써 둔 이력서로 만들기", "Use a resume I already have", "用已有的简历制作", "Dùng CV có sẵn", "手持ちの履歴書から作る", "Pakai CV yang sudah ada")
                  : t("써 둔 자기소개서로 만들기", "Use a cover letter I already have", "用已有的自我介绍制作", "Dùng thư giới thiệu có sẵn", "手持ちの自己紹介書から作る", "Pakai surat lamaran yang sudah ada")}
              </span>
              <span className="mt-0.5 block break-keep text-[13px] leading-relaxed text-[#8B95A1]">
                {resume
                  ? t("PDF를 올리거나 내용을 붙여넣으면 항목별로 정리해서 채워 드려요.", "Upload a PDF or paste the text and we'll sort it into sections for you.", "上传 PDF 或粘贴内容，我们会按条目整理填好。", "Tải PDF hoặc dán nội dung, chúng tôi sẽ sắp xếp theo từng mục.", "PDFを上げるか本文を貼り付けると、項目ごとに整理して入れます。", "Unggah PDF atau tempel teks, akan dirapikan per bagian.")
                  : t("PDF를 올리거나 내용을 붙여넣으면 답변을 에피소드로 나눠 채워 드려요.", "Upload a PDF or paste the text and we'll split your answers into episodes.", "上传 PDF 或粘贴内容，我们会把答案拆分成经历填好。", "Tải PDF hoặc dán nội dung, câu trả lời sẽ được chia thành các đoạn kể.", "PDFを上げるか本文を貼り付けると、回答をエピソードに分けて入れます。", "Unggah PDF atau tempel teks, jawaban dibagi jadi episode.")}
              </span>
            </span>
          </button>

          {importing ? <div className="rounded-2xl border border-[#E5E8EB] bg-white p-5">{importPanel}</div> : null}
        </div>
      </main>
    </div>
  );
}
