"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Export as ShareIcon, Check } from "@phosphor-icons/react";
import { usePlatformT } from "../../lib/i18n";

// ---------------------------------------------------------------------------
// MBTI landing — chat-style flow, quiz-only.
//
// Flow: intro → 20-question quiz → 이름 (옵션) → 국적 (옵션) → 결과 보기
// Quiz answers are all button picks; only 이름/국적 use a chat-input row.
//
// Edit support: every user bubble carries a `stepKey`. Tapping "수정" rewinds
// the thread to that point, clears that step's answer + all later answers,
// and re-renders the choice card for that step.
// ---------------------------------------------------------------------------

type AxisKey = "EI" | "SN" | "TF" | "JP";

type QuizQuestion = {
  id: string;
  axis: AxisKey;
  question: string;
  options: [
    { code: string; label: string },
    { code: string; label: string }
  ];
};

type Message =
  | { id: string; role: "bot"; text: string; stepKey: string | null }
  | { id: string; role: "user"; text: string; stepKey: string | null };

type Step =
  | { kind: "intro" }
  | { kind: "quiz-question"; index: number }
  | { kind: "ask-name" }
  | { kind: "ask-nationality" }
  | { kind: "ready" }
  | { kind: "submitting" };

function stepKeyOf(step: Step): string | null {
  switch (step.kind) {
    case "intro": return null;
    case "quiz-question": return `quiz-${step.index}`;
    case "ask-name": return "ask-name";
    case "ask-nationality": return "ask-nationality";
    case "ready": return "ready";
    case "submitting": return null;
  }
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Bot avatar — Aply logo in a circle.
// ---------------------------------------------------------------------------
function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-white/20 overflow-hidden">
      <Image
        src="/aply_logo.webp"
        alt="Aply"
        width={28}
        height={28}
        className="object-contain"
        priority
      />
    </div>
  );
}

