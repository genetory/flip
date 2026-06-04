"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-border/60 overflow-hidden">
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

  const threadRef = useRef<HTMLDivElement | null>(null);

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
            text:
              "안녕하세요! Aply 매칭 봇이에요 ✨\nMBTI에 잘 맞는 한국 회사·직무와 실제 채용 공고까지 추천해드릴게요."
          },
          {
            id: makeId(),
            role: "bot",
            stepKey: null,
            text:
              "MBTI를 잘 모르셔도 괜찮아요. 가벼운 퀴즈 12문항으로 같이 알아볼게요 🔍"
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
      text = "결과 카드에 띄울 이름이 있으신가요? (생략하셔도 괜찮아요)";
    } else if (step.kind === "ask-nationality") {
      text = "국적도 알려주시면 카드에 같이 표시해드릴게요 🌍 (생략 가능)";
    } else if (step.kind === "ready") {
      text = "준비 끝났어요! 결과 보러 가볼까요? 🎁";
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
      .catch(() => setError("질문지를 불러오지 못했어요."))
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
    const display = value || "(생략)";
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
      pushUser("(생략)", "ask-name");
      setPendingText("");
      setStep({ kind: "ask-nationality" });
    } else {
      pushUser("(생략)", "ask-nationality");
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
        throw new Error(payload.message ?? "결과 생성에 실패했습니다.");
      }
      router.push(`/events/mbti/result/${encodeURIComponent(payload.shareSlug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결과 생성에 실패했습니다.");
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
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span>퀴즈 준비 중이에요...</span>
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
      const placeholder = step.kind === "ask-name" ? "이름 입력" : "예: 베트남, 인도네시아";
      return (
        <InlineInputRow>
          <input
            value={pendingText}
            onChange={(e) => setPendingText(e.target.value)}
            placeholder={placeholder}
            maxLength={40}
            className="h-10 flex-1 min-w-0 rounded-full border border-border/50 bg-white px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitText(step.kind as "ask-name" | "ask-nationality");
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => submitText(step.kind as "ask-name" | "ask-nationality")}
            className="h-10 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            보내기
          </button>
          <button
            type="button"
            onClick={() => skipText(step.kind as "ask-name" | "ask-nationality")}
            className="h-10 shrink-0 rounded-full border border-border/50 bg-white px-3 text-xs font-semibold text-muted-foreground"
          >
            생략
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
            className="h-12 w-full max-w-sm rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "결과 만드는 중..." : "결과 보러 가기 🎁"}
          </button>
        </div>
      );
    }
    if (step.kind === "submitting") {
      return (
        <InlineHint>
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span>결과 만드는 중이에요... 잠시만요 ⏳</span>
        </InlineHint>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {/* Saju-style mobile-web shell: centered 480px column on desktop,
          full width on mobile. Header/Footer are intentionally dropped
          to keep the focus on the chat thread. */}
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-background">
        <main className="flex flex-1 flex-col px-4 py-5">
          <header className="space-y-2 text-center pb-4">
            <p className="inline-flex items-center rounded-full border border-border/60 bg-white px-3 py-1 text-[11px] font-semibold text-primary">
              Aply × MBTI
            </p>
            <h1 className="font-display text-[22px] font-black leading-tight tracking-[-0.02em]">
              내 MBTI에 잘 맞는<br />한국 회사는? 🎯
            </h1>
          </header>

          {/* Chat panel — one scrollable area with inline input at the end */}
          <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-border/40 bg-white">
            <div
              ref={threadRef}
              className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4"
            >
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} onEdit={editAt} />
              ))}

              {/* Inline input at the end of the thread */}
              {error ? (
                <p className="ml-10 text-xs text-destructive">{error}</p>
              ) : null}
              {renderInlineInput()}
            </div>

            {/* Footer note */}
            <div className="border-t border-border/40 bg-muted/20 px-4 py-2.5 text-center">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                MBTI를 더 정확히 알고 싶다면{" "}
                <a
                  href="https://www.16personalities.com/ko/%EB%AC%B4%EB%A3%8C-%EC%84%B1%EA%B2%A9-%EC%9C%A0%ED%98%95-%EA%B2%80%EC%82%AC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  16personalities 무료 검사
                </a>
                도 참고해 보세요.
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
  if (message.role === "bot") {
    return (
      <div className="flex items-start gap-2.5">
        <BotAvatar />
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted/40 px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }
  const editable = Boolean(message.stepKey);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-[14px] leading-relaxed text-primary-foreground whitespace-pre-wrap">
        {message.text}
      </div>
      {editable ? (
        <button
          type="button"
          onClick={() => onEdit(message.id)}
          className="text-[11px] text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
        >
          수정
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
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
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
          border border-primary/30 bg-primary/10
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
              rounded-xl border border-primary/15 bg-white
              px-6 py-5 text-left text-[14px] font-semibold leading-snug
              text-primary
              transition hover:border-primary hover:bg-primary hover:text-primary-foreground
            "
          >
            <span className="whitespace-nowrap">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
