"use client";

// v2 자기소개서 편집기 시트 — 기존 편집기의 오른쪽 패널(Inspector)을 둘로 나눠 아래에서 올라오는 시트로.
//  - 문항 시트: 답변(글자 수·복사·상투어·AI 다듬기) → 이 문항의 에피소드 → 모음에서 넣기 → 문항 설정
//  - 에피소드 시트: 본문·AI 다듬기 → 배치(위/아래·앞뒤 문항·빼기 또는 문항에 넣기) → 삭제
// 문항·배치 계산은 lib/talent/cover-layout 을 그대로 쓴다.
import { Button, TextLink } from "../ui";
import { Sheet } from "../sheets";
import { AiPolish } from "../../talent/editor/AiPolish";
import { ClicheHints } from "../../talent/career/ClicheHints";
import type { PlatformT } from "../../../lib/i18n";
import type { CoverDoc } from "../../../lib/talent/cover-doc";
import type { CoverScan } from "../../../lib/talent/cover-scan";
import { generateCoverLetter, polishSelfIntro } from "../../../lib/resume-maker-client";
import { addBlock, answerText, charCount, moveBlockToQuestion, moveQuestion, nudgeBlock, removeBlock, removeQuestion, updateQuestion, type ResolvedCover } from "../../../lib/talent/cover-layout";
import { V2CoverCharGauge, V2CoverField, coverIssueText } from "./V2CoverEditorParts";

const qLabelOf = (t: PlatformT, q: number) => t(`문항 ${q + 1}`, `Question ${q + 1}`, `题目 ${q + 1}`, `Câu ${q + 1}`, `設問 ${q + 1}`, `Pertanyaan ${q + 1}`);
const addToQ = (t: PlatformT, q: number) => t(`문항 ${q + 1}에 넣기`, `Add to Q${q + 1}`, `放入题目 ${q + 1}`, `Thêm vào câu ${q + 1}`, `設問 ${q + 1} に入れる`, `Masukkan ke P${q + 1}`);
const emptyText = (t: PlatformT) => t("(내용 없음)", "(empty)", "（无内容）", "(trống)", "（内容なし）", "(kosong)");

function SubTitle({ children }: { children: string }) {
  return <h3 className="mb-3 text-[17px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">{children}</h3>;
}

// ── 문항 시트 ──────────────────────────────────────