export function MbtiLandingPage() {
  const router = useRouter();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const t = usePlatformT();

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answer state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [pendingText, setPendingText] = useState("");
  const [copied, setCopied] = useState(false);

  const threadRef = useRef<HTMLDivElement | null>(null);

  // 공유 — 사주 페이지와 동일 패턴(모바일: 네이티브 공유 시트, 그 외: 링크 복사).
  async function copyShareLink(url: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 무시 */
    }
  }
  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/mbti`;
    const shareTitle = t("내 MBTI에 잘 맞는 한국 직장은?", "Which Korean company fits your MBTI?", "哪家韩国公司最合你的MBTI？", "Công ty Hàn nào hợp MBTI của bạn?", "あなたのMBTIに合う韓国企業は？", "Perusahaan Korea mana yang cocok dengan MBTI-mu?");
    const shareText = t("Aply의 직무 MBTI로 나에게 맞는 직업을 추천받아보세요.", "Get an Aply job-MBTI career match.", "用 Aply 职务MBTI 匹配适合你的职业。", "Nhận gợi ý nghề nghiệp qua MBTI của Aply.", "Aplyの職務MBTIで自分に合う職業を診断。", "Dapatkan rekomendasi karier lewat MBTI Aply.");
    const isMobile = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
    if (isMobile && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    await copyShareLink(url);
  }

  const pushUser = useCallback((text: string, stepKey: string | null) => {
    setMessages((prev) => [...prev, { id: makeId(), role: "user", text, stepKey }]);
  }, []);

  // Auto-scroll on each new message / step transition.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  // Post the next bot prompt as the step advances. Dedupe by `stepKey`
  // computed from `messages` so re-renders or edit-rewinds don't double-post.
  useEffect(() => {
    if (step.kind === "intro") {
      if (messages.length === 0) {
        setMessages([
          {
            id: makeId(),
            role: "bot",
            stepKey: null,
            text: t(
              "안녕하세요! Aply 매칭 봇이에요 ✨\nMBTI에 잘 맞는 한국 회사·직무와 실제 채용 공고까지 추천해드릴게요.",
              "Hi! I'm the Aply matching bot ✨\nI'll recommend Korean companies, roles, and real job openings that fit your MBTI.",
              "你好！我是 Aply 匹配机器人 ✨\n我会推荐适合你 MBTI 的韩国公司、职务和真实招聘。",
              "Xin chào! Mình là bot ghép nối Aply ✨\nMình sẽ gợi ý công ty, vị trí Hàn Quốc và tin tuyển dụng hợp MBTI của bạn.",
              "こんにちは！Aplyマッチングボットです ✨\nMBTIに合う韓国の会社・職種、実際の求人までおすすめします。",
              "Hai! Aku bot pencocokan Aply ✨\nAku akan merekomendasikan perusahaan, peran Korea, dan lowongan nyata yang cocok dengan MBTI-mu."
            )
          },
          {
            id: makeId(),
            role: "bot",
            stepKey: null,
            text: t(
              "MBTI를 잘 모르셔도 괜찮아요. 가벼운 퀴즈 12문항으로 같이 알아볼게요 🔍",
              "Don't know your MBTI? No worries — let's find out with a quick 12-question quiz 🔍",
              "不知道自己的 MBTI 也没关系，用 12 道轻松小测一起来看看 🔍",
              "Chưa biết MBTI cũng không sao — cùng khám phá qua bài quiz 12 câu nhé 🔍",
              "MBTIが分からなくても大丈夫。かんたんな12問クイズで一緒に調べましょう 🔍",
              "Belum tahu MBTI-mu? Santai — yuk cari tahu lewat kuis singkat 12 soal 🔍"
            )
          }
        ]);
        setStep({ kind: "quiz-question", index: 0 });
      }
      return;
    }
    const key = stepKeyOf(step);
    if (!key) return;
    if (messages.some((m) => m.role === "bot" && m.stepKey === key)) return;

    let text: string | null = null;
    if (step.kind === "quiz-question") {
      const q = questions[step.index];
      if (!q) return; // wait for quiz to load
      text = `Q${step.index + 1}. ${q.question}`;
    } else if (step.kind === "ask-name") {
      text = t(
        "결과 카드에 띄울 이름이 있으신가요? (생략하셔도 괜찮아요)",
        "Any name to show on your result card? (You can skip this)",
        "结果卡片上想显示的名字？（可以跳过）",
        "Tên hiển thị trên thẻ kết quả? (Có thể bỏ qua)",
        "結果カードに載せる名前はありますか？（省略OK）",
        "Nama untuk ditampilkan di kartu hasil? (Boleh dilewati)"
      );
    } else if (step.kind === "ask-nationality") {
      text = t(
        "국적도 알려주시면 카드에 같이 표시해드릴게요 🌍 (생략 가능)",
        "Tell me your nationality and I'll show it on the card too 🌍 (optional)",
        "告诉我你的国籍，也会显示在卡片上 🌍（可选）",
        "Cho mình biết quốc tịch để hiển thị trên thẻ nhé 🌍 (tùy chọn)",
        "国籍も教えてくれたらカードに表示します 🌍（省略可）",
        "Beri tahu kewarganegaraanmu, akan ditampilkan di kartu juga 🌍 (opsional)"
      );
    } else if (step.kind === "ready") {
      text = t(
        "준비 끝났어요! 결과 보러 가볼까요? 🎁",
        "All set! Ready to see your result? 🎁",
        "准备好啦！要看看结果吗？🎁",
        "Xong rồi! Xem kết quả nhé? 🎁",
        "準備完了！結果を見に行きましょう？🎁",
        "Siap! Mau lihat hasilnya? 🎁"
      );
    }
    if (text) {
      setMessages((prev) => [...prev, { id: makeId(), role: "bot", text: text!, stepKey: key }]);
    }
  }, [step, messages, questions]);

  // Lazy-fetch quiz questions when entering quiz mode.
  useEffect(() => {
    if (step.kind !== "quiz-question" || questions.length > 0 || quizLoading) return;
    setQuizLoading(true);
    void fetch(`${apiBase}/mbti/quiz`, { cache: "force-cache" })
      .then((r) => r.json() as Promise<{ ok?: boolean; questions?: QuizQuestion[] }>)
      .then((data) => {
        if (data.ok && data.questions) setQuestions(data.questions);
      })
      .catch(() => setError(t("질문지를 불러오지 못했어요.", "Couldn't load the questions.", "无法载入题目。", "Không thể tải câu hỏi.", "質問を読み込めませんでした。", "Tidak dapat memuat pertanyaan.")))
      .finally(() => setQuizLoading(false));
  }, [apiBase, step.kind, questions.length, quizLoading]);

  // ---------------------------------------------------------------------
  // Input handlers
  // ---------------------------------------------------------------------
  function pickQuiz(q: QuizQuestion, code: string, label: string) {
    if (step.kind !== "quiz-question") return;
    const currentIdx = step.index;
    pushUser(label, `quiz-${currentIdx}`);
    setQuizAnswers((prev) => ({ ...prev, [q.id]: code }));
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setStep({ kind: "quiz-question", index: nextIdx });
    } else {
      setStep({ kind: "ask-name" });
    }
  }

  function submitText(kind: "ask-name" | "ask-nationality") {
    const value = pendingText.trim();
    const display = value || t("(생략)", "(skipped)", "(已跳过)", "(đã bỏ qua)", "(省略)", "(dilewati)");
    if (kind === "ask-name") {
      pushUser(display, "ask-name");
      setName(value);
      setPendingText("");
      setStep({ kind: "ask-nationality" });
    } else {
      pushUser(display, "ask-nationality");
      setNationality(value);
      setPendingText("");
      setStep({ kind: "ready" });
    }
  }

  function skipText(kind: "ask-name" | "ask-nationality") {
    if (kind === "ask-name") {
      pushUser(t("(생략)", "(skipped)", "(已跳过)", "(đã bỏ qua)", "(省略)", "(dilewati)"), "ask-name");
      setPendingText("");
      setStep({ kind: "ask-nationality" });
    } else {
      pushUser(t("(생략)", "(skipped)", "(已跳过)", "(đã bỏ qua)", "(省略)", "(dilewati)"), "ask-nationality");
      setPendingText("");
      setStep({ kind: "ready" });
    }
  }

  function editAt(messageId: string) {
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    const target = messages[idx];
    if (target.role !== "user" || !target.stepKey) return;
    const key = target.stepKey;

    setMessages((prev) => prev.slice(0, idx));
    setPendingText("");
    setError(null);

    if (key.startsWith("quiz-")) {
      const qIdx = parseInt(key.slice("quiz-".length), 10);
      // Keep answers up to but not including this question.
      setQuizAnswers((prev) => {
        const next: Record<string, string> = {};
        questions.slice(0, qIdx).forEach((q) => {
          if (prev[q.id]) next[q.id] = prev[q.id];
        });
        return next;
      });
      setName("");
      setNationality("");
      setStep({ kind: "quiz-question", index: qIdx });
      return;
    }
    if (key === "ask-name") {
      setName("");
      setNationality("");
      setStep({ kind: "ask-name" });
      return;
    }
    if (key === "ask-nationality") {
      setNationality("");
      setStep({ kind: "ask-nationality" });
      return;
    }
  }

  async function submitResult() {
    setError(null);
    setSubmitting(true);
    setStep({ kind: "submitting" });
    try {
      const response = await fetch(`${apiBase}/mbti/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          nationality: nationality.trim() || undefined,
          locale: "ko",
          quizAnswers: Object.entries(quizAnswers).map(([id, code]) => ({ id, code }))
        })
      });
      const payload = (await response.json()) as { ok?: boolean; shareSlug?: string; message?: string };
      if (!response.ok || !payload.ok || !payload.shareSlug) {
        throw new Error(payload.message ?? t("결과 생성에 실패했습니다.", "Couldn't create your result.", "结果生成失败。", "Không thể tạo kết quả.", "結果の生成に失敗しました。", "Gagal membuat hasil."));
      }
      router.push(`/events/mbti/result/${encodeURIComponent(payload.shareSlug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("결과 생성에 실패했습니다.", "Couldn't create your result.", "结果生成失败。", "Không thể tạo kết quả.", "結果の生成に失敗しました。", "Gagal membuat hasil."));
      setSubmitting(false);
      setStep({ kind: "ready" });
    }
  }

  // ---------------------------------------------------------------------
  // Render the inline input zone — appended at the end of the thread.
  // ---------------------------------------------------------------------
  function renderInlineInput() {
    if (step.kind === "quiz-question") {
      if (quizLoading && questions.length === 0) {
        return (
          <InlineHint>
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-300" />
            <span>{t("퀴즈 준비 중이에요...", "Getting the quiz ready...", "正在准备测验...", "Đang chuẩn bị quiz...", "クイズを準備中です...", "Menyiapkan kuis...")}</span>
          </InlineHint>
        );
      }
      const q = questions[step.index];
      if (!q) return null;
      return (
        <>
          <InlineHint>{step.index + 1} / {questions.length}</InlineHint>
          <ChoiceCard
            options={q.options.map((o) => ({ key: o.code, label: o.label }))}
            onPick={(code) => {
              const opt = q.options.find((o) => o.code === code);
              if (opt) pickQuiz(q, opt.code, opt.label);
            }}
          />
        </>
      );
    }
    if (step.kind === "ask-name" || step.kind === "ask-nationality") {
      const placeholder = step.kind === "ask-name"
        ? t("이름 입력", "Enter name", "输入姓名", "Nhập tên", "名前を入力", "Masukkan nama")
        : t("예: 베트남, 인도네시아", "e.g. Vietnam, Indonesia", "例：越南、印尼", "VD: Việt Nam, Indonesia", "例：ベトナム、インドネシア", "mis. Vietnam, Indonesia");
      return (
        <InlineInputRow>
          <input
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            placeholder={placeholder}
            maxLength={40}
            className="h-11 flex-1 min-w-0 rounded-full border border-white/10 bg-white/10 px-4 text-[16px] text-white outline-none placeholder:text-white/40 focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitText(step.kind as "ask-name" | "ask-nationality");
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => submitText(step.kind as "ask-name" | "ask-nationality")}
            className="h-11 shrink-0 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 px-4 text-sm font-bold text-[#2a1608] transition active:opacity-90"
          >
            {t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
          </button>
          <button
            type="button"
            onClick={() => skipText(step.kind as "ask-name" | "ask-nationality")}
            className="h-11 shrink-0 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white/70 transition active:bg-white/20"
          >
            {t("생략", "Skip", "跳过", "Bỏ qua", "省略", "Lewati")}
          </button>
        </InlineInputRow>
      );
    }
    if (step.kind === "ready") {
      return (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void submitResult()}
            disabled={submitting}
            className="h-13 w-full max-w-sm rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-400 py-3.5 text-[15px] font-bold text-[#2a1608] shadow-[0_8px_24px_-12px_rgba(251,191,36,0.6)] transition active:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? t("결과 만드는 중...", "Creating result...", "正在生成结果...", "Đang tạo kết quả...", "結果を作成中...", "Membuat hasil...")
              : t("결과 보러 가기 🎁", "See my result 🎁", "查看结果 🎁", "Xem kết quả 🎁", "結果を見る 🎁", "Lihat hasil 🎁")}
          </button>
        </div>
      );
    }
    if (step.kind === "submitting") {
      return (
        <InlineHint>
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-300" />
          <span>{t("결과 만드는 중이에요... 잠시만요 ⏳", "Creating your result... hang tight ⏳", "正在生成结果... 请稍候 ⏳", "Đang tạo kết quả... đợi chút nhé ⏳", "結果を作成中です... 少々お待ちください ⏳", "Membuat hasilmu... tunggu sebentar ⏳")}</span>
        </InlineHint>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1c0f05] font-sans text-white antialiased">
      {/* 사주 페이지와 동일 톤 — 다크 코스믹 배경 + 별·글로우 + 그라데이션 히어로 */}
      <div className="relative mx-auto flex min-h-screen max-w-[480px] flex-col overflow-hidden bg-gradient-to-b from-[#1c0f05] via-[#3a230c] to-[#1c0f05]">
        {/* 별·글로우 장식 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute left-[26%] top-14 h-2 w-2 rounded-full bg-yellow-200/70 blur-[1px]" />
          <span className="absolute right-[18%] top-24 h-1.5 w-1.5 rounded-full bg-white/80" />
          <span className="absolute left-8 top-52 h-1 w-1 rounded-full bg-yellow-100/60" />
          <span className="absolute right-9 top-72 h-1.5 w-1.5 rounded-full bg-white/70" />
          <span className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />
        </div>

        {/* 상단 바 — 독립 공유 페이지: 뒤로가기 대신 공유 버튼 */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-4 py-3">
          <p className="text-[14px] font-bold tracking-[-0.01em] text-white/90">{t("직무 MBTI", "Job MBTI", "职务MBTI", "MBTI nghề nghiệp", "職務MBTI", "MBTI kerja")}</p>
          <button
            type="button"
            onClick={() => void handleShare()}
            aria-label={t("공유하기", "Share", "分享", "Chia sẻ", "共有", "Bagikan")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold backdrop-blur-sm transition ${copied ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-white/85 active:bg-white/20"}`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" weight="bold" aria-hidden /> {t("링크 복사됨", "Link copied", "已复制链接", "Đã sao chép", "リンクをコピー", "Tautan disalin")}
              </>
            ) : (
              <>
                <ShareIcon className="h-4 w-4" weight="bold" aria-hidden /> {t("공유", "Share", "分享", "Chia sẻ", "共有", "Bagikan")}
              </>
            )}
          </button>
        </div>

        <main className="relative z-10 flex flex-1 flex-col px-4 pb-5">
          <header className="pb-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[11px] font-medium text-amber-100">Aply × MBTI</span>
            <h1 className="mt-3 whitespace-pre-line break-keep text-[23px] font-black leading-[1.3] tracking-[-0.02em]">
              <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                {t(
                  "내 MBTI에 잘 맞는\n한국 회사는? 🎯",
                  "Which Korean company\nfits your MBTI? 🎯",
                  "哪家韩国公司\n最合你的 MBTI？🎯",
                  "Công ty Hàn nào\nhợp MBTI của bạn? 🎯",
                  "あなたのMBTIに合う\n韓国企業は？🎯",
                  "Perusahaan Korea mana\nyang cocok dengan MBTI-mu? 🎯"
                )}
              </span>
            </h1>
            {/* 캐릭터 히어로 */}
            <Image src="/images/img_mbti_event_characters.webp" alt="" width={300} height={200} priority className="mx-auto mt-3 h-auto w-[64%] max-w-[280px] object-contain" />
          </header>

          {/* Chat panel — glass 카드(다크) */}
          <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
            <div
              ref={threadRef}
              className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4"
            >
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} onEdit={editAt} />
              ))}

              {/* Inline input at the end of the thread */}
              {error ? (
                <p className="ml-10 text-xs text-red-300">{error}</p>
              ) : null}
              {renderInlineInput()}
            </div>

            {/* Footer note */}
            <div className="border-t border-white/10 px-4 py-2.5 text-center">
              <p className="text-[10px] leading-relaxed text-white/45">
                {t("MBTI를 더 정확히 알고 싶다면", "Want a more accurate MBTI? Try", "想更准确了解 MBTI？可参考", "Muốn biết MBTI chính xác hơn? Thử", "MBTIをもっと正確に知りたいなら", "Ingin MBTI lebih akurat? Coba")}{" "}
                <a
                  href="https://www.16personalities.com/ko/%EB%AC%B4%EB%A3%8C-%EC%84%B1%EA%B2%A9-%EC%9C%A0%ED%98%95-%EA%B2%80%EC%82%AC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-200 underline"
                >
                  {t("16personalities 무료 검사", "the free 16personalities test", "16personalities 免费测试", "bài test miễn phí 16personalities", "16personalitiesの無料診断", "tes gratis 16personalities")}
                </a>
                {t("도 참고해 보세요.", ".", "。", ".", "も参考にしてみてください。", ".")}
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChatBubble({
  message,
  onEdit
}: {
  message: Message;
  onEdit: (id: string) => void;
}) {
  const t = usePlatformT();
  if (message.role === "bot") {
    return (
      <div className="flex items-start gap-2.5">
        <BotAvatar />
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-[14px] leading-relaxed text-white whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }
  const editable = Boolean(message.stepKey);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-2.5 text-[14px] leading-relaxed text-white whitespace-pre-wrap">
        {message.text}
      </div>
      {editable ? (
        <button
          type="button"
          onClick={() => onEdit(message.id)}
          className="text-[11px] text-white/45 hover:text-amber-200 underline-offset-2 hover:underline"
        >
          {t("수정", "Edit", "修改", "Sửa", "修正", "Ubah")}
        </button>
      ) : null}
    </div>
  );
}

