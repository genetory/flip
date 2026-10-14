"use client";

// v2 자기소개서 편집기 조각 — 기존 CoverEditorScreen 의 패널(최종 점검·지원 공고·문장 다듬기·저장)을
// 같은 데이터·같은 계산으로, v2 모양(흰 바탕·연회색 채움·큰 글자)으로 다시 그린다.
// 규칙 점검(cover-scan)·AI 점검(useAiReview)·치워 둔 지적(useHiddenIssues)은 기존 것을 그대로 쓴다.
import { useEffect, useRef, useState } from "react";
import { useToast } from "../../toast/ToastProvider";
import { Button, Spinner, TextLink } from "../ui";
import { Sheet } from "../sheets";
import type { PlatformT } from "../../../lib/i18n";
import type { CoverDoc } from "../../../lib/talent/cover-doc";
import { answerText, charCount, type ResolvedCover } from "../../../lib/talent/cover-layout";
import { scanCover, type CoverScan, type CoverScanIssue } from "../../../lib/talent/cover-scan";
import { polishSelfIntro } from "../../../lib/resume-maker-client";
import type { useAiReview, useHiddenIssues } from "../../talent/editor/editor-shared";

// ── 입력칸 ─────────────────────────────────────────

/** 입력칸 — 칠 때마다 onChange(내용 저장은 talent 저장소가 debounce), 포커스를 벗어날 때 onBlurValue.
 *  모바일 확대를 막으려 글자 16px. */
export function V2CoverField({
  label,
  value,
  onChange,
  onBlurValue,
  multiline,
  rows = 6,
  placeholder,
  type,
  autoFocus,
  maxLength
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onBlurValue?: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  type?: "text" | "number";
  /** 방금 '새로 쓰기'로 만든 빈 칸처럼, 바로 타이핑할 곳에만 켠다. */
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 바깥(저장소·AI 다듬기)에서 값이 바뀌면 입력칸도 따라간다(기존 Field 와 같은 규칙).
  useEffect(() => setDraft(value), [value]);
  const cls =
    "w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2";
  const common = {
    value: draft,
    placeholder,
    autoFocus,
    maxLength,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(e.target.value);
      onChange?.(e.target.value);
    },
    onBlur: () => onBlurValue?.(draft)
  };
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{label}</span>
      {multiline ? (
        <textarea {...common} rows={rows} className={`${cls} resize-y py-3 leading-[1.65]`} />
      ) : (
        <input {...common} type={type ?? "text"} inputMode={type === "number" ? "numeric" : undefined} className={`${cls} h-12`} />
      )}
    </label>
  );
}

// ── 글자 수 ────────────────────────────────────────