export function V2CoverQuestionSheet({
  t,
  doc,
  layout,
  q,
  scan,
  textOf,
  onLayout,
  onQ,
  onOpenEpisode,
  onNewEpisode,
  onCopy,
  onPolishedAnswer,
  onClose
}: {
  t: PlatformT;
  doc: CoverDoc;
  layout: ResolvedCover;
  q: number;
  scan: CoverScan;
  textOf: (id: string) => string;
  onLayout: (next: ResolvedCover) => void;
  /** 문항 순서를 바꾸거나 지웠을 때 지금 보는 문항 번호를 맞춘다(null = 시트 닫기). */
  onQ: (q: number | null) => void;
  onOpenEpisode: (id: string) => void;
  onNewEpisode: () => void;
  onCopy: (text: string) => void;
  onPolishedAnswer: (text: string) => void;
  onClose: () => void;
}) {
  const question = layout.questions[q];
  if (!question) return null;
  const n = layout.questions.length;
  const answer = answerText(question.blocks.map(textOf));
  const issues = scan.byQuestion.get(question.id) ?? [];
  const others = doc.items.filter((it) => !question.blocks.includes(it.id));

  return (
    <Sheet tall title={qLabelOf(t, q)} subtitle={question.prompt || t("(문항 없음)", "(no prompt)", "（无题目）", "(chưa có câu hỏi)", "（設問なし）", "(tanpa pertanyaan)")} onClose={onClose}>
      {/* 답변 — 이 문항에 넣은 에피소드를 빈 줄로 이어 붙인 글(회사 지원서에 붙여 넣는 모양). */}
      <section>
        <SubTitle>{t("답변", "Answer", "答案", "Câu trả lời", "回答", "Jawaban")}</SubTitle>
        <div className="rounded-2xl bg-[color:var(--v2-band)] p-4">
          <p className={`whitespace-pre-line text-[15px] leading-[1.7] ${answer ? "text-[color:var(--v2-ink-2)]" : "text-[color:var(--v2-faint)]"}`}>
            {answer || t("아래에서 에피소드를 넣으면 답변이 돼요.", "Add episodes below to build the answer.", "在下方放入经历即可组成答案。", "Thêm đoạn kể bên dưới để tạo câu trả lời.", "下でエピソードを入れると回答になります。", "Tambahkan episode di bawah untuk menyusun jawaban.")}
          </p>
          <div className="mt-3">
            <V2CoverCharGauge t={t} count={charCount(answer)} limit={question.limit} />
          </div>
          {/* 사용자가 직접 쓴 문장에도 AI와 같은 기준(프롬프트 금지 표현)을 보여 준다. */}
          <ClicheHints text={answer} />
          <div className="mt-3">
            <Button size="sm" variant="white" full onClick={() => onCopy(answer)} disabled={!answer}>
              {t("답변 복사", "Copy answer", "复制答案", "Sao chép", "回答をコピー", "Salin jawaban")}
            </Button>
          </div>
        </div>
        {issues.length ? (
          <ul className="mt-3 flex flex-col gap-1.5">
            {issues.map((x, i) => {
              const { what, why } = coverIssueText(x, t);
              return (
                <li key={i} className="rounded-2xl bg-[#fff4f4] px-4 py-3">
                  <p className="text-[14px] font-semibold text-[color:var(--v2-attention)]">{what}</p>
                  <p className="mt-0.5 text-[13px] leading-[1.6] text-[color:var(--v2-muted)]">{why}</p>
                </li>
              );
            })}
          </ul>
        ) : null}
        {/* 문항 단위 다듬기 — 문항·글자 수 제한·지원 공고·필수 소재에 맞춰 답변 전체를 다듬는다.
            고르면 다듬은 글이 새 에피소드가 되어 이 문항의 답이 된다(원래 에피소드는 모음에 남는다). */}
        <div className="mt-3">
          <AiPolish
            key={`qa-${question.id}`}
            t={t}
            title={t("문항 답변 AI로 다듬기", "Polish this answer with AI", "用 AI 润色此题答案", "Chỉnh câu trả lời bằng AI", "この回答をAIで整える", "Poles jawaban dengan AI")}
            text={answer}
            polish={(src, style) =>
              generateCoverLetter({
                mode: "polish",
                style,
                prompt: question.prompt,
                current: src,
                targetChars: question.limit ?? undefined,
                companyName: doc.companyName?.trim() || undefined,
                jobText: doc.jobText?.trim() || undefined,
                keywords: (doc.keywords ?? []).map((k) => k.trim()).filter(Boolean).slice(0, 10)
              })
            }
            onApply={onPolishedAnswer}
          />
        </div>
      </section>

      {/* 이 문항의 에피소드 — 누르면 그 에피소드를 고친다(배치도 거기서). */}
      <section className="mt-8">
        <SubTitle>{t("이 문항의 에피소드", "Episodes in this question", "此题目的经历", "Đoạn kể của câu này", "この設問のエピソード", "Episode di pertanyaan ini")}</SubTitle>
        {question.blocks.length ? (
          <ul className="flex flex-col gap-2">
            {question.blocks.map((id, i) => (
              <li key={id}>
                <button type="button" onClick={() => onOpenEpisode(id)} className="flex w-full items-start gap-3 rounded-2xl bg-[color:var(--v2-band)] p-4 text-left transition hover:bg-[color:var(--v2-line)]">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[color:var(--v2-ink-3)]">{i + 1}</span>
                  <span className="line-clamp-3 min-w-0 flex-1 text-[15px] leading-[1.6] text-[color:var(--v2-ink-2)]">{textOf(id).trim() || emptyText(t)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-[color:var(--v2-fill)] px-4 py-4 text-[14px] leading-[1.6] text-[color:var(--v2-faint)]">
            {t("아직 넣은 에피소드가 없어요.", "No episodes here yet.", "还没有放入经历。", "Chưa có đoạn kể nào.", "まだエピソードがありません。", "Belum ada episode.")}
          </p>
        )}
        <div className="mt-3">
          <Button full variant="secondary" onClick={onNewEpisode}>
            + {t("새 에피소드 쓰기", "Write a new episode", "写新经历", "Viết đoạn mới", "新しいエピソードを書く", "Tulis episode baru")}
          </Button>
        </div>
      </section>

      {/* 모음에서 넣기 — 다른 문항에 쓴 에피소드도 이 문항에 함께 쓸 수 있다(의도된 재사용). */}
      {others.length ? (
        <section className="mt-8">
          <SubTitle>{t("모음에서 넣기", "Add from your episodes", "从经历库放入", "Thêm từ kho đoạn kể", "一覧から入れる", "Tambah dari koleksi")}</SubTitle>
          <ul className="flex flex-col gap-2">
            {others.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-2xl bg-[color:var(--v2-fill)] py-3 pl-4 pr-3">
                <span className="line-clamp-2 min-w-0 flex-1 text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{textOf(it.id).trim() || emptyText(t)}</span>
                <Button size="sm" variant="white" onClick={() => onLayout(addBlock(layout, doc, q, it.id))}>
                  {t("넣기", "Add", "放入", "Thêm", "入れる", "Tambah")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 문항 설정 — 회사 문항·글자 수 제한에 맞춘다. */}
      <section className="mt-8">
        <SubTitle>{t("문항 설정", "Question settings", "题目设置", "Cài đặt câu hỏi", "設問の設定", "Pengaturan pertanyaan")}</SubTitle>
        <div className="flex flex-col gap-4">
          <V2CoverField key={`p-${question.id}`} label={t("문항", "Prompt", "题目", "Câu hỏi", "設問", "Pertanyaan")} value={question.prompt} multiline rows={3} onChange={(v) => onLayout(updateQuestion(layout, q, { prompt: v }))} />
          <V2CoverField
            key={`l-${question.id}`}
            label={t("글자 수 제한 (공백 포함)", "Character limit (incl. spaces)", "字数限制（含空格）", "Giới hạn ký tự (gồm khoảng trắng)", "文字数制限（空白含む）", "Batas karakter (termasuk spasi)")}
            type="number"
            value={question.limit == null ? "" : String(question.limit)}
            placeholder={t("제한 없음", "No limit", "无限制", "Không giới hạn", "制限なし", "Tanpa batas")}
            onBlurValue={(v) => {
              const num = Math.floor(Number(v));
              const limit = v.trim() && Number.isFinite(num) && num > 0 ? Math.min(num, 20000) : null;
              if (limit !== question.limit) onLayout(updateQuestion(layout, q, { limit }));
            }}
          />
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="neutral"
              full
              disabled={q === 0}
              onClick={() => {
                onLayout(moveQuestion(layout, q, -1));
                onQ(q - 1);
              }}
            >
              {t("위로", "Up", "上移", "Lên", "上へ", "Naik")}
            </Button>
            <Button
              size="sm"
              variant="neutral"
              full
              disabled={q >= n - 1}
              onClick={() => {
                onLayout(moveQuestion(layout, q, 1));
                onQ(q + 1);
              }}
            >
              {t("아래로", "Down", "下移", "Xuống", "下へ", "Turun")}
            </Button>
            <Button
              size="sm"
              variant="neutral"
              full
              onClick={() => {
                if (!window.confirm(t("이 문항을 삭제할까요? 에피소드는 지워지지 않아요.", "Delete this question? Episodes stay.", "删除此题目？经历不会被删除。", "Xóa câu hỏi này? Đoạn kể vẫn giữ.", "この設問を削除しますか？エピソードは残ります。", "Hapus pertanyaan ini? Episode tetap ada."))) return;
                onLayout(removeQuestion(layout, doc, q));
                onQ(null);
              }}
            >
              <span className="text-[color:var(--v2-attention)]">{t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}</span>
            </Button>
          </div>
          <p className="text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
            {t("회사 문항에 맞춰 고친 뒤 '새 버전으로 저장'하면 그 회사용 저장본이 돼요.", "Match the company's questions, then 'Save as new version' to keep a copy for that company.", "按公司题目修改后“另存为新版本”，即成为该公司专用版本。", "Chỉnh theo câu hỏi của công ty rồi 'Lưu phiên bản mới' để có bản cho công ty đó.", "企業の設問に合わせて直し「新バージョンで保存」すると、その企業用の保存版になります。", "Sesuaikan dengan pertanyaan perusahaan lalu 'Simpan versi baru' untuk salinan perusahaan itu.")}
          </p>
        </div>
      </section>
    </Sheet>
  );
}

// ── 에피소드 시트 ──────────────────────────────────

export function V2CoverEpisodeSheet({
  t,
  doc,
  layout,
  id,
  q,
  textOf,
  onLayout,
  onQ,
  onText,
  onDelete,
  onBack,
  onClose
}: {
  t: PlatformT;
  doc: CoverDoc;
  layout: ResolvedCover;
  id: string;
  /** 문항에서 열었으면 그 문항 번호, 모음에서 열었으면 null(넣을 문항을 고르게 한다). */
  q: number | null;
  textOf: (id: string) => string;
  onLayout: (next: ResolvedCover) => void;
  onQ: (q: number) => void;
  onText: (id: string, v: string) => void;
  onDelete: (id: string) => void;
  /** 문항 시트로 돌아가기(문항에서 연 경우만). */
  onBack: (() => void) | null;
  onClose: () => void;
}) {
  const item = doc.items.find((i) => i.id === id);
  if (!item) return null;
  const para = textOf(id);
  const question = q != null ? layout.questions[q] : undefined;
  const index = question ? question.blocks.indexOf(id) : -1;
  const n = layout.questions.length;

  return (
    <Sheet
      tall
      title={t("에피소드", "Episode", "经历", "Đoạn kể", "エピソード", "Episode")}
      subtitle={question && q != null ? `${qLabelOf(t, q)} · ${question.prompt}` : item.question || undefined}
      onClose={onClose}
    >
      {onBack && q != null ? (
        <div className="-mt-1 mb-4">
          <TextLink onClick={onBack}>‹ {t(`문항 ${q + 1}로 돌아가기`, `Back to Q${q + 1}`, `返回题目 ${q + 1}`, `Về câu ${q + 1}`, `設問 ${q + 1} に戻る`, `Kembali ke P${q + 1}`)}</TextLink>
        </div>
      ) : null}

      <section>
        <V2CoverField
          key={`t-${id}`}
          label={t(`본문 · ${charCount(para.trim()).toLocaleString()}자`, `Text · ${charCount(para.trim()).toLocaleString()} chars`, `正文 · ${charCount(para.trim()).toLocaleString()} 字`, `Nội dung · ${charCount(para.trim()).toLocaleString()} ký tự`, `本文 · ${charCount(para.trim()).toLocaleString()} 字`, `Isi · ${charCount(para.trim()).toLocaleString()} karakter`)}
          value={para}
          multiline
          rows={9}
          // 빈 에피소드 = 방금 '새 에피소드 쓰기'로 만든 것 → 커서를 여기 둔다.
          autoFocus={!para.trim()}
          placeholder={t(
            "언제, 무엇을, 어떻게 했고 무엇이 달라졌는지 순서대로 적어 보세요.",
            "Write what you did, how, and what changed — in that order.",
            "按时间、做了什么、怎么做、带来什么变化的顺序写。",
            "Viết theo thứ tự: khi nào, làm gì, làm thế nào, kết quả ra sao.",
            "いつ・何を・どのように行い、何が変わったかを順に書いてみてください。",
            "Tulis berurutan: kapan, apa, bagaimana, dan apa yang berubah."
          )}
          onChange={(v) => onText(id, v)}
        />
        <div className="mt-3">
          <AiPolish key={`ai-${id}`} t={t} text={para} polish={(src, style) => polishSelfIntro({ text: src, style })} onApply={(v) => onText(id, v)} />
        </div>
      </section>

      <section className="mt-8">
        <SubTitle>{t("배치", "Placement", "位置", "Vị trí", "配置", "Penempatan")}</SubTitle>
        {question && q != null ? (
          index >= 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="neutral" full disabled={index === 0} onClick={() => onLayout(nudgeBlock(layout, q, index, -1).layout)}>
                {t("위로", "Up", "上移", "Lên", "上へ", "Naik")}
              </Button>
              <Button size="sm" variant="neutral" full disabled={index >= question.blocks.length - 1} onClick={() => onLayout(nudgeBlock(layout, q, index, 1).layout)}>
                {t("아래로", "Down", "下移", "Xuống", "下へ", "Turun")}
              </Button>
              <Button
                size="sm"
                variant="neutral"
                full
                disabled={q === 0}
                onClick={() => {
                  const r = moveBlockToQuestion(layout, doc, q, index, q - 1);
                  onLayout(r.layout);
                  onQ(r.q);
                }}
              >
                {t("앞 문항으로", "To previous", "移到上一题", "Câu trước", "前の設問へ", "Ke sebelumnya")}
              </Button>
              <Button
                size="sm"
                variant="neutral"
                full
                disabled={q >= n - 1}
                onClick={() => {
                  const r = moveBlockToQuestion(layout, doc, q, index, q + 1);
                  onLayout(r.layout);
                  onQ(r.q);
                }}
              >
                {t("다음 문항으로", "To next", "移到下一题", "Câu sau", "次の設問へ", "Ke berikutnya")}
              </Button>
              <div className="col-span-2">
                <Button size="sm" variant="neutral" full onClick={() => onLayout(removeBlock(layout, doc, q, index))}>
                  {t("이 문항에서 빼기", "Remove from this question", "从此题目移除", "Bỏ khỏi câu này", "この設問から外す", "Keluarkan dari pertanyaan")}
                </Button>
              </div>
            </div>
          ) : (
            <Button full onClick={() => onLayout(addBlock(layout, doc, q, id))}>
              {addToQ(t, q)}
            </Button>
          )
        ) : layout.questions.length ? (
          // 모음에서 연 경우 — 문항마다 넣기/들어 있음.
          <ul className="flex flex-col gap-2">
            {layout.questions.map((x, i) => {
              const inside = x.blocks.includes(id);
              return (
                <li key={x.id} className="flex items-center gap-3 rounded-2xl bg-[color:var(--v2-fill)] py-3 pl-4 pr-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-[color:var(--v2-muted)]">{qLabelOf(t, i)}</span>
                    <span className="block truncate text-[15px] font-semibold text-[color:var(--v2-ink-2)]">{x.prompt || "—"}</span>
                  </span>
                  {inside ? (
                    <span className="shrink-0 px-2 text-[14px] font-semibold text-[color:var(--v2-faint)]">{t("들어 있음", "Added", "已放入", "Đã thêm", "入っています", "Sudah ada")}</span>
                  ) : (
                    <Button size="sm" variant="white" onClick={() => onLayout(addBlock(layout, doc, i, id))}>
                      {t("넣기", "Add", "放入", "Thêm", "入れる", "Tambah")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[14px] text-[color:var(--v2-faint)]">{t("먼저 문항을 추가해 주세요.", "Add a question first.", "请先添加题目。", "Hãy thêm câu hỏi trước.", "先に設問を追加してください。", "Tambah pertanyaan dulu.")}</p>
        )}
      </section>

      <div className="mt-8">
        <Button full variant="neutral" onClick={() => onDelete(id)}>
          <span className="text-[color:var(--v2-attention)]">{t("에피소드 삭제", "Delete episode", "删除经历", "Xóa đoạn kể", "エピソードを削除", "Hapus episode")}</span>
        </Button>
      </div>
    </Sheet>
  );
}
