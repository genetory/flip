"use client";

// v2 한 문항 연습 시트 — 오늘의 질문·다시 볼 답·면접 후기 질문이 함께 쓴다.
// 답하기(글 또는 말로) → AI 피드백(단계·잘한 점·고칠 점·꼬리 질문) → 내 연습 기록(self-mock)에 저장.
// 실전 모드: 60초 안에 답하기. '잘해요'를 받으면 익명 예시로 공개할지 묻고, 내 답을 낸 뒤에만 다른 사람의 잘 쓴 답을 보여 준다.
import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet } from "./sheets";
import { Button, Spinner, Switch } from "./ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { aiInterviewFeedback, getAnswerExamples, shareAnswerExample, type InterviewFeedback } from "../../lib/member-profile-client";
import { isInterviewPaywallError, openInterviewPaywall, setInterviewCreditBalance } from "../../lib/interview-credits";
import { useResumeDoc } from "../../lib/talent/resume-doc";
import { useBasicInfo } from "../../lib/talent/basic-info";
import { saveSelfMockAnswer, useSelfMock } from "../../lib/talent/self-mock";
import { formatRelativeTime } from "../../lib/talent/career-feed";
import { resumeToText } from "../talent/jobs/MockInterviewModal";

export type PracticeQuestion = { ko: string; shown: string; category: string };

/** 점수 → 단계. 80 이상 잘 쓴 답, 70 미만은 더 볼 곳(mock-weakness 기준). */
export function LevelChip({ t, score }: { t: PlatformT; score: number | null | undefined }) {
  if (score == null) return null;
  const lv =
    score >= 80
      ? { text: t("잘해요", "Strong", "很好", "Tốt", "良い", "Bagus"), cls: "bg-[#e5f6ee] text-[color:var(--v2-good)]" }
      : score >= 70
        ? { text: t("괜찮아요", "Okay", "还行", "Ổn", "まずまず", "Cukup"), cls: "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" }
        : { text: t("더 연습", "Practice more", "多练习", "Luyện thêm", "要練習", "Latih lagi"), cls: "bg-[#fdeced] text-[color:var(--v2-attention)]" };
  return <span className={`inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 text-[13px] font-bold ${lv.cls}`}>{lv.text}</span>;
}

// 질문 읽어 주기 — 브라우저 음성 합성(speechSynthesis). 한국어 면접이라 한국어 질문을 한국어 목소리로 읽는다.
export function useSpeak() {
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.95;
    const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith("ko"));
    if (voice) u.voice = voice;
    synth.speak(u);
  }, []);
  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);
  useEffect(() => stop, [stop]); // 시트가 닫히면 멈춘다
  return { speak, stop };
}

