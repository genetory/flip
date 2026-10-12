"use client";

// v2 한 문항 연습 시트 — 오늘의 질문·다시 볼 답·면접 후기 질문이 함께 쓴다.
// 답하기(글 또는 말로) → AI 피드백(단계·잘한 점·고칠 점·꼬리 질문) → 내 연습 기록(self-mock)에 저장.
// 실전 모드: 60초 안에 답하기. '잘해요'를 받으면 익명 예시로 공개할지 묻고, 내 답을 낸 뒤에만 다른 사람의 잘 쓴 답을 보여 준다.
import { useEffect, useRef, useState } from "react";
import { Sheet } from "./sheets";
import { Button, Spinner, Switch } from "./ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { aiInterviewFeedback, getAnswerExamples, shareAnswerExample, type InterviewFeedback } from "../../lib/member-profile-client";
import { useResumeDoc } from "../../lib/talent/resume-doc";
import { useBasicInfo } from "../../lib/talent/basic-info";
import { saveSelfMockAnswer } from "../../lib/talent/self-mock";
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

// 말로 답하기 — 브라우저 음성 인식(Web Speech API). 지원하지 않는 브라우저에선 버튼을 숨긴다.
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null };
function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
const FILLERS = /(^|\s)(음+|어+|그+|저기|뭐랄까|약간|좀)(?=\s|$|[,.])/g;