/** 글자 수 막대 — 제한이 없으면 숫자만. 넘으면 빨강, 90% 넘으면 주황. */
export function V2CoverCharGauge({ t, count, limit, onWhite = false }: { t: PlatformT; count: number; limit: number | null; onWhite?: boolean }) {
  if (!limit) {
    return <p className="text-[13px] text-[color:var(--v2-faint)]">{t(`${count.toLocaleString()}자`, `${count.toLocaleString()} chars`, `${count.toLocaleString()} 字`, `${count.toLocaleString()} ký tự`, `${count.toLocaleString()} 字`, `${count.toLocaleString()} karakter`)}</p>;
  }
  const ratio = count / limit;
  const color = ratio > 1 ? "var(--v2-attention)" : ratio >= 0.9 ? "#f59f00" : "var(--v2-accent)";
  return (
    <div className="flex items-center gap-3">
      <div className={`h-1.5 min-w-0 flex-1 overflow-hidden rounded-full ${onWhite ? "bg-[color:var(--v2-band)]" : "bg-white"}`} role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={count}>
        <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(ratio, 1) * 100}%`, background: color }} />
      </div>
      <span className="shrink-0 text-[13px] font-semibold tabular-nums" style={{ color: ratio > 1 ? color : "var(--v2-muted)" }}>
        {count.toLocaleString()} / {limit.toLocaleString()}
        {ratio > 1 ? ` · ${t(`${(count - limit).toLocaleString()}자 초과`, `${(count - limit).toLocaleString()} over`, `超出 ${(count - limit).toLocaleString()}`, `vượt ${(count - limit).toLocaleString()}`, `${(count - limit).toLocaleString()} 字超過`, `lebih ${(count - limit).toLocaleString()}`)}` : ""}
      </span>
    </div>
  );
}

// ── 점검(규칙) ─────────────────────────────────────

/** 문항별 본문을 스캔 입력 형태로 — 문항 카드 배지·A4 형광펜·최종 점검이 같은 계산을 쓴다. */
export function buildCoverScan(doc: CoverDoc, layout: ResolvedCover, textOf: (id: string) => string): CoverScan {
  return scanCover(
    layout.questions.map((q) => ({ id: q.id, prompt: q.prompt, limit: q.limit, text: answerText(q.blocks.map(textOf)), blocks: q.blocks })),
    doc.keywords ?? [],
    charCount
  );
}

/** 지적 1건의 키 — 치워 둔 것을 알아보는 데 쓴다(기존 편집기와 같은 키라 치워 둔 목록을 함께 쓴다). */
export function coverIssueKey(id: string, issue: CoverScanIssue): string {
  const detail = issue.kind === "cliche" ? issue.phrases.join(",") : issue.kind === "overlap" ? issue.shared.join(",") : issue.kind === "over" ? String(issue.length) : "";
  return `rule:${id}:${issue.kind}:${detail}`;
}

/** 문제 1건을 두 줄로 — 무엇이 걸렸는지(what)와 왜·어떻게(why). */
export function coverIssueText(issue: CoverScanIssue, t: PlatformT): { what: string; why: string } {
  switch (issue.kind) {
    case "empty":
      return {
        what: t("아직 작성 안 됨", "Not written yet", "尚未填写", "Chưa viết", "未記入", "Belum ditulis"),
        why: t(
          "빈 문항이 있으면 제출할 수 없어요. 완성하려 하지 말고 떠오르는 대로 몇 줄만 먼저 채워 두면 다듬기 쉬워요.",
          "An unanswered question blocks submission. Jot a few rough lines first — polishing is the easy part.",
          "有空题目就无法提交。先随意写几行，之后再润色会容易得多。",
          "Câu hỏi để trống thì không nộp được. Cứ viết vài dòng thô trước, chỉnh sửa sau sẽ dễ hơn.",
          "未記入の設問があると提出できません。完成させようとせず、まず数行だけ書いておくと直しやすいです。",
          "Pertanyaan kosong membuat tidak bisa dikirim. Tulis beberapa baris kasar dulu, memolesnya lebih mudah."
        )
      };
    case "over":
      return {
        what: `${issue.length}/${issue.limit} ${t("자 초과", "over limit", "超出", "vượt", "字超過", "lewat")}`,
        why: t(
          "글자 수를 넘으면 제출 자체가 막혀요. 설명하는 문장부터 덜어 내면 사례는 그대로 남아요.",
          "Going over the limit blocks submission. Cut explanatory sentences first — the examples survive.",
          "超出字数将无法提交。先删减说明性句子，事例可以保留。",
          "Vượt giới hạn sẽ không nộp được. Cắt câu giải thích trước, phần ví dụ vẫn giữ nguyên.",
          "文字数を超えると提出できません。説明の文から削ると、事例はそのまま残ります。",
          "Melebihi batas membuat tidak bisa dikirim. Pangkas kalimat penjelasan dulu, contohnya tetap."
        )
      };
    case "cliche":
      return {
        what: `${t("다시 볼 표현", "Phrases to revisit", "可再斟酌", "Cụm nên xem lại", "見直したい表現", "Frasa ditinjau")} ${issue.phrases
          .slice(0, 2)
          .map((x) => `「${x}」`)
          .join(" ")}`,
        why: t(
          "누구나 쓰는 표현이라 읽는 사람 기억에 남지 않아요. 그 말을 뒷받침하는 사례 한 줄로 바꾸면 훨씬 세게 읽혀요.",
          "Everyone writes these, so they don't stick. Swap in one concrete example that backs the claim.",
          "人人都这么写，留不下印象。换成一句能佐证的具体事例会有力得多。",
          "Ai cũng viết vậy nên không đọng lại. Thay bằng một ví dụ cụ thể chứng minh điều đó.",
          "誰もが書く表現なので印象に残りません。その主張を裏づける事例一行に替えると強く読まれます。",
          "Semua menulis begitu, jadi tak berkesan. Ganti dengan satu contoh konkret yang mendukungnya."
        )
      };
    case "overlap":
      return {
        what: `${t("내용 중복", "Overlaps with", "内容重复", "Trùng nội dung", "内容が重複", "Tumpang tindih")} 「${issue.withQuestion.slice(0, 14)}」${issue.shared.length ? ` (${issue.shared.slice(0, 2).join(", ")})` : ""}`,
        why: t(
          "같은 경험을 두 문항에 쓰면 쓸 이야기가 없어 보여요. 한쪽은 다른 경험으로 바꾸거나 같은 경험이라도 다른 면을 써 주세요.",
          "The same story in two answers reads as if you have little to show. Swap one, or show a different side of it.",
          "同一经历写在两题会显得素材不足。换成其他经历，或写出同一经历的不同侧面。",
          "Cùng trải nghiệm ở hai câu trông như thiếu nội dung. Đổi một câu, hoặc nói về khía cạnh khác.",
          "同じ経験を二つの設問に書くと書くことがないように見えます。片方を別の経験にするか、別の側面を書いてください。",
          "Pengalaman sama di dua jawaban terlihat minim materi. Ganti salah satu, atau tunjukkan sisi lain."
        )
      };
  }
}

// ── 제출 전 최종 점검 ───────────────────────────────

/** 미작성·글자 수 초과·상투어·내용 중복·필수 소재 누락(규칙) + AI 지적을 한 목록으로.
 *  줄을 누르면 그 문항(아는 경우 그 에피소드)으로 바로 간다. 안 고칠 지적은 × 로 치운다. */
export function V2CoverFinalCheck({
  t,
  layout,
  scan,
  review,
  onRunReview,
  hiddenIssues,
  reviewableCount,
  textOf,
  onGo
}: {
  t: PlatformT;
  layout: ResolvedCover;
  scan: CoverScan;
  review: ReturnType<typeof useAiReview>;
  onRunReview: () => void;
  hiddenIssues: ReturnType<typeof useHiddenIssues>;
  reviewableCount: number;
  textOf: (id: string) => string;
  onGo: (q: number, episodeId?: string | null) => void;
}) {
  const lines: { what: string; why: string; go: (() => void) | null; key: string }[] = [];
  for (const [i, question] of layout.questions.entries()) {
    const issues = scan.byQuestion.get(question.id);
    if (!issues?.length) continue;
    const label = `${i + 1}. ${question.prompt.slice(0, 18)}`;
    for (const issue of issues) {
      const key = coverIssueKey(question.id, issue);
      if (hiddenIssues.hidden.has(key)) continue;
      const { what, why } = coverIssueText(issue, t);
      lines.push({ what: `${label} — ${what}`, why, go: () => onGo(i), key });
    }
  }
  for (const k of scan.missingKeywords) {
    if (hiddenIssues.hidden.has(`kw:${k}`)) continue;
    lines.push({
      key: `kw:${k}`,
      what: `${t("소재", "Point", "素材", "Nội dung", "要素", "Poin")} 「${k}」 — ${t("본문에 없어요", "missing from the text", "正文中未出现", "chưa có trong bài", "本文にありません", "belum ada di teks")}`,
      why: t(
        "직접 '반드시 넣을 소재'로 적어 둔 거예요. 가장 어울리는 문항에 한 문장으로 녹여 주세요.",
        "You marked this as a must-include point. Work it into the answer where it fits best.",
        "这是你标记的必写素材。请融入最合适的题目中。",
        "Bạn đã đánh dấu đây là nội dung bắt buộc. Hãy lồng vào câu phù hợp nhất.",
        "自分で「必ず入れる要素」に入れたものです。いちばん合う設問に一文で織り込んでください。",
        "Anda menandainya sebagai poin wajib. Masukkan ke pertanyaan yang paling cocok."
      ),
      go: null
    });
  }
  // AI 지적은 아래에 — 인용 구절이 든 에피소드를 찾아 그 에피소드까지 열어 준다(못 찾으면 문항까지).
  const qIndexOf = new Map(layout.questions.map((q, i) => [q.id, i]));
  for (const f of review.findings) {
    const key = `ai:${f.id}:${f.issue}`;
    if (!qIndexOf.has(f.id) || hiddenIssues.hidden.has(key)) continue;
    const qi = qIndexOf.get(f.id) as number;
    const blocks = layout.questions[qi]?.blocks ?? [];
    const episodeId = f.quote ? (blocks.find((bid) => textOf(bid).includes(f.quote)) ?? null) : null;
    lines.push({ key, what: `AI · ${qi + 1}. ${layout.questions[qi]?.prompt.slice(0, 14)} — ${f.issue}`, why: f.fix, go: () => onGo(qi, episodeId) });
  }

  return (
    <div>
      {lines.length === 0 ? (
        <p className="rounded-2xl bg-[color:var(--v2-fill)] px-4 py-4 text-[15px] leading-[1.6] text-[color:var(--v2-good)]">
          {review.ran
            ? t("확인할 항목이 없어요.", "Nothing to fix.", "没有待修项。", "Không có gì cần sửa.", "修正点はありません。", "Tidak ada perbaikan.")
            : t("규칙으로 걸리는 건 없어요. AI 점검도 해 보세요.", "Nothing caught by the rules. Try the AI check.", "规则未发现问题。可试试 AI 检查。", "Quy tắc không phát hiện gì. Thử kiểm tra AI.", "ルールでの指摘はありません。AIチェックもどうぞ。", "Aturan tidak menemukan apa pun. Coba cek AI.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lines.map((line) => (
            <li key={line.key} className="flex items-start gap-1 rounded-2xl bg-[color:var(--v2-fill)] py-3 pl-4 pr-1.5">
              {line.go ? (
                <button type="button" onClick={line.go} className="min-w-0 flex-1 text-left">
                  <span className="block text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink-2)]">{line.what}</span>
                  {line.why ? <span className="mt-1 block text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{line.why}</span> : null}
                </button>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink-2)]">{line.what}</p>
                  {line.why ? <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{line.why}</p> : null}
                </div>
              )}
              <button
                type="button"
                onClick={() => hiddenIssues.hide(line.key)}
                aria-label={t("이 지적 치우기", "Dismiss", "收起该提示", "Bỏ qua", "この指摘を片づける", "Sembunyikan")}
                title={t("안 고치기로 했다면 치워 두세요. 내용을 고치면 다시 보여요.", "Dismiss if you won't act on it. It returns if you edit the text.", "若不打算修改可收起。修改内容后会再次出现。", "Bỏ qua nếu không sửa. Sẽ hiện lại khi bạn sửa nội dung.", "直さないなら片づけてください。内容を直すと再び表示されます。", "Sembunyikan jika tidak akan diubah. Muncul lagi bila teks diubah.")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[18px] leading-none text-[color:var(--v2-faint)] transition hover:bg-[color:var(--v2-band)] hover:text-[color:var(--v2-ink-3)]"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        {/* 보낼 답변이 하나도 없으면 누르지 못하게 — 결과가 0건일 수밖에 없는 호출이 된다. */}
        <Button full variant="secondary" onClick={onRunReview} disabled={review.running || reviewableCount === 0}>
          {review.running ? (
            <>
              <Spinner /> {t("점검 중…", "Checking…", "检查中…", "Đang kiểm tra…", "チェック中…", "Memeriksa…")}
            </>
          ) : review.ran ? (
            t("AI로 다시 점검", "Check with AI again", "再用 AI 检查", "Kiểm tra lại bằng AI", "AIで再チェック", "Cek ulang dengan AI")
          ) : (
            t("AI로 더 점검하기", "Check with AI", "用 AI 检查", "Kiểm tra bằng AI", "AIでチェック", "Cek dengan AI")
          )}
        </Button>
      </div>
      {review.error ? <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--v2-attention)]">{review.error}</p> : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
          {t("AI 점검은 눌렀을 때만 돌아요. 답변을 고치면 그 문항의 지적은 사라져요.", "The AI check runs only when you press it. Edit an answer and its note clears.", "AI 检查仅在点击时运行。修改答案后该条提示会消失。", "Kiểm tra AI chỉ chạy khi bạn bấm. Sửa câu trả lời thì ghi chú sẽ mất.", "AIチェックは押したときだけ動きます。回答を直すとその指摘は消えます。", "Cek AI hanya jalan saat ditekan. Ubah jawabannya, catatannya hilang.")}
        </p>
        {hiddenIssues.hiddenCount > 0 ? (
          <TextLink onClick={hiddenIssues.showAll}>
            {t(`치워 둔 ${hiddenIssues.hiddenCount}개 보기`, `Show ${hiddenIssues.hiddenCount} dismissed`, `显示已收起的 ${hiddenIssues.hiddenCount} 条`, `Xem ${hiddenIssues.hiddenCount} mục đã bỏ`, `片づけた ${hiddenIssues.hiddenCount} 件を表示`, `Lihat ${hiddenIssues.hiddenCount} tersembunyi`)}
          </TextLink>
        ) : null}
      </div>
    </div>
  );
}

// ── 지원 공고 · 필수 소재 ────────────────────────────

const JOB_TEXT_MAX = 4000;
const KEYWORDS_MAX = 10;

/** 자소서 전체에 걸리는 AI 재료 — 공고를 넣으면 '공고 1:1 연결'이 켜지고, 소재는 빠짐없이 녹여 쓴다. */
export function V2CoverDocContext({ t, doc, onDocMeta }: { t: PlatformT; doc: CoverDoc; onDocMeta: (patch: Partial<CoverDoc>) => void }) {
  const [draft, setDraft] = useState("");
  const list = doc.keywords ?? [];
  const jd = doc.jobText ?? "";
  const addKeyword = () => {
    const v = draft.trim().slice(0, 40);
    setDraft("");
    if (!v || list.length >= KEYWORDS_MAX || list.includes(v)) return;
    onDocMeta({ keywords: [...list, v] });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="-mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
        {t(
          "자소서 전체에 적용돼요. 공고를 넣으면 AI가 그 회사 요구에 내 경험을 연결하고, 소재는 빠짐없이 녹여 씁니다.",
          "Applies to the whole document. With a posting, the AI ties your experience to it; every point gets woven in.",
          "适用于整篇。填入招聘后，AI 会对应要求；素材会全部融入。",
          "Áp dụng toàn bài. Có tin tuyển, AI sẽ nối kinh nghiệm; mọi nội dung đều được đưa vào.",
          "全体に適用。求人を入れると要件に経験を結び付け、要素は必ず織り込みます。",
          "Berlaku untuk seluruh dokumen. Dengan lowongan, AI menautkan pengalaman; semua poin dimasukkan."
        )}
      </p>
      <V2CoverField label={t("회사명", "Company", "公司名", "Tên công ty", "会社名", "Perusahaan")} value={doc.companyName ?? ""} maxLength={120} onChange={(v) => onDocMeta({ companyName: v.slice(0, 120) })} />
      <V2CoverField
        label={`${t("공고 내용", "Job posting", "招聘内容", "Nội dung tin", "求人内容", "Isi lowongan")} (${jd.length}/${JOB_TEXT_MAX})`}
        value={jd}
        multiline
        rows={4}
        maxLength={JOB_TEXT_MAX}
        onChange={(v) => onDocMeta({ jobText: v.slice(0, JOB_TEXT_MAX) })}
      />
      <div>
        <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">
          {t("반드시 넣을 소재", "Must-include points", "必写素材", "Nội dung bắt buộc", "必ず入れる要素", "Poin wajib")} {list.length}/{KEYWORDS_MAX}
        </span>
        {list.length ? (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {list.map((k) => (
              <span key={k} className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-full bg-[color:var(--v2-accent-weak)] py-1 pl-3.5 pr-1.5 text-[14px] font-semibold text-[color:var(--v2-accent)]">
                <span className="min-w-0 break-all">{k}</span>
                <button
                  type="button"
                  onClick={() => onDocMeta({ keywords: list.filter((x) => x !== k) })}
                  aria-label={`${k} ${t("삭제", "Remove", "删除", "Xóa", "削除", "Hapus")}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[16px] leading-none text-[#8aa6ef] transition hover:bg-white/70 hover:text-[color:var(--v2-accent)]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {list.length < KEYWORDS_MAX ? (
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder={t("예: 교환학생 경험", "e.g. exchange program", "例：交换生经历", "VD: du học trao đổi", "例：交換留学", "mis. pertukaran")}
              aria-label={t("소재 추가", "Add a point", "添加素材", "Thêm nội dung", "要素を追加", "Tambah poin")}
              className="h-12 min-w-0 flex-1 rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2"
            />
            <Button variant="secondary" onClick={addKeyword} disabled={!draft.trim()}>
              {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── 문장 다듬기(일괄) ───────────────────────────────

/** 에피소드 일괄 다듬기 — 자소서는 존댓말 산문이 정답이라 문체는 그대로(style="natural"),
 *  어색한 표현과 맞춤법만 고친다. 글을 한꺼번에 건드리므로 되돌리기를 같이 둔다. */
export function V2CoverBulkTidy({ t, doc, onDoc }: { t: PlatformT; doc: CoverDoc; onDoc: (next: CoverDoc, opts?: { label?: string; force?: boolean }) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState<CoverDoc["items"] | null>(null);
  const targets = doc.items.filter((it) => (it.text ?? "").trim().length > 0).slice(0, 20);
  if (targets.length === 0 && !prev) return null;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // 에피소드마다 한 번씩 부른다(문단 배치 엔드포인트가 없다). 20개로 자른 건 분당 호출 상한 때문.
      const results = await Promise.all(
        targets.map(async (it) => {
          try {
            return [it.id, await polishSelfIntro({ text: it.text.trim(), style: "natural" })] as const;
          } catch {
            return [it.id, null] as const; // 한 개가 실패해도 나머지는 살린다
          }
        })
      );
      const byId = new Map(results);
      let changed = 0;
      const items = doc.items.map((it) => {
        const next = byId.get(it.id);
        if (typeof next !== "string" || !next.trim() || next === it.text) return it;
        changed += 1;
        return { ...it, text: next };
      });
      if (changed > 0) {
        setPrev(doc.items);
        onDoc({ ...doc, items }, { label: "문장 다듬기", force: true });
      }
      toast.success(
        changed > 0
          ? `${changed}${t("개 에피소드를 다듬었어요", " episodes polished", " 段已润色", " đoạn đã chỉnh", "件を整えました", " episode dirapikan")}`
          : t("바꿀 내용이 없었어요", "Nothing to change", "没有需要修改的", "Không có gì để đổi", "変更点はありません", "Tidak ada perubahan")
      );
    } catch (err) {
      // 429·5xx 는 aiPost 가 전역 토스트로 안내한다.
      console.error("[v2-cover/bulk-tidy] failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
      <p className="text-[16px] font-semibold text-[color:var(--v2-ink)]">{t("문장 다듬기", "Tidy up sentences", "润色句子", "Chỉnh câu văn", "文章を整える", "Rapikan kalimat")}</p>
      <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
        {t(
          "어색한 표현과 맞춤법만 한 번에 고쳐요. 길이·내용·문체는 그대로 두고, 없는 사실은 추가하지 않아요.",
          "Fixes awkward wording and typos at once. Length, content and tone stay as they are; no facts are invented.",
          "一次性修正生硬表达和错别字。长度、内容、语气保持不变，不添加不存在的事实。",
          "Sửa cách diễn đạt gượng và lỗi chính tả cùng lúc. Độ dài, nội dung, giọng văn giữ nguyên; không thêm điều không có.",
          "不自然な表現と誤字だけを一括で直します。長さ・内容・文体はそのまま、事実は追加しません。",
          "Memperbaiki ungkapan janggal dan salah ketik sekaligus. Panjang, isi, dan nada tetap; tanpa menambah fakta."
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets.length ? (
          <Button size="sm" variant="white" onClick={() => void run()} disabled={busy}>
            {busy ? (
              <>
                <Spinner /> {t("다듬는 중…", "Polishing…", "润色中…", "Đang chỉnh…", "整えています…", "Merapikan…")}
              </>
            ) : (
              `${t("다듬기", "Tidy up", "润色", "Chỉnh", "整える", "Rapikan")} ${targets.length}`
            )}
          </Button>
        ) : null}
        {prev ? (
          <Button
            size="sm"
            variant="white"
            onClick={() => {
              onDoc({ ...doc, items: prev });
              setPrev(null);
            }}
          >
            {t("되돌리기", "Undo", "撤销", "Hoàn tác", "元に戻す", "Batalkan")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ── 새 버전으로 저장 ────────────────────────────────

/** 이름을 받아 지금 모습 그대로 읽기 전용 저장본으로 남긴다(회사별 제출본). */
export function V2CoverSaveSheet({ t, onSave, onClose }: { t: PlatformT; onSave: (name: string) => Promise<boolean>; onClose: () => void }) {
  const [name, setName] = useState(() => {
    const d = new Date();
    return t(`${d.getMonth() + 1}월 ${d.getDate()}일 저장본`, `Saved ${d.getMonth() + 1}/${d.getDate()}`, `${d.getMonth() + 1}月${d.getDate()}日保存`, `Bản lưu ${d.getDate()}/${d.getMonth() + 1}`, `${d.getMonth() + 1}月${d.getDate()}日の保存版`, `Simpanan ${d.getDate()}/${d.getMonth() + 1}`);
  });
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => inputRef.current?.select(), []);
  const submit = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    const ok = await onSave(n);
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Sheet
      title={t("새 버전으로 저장", "Save as new version", "另存为新版本", "Lưu phiên bản mới", "新バージョンで保存", "Simpan versi baru")}
      onClose={onClose}
      footer={
        <Button full onClick={() => void submit()} disabled={!name.trim() || busy}>
          {busy ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장하기", "Save", "保存", "Lưu", "保存する", "Simpan")}
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{t("저장본 이름", "Name", "名称", "Tên", "名前", "Nama")}</span>
          <input
            ref={inputRef}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("예: OO전자 지원용", "e.g. For Company A", "例：投递 A 公司", "VD: Nộp công ty A", "例：A社応募用", "mis. Untuk Perusahaan A")}
            className="h-12 w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2"
          />
        </label>
        <p className="mt-3 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
          {t("지금 모습 그대로 저장돼요. 저장본은 고칠 수 없고, 지원할 때 골라 쓸 수 있어요.", "Saved exactly as it looks now. Saved versions can't be edited and can be picked when applying.", "按当前样子保存。保存版本不可修改，投递时可选用。", "Lưu đúng như hiện tại. Bản đã lưu không sửa được và có thể chọn khi ứng tuyển.", "今の状態のまま保存されます。保存版は編集できず、応募時に選べます。", "Disimpan persis seperti sekarang. Tidak bisa diubah dan bisa dipilih saat melamar.")}
        </p>
      </form>
    </Sheet>
  );
}

/** 작은 표시 — 자물쇠(저장본). */
export function V2CoverLock({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