/** 질문 다시 듣기 버튼. */
export function SpeakButton({ t, onSpeak }: { t: PlatformT; onSpeak: () => void }) {
  return (
    <button type="button" onClick={onSpeak} aria-label={t("질문 듣기", "Listen", "听问题", "Nghe câu hỏi", "質問を聞く", "Dengarkan")} title={t("질문 듣기", "Listen", "听问题", "Nghe câu hỏi", "質問を聞く", "Dengarkan")} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-[color:var(--v2-band)] px-3 text-[13px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
      {t("듣기", "Listen", "听", "Nghe", "聞く", "Dengar")}
    </button>
  );
}

// 말로 답하기 — 브라우저 음성 인식(Web Speech API). 지원하지 않는 브라우저에선 버튼을 숨긴다.
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
const FILLERS = /(^|\s)(음+|어+|그+|저기|뭐랄까|약간|좀)(?=\s|$|[,.])/g;

export function PracticeSheet({
  question: initial,
  initialAnswer = "",
  onClose,
  onSaved,
  heading,
  progress,
  intent,
  onSave,
  onNext,
  nextBusy,
  daily = false
}: {
  question: PracticeQuestion;
  initialAnswer?: string;
  onClose: () => void;
  onSaved?: () => void;
  /** 모의 면접 세션에서 쓸 때 — 제목·진행(Q2 · 이 공고 맞춤)·질문 의도 */
  heading?: string;
  progress?: string;
  intent?: string;
  /** 답을 어디에 남길지(기본: 내 연습 기록 self-mock). 공고 연습은 공고 기록에. */
  onSave?: (q: PracticeQuestion, answer: string, fb: InterviewFeedback) => void;
  /** 피드백 뒤 [다음 질문] — 있으면 [완료] 대신 */
  onNext?: () => void;
  nextBusy?: boolean;
  /** 오늘의 질문 — 하루 1번 이용권 없이 */
  daily?: boolean;
}) {
  const t = usePlatformT();
  const [question, setQuestion] = useState(initial); // 꼬리 질문으로 이어서 답하면 바뀐다
  const tts = useSpeak();
  const { locale } = useLanguage();
  const resume = useResumeDoc();
  const info = useBasicInfo();
  const [answer, setAnswer] = useState(initialAnswer);
  const selfMock = useSelfMock();
  // 예전에 이 질문에 답한 적 있으면(내 서류·오늘의 질문 연습) — 지난 답과 평가를 보여 주고 거기서 고쳐 쓸 수 있게.
  const prev = !onSave ? (selfMock?.answers ?? []).find((a) => a.question === question.ko && a.answer.trim()) : undefined;
  const [showPrev, setShowPrev] = useState(false);
  const [timed, setTimed] = useState(false);
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [shared, setShared] = useState<"idle" | "saving" | "done">("idle");
  const [examples, setExamples] = useState<{ id: string; answer: string; score: number }[] | null>(null);
  const timeUp = timed && running && left <= 0;

  // 실전 모드 타이머 — 첫 글자를 쓰거나 말하기를 누르면 시작.
  useEffect(() => {
    if (!timed || !running || left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timed, running, left]);

  const begin = () => {
    if (timed && !running) setRunning(true);
  };
  const dict = useDictation({ onStart: begin, onFinal: (add) => setAnswer((a) => (a.trim() ? `${a.trim()} ${add}` : add)) });

  /** 다시 답하기 — 결과를 닫고 글을 고칠 수 있게(같은 질문, 또는 꼬리 질문으로). */
  const retry = (text: string, next?: PracticeQuestion) => {
    if (next) setQuestion(next);
    setAnswer(text);
    setFeedback(null);
    setExamples(null);
    setShared("idle");
    dict.reset();
    setRunning(false);
    setLeft(60);
  };

  const submit = async () => {
    const a = answer.trim();
    if (a.length < 10) {
      setError(t("조금 더 길게 답해 주세요.", "Please write a bit more.", "请再多写一点。", "Hãy viết thêm một chút.", "もう少し書いてください。", "Tulis sedikit lebih panjang."));
      return;
    }
    dict.stop();
    setBusy(true);
    setError(null);
    try {
      const fb = await aiInterviewFeedback({ question: question.ko, answer: a, resumeText: resumeToText(resume, info) || undefined, desiredJobRole: resume?.targetRole || undefined, locale, daily: daily || undefined });
      setInterviewCreditBalance(fb.credits);
      setFeedback(fb);
      if (onSave) onSave(question, a, fb);
      else saveSelfMockAnswer({ question: question.ko, category: question.category, answer: a, score: fb.score, feedback: { score: fb.score, strengths: fb.strengths, improvements: fb.improvements, sampleAnswer: fb.sampleAnswer } });
      onSaved?.();
      getAnswerExamples(question.ko)
        .then(setExamples)
        .catch(() => setExamples([]));
    } catch (e) {
      // 이용권이 없으면 결제 창을 연다(답은 그대로 남아 있어 충전 후 다시 누르면 된다).
      if (isInterviewPaywallError(e)) {
        setError(t("이용권이 필요해요. 충전하면 바로 이어서 할 수 있어요.", "You need a pass. Top up to continue.", "需要使用券，充值后即可继续。", "Cần vé. Nạp thêm để tiếp tục.", "チケットが必要です。チャージすると続けられます。", "Perlu tiket. Isi ulang untuk lanjut."));
        openInterviewPaywall();
        return;
      }
      setError(t("피드백을 받지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't get feedback. Try again soon.", "未能获取反馈，请稍后再试。", "Không nhận được phản hồi. Thử lại sau.", "フィードバックを受け取れませんでした。", "Gagal mendapat umpan balik."));
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    if (!feedback) return;
    setShared("saving");
    try {
      await shareAnswerExample({ question: question.ko, category: question.category, answer: answer.trim(), score: Math.round(feedback.score) });
      setShared("done");
    } catch {
      setShared("idle");
    }
  };

  return (
    <Sheet
      tall
      title={heading ?? t("한 문항 연습", "Practice one question", "单题练习", "Luyện một câu", "1問練習", "Latihan satu soal")}
      subtitle={progress}
      onClose={onClose}
      footer={
        feedback ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="neutral" full onClick={() => retry(answer)}>
              {t("고쳐서 다시 답하기", "Revise & retry", "修改后重答", "Sửa & trả lời lại", "直して再回答", "Perbaiki & ulangi")}
            </Button>
            {onNext ? (
              <Button full onClick={onNext} disabled={nextBusy}>
                {nextBusy ? <Spinner /> : null}
                {t("다음 질문", "Next question", "下一题", "Câu tiếp", "次の質問", "Berikutnya")}
              </Button>
            ) : (
              <Button full onClick={onClose}>
                {t("완료", "Done", "完成", "Xong", "完了", "Selesai")}
              </Button>
            )}
          </div>
        ) : (
          <Button full onClick={() => void submit()} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? t("AI가 읽고 있어요", "AI is reading…", "AI 正在阅读", "AI đang đọc…", "AIが読んでいます", "AI membaca…") : t("AI 피드백 받기", "Get AI feedback", "获取 AI 反馈", "Nhận phản hồi AI", "AIフィードバック", "Dapatkan umpan balik AI")}
          </Button>
        )
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[19px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{question.shown}</p>
        <SpeakButton t={t} onSpeak={() => tts.speak(question.ko)} />
      </div>
      {locale !== "ko" && question.shown !== question.ko ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {question.ko}</p> : null}
      {prev && !feedback ? (
        <div className="mt-3 rounded-2xl bg-[color:var(--v2-fill)] p-4">
          <button type="button" onClick={() => setShowPrev((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
            <span className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">
              {t("지난번 내 답", "My last answer", "上次的回答", "Câu trả lời trước", "前回の回答", "Jawaban terakhir")} <span className="font-medium text-[color:var(--v2-faint)]">· {formatRelativeTime(prev.updatedAt, undefined, t)}</span>
            </span>
            <span className="flex items-center gap-2">
              <LevelChip t={t} score={prev.score} />
              <svg viewBox="0 0 24 24" className={`h-4 w-4 text-[color:var(--v2-faint)] transition ${showPrev ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>
          {showPrev ? (
            <div className="mt-3 text-[14px] leading-[1.6]">
              <p className="whitespace-pre-wrap text-[color:var(--v2-ink-3)]">{prev.answer}</p>
              {prev.feedback?.strengths?.length ? <p className="mt-2 text-[color:var(--v2-good)]"><b>{t("잘한 점", "Good", "优点", "Tốt", "良い点", "Bagus")}</b> · {prev.feedback.strengths.slice(0, 2).join(" / ")}</p> : null}
              {prev.feedback?.improvements?.length ? <p className="mt-1 text-[color:var(--v2-attention)]"><b>{t("고칠 점", "Fix", "改进", "Cần sửa", "直す点", "Perbaiki")}</b> · {prev.feedback.improvements.slice(0, 2).join(" / ")}</p> : null}
              <div className="mt-3">
                <Button size="sm" variant="white" onClick={() => setAnswer(prev.answer)}>
                  {t("이 답에서 고쳐 쓰기", "Edit from this", "在此基础上修改", "Sửa từ bản này", "これを直して書く", "Perbaiki dari ini")}
                </Button>
              </div>
            </div>
          ) : prev.feedback?.improvements?.[0] ? (
            <p className="mt-1.5 line-clamp-2 text-[13px] text-[color:var(--v2-attention)]">{t("고칠 점", "Fix", "改进", "Cần sửa", "直す点", "Perbaiki")} · {prev.feedback.improvements[0]}</p>
          ) : null}
        </div>
      ) : null}
      {intent && !feedback ? <p className="mt-2 rounded-xl bg-[color:var(--v2-fill)] px-3 py-2 text-[13px] leading-[1.55] text-[color:var(--v2-muted)]">💡 {t("면접관이 보려는 것", "What they look for", "面试官想看的", "Người PV muốn thấy", "面接官が見たいこと", "Yang dicari")} · {intent}</p> : null}

      {!feedback ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Switch on={timed} onChange={(v) => { setTimed(v); setRunning(false); setLeft(60); }} label={t("실전 모드 · 60초", "Real mode · 60s", "实战模式 · 60秒", "Thực chiến · 60s", "本番モード・60秒", "Mode nyata · 60 dtk")} />
            {timed && !running ? <span className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{t("쓰기 시작하면 재요", "Starts when you begin", "开始作答即计时", "Bắt đầu khi bạn viết", "書き始めると計測", "Mulai saat menulis")}</span> : null}
          </div>
          {timed && running ? <TimerBar t={t} left={left} total={60} /> : null}
          <textarea
            value={answer}
            onChange={(e) => {
              begin();
              setAnswer(e.target.value);
            }}
            readOnly={timeUp}
            rows={7}
            placeholder={t("면접관에게 말하듯 편하게 써 보세요.", "Write as if you're talking to the interviewer.", "像对面试官说话一样写。", "Viết như đang nói với người phỏng vấn.", "面接官に話すように書いてみましょう。", "Tulis seperti berbicara ke pewawancara.")}
            className="mt-3 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[16px] leading-[1.65] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2 read-only:opacity-70"
          />
          {timeUp ? <p className="mt-2 text-[14px] font-semibold text-[color:var(--v2-attention)]">{t("시간이 끝났어요. 지금까지 쓴 답으로 피드백을 받아 보세요.", "Time's up — get feedback on what you have.", "时间到了，用已写的回答获取反馈吧。", "Hết giờ — nhận phản hồi với câu trả lời hiện có.", "時間切れです。ここまでの回答でフィードバックを。", "Waktu habis — minta umpan balik.")}</p> : null}
          <DictationControls t={t} dict={dict} disabled={timeUp} right={<span className="text-[13px] tabular-nums text-[color:var(--v2-faint)]">{answer.trim().length}{t("자", " chars", "字", " ký tự", "字", " karakter")}</span>} />
          {error ? <p className="mt-2 text-[14px] text-[color:var(--v2-attention)]">{error}</p> : null}
        </>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          <ResultSummary t={t} answer={answer.trim()} feedback={feedback} />

          {/* 내 답 — 숫자(결과)는 초록, 막연한 말은 빨강으로 표시 */}
          <div className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
            <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("내 답", "Your answer", "我的回答", "Câu trả lời", "あなたの回答", "Jawabanmu")}</p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">
              <Highlighted text={answer.trim()} />
            </p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[color:var(--v2-faint)]">
              <span><span className="font-semibold text-[color:var(--v2-good)] underline decoration-2 underline-offset-4">30%</span> {t("구체적인 결과", "concrete result", "具体结果", "kết quả cụ thể", "具体的な成果", "hasil konkret")}</span>
              <span><span className="font-semibold text-[color:var(--v2-attention)] underline decoration-wavy underline-offset-4">{t("열심히", "hard", "努力", "chăm chỉ", "一生懸命", "keras")}</span> {t("막연한 말", "vague word", "空泛的词", "từ mơ hồ", "あいまいな言葉", "kata samar")}</span>
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {feedback.strengths.length ? (
              <PointCard tone="good" title={t("잘한 점", "What worked", "优点", "Điểm tốt", "良い点", "Yang bagus")} items={feedback.strengths.slice(0, 3)} />
            ) : null}
            {feedback.improvements.length ? (
              <PointCard tone="bad" title={t("고칠 점", "To improve", "改进点", "Cần sửa", "直す点", "Perbaiki")} items={feedback.improvements.slice(0, 3)} />
            ) : null}
          </div>

          {feedback.sampleAnswer?.trim() ? (
            <div className="rounded-2xl bg-[color:var(--v2-band)] p-4">
              <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("이렇게 바꿔 보면 어때요?", "Try it like this", "试试这样改", "Thử viết thế này", "こう直してみては？", "Coba seperti ini")}</p>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">{feedback.sampleAnswer.trim()}</p>
              <p className="mt-2 text-[12px] text-[color:var(--v2-faint)]">{t("AI가 내 답을 바탕으로 고친 예시예요. 내 경험에 맞게 바꿔 쓰세요.", "An AI rewrite based on your answer — adapt it to your real experience.", "AI 基于你的回答改写的示例，请按真实经历调整。", "Bản AI viết lại từ câu trả lời của bạn — hãy chỉnh theo trải nghiệm thật.", "AIがあなたの回答をもとに直した例です。実際の経験に合わせて。", "Contoh tulisan ulang AI — sesuaikan dengan pengalaman nyata.")}</p>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={() => retry(feedback.sampleAnswer.trim())}>
                  {t("이 답으로 고쳐 쓰기", "Edit from this", "以此修改", "Sửa từ bản này", "これをもとに書く", "Edit dari ini")}
                </Button>
              </div>
            </div>
          ) : null}

          {feedback.followUp ? (
            <div className="rounded-2xl bg-[color:var(--v2-accent-weak)] p-4">
              <p className="text-[13px] font-bold text-[color:var(--v2-accent)]">{t("면접관이 이어서 물을 질문", "Likely follow-up", "面试官可能追问", "Câu hỏi nối tiếp", "想定される追加質問", "Pertanyaan lanjutan")}</p>
              <p className="mt-1 text-[16px] font-semibold leading-[1.55] text-[color:var(--v2-ink)]">{feedback.followUp}</p>
              <div className="mt-3">
                <Button size="sm" onClick={() => retry("", { ko: feedback.followUp!, shown: feedback.followUp!, category: question.category })}>
                  {t("이어서 답하기", "Answer it", "继续回答", "Trả lời tiếp", "続けて答える", "Jawab")}
                </Button>
              </div>
            </div>
          ) : null}

          {feedback.score >= 80 ? (
            <div className="rounded-2xl bg-[color:var(--v2-band)] p-4">
              {shared === "done" ? (
                <p className="text-[14px] font-semibold text-[color:var(--v2-good)]">{t("고마워요! 익명 예시로 공개했어요.", "Thanks! Shared anonymously.", "谢谢！已匿名分享。", "Cảm ơn! Đã chia sẻ ẩn danh.", "ありがとう！匿名で公開しました。", "Terima kasih! Dibagikan anonim.")}</p>
              ) : (
                <>
                  <p className="text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">{t("잘 쓴 답이에요. 이름 없이 다른 사람에게 예시로 보여줘도 될까요? 이름·회사 같은 개인정보가 있다면 공개하지 마세요.", "Great answer. Share it anonymously as an example? Don't share if it has personal info.", "回答很好。可以匿名作为示例分享吗？含个人信息请勿分享。", "Câu trả lời tốt. Chia sẻ ẩn danh làm ví dụ? Đừng chia sẻ nếu có thông tin cá nhân.", "良い回答です。匿名で例として公開しますか？個人情報があれば公開しないでください。", "Jawaban bagus. Bagikan anonim sebagai contoh? Jangan jika ada data pribadi.")}</p>
                  <div className="mt-3">
                    <Button size="sm" variant="secondary" onClick={() => void share()} disabled={shared === "saving"}>
                      {t("익명으로 공개하기", "Share anonymously", "匿名分享", "Chia sẻ ẩn danh", "匿名で公開", "Bagikan anonim")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
          {examples && examples.length ? (
            <div>
              <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("다른 사람의 잘 쓴 답", "Strong answers from others", "他人的优秀回答", "Câu trả lời tốt của người khác", "他の人の良い回答", "Jawaban bagus orang lain")}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {examples.map((x) => (
                  <li key={x.id} className="whitespace-pre-wrap rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[14px] leading-[1.65] text-[color:var(--v2-ink-3)]">
                    {x.answer}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}

// ── 결과 보기 도우미 ─────────────────────────────────────
// 막연한 말 · 숫자로 된 결과(단위까지). 캡처 그룹은 하나만 — split 결과에 조각이 겹쳐 나오지 않게.
const VAGUE_SRC = "열심히|최선을|최선|다양한|여러 가지|많은 것|성실하게|노력했|노력하|열정|책임감";
const NUM_SRC = "\\d[\\d,.]*\\s*(?:%|퍼센트|명|건|배|시간|분|개월|년|원|만|천|억|개)?";
const VAGUE = new RegExp(VAGUE_SRC, "g");

/** 한눈에 보는 결과 — 단계 · 한 줄 평 · 답 체크(길이·숫자로 된 결과·내 역할·막연한 말). 체크는 규칙으로 계산(AI 아님). */
export function ResultSummary({ t, answer, feedback }: { t: PlatformT; answer: string; feedback: InterviewFeedback }) {
  const len = answer.replace(/\s+/g, "").length;
  const hasNumber = /\d/.test(answer);
  const hasRole = /(제가|저는|제\s|맡|담당|주도|직접|이끌)/.test(answer);
  const vague = (answer.match(VAGUE) ?? []).length;
  const verdict = feedback.score >= 80 ? feedback.strengths[0] : feedback.improvements[0];
  const checks: { ok: boolean; text: string }[] = [
    len < 120
      ? { ok: false, text: t(`조금 짧아요(${len}자) — 1분 답이면 250~400자 정도예요`, `A bit short (${len}) — aim for 250–400 chars for 1 min`, `有点短（${len}字）— 1分钟回答约250~400字`, `Hơi ngắn (${len}) — khoảng 250–400 ký tự cho 1 phút`, `少し短い（${len}字）— 1分なら250〜400字`, `Agak pendek (${len}) — 250–400 karakter untuk 1 menit`) }
      : len > 700
        ? { ok: false, text: t(`길어요(${len}자) — 핵심만 남겨 1분 안에`, `Long (${len}) — keep it under a minute`, `偏长（${len}字）— 只留重点`, `Dài (${len}) — giữ trong 1 phút`, `長い（${len}字）— 要点だけに`, `Panjang (${len}) — cukup 1 menit`) }
        : { ok: true, text: t(`길이가 알맞아요(${len}자)`, `Good length (${len})`, `长度合适（${len}字）`, `Độ dài vừa (${len})`, `ちょうどいい長さ（${len}字）`, `Panjang pas (${len})`) },
    hasNumber
      ? { ok: true, text: t("결과를 숫자로 말했어요", "You gave numbers", "用数字说明了结果", "Có số liệu kết quả", "成果を数字で伝えた", "Ada angka hasil") }
      : { ok: false, text: t("결과를 숫자로 말해 보세요 (예: 30% 늘렸어요)", "Add a number (e.g. grew 30%)", "用数字说明结果（如提升30%）", "Thêm số liệu (vd: tăng 30%)", "成果を数字で（例：30%伸ばした）", "Tambahkan angka (mis. naik 30%)") },
    hasRole
      ? { ok: true, text: t("내 역할이 드러나요", "Your role is clear", "体现了你的角色", "Vai trò rõ ràng", "自分の役割が見える", "Peranmu jelas") }
      : { ok: false, text: t("'제가 ~했습니다'로 내 역할을 분명히", "Say what *you* did ('I …')", "用'我做了~'说明你的角色", "Nói rõ bạn đã làm gì", "「私が〜しました」で役割を明確に", "Jelaskan apa yang *kamu* lakukan") },
    ...(vague >= 2 ? [{ ok: false, text: t(`막연한 말이 ${vague}번 나와요 — 구체적인 예로 바꿔 보세요`, `${vague} vague words — swap for examples`, `空泛的词出现${vague}次 — 换成具体例子`, `${vague} từ mơ hồ — thay bằng ví dụ`, `あいまいな言葉が${vague}回 — 具体例に`, `${vague} kata samar — ganti dengan contoh`) }] : [])
  ];
  return (
    <div className="rounded-2xl bg-[color:var(--v2-band)] p-4">
      <div className="flex items-center gap-2">
        <LevelChip t={t} score={feedback.score} />
        <span className="text-[13px] font-semibold text-[color:var(--v2-muted)]">{t("AI 평가", "AI rating", "AI 评价", "Đánh giá AI", "AI評価", "Penilaian AI")}</span>
      </div>
      {verdict ? <p className="mt-2 text-[17px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{verdict}</p> : null}
      <ul className="mt-3 flex flex-col gap-1.5">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-[14px] leading-[1.5]">
            <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${c.ok ? "bg-[color:var(--v2-good)] text-white" : "bg-white text-[color:var(--v2-attention)]"}`} aria-hidden>
              {c.ok ? "✓" : "!"}
            </span>
            <span className={c.ok ? "text-[color:var(--v2-ink-3)]" : "font-semibold text-[color:var(--v2-ink-2)]"}>{c.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 실전 모드 타이머 — 큰 숫자 + 줄어드는 막대. 20초 남으면 주황, 10초 남으면 빨강 테두리와 깜빡이는 점으로 압박을 준다. */
export function TimerBar({ t, left, total }: { t: PlatformT; left: number; total: number }) {
  const sec = Math.max(0, left);
  const pct = Math.max(0, Math.min(100, (sec / total) * 100));
  const level = sec <= 10 ? "danger" : sec <= 20 ? "warn" : "ok";
  const color = level === "danger" ? "#f04452" : level === "warn" ? "#ff8a00" : "var(--v2-accent)";
  const bg = level === "danger" ? "bg-[#fdf2f3]" : level === "warn" ? "bg-[#fff4e8]" : "bg-[color:var(--v2-accent-weak)]";
  return (
    <div className={`mt-3 rounded-2xl px-4 py-3 transition-colors ${bg} ${level === "danger" && sec > 0 ? "ring-2 ring-[#f04452]" : ""}`} role="timer" aria-live="off">
      <div className="flex items-end justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color }}>
          {level === "danger" && sec > 0 ? (
            // 10초 남으면 깜빡이는 빨간 점
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f04452] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#f04452]" />
            </span>
          ) : null}
          {sec <= 0
            ? t("시간 끝", "Time's up", "时间到", "Hết giờ", "時間切れ", "Waktu habis")
            : level === "danger"
              ? t("곧 끝나요!", "Almost out!", "快结束了！", "Sắp hết!", "もうすぐ終了！", "Hampir habis!")
              : level === "warn"
                ? t("서둘러요", "Hurry up", "抓紧", "Nhanh lên", "急いで", "Cepat")
                : t("⏱ 남은 시간", "⏱ Time left", "⏱ 剩余时间", "⏱ Còn lại", "⏱ 残り時間", "⏱ Sisa waktu")}
        </span>
        <span className="text-[34px] font-bold leading-none tabular-nums tracking-[-0.02em]" style={{ color }}>
          {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/** 내 답 강조 — 숫자 결과는 초록 밑줄, 막연한 말은 빨간 물결. */
export function Highlighted({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${VAGUE_SRC}|${NUM_SRC})`, "g"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 0 ? (
          <span key={i}>{p}</span>
        ) : new RegExp(`^(?:${VAGUE_SRC})$`).test(p) ? (
          <span key={i} className="font-semibold text-[color:var(--v2-attention)] underline decoration-wavy underline-offset-4">{p}</span>
        ) : (
          <span key={i} className="font-semibold text-[color:var(--v2-good)] underline decoration-2 underline-offset-4">{p}</span>
        )
      )}
    </>
  );
}

export function PointCard({ tone, title, items }: { tone: "good" | "bad"; title: string; items: string[] }) {
  return (
    <div className={`rounded-2xl p-4 ${tone === "good" ? "bg-[#effaf4]" : "bg-[#fdf2f3]"}`}>
      <p className={`text-[14px] font-bold ${tone === "good" ? "text-[color:var(--v2-good)]" : "text-[color:var(--v2-attention)]"}`}>{title}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">
            <span className="shrink-0 font-bold">{i + 1}.</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 말로 답하기 — 음성 인식(Web Speech API) + 마이크 소리 크기 + 듣는 시간 + 말 빠르기/군말. 한 문항 연습·10분 세트가 함께 쓴다.
export type Dictation = ReturnType<typeof useDictation>;
export function useDictation({ onStart, onFinal }: { onStart?: () => void; onFinal: (text: string) => void }) {
  const t = usePlatformT();
  const [listening, setListening] = useState(false);
  const [speech, setSpeech] = useState<{ ms: number; chars: number; fillers: number } | null>(null);
  const [interim, setInterim] = useState(""); // 아직 확정 안 된, 지금 말하는 중인 글
  const [level, setLevel] = useState(0); // 마이크 소리 크기 0~1
  const [heard, setHeard] = useState(0); // 들은 시간(초)
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const speechStart = useRef(0);
  const spoken = useRef("");
  const Rec = getRecognition();
  const onFinalRef = useRef(onFinal);
  const onStartRef = useRef(onStart);
  useEffect(() => {
    onFinalRef.current = onFinal;
    onStartRef.current = onStart;
  });
  useEffect(() => () => recRef.current?.stop(), []);
  // 마이크 소리 크기 — 말하는 동안 막대가 움직여 '듣고 있다'는 걸 바로 알 수 있게(인식 결과는 몇 초 늦게 온다).
  const meterStop = useRef<(() => void) | null>(null);
  const startMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      let raf = 0;
      let last = 0;
      const tick = (ts: number) => {
        if (ts - last > 80) {
          analyser.getByteTimeDomainData(buf);
          let peak = 0;
          for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
          setLevel(Math.min(1, peak / 64));
          last = ts;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      meterStop.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((tr) => tr.stop());
        void ctx.close();
        setLevel(0);
      };
    } catch {
      /* 막대만 못 보여 줄 뿐 — 인식은 따로 돈다 */
    }
  };
  useEffect(() => () => meterStop.current?.(), []);
  // 듣는 시간(초)
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => setHeard((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [listening]);

  const toggle = () => {
    if (!Rec) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    onStartRef.current?.();
    setMicError(null);
    setInterim("");
    setHeard(0);
    const rec = new Rec();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true; // 말하는 중에도 글자가 바로 보이게
    spoken.current = "";
    speechStart.current = Date.now();
    rec.onresult = (e) => {
      let add = "";
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) add += e.results[i][0].transcript;
        else live += e.results[i][0].transcript;
      }
      setInterim(live.trim());
      if (add.trim()) {
        spoken.current += ` ${add.trim()}`;
        onFinalRef.current(add.trim());
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setMicError(t("마이크를 쓸 수 없어요. 브라우저 주소창의 마이크 권한을 허용해 주세요.", "Microphone blocked — allow mic access in your browser.", "无法使用麦克风，请在浏览器中允许麦克风权限。", "Micro bị chặn — hãy cho phép trong trình duyệt.", "マイクが使えません。ブラウザでマイクを許可してください。", "Mikrofon diblokir — izinkan di browser."));
      else if (e.error === "no-speech") setMicError(t("목소리가 들리지 않아요. 마이크 가까이에서 다시 말해 보세요.", "We couldn't hear you — try again closer to the mic.", "没有听到声音，请靠近麦克风再试。", "Không nghe thấy — hãy nói gần micro hơn.", "声が聞こえません。マイクの近くでもう一度。", "Suara tidak terdengar — coba lebih dekat ke mikrofon."));
      else if (e.error !== "aborted") setMicError(t("음성 인식이 멈췄어요. 다시 눌러 주세요.", "Voice input stopped — tap again.", "语音识别已停止，请再点一次。", "Nhận giọng nói đã dừng — chạm lại.", "音声認識が止まりました。もう一度押してください。", "Input suara berhenti — ketuk lagi."));
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      meterStop.current?.();
      meterStop.current = null;
      const text = spoken.current.trim();
      if (text) setSpeech({ ms: Date.now() - speechStart.current, chars: text.replace(/\s+/g, "").length, fillers: (text.match(FILLERS) ?? []).length });
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
    void startMeter();
  };

  const stop = () => recRef.current?.stop();
  const reset = () => setSpeech(null);
  return { supported: !!Rec, listening, interim, level, heard, micError, speech, toggle, stop, reset };
}

export function DictationControls({ t, dict, disabled, right }: { t: PlatformT; dict: Dictation; disabled?: boolean; right?: React.ReactNode }) {
  const { supported, listening, interim, level, heard, micError, speech, toggle } = dict;
  const toggleMic = toggle;
  const Rec = supported;
  return (
    <>
          <div className="mt-3 flex items-center justify-between gap-3">
            {Rec ? (
              <button type="button" onClick={toggleMic} disabled={disabled} className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[14px] font-semibold transition disabled:opacity-40 ${listening ? "bg-[color:var(--v2-attention)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-2)] hover:bg-[color:var(--v2-line)]"}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
                {listening ? t("듣는 중… 누르면 멈춰요", "Listening… tap to stop", "正在听…点击停止", "Đang nghe… chạm để dừng", "聞いています…押すと停止", "Mendengar… ketuk untuk berhenti") : t("말로 답하기", "Answer by voice", "语音作答", "Trả lời bằng giọng", "声で答える", "Jawab dengan suara")}
              </button>
            ) : (
              <span />
            )}
            {right}
          </div>
          {listening ? (
            <div className="mt-3 rounded-2xl bg-[#fdeced] p-4" aria-live="polite">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--v2-attention)] opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[color:var(--v2-attention)]" />
                </span>
                <span className="text-[14px] font-bold text-[color:var(--v2-attention)]">{t("듣고 있어요", "Listening", "正在听", "Đang nghe", "聞いています", "Mendengarkan")}</span>
                <span className="text-[13px] tabular-nums text-[color:var(--v2-muted)]">{`${Math.floor(heard / 60)}:${String(heard % 60).padStart(2, "0")}`}</span>
                {/* 소리 크기 막대 — 말하면 움직인다 */}
                <span className="ml-auto flex h-5 items-end gap-0.5" aria-hidden>
                  {[0.2, 0.45, 0.7, 1, 0.7, 0.45, 0.2].map((w, i) => (
                    <span key={i} className="w-1 rounded-full bg-[color:var(--v2-attention)] transition-[height] duration-75" style={{ height: `${Math.max(3, Math.round(20 * Math.min(1, level * 1.6) * w))}px` }} />
                  ))}
                </span>
              </div>
              <p className="mt-2 min-h-[22px] text-[15px] leading-[1.55] text-[color:var(--v2-ink-3)]">{interim || t("말해 보세요. 들은 말이 여기 바로 보여요.", "Start speaking — your words appear here.", "开始说吧，听到的内容会显示在这里。", "Hãy nói — lời bạn sẽ hiện ở đây.", "話してみてください。ここにすぐ表示されます。", "Mulai bicara — kata-katamu muncul di sini.")}</p>
            </div>
          ) : null}
          {micError ? <p className="mt-2 text-[14px] text-[color:var(--v2-attention)]">{micError}</p> : null}
          {speech ? (
            <p className="mt-2 text-[13px] text-[color:var(--v2-muted)]">
              {t(
                `말 빠르기 분당 ${Math.round(speech.chars / Math.max(speech.ms / 60000, 0.1))}자 · 군말 ${speech.fillers}번`,
                `${Math.round(speech.chars / Math.max(speech.ms / 60000, 0.1))} chars/min · ${speech.fillers} fillers`,
                `语速每分钟 ${Math.round(speech.chars / Math.max(speech.ms / 60000, 0.1))} 字 · 口头禅 ${speech.fillers} 次`,
                `${Math.round(speech.chars / Math.max(speech.ms / 60000, 0.1))} ký tự/phút · ${speech.fillers} từ đệm`,
                `話す速さ 毎分${Math.round(speech.chars / Math.max(speech.ms / 60000, 0.1))}字・口癖${speech.fillers}回`,
                `${Math.round(speech.chars / Math.max(speech.ms / 60000, 0.1))} karakter/menit · ${speech.fillers} kata pengisi`
              )}
            </p>
          ) : null}
    </>
  );
}