// User-side text-input row (이름/국적). Right-aligned so it matches the
// user bubble side of the thread.
function InlineInputRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="flex w-full max-w-[85%] flex-wrap gap-2">{children}</div>
    </div>
  );
}

// Small contextual hint (e.g., "3/20", "퀴즈 준비 중..."). Right-aligned
// since it's about the user's progress.
function InlineHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-1.5 text-[11px] text-white/50">
        {children}
      </div>
    </div>
  );
}

// A user-side chat group. Light blue outer card holds individual white
// answer cards stacked vertically. Width sizes to the longest option
// (inline-block + w-fit) so the group never stretches across the row.
function ChoiceCard({
  options,
  onPick
}: {
  options: { key: string; label: string }[];
  onPick: (key: string) => void;
}) {
  return (
    <div className="flex justify-end">
      <div
        className="
          inline-flex flex-col gap-2.5
          max-w-full
          rounded-2xl rounded-tr-sm
          border border-white/10 bg-white/[0.05]
          p-3
        "
      >
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onPick(opt.key)}
            className="
              inline-flex items-center
              rounded-xl border border-white/10 bg-white/10
              px-6 py-5 text-left text-[14px] font-semibold leading-snug
              text-white
              transition hover:border-amber-400 hover:bg-amber-500 hover:text-white
            "
          >
            <span className="whitespace-nowrap">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