export function PracticeSheet({ question, onClose, onSaved }: { question: PracticeQuestion; onClose: () => void; onSaved?: () => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const resume = useResumeDoc();
  const info = useBasicInfo();
  const [answer, setAnswer] = useState("");
  const [timed, setTimed] = useState(false);
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [shared, setShared] = useState<"idle" | "saving" | "done">("idle");
  const [examples, setExamples] = useState<{ id: string; answer: string; score: number }[] | null>(null);
  const [listening, setListening] = useState(false);
  const [speech, setSpeech] = useState<{ ms: number; chars: number; fillers: number } | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const speechStart = useRef(0);
  const spoken = useRef("");
  const Rec = getRecognition();
  const timeUp = timed && running && left <= 0;

  // 실전 모드 타이머 — 첫 글자를 쓰거나 말하기를 누르면 시작.
  useEffect(() => {
    if (!timed || !running || left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timed, running, left]);
  useEffect(() => () => recRef.current?.stop(), []);

  const begin = () => {
    if (timed && !running) setRunning(true);
  };
  const toggleMic = () => {
    if (!Rec) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    begin();
    const rec = new Rec();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = false;
    spoken.current = "";
    speechStart.current = Date.now();
    rec.onresult = (e) => {
      let add = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) add += e.results[i][0].transcript;
      if (add.trim()) {
        spoken.current += ` ${add.trim()}`;
        setAnswer((a) => (a.trim() ? `${a.trim()} ${add.trim()}` : add.trim()));
      }
    };
    rec.onend = () => {
      setListening(false);
      const text = spoken.current.trim();
      if (text) setSpeech({ ms: Date.now() - speechStart.current, chars: text.replace(/\s+/g, "").length, fillers: (text.match(FILLERS) ?? []).length });
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const submit = async () => {
    const a = answer.trim();
    if (a.length < 10) {
      setError(t("조금 더 길게 답해 주세요.", "Please write a bit more.", "请再多写一点。", "Hãy viết thêm một chút.", "もう少し書いてください。", "Tulis sedikit lebih panjang."));
      return;
    }
    recRef.current?.stop();
    setBusy(true);
    setError(null);
    try {
      const fb = await aiInterviewFeedback({ question: question.ko, answer: a, resumeText: resumeToText(resume, info) || undefined, desiredJobRole: resume?.targetRole || undefined, locale });
      setFeedback(fb);
      saveSelfMockAnswer({ question: question.ko, category: question.category, answer: a, score: fb.score, feedback: { score: fb.score, strengths: fb.strengths, improvements: fb.improvements, sampleAnswer: fb.sampleAnswer } });
      onSaved?.();
      getAnswerExamples(question.ko)
        .then(setExamples)
        .catch(() => setExamples([]));
    } catch {
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
      title={t("한 문항 연습", "Practice one question", "单题练习", "Luyện một câu", "1問練習", "Latihan satu soal")}
      onClose={onClose}
      footer={
        feedback ? (
          <Button full onClick={onClose}>
            {t("완료", "Done", "完成", "Xong", "完了", "Selesai")}
          </Button>
        ) : (
          <Button full onClick={() => void submit()} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? t("AI가 읽고 있어요", "AI is reading…", "AI 正在阅读", "AI đang đọc…", "AIが読んでいます", "AI membaca…") : t("AI 피드백 받기", "Get AI feedback", "获取 AI 反馈", "Nhận phản hồi AI", "AIフィードバック", "Dapatkan umpan balik AI")}
          </Button>
        )
      }
    >
      <p className="text-[19px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{question.shown}</p>
      {locale !== "ko" && question.shown !== question.ko ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {question.ko}</p> : null}

      {!feedback ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Switch on={timed} onChange={(v) => { setTimed(v); setRunning(false); setLeft(60); }} label={t("실전 모드 · 60초", "Real mode · 60s", "实战模式 · 60秒", "Thực chiến · 60s", "本番モード・60秒", "Mode nyata · 60 dtk")} />
            {timed ? <span className={`text-[15px] font-bold tabular-nums ${left <= 10 ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-ink-2)]"}`}>{running ? `0:${String(Math.max(0, left)).padStart(2, "0")}` : t("쓰기 시작하면 재요", "Starts when you begin", "开始作答即计时", "Bắt đầu khi bạn viết", "書き始めると計測", "Mulai saat menulis")}</span> : null}
          </div>
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
          <div className="mt-3 flex items-center justify-between gap-3">
            {Rec ? (
              <button type="button" onClick={toggleMic} disabled={timeUp} className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[14px] font-semibold transition disabled:opacity-40 ${listening ? "bg-[color:var(--v2-attention)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-2)] hover:bg-[color:var(--v2-line)]"}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
                {listening ? t("듣는 중… 누르면 멈춰요", "Listening… tap to stop", "正在听…点击停止", "Đang nghe… chạm để dừng", "聞いています…押すと停止", "Mendengar… ketuk untuk berhenti") : t("말로 답하기", "Answer by voice", "语音作答", "Trả lời bằng giọng", "声で答える", "Jawab dengan suara")}
              </button>
            ) : (
              <span />
            )}
            <span className="text-[13px] tabular-nums text-[color:var(--v2-faint)]">{answer.trim().length}{t("자", " chars", "字", " ký tự", "字", " karakter")}</span>
          </div>
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
          {error ? <p className="mt-2 text-[14px] text-[color:var(--v2-attention)]">{error}</p> : null}
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t("내 답", "Your answer", "我的回答", "Câu trả lời", "あなたの回答", "Jawabanmu")}</p>
              <LevelChip t={t} score={feedback.score} />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.65] text-[color:var(--v2-ink-3)]">{answer.trim()}</p>
          </div>
          {feedback.strengths.length ? (
            <div>
              <p className="text-[14px] font-bold text-[color:var(--v2-good)]">{t("잘한 점", "What worked", "优点", "Điểm tốt", "良い点", "Yang bagus")}</p>
              <ul className="mt-1 flex flex-col gap-1 text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">
                {feedback.strengths.slice(0, 3).map((x, i) => (
                  <li key={i}>· {x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {feedback.improvements.length ? (
            <div>
              <p className="text-[14px] font-bold text-[color:var(--v2-attention)]">{t("고칠 점", "To improve", "改进点", "Cần sửa", "直す点", "Perbaiki")}</p>
              <ul className="mt-1 flex flex-col gap-1 text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">
                {feedback.improvements.slice(0, 3).map((x, i) => (
                  <li key={i}>· {x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {feedback.followUp ? (
            <div className="rounded-2xl bg-[color:var(--v2-accent-weak)] p-4">
              <p className="text-[13px] font-bold text-[color:var(--v2-accent)]">{t("면접관이 이어서 물을 질문", "Likely follow-up", "面试官可能追问", "Câu hỏi nối tiếp", "想定される追加質問", "Pertanyaan lanjutan")}</p>
              <p className="mt-1 text-[15px] font-semibold leading-[1.55] text-[color:var(--v2-ink)]">{feedback.followUp}</p>
            </div>
          ) : null}
          {feedback.score >= 80 ? (
            <div className="rounded-2xl border border-[color:var(--v2-line)] p-4">
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
