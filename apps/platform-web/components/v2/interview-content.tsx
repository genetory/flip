"use client";

// v2 모의 면접 연습 도구 — 10분 모의 면접 세트 · 1분 자기소개 만들기 · 한국 면접 매너 퀴즈.
// 목록 줄만 이어지면 심심해서, 도구마다 색·모양이 다른 타일로 연다(PracticeTools).
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "./sheets";
import { Button, Spinner } from "./ui";
import { DictationControls, LevelChip, PracticeSheet, SpeakButton, useDictation, useSpeak } from "./practice";
import { docsReady } from "./lib";
import { useCoverDoc } from "../../lib/talent/cover-doc";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT } from "../../lib/i18n";
import { isInterviewPaywallError, openInterviewPaywall, setInterviewCreditBalance, useInterviewCredits } from "../../lib/interview-credits";
import { CreditLine } from "./interview-paywall";
import { addMyFavoritePosition, aiInterviewFeedback, getPublicPositionById, importJob, type ImportedJobDraft, type InterviewFeedback, type PublicPositionListItem } from "../../lib/member-profile-client";
import { addImportedJob, importedToPosition } from "../../lib/talent/imported-jobs";
import { draftResumeText } from "../../lib/resume-maker-client";
import { useResumeDoc } from "../../lib/talent/resume-doc";
import { useBasicInfo } from "../../lib/talent/basic-info";
import { markInterviewSetCompleted, saveSelfMockAnswer, useSelfMock } from "../../lib/talent/self-mock";
import { mockCategoryLabelOf } from "../../lib/talent/career-labels";
import { DAILY_QUESTIONS, kstDay, pickDailyQuiz, pickInterviewSet, questionText, type DailyQuestion } from "../../lib/talent/interview-daily";
import { resumeToText } from "../talent/jobs/MockInterviewModal";

const INTRO_Q = DAILY_QUESTIONS[0];

// ── 10분 모의 면접 세트 ─────────────────────────────────
type SetAnswer = { q: DailyQuestion; answer: string; ms: number };

export function InterviewSetSheet({ onClose }: { onClose: () => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const resume = useResumeDoc();
  const info = useBasicInfo();
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const questions = useMemo(() => pickInterviewSet(seed), [seed]);
  const [step, setStep] = useState<"intro" | number | "grading" | "result">("intro");
  const [answers, setAnswers] = useState<SetAnswer[]>([]);
  const [draft, setDraft] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [results, setResults] = useState<(InterviewFeedback | null)[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const dict = useDictation({ onFinal: (add) => setDraft((a) => (a.trim() ? `${a.trim()} ${add}` : add)) });

  const idx = typeof step === "number" ? step : -1;
  useEffect(() => {
    if (idx < 0) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 500);
    return () => window.clearInterval(id);
  }, [idx, startedAt]);

  const credits = useInterviewCredits();
  // 실전 모드 — 질문이 바뀔 때마다 면접관처럼 소리로 읽어 준다(끌 수 있다).
  const tts = useSpeak();
  const [voice, setVoice] = useState(true);
  const { speak } = tts; // speak 는 고정 — tts 객체는 재생 상태가 바뀔 때마다 새로 만들어진다
  useEffect(() => {
    if (typeof step === "number" && voice && questions[step]) speak(questions[step].ko);
  }, [step, voice, questions, speak]);
  const begin = () => {
    // 유료화가 켜져 있고 이용권이 질문 수보다 적으면 먼저 충전부터.
    if (credits?.paywall && credits.credits < questions.length) {
      openInterviewPaywall();
      return;
    }
    setStep(0);
    setStartedAt(Date.now());
    setElapsed(0);
  };
  const grade = async (all: SetAnswer[]) => {
    setStep("grading");
    const resumeText = resumeToText(resume, info) || undefined;
    const settled = await Promise.allSettled(
      all.map((a) => (a.answer.trim().length >= 10 ? aiInterviewFeedback({ question: a.q.ko, answer: a.answer.trim(), resumeText, desiredJobRole: resume?.targetRole || undefined, locale }) : Promise.reject(new Error("empty"))))
    );
    const fb = settled.map((r) => (r.status === "fulfilled" ? r.value : null));
    const last = [...fb].reverse().find((f) => typeof f?.credits === "number");
    setInterviewCreditBalance(last?.credits);
    // 이용권이 모자라 평가 못 한 답이 있으면 결제 창을 연다.
    if (settled.some((r) => r.status === "rejected" && isInterviewPaywallError(r.reason))) openInterviewPaywall();
    // 오늘 AI 이용 한도에 걸려 평가 못 한 답이 있으면 결과 카드에서 알려 준다.
    setLimitHit(settled.some((r) => r.status === "rejected" && (r.reason as { status?: number })?.status === 429));
    fb.forEach((f, i) => {
      if (f) saveSelfMockAnswer({ question: all[i].q.ko, category: all[i].q.category, answer: all[i].answer.trim(), score: f.score, feedback: { score: f.score, strengths: f.strengths, improvements: f.improvements, sampleAnswer: f.sampleAnswer } });
    });
    setResults(fb);
    markInterviewSetCompleted();
    setStep("result");
  };
  const next = () => {
    dict.stop();
    const all = [...answers, { q: questions[idx], answer: draft, ms: Date.now() - startedAt }];
    setAnswers(all);
    setDraft("");
    dict.reset();
    if (idx + 1 < questions.length) {
      setStep(idx + 1);
      setStartedAt(Date.now());
      setElapsed(0);
    } else void grade(all);
  };

  const sec = Math.floor(elapsed / 1000);
  const scored = results.filter((r): r is InterviewFeedback => !!r);
  const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : null;
  const totalSec = Math.round(answers.reduce((s, a) => s + a.ms, 0) / 1000);
  const best = scored.length ? results.indexOf(scored.reduce((a, b) => (b.score > a.score ? b : a))) : -1;
  const worst = scored.length ? results.indexOf(scored.reduce((a, b) => (b.score < a.score ? b : a))) : -1;

  return (
    <Sheet
      tall
      title={t("10분 모의 면접", "10-minute mock interview", "10分钟模拟面试", "Phỏng vấn thử 10 phút", "10分模擬面接", "Simulasi 10 menit")}
      onClose={onClose}
      footer={
        step === "intro" ? (
          <Button full onClick={begin}>
            {t("면접 시작", "Start interview", "开始面试", "Bắt đầu", "面接開始", "Mulai")}
          </Button>
        ) : typeof step === "number" ? (
          <Button full onClick={next} disabled={draft.trim().length < 10}>
            {idx + 1 < questions.length ? t("다음 질문", "Next question", "下一题", "Câu tiếp", "次の質問", "Berikutnya") : t("면접 마치기", "Finish", "结束面试", "Kết thúc", "面接を終える", "Selesai")}
          </Button>
        ) : step === "result" ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="neutral" full onClick={() => { setAnswers([]); setResults([]); setOpen(null); setStep("intro"); }}>
              {t("다시 보기", "Try again", "再来一次", "Làm lại", "もう一度", "Ulangi")}
            </Button>
            <Button full onClick={onClose}>
              {t("완료", "Done", "完成", "Xong", "完了", "Selesai")}
            </Button>
          </div>
        ) : undefined
      }
    >
      {step === "intro" ? (
        <div>
          <div className="rounded-3xl bg-[#fff0f3] p-6 text-[color:var(--v2-ink)]">
            <p className="text-[13px] font-bold text-[#e5484d]">{t("실제 면접 순서 그대로", "Same order as a real interview", "与真实面试顺序相同", "Đúng thứ tự phỏng vấn thật", "本番と同じ順番", "Urutan seperti wawancara nyata")}</p>
            <p className="mt-1 text-[22px] font-bold leading-[1.35]">{t("5문항 · 약 10분", "5 questions · ~10 min", "5题 · 约10分钟", "5 câu · ~10 phút", "5問・約10分", "5 soal · ~10 menit")}</p>
            <ol className="mt-4 flex flex-col gap-2">
              {questions.map((q, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14px] text-[color:var(--v2-ink-2)]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#e5484d]">{i + 1}</span>
                  {i === questions.length - 1 ? t("마지막 한마디", "Closing words", "最后陈述", "Lời kết", "最後の一言", "Penutup") : mockCategoryLabelOf(t, q.category)}
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-4 text-[14px] leading-[1.65] text-[color:var(--v2-muted)]">{t("질문마다 바로 피드백을 주지 않아요. 실제 면접처럼 끝까지 답하면, 마지막에 5개 답을 한 번에 평가해 결과 카드로 보여 드려요. 질문당 2분 안쪽이 좋아요.", "No feedback in between — like a real interview. At the end, all 5 answers are rated together in a report card. Aim for under 2 min each.", "中途不给反馈，像真实面试一样答完，最后一次性评估5个回答并给出结果卡。每题2分钟以内为宜。", "Không có phản hồi giữa chừng. Cuối cùng 5 câu được chấm cùng lúc thành thẻ kết quả. Mỗi câu dưới 2 phút.", "途中でフィードバックはありません。最後に5つの回答をまとめて評価し結果カードに。1問2分以内が目安。", "Tanpa umpan balik di tengah. Di akhir, 5 jawaban dinilai bersama. Usahakan < 2 menit per soal.")}</p>
        </div>
      ) : typeof step === "number" ? (
        <div>
          {/* 진행 막대 */}
          <div className="flex gap-1.5" aria-hidden>
            {questions.map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-[color:var(--v2-accent)]" : i === idx ? "bg-[color:var(--v2-accent)] opacity-50" : "bg-[color:var(--v2-band)]"}`} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[color:var(--v2-accent)]">
              Q{idx + 1} · {idx === questions.length - 1 ? t("마지막 한마디", "Closing words", "最后陈述", "Lời kết", "最後の一言", "Penutup") : mockCategoryLabelOf(t, questions[idx].category)}
            </span>
            <span className={`text-[15px] font-bold tabular-nums ${sec >= 120 ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-ink-3)]"}`}>{`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`}</span>
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <p className="text-[21px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{questionText(t, questions[idx])}</p>
            <SpeakButton t={t} tts={tts} text={questions[idx].ko} />
          </div>
          <button type="button" onClick={() => setVoice((v) => !v)} aria-pressed={voice} className="mt-2 text-[13px] font-semibold text-[color:var(--v2-faint)]">
            {voice ? t("🔊 질문을 소리로 읽어 줘요 · 끄기", "🔊 Reading questions aloud · Turn off", "🔊 朗读问题中 · 关闭", "🔊 Đang đọc câu hỏi · Tắt", "🔊 質問を読み上げ中 · オフ", "🔊 Membacakan · Matikan") : t("🔇 소리로 듣기 켜기", "🔇 Turn on read-aloud", "🔇 开启朗读", "🔇 Bật đọc", "🔇 読み上げをオン", "🔇 Nyalakan")}
          </button>
          {locale !== "ko" ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {questions[idx].ko}</p> : null}
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={7} autoFocus placeholder={t("면접관에게 말하듯 답해 보세요.", "Answer as if speaking to the interviewer.", "像对面试官说话一样回答。", "Trả lời như đang nói với người phỏng vấn.", "面接官に話すように答えてみましょう。", "Jawab seperti berbicara ke pewawancara.")} className="mt-4 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[16px] leading-[1.65] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2" />
          <DictationControls t={t} dict={dict} right={<span className="text-[13px] tabular-nums text-[color:var(--v2-faint)]">{draft.trim().length}{t("자", " chars", "字", " ký tự", "字", " karakter")}</span>} />
        </div>
      ) : step === "grading" ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Spinner className="h-8 w-8 text-[color:var(--v2-accent)]" />
          <p className="mt-4 text-[17px] font-bold text-[color:var(--v2-ink)]">{t("5개 답을 읽고 있어요", "Reading your 5 answers", "正在阅读你的5个回答", "Đang đọc 5 câu trả lời", "5つの回答を読んでいます", "Membaca 5 jawabanmu")}</p>
          <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">{t("20초쯤 걸려요", "About 20 seconds", "大约需要20秒", "Khoảng 20 giây", "20秒ほどかかります", "Sekitar 20 detik")}</p>
        </div>
      ) : (
        <div>
          {/* 결과 카드 */}
          <div className="relative overflow-hidden rounded-3xl bg-[#fff0f3] p-6 text-[color:var(--v2-ink)]">
            <p className="relative text-[13px] font-bold text-[#e5484d]">{t("모의 면접 결과", "Mock interview result", "模拟面试结果", "Kết quả phỏng vấn thử", "模擬面接の結果", "Hasil simulasi")}</p>
            <p className="relative mt-1 text-[26px] font-bold">
              {avg == null ? "—" : avg >= 80 ? t("잘 해냈어요 🎉", "Well done 🎉", "表现很好 🎉", "Làm tốt lắm 🎉", "よくできました 🎉", "Bagus sekali 🎉") : avg >= 70 ? t("괜찮았어요 👍", "Not bad 👍", "还不错 👍", "Khá ổn 👍", "まずまず 👍", "Lumayan 👍") : t("조금 더 연습해요 💪", "Keep practicing 💪", "再多练练 💪", "Luyện thêm nhé 💪", "もう少し練習 💪", "Latih lagi 💪")}
            </p>
            <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label={t("답한 질문", "Answered", "已回答", "Đã trả lời", "回答数", "Dijawab")} value={`${scored.length}/${questions.length}`} />
              <Stat label={t("걸린 시간", "Time", "用时", "Thời gian", "所要時間", "Waktu")} value={`${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, "0")}`} />
              <Stat label={t("잘한 답", "Strong", "优秀回答", "Câu tốt", "良い回答", "Bagus")} value={`${scored.filter((r) => r.score >= 80).length}`} />
            </div>
          </div>
          {limitHit ? <p className="mt-3 rounded-2xl bg-[#fff4e8] px-4 py-3 text-[14px] leading-[1.55] text-[#c2410c]">{t("오늘 AI 이용 한도에 도달해서 일부 답은 평가하지 못했어요. 답은 그대로 남아 있으니 내일 다시 받아 보세요.", "Today's AI limit was reached, so some answers weren't rated. Try again tomorrow.", "今天的 AI 使用已达上限，部分回答未能评估，明天再试。", "Đã hết lượt AI hôm nay nên một số câu chưa được chấm. Thử lại ngày mai.", "本日のAI上限に達したため一部未評価です。明日また。", "Batas AI hari ini tercapai, sebagian jawaban belum dinilai.")}</p> : null}
          <ol className="mt-4 flex flex-col gap-2">
            {answers.map((a, i) => {
              const r = results[i];
              const expanded = open === i;
              return (
                <li key={i} className={`rounded-2xl p-4 ${i === best && best !== worst ? "bg-[#effaf4]" : i === worst && best !== worst ? "bg-[#fdf2f3]" : "bg-[color:var(--v2-fill)]"}`}>
                  <button type="button" onClick={() => setOpen(expanded ? null : i)} className="flex w-full items-start gap-3 text-left">
                    <span className="mt-0.5 text-[13px] font-bold text-[color:var(--v2-muted)]">Q{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink)]">{questionText(t, a.q)}</span>
                      {r ? <span className="mt-1 block text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{r.score >= 80 ? r.strengths[0] : r.improvements[0]}</span> : <span className="mt-1 block text-[13px] text-[color:var(--v2-faint)]">{t("평가하지 못했어요", "Couldn't rate", "未能评估", "Không chấm được", "評価できませんでした", "Tidak dinilai")}</span>}
                      {i === best && best !== worst ? <span className="mt-1.5 inline-block text-[12px] font-bold text-[color:var(--v2-good)]">👑 {t("가장 잘한 답", "Best answer", "最佳回答", "Câu tốt nhất", "ベスト回答", "Jawaban terbaik")}</span> : i === worst && best !== worst ? <span className="mt-1.5 inline-block text-[12px] font-bold text-[color:var(--v2-attention)]">🔁 {t("다시 해 볼 답", "Try this again", "再练这题", "Luyện lại câu này", "やり直したい回答", "Ulangi ini")}</span> : null}
                    </span>
                    {r ? <LevelChip t={t} score={r.score} /> : null}
                  </button>
                  {expanded && r ? (
                    <div className="mt-3 border-t border-[color:var(--v2-line)] pt-3 text-[14px] leading-[1.6]">
                      <p className="whitespace-pre-wrap text-[color:var(--v2-ink-3)]">{a.answer.trim()}</p>
                      {r.improvements.length ? <p className="mt-2 text-[color:var(--v2-attention)]"><b>{t("고칠 점", "Fix", "改进", "Cần sửa", "直す点", "Perbaiki")}</b> · {r.improvements.slice(0, 2).join(" / ")}</p> : null}
                      {r.sampleAnswer?.trim() ? (
                        <div className="mt-2 rounded-xl bg-white p-3">
                          <p className="text-[12px] font-bold text-[color:var(--v2-muted)]">{t("이렇게 바꿔 보면", "Try it like this", "试试这样改", "Thử viết thế này", "こう直すと", "Coba seperti ini")}</p>
                          <p className="mt-1 whitespace-pre-wrap text-[color:var(--v2-ink-2)]">{r.sampleAnswer.trim()}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3">
      <p className="text-[19px] font-bold tabular-nums text-[color:var(--v2-ink)]">{value}</p>
      <p className="mt-0.5 text-[12px] text-[color:var(--v2-muted)]">{label}</p>
    </div>
  );
}

// ── 1분 자기소개 만들기 ─────────────────────────────────
// 초안(이력서로 AI) → 다듬기(글자 수·예상 시간) → 소리 내어 연습(60초 프롬프터) → 저장 / AI 피드백.
export function SelfIntroSheet({ onClose }: { onClose: () => void }) {
  const t = usePlatformT();
  const resume = useResumeDoc();
  const selfMock = useSelfMock();
  const saved = (selfMock?.answers ?? []).find((a) => a.question === INTRO_Q.ko);
  const [text, setText] = useState(saved?.answer ?? "");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rehearse, setRehearse] = useState(false);
  const [left, setLeft] = useState(60);
  const [savedMsg, setSavedMsg] = useState(false);
  const [feedback, setFeedback] = useState(false);

  const chars = text.replace(/\s+/g, "").length;
  const secs = Math.round(chars / 5.2); // 한국어 말하기 대략 초당 5자
  const fit = secs < 40 ? { text: t("조금 짧아요", "A bit short", "有点短", "Hơi ngắn", "少し短い", "Agak pendek"), cls: "bg-[#fff4e8] text-[#e8590c]" } : secs > 75 ? { text: t("조금 길어요", "A bit long", "有点长", "Hơi dài", "少し長い", "Agak panjang"), cls: "bg-[#fdeced] text-[color:var(--v2-attention)]" } : { text: t("딱 좋아요", "Just right", "刚刚好", "Vừa đẹp", "ちょうどいい", "Pas"), cls: "bg-[#e5f6ee] text-[color:var(--v2-good)]" };

  useEffect(() => {
    if (!rehearse || left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [rehearse, left]);

  const draft = async () => {
    setDrafting(true);
    setError(null);
    try {
      const facts = [resume?.targetRole ? `희망 직무: ${resume.targetRole}` : "", resume?.summary ? `요약: ${resume.summary}` : "", ...(resume?.items ?? []).filter((i) => i.section === "experience" || i.section === "project").slice(0, 2).map((i) => `${i.company ?? ""} ${i.text}`.trim())].filter(Boolean).join(" / ").slice(0, 380);
      const out = await draftResumeText({ currentText: "", fieldType: "selfIntroduction", mode: "generate", hints: `면접에서 말하는 1분 자기소개(300자 안팎, 합니다체). 인사와 이름 → 핵심 경험 하나(숫자) → 강점 → 지원 동기 한 줄. ${facts}`.slice(0, 500) });
      setText(out);
    } catch {
      setError(t("초안을 만들지 못했어요. 이력서를 조금 더 채운 뒤 다시 해 보세요.", "Couldn't draft — fill in more of your resume and retry.", "未能生成初稿，请多完善简历后再试。", "Không tạo được bản nháp — hãy bổ sung CV rồi thử lại.", "下書きを作れませんでした。履歴書をもう少し埋めてから再試行。", "Gagal membuat draf — lengkapi CV lalu coba lagi."));
    } finally {
      setDrafting(false);
    }
  };
  const save = () => {
    saveSelfMockAnswer({ question: INTRO_Q.ko, category: "intro", answer: text.trim(), score: saved?.score ?? null, feedback: saved?.feedback ?? null });
    setSavedMsg(true);
    window.setTimeout(() => setSavedMsg(false), 1800);
  };

  if (feedback) return <PracticeSheet question={{ ko: INTRO_Q.ko, shown: questionText(t, INTRO_Q), category: "intro" }} initialAnswer={text.trim()} onClose={onClose} />;

  return (
    <Sheet
      tall
      title={t("1분 자기소개", "1-minute self-intro", "1分钟自我介绍", "Tự giới thiệu 1 phút", "1分自己紹介", "Perkenalan 1 menit")}
      onClose={onClose}
      footer={
        rehearse ? (
          <Button full onClick={() => setRehearse(false)}>
            {t("연습 끝내기", "Stop rehearsing", "结束练习", "Dừng tập", "練習を終える", "Selesai latihan")}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="neutral" full onClick={save} disabled={!text.trim()}>
              {savedMsg ? t("저장했어요 ✓", "Saved ✓", "已保存 ✓", "Đã lưu ✓", "保存しました ✓", "Tersimpan ✓") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
            </Button>
            <Button full onClick={() => setFeedback(true)} disabled={text.trim().length < 30}>
              {t("AI 피드백 받기", "Get AI feedback", "获取 AI 反馈", "Nhận phản hồi AI", "AIフィードバック", "Umpan balik AI")}
            </Button>
          </div>
        )
      }
    >
      {rehearse ? (
        // 프롬프터 — 큰 글씨 + 60초 막대
        <div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--v2-band)]">
            <div className="h-full rounded-full bg-[#e8590c] transition-[width] duration-1000 ease-linear" style={{ width: `${(left / 60) * 100}%` }} />
          </div>
          <p className={`mt-2 text-right text-[15px] font-bold tabular-nums ${left <= 10 ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-ink-3)]"}`}>{left > 0 ? `0:${String(left).padStart(2, "0")}` : t("1분 끝!", "Time!", "1分钟到！", "Hết 1 phút!", "1分経過！", "Waktu habis!")}</p>
          <p className="mt-4 whitespace-pre-wrap text-[22px] font-semibold leading-[1.7] text-[color:var(--v2-ink)]">{text}</p>
          <p className="mt-6 text-[14px] text-[color:var(--v2-muted)]">{t("소리 내어 읽어 보세요. 막대가 끝나기 전에 다 읽으면 딱 좋아요.", "Read it out loud — finishing before the bar ends is perfect.", "大声朗读，在进度条结束前读完最好。", "Đọc to — đọc xong trước khi thanh hết là vừa.", "声に出して読んでみましょう。バーが終わる前に読み終えれば◎。", "Bacakan keras-keras — selesai sebelum bar habis itu pas.")}</p>
        </div>
      ) : (
        <div>
          <div className="rounded-3xl bg-[#fff4e8] p-5">
            <p className="text-[13px] font-bold text-[#e8590c]">{t("좋은 1분 자기소개 순서", "A good 1-min structure", "好的1分钟结构", "Cấu trúc 1 phút tốt", "良い1分の構成", "Struktur 1 menit yang baik")}</p>
            <ol className="mt-2 flex flex-col gap-1 text-[14px] leading-[1.55] text-[color:var(--v2-ink-2)]">
              <li>① {t("인사와 이름", "Greeting & name", "问候和名字", "Chào & tên", "挨拶と名前", "Salam & nama")}</li>
              <li>② {t("핵심 경험 하나 — 숫자로", "One key experience — with numbers", "一个核心经历——用数字", "Một trải nghiệm chính — có số", "核心の経験1つ — 数字で", "Satu pengalaman utama — dengan angka")}</li>
              <li>③ {t("그 경험에서 드러난 강점", "The strength it shows", "体现的优点", "Điểm mạnh thể hiện", "そこに表れた強み", "Kekuatan yang terlihat")}</li>
              <li>④ {t("지원 동기 한 줄", "One line of motivation", "一句话动机", "Một câu động lực", "志望動機を一言", "Satu kalimat motivasi")}</li>
            </ol>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={t("안녕하십니까, ○○○입니다. …", "Hello, I'm ○○○. …", "您好，我是○○○。……", "Xin chào, tôi là ○○○. …", "こんにちは、○○○です。…", "Halo, saya ○○○. …")} className="mt-4 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[16px] leading-[1.7] text-[color:var(--v2-ink)] outline-none ring-[#e8590c] focus:ring-2" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {chars ? <span className={`inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-bold ${fit.cls}`}>{fit.text}</span> : null}
            <span className="text-[13px] text-[color:var(--v2-muted)]">{t(`${chars}자 · 소리 내어 읽으면 약 ${secs}초`, `${chars} chars · ~${secs}s out loud`, `${chars}字 · 朗读约${secs}秒`, `${chars} ký tự · đọc ~${secs}s`, `${chars}字・読むと約${secs}秒`, `${chars} karakter · ~${secs} dtk`)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void draft()} disabled={drafting}>
              {drafting ? <Spinner /> : null}
              {text.trim() ? t("이력서로 다시 쓰기", "Redraft from resume", "用简历重写", "Viết lại từ CV", "履歴書で書き直す", "Tulis ulang dari CV") : t("이력서로 초안 만들기", "Draft from resume", "用简历生成初稿", "Tạo nháp từ CV", "履歴書で下書き", "Draf dari CV")}
            </Button>
            <Button size="sm" variant="neutral" onClick={() => { setLeft(60); setRehearse(true); }} disabled={!text.trim()}>
              ▶ {t("소리 내어 연습", "Rehearse aloud", "朗读练习", "Tập nói", "声に出して練習", "Latihan bersuara")}
            </Button>
          </div>
          {error ? <p className="mt-2 text-[14px] text-[color:var(--v2-attention)]">{error}</p> : null}
        </div>
      )}
    </Sheet>
  );
}

// ── 한국 면접 매너 퀴즈 ─────────────────────────────────
const QUIZ_KEY = "aply.v2.interview.quiz";

export function useQuizResult(): number | null {
  const [v] = useState<number | null>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(QUIZ_KEY) : null;
      const p = raw ? (JSON.parse(raw) as { day: string; correct: number }) : null;
      return p && p.day === kstDay() ? p.correct : null;
    } catch {
      return null;
    }
  });
  return v;
}

export function QuizSheet({ onClose }: { onClose: () => void }) {
  const t = usePlatformT();
  const quiz = useMemo(() => pickDailyQuiz(), []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const L = (arr: readonly string[]) => t(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
  const item = quiz[i];

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === item.answer) setCorrect((c) => c + 1);
  };
  const next = () => {
    if (i + 1 < quiz.length) {
      setI(i + 1);
      setPicked(null);
    } else {
      setDone(true);
      try {
        window.localStorage.setItem(QUIZ_KEY, JSON.stringify({ day: kstDay(), correct }));
      } catch {
        /* 기억만 못 할 뿐 */
      }
    }
  };

  return (
    <Sheet
      tall
      title={t("한국 면접 매너 퀴즈", "Korean interview etiquette", "韩国面试礼仪测验", "Quiz phép lịch sự PV Hàn", "韓国面接マナークイズ", "Kuis etiket wawancara Korea")}
      onClose={onClose}
      footer={
        done ? (
          <Button full onClick={onClose}>
            {t("완료", "Done", "完成", "Xong", "完了", "Selesai")}
          </Button>
        ) : picked !== null ? (
          <Button full onClick={next}>
            {i + 1 < quiz.length ? t("다음 문제", "Next", "下一题", "Câu tiếp", "次の問題", "Berikutnya") : t("결과 보기", "See result", "查看结果", "Xem kết quả", "結果を見る", "Lihat hasil")}
          </Button>
        ) : undefined
      }
    >
      {done ? (
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-[56px] leading-none">{correct === 3 ? "🏆" : correct === 2 ? "🎉" : "💪"}</p>
          <p className="mt-4 text-[22px] font-bold text-[color:var(--v2-ink)]">{t(`3문제 중 ${correct}개 맞혔어요`, `${correct} of 3 correct`, `3题答对${correct}题`, `Đúng ${correct}/3`, `3問中${correct}問正解`, `Benar ${correct} dari 3`)}</p>
          <p className="mt-2 text-[15px] text-[color:var(--v2-muted)]">{t("내일 새 문제가 나와요.", "New questions tomorrow.", "明天有新题。", "Ngày mai có câu mới.", "明日新しい問題が出ます。", "Soal baru besok.")}</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-1.5" aria-hidden>
            {quiz.map((_, k) => (
              <span key={k} className={`h-1.5 flex-1 rounded-full ${k < i ? "bg-[color:var(--v2-good)]" : k === i ? "bg-[color:var(--v2-good)] opacity-50" : "bg-[color:var(--v2-band)]"}`} />
            ))}
          </div>
          <p className="mt-4 text-[13px] font-bold text-[color:var(--v2-good)]">Q{i + 1}</p>
          <p className="mt-1 text-[19px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{L(item.q)}</p>
          <div className="mt-4 flex flex-col gap-2">
            {item.options.map((o, k) => {
              const state = picked === null ? "idle" : k === item.answer ? "right" : k === picked ? "wrong" : "dim";
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => pick(k)}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left text-[15px] leading-[1.5] transition ${
                    state === "right" ? "border-[color:var(--v2-good)] bg-[#effaf4] font-semibold text-[color:var(--v2-ink)]" : state === "wrong" ? "border-[color:var(--v2-attention)] bg-[#fdf2f3] text-[color:var(--v2-ink-2)]" : state === "dim" ? "border-transparent bg-[color:var(--v2-fill)] text-[color:var(--v2-faint)]" : "border-transparent bg-[color:var(--v2-fill)] text-[color:var(--v2-ink-2)] hover:border-[color:var(--v2-line)]"
                  }`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${state === "right" ? "bg-[color:var(--v2-good)] text-white" : state === "wrong" ? "bg-[color:var(--v2-attention)] text-white" : "bg-white text-[color:var(--v2-muted)]"}`}>{state === "right" ? "✓" : state === "wrong" ? "✕" : String.fromCharCode(65 + k)}</span>
                  {L(o)}
                </button>
              );
            })}
          </div>
          {picked !== null ? (
            <div className={`mt-4 rounded-2xl p-4 ${picked === item.answer ? "bg-[#effaf4]" : "bg-[#fff4e8]"}`}>
              <p className={`text-[14px] font-bold ${picked === item.answer ? "text-[color:var(--v2-good)]" : "text-[#e8590c]"}`}>{picked === item.answer ? t("정답이에요!", "Correct!", "答对了！", "Chính xác!", "正解！", "Benar!") : t("아쉬워요", "Not quite", "差一点", "Chưa đúng", "惜しい", "Kurang tepat")}</p>
              <p className="mt-1 text-[14px] leading-[1.65] text-[color:var(--v2-ink-2)]">{L(item.why)}</p>
            </div>
          ) : null}
        </div>
      )}
    </Sheet>
  );
}

// ── 공고 가져오기 ─────────────────────────────────────
// 가고 싶은 회사·다른 서비스의 공고를 링크(또는 공고 글 붙여넣기)로 가져와 그 공고로 모의 면접.
// Aply·원티드(수집된) 공고는 그 공고를 그대로 열고, 그 밖은 정리해서 '가져온 공고'로 계정에 남긴다.
export function ImportJobSheet({ onClose, onStart, initialMode = "url", title, subtitle, ctaLabel }: { onClose: () => void; onStart: (item: PublicPositionListItem) => void; initialMode?: "url" | "text"; title?: string; subtitle?: string; ctaLabel?: string }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [mode, setMode] = useState<"url" | "text">(initialMode);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImportedJobDraft | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await importJob(mode === "url" ? { url: url.trim() } : { text: text.trim() });
      if (r.positionId) {
        const item = await getPublicPositionById(r.positionId, { locale });
        void addMyFavoritePosition(r.positionId).catch(() => {});
        onStart(item);
        return;
      }
      if (r.job) setDraft(r.job);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "PAGE_UNREADABLE") {
        setError(t("이 페이지는 읽을 수 없어요(로그인이 필요하거나 막혀 있어요). 공고 내용을 복사해 '내용 붙여넣기'로 가져와 주세요.", "We couldn't read this page (login or blocked). Copy the posting and use 'Paste text'.", "无法读取此页面（需登录或被阻止）。请复制职位内容用'粘贴内容'导入。", "Không đọc được trang (cần đăng nhập hoặc bị chặn). Hãy sao chép nội dung và dùng 'Dán nội dung'.", "このページは読めません（ログインが必要かブロック）。本文をコピーして「本文を貼り付け」で。", "Halaman tidak bisa dibaca. Salin isinya dan gunakan 'Tempel teks'."));
        setMode("text");
      } else if (code === "NOT_A_JOB") setError(t("채용 공고를 찾지 못했어요. 공고 상세 페이지 주소인지 확인하거나 내용을 붙여 넣어 주세요.", "No job posting found — check it's a posting page, or paste the text.", "未找到职位信息。请确认是职位详情页，或粘贴内容。", "Không thấy tin tuyển dụng — kiểm tra link hoặc dán nội dung.", "求人が見つかりません。詳細ページか確認するか本文を貼り付けて。", "Lowongan tidak ditemukan — periksa tautan atau tempel teks."));
      else if (code === "URL_NOT_ALLOWED") setError(t("열 수 없는 주소예요. http(s)로 시작하는 공개 페이지 주소를 넣어 주세요.", "That address can't be opened. Use a public http(s) page.", "无法打开该地址，请输入以 http(s) 开头的公开页面。", "Không mở được địa chỉ này. Dùng trang công khai http(s).", "開けないアドレスです。公開のhttp(s)ページを。", "Alamat tidak bisa dibuka. Gunakan halaman publik http(s)."));
      else setError(t("가져오지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't import. Try again soon.", "导入失败，请稍后再试。", "Không nhập được. Thử lại sau.", "取り込めませんでした。", "Gagal mengimpor."));
    } finally {
      setBusy(false);
    }
  };
  const start = () => {
    if (!draft) return;
    const job = addImportedJob(draft);
    onStart(importedToPosition(job));
  };
  const canRun = mode === "url" ? /^https?:\/\/\S+\.\S+/.test(url.trim()) : text.trim().length >= 80;

  return (
    <Sheet
      tall
      title={title ?? t("공고 가져오기", "Import a job", "导入职位", "Nhập tin tuyển dụng", "求人を取り込む", "Impor lowongan")}
      subtitle={subtitle ?? t("가고 싶은 회사 공고로 맞춤 모의 면접을 봐요", "Practice a mock interview for the job you want", "用想去公司的职位进行定制模拟面试", "Phỏng vấn thử theo tin bạn muốn", "行きたい会社の求人で模擬面接", "Simulasi untuk lowongan incaran")}
      onClose={onClose}
      footer={
        draft ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="neutral" full onClick={() => setDraft(null)}>
              {t("다시 가져오기", "Import another", "重新导入", "Nhập lại", "取り込み直す", "Impor lagi")}
            </Button>
            <Button full onClick={start}>
              {ctaLabel ?? t("이 공고로 연습", "Practice for it", "用此职位练习", "Luyện cho tin này", "この求人で練習", "Latihan")}
            </Button>
          </div>
        ) : (
          <Button full onClick={() => void run()} disabled={busy || !canRun}>
            {busy ? <Spinner /> : null}
            {busy ? t("공고를 읽고 있어요", "Reading the posting…", "正在读取职位…", "Đang đọc tin…", "求人を読んでいます", "Membaca lowongan…") : t("가져오기", "Import", "导入", "Nhập", "取り込む", "Impor")}
          </Button>
        )
      }
    >
      {draft ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-3xl bg-[#f3eeff] p-5">
            <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{draft.company || t("회사 이름 없음", "Company unknown", "未知公司", "Không rõ công ty", "会社名なし", "Perusahaan tidak diketahui")}</p>
            <p className="mt-1 text-[20px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{draft.title}</p>
            {draft.sourceUrl ? <p className="mt-1 truncate text-[12px] text-[color:var(--v2-faint)]">{draft.sourceUrl}</p> : null}
          </div>
          {[
            [t("주요 업무", "What you'll do", "主要工作", "Công việc chính", "主な業務", "Tugas utama"), draft.mainResponsibilities],
            [t("자격 요건", "Requirements", "任职要求", "Yêu cầu", "応募資格", "Persyaratan"), draft.requiredQualifications],
            [t("우대 사항", "Nice to have", "优先条件", "Ưu tiên", "歓迎条件", "Nilai tambah"), draft.preferredQualifications]
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
                <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{k}</p>
                <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-[1.65] text-[color:var(--v2-ink-3)]">{v}</p>
              </div>
            ))}
          <p className="text-[12px] leading-[1.5] text-[color:var(--v2-faint)]">{t("AI가 공고에서 뽑아 정리했어요. 이 공고는 나만 보고, '가져온 공고'에 남아 언제든 다시 연습할 수 있어요.", "Summarized by AI. Only you can see it; it stays in 'Imported' for later practice.", "由 AI 整理。仅你可见，保存在'导入的职位'中可随时练习。", "AI tóm tắt. Chỉ bạn thấy; lưu trong 'Tin đã nhập' để luyện lại.", "AIが整理しました。自分だけが見られ「取り込んだ求人」に残ります。", "Diringkas AI. Hanya kamu yang melihat; tersimpan di 'Diimpor'.")}</p>
        </div>
      ) : (
        <div>
          <div className="flex gap-1 rounded-xl bg-[color:var(--v2-band)] p-1">
            {(
              [
                ["url", t("링크로", "By link", "通过链接", "Bằng link", "リンクで", "Lewat tautan")],
                ["text", t("내용 붙여넣기", "Paste text", "粘贴内容", "Dán nội dung", "本文を貼り付け", "Tempel teks")]
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setMode(k)} className={`h-10 flex-1 rounded-lg text-[14px] font-semibold transition ${mode === k ? "bg-white text-[color:var(--v2-ink)] shadow-sm" : "text-[color:var(--v2-muted)]"}`}>
                {label}
              </button>
            ))}
          </div>
          {mode === "url" ? (
            <>
              <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://" className="mt-4 h-12 w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2" />
              <p className="mt-2 text-[13px] leading-[1.6] text-[color:var(--v2-muted)]">{t("원티드·사람인·잡코리아·회사 채용 페이지의 공고 주소를 붙여 넣어 주세요. 링크드인처럼 로그인이 필요한 곳은 '내용 붙여넣기'로 가져와요.", "Paste a posting link from any job site or company careers page. For login-only sites (e.g. LinkedIn), use 'Paste text'.", "粘贴任意招聘网站或公司招聘页的职位链接。需登录的网站（如领英）请用'粘贴内容'。", "Dán link tin từ trang tuyển dụng hoặc trang công ty. Trang cần đăng nhập (LinkedIn) hãy dùng 'Dán nội dung'.", "求人サイトや企業の採用ページのリンクを。ログインが必要なサイトは「本文を貼り付け」で。", "Tempel tautan lowongan. Untuk situs yang perlu login (LinkedIn), gunakan 'Tempel teks'.")}</p>
            </>
          ) : (
            <>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} placeholder={t("공고 내용을 통째로 복사해 붙여 넣어 주세요(회사·직무·주요 업무·자격 요건).", "Paste the whole posting (company, role, duties, requirements).", "请复制粘贴整个职位内容（公司、职位、工作内容、要求）。", "Dán toàn bộ nội dung tin (công ty, vị trí, công việc, yêu cầu).", "求人本文をまるごと貼り付けてください。", "Tempel seluruh isi lowongan.")} className="mt-4 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[15px] leading-[1.6] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2" />
              <p className="mt-1 text-right text-[12px] tabular-nums text-[color:var(--v2-faint)]">{text.trim().length}</p>
            </>
          )}
          {error ? <p className="mt-3 rounded-2xl bg-[#fff4e8] px-4 py-3 text-[14px] leading-[1.55] text-[#c2410c]">{error}</p> : null}
        </div>
      )}
    </Sheet>
  );
}

// ── 모의 면접 시작 — 예전 팝업(MockGateModal)의 v2 모양. 다른 카드 팝업과 같은 크기(tall 시트).
// 공고 연습은 서류 없이도 시작(공고 기반 일반 질문), 내 서류 연습은 서류가 준비돼야 시작. 회사 하루 제한에 걸리면 막는다.
export function StartSheet({ title, allowWithoutDocs, dailyLimitReached, dailyLimit, onClose, onConfirm }: { title?: string; allowWithoutDocs: boolean; dailyLimitReached: boolean; dailyLimit: number; onClose: () => void; onConfirm: () => void }) {
  const t = usePlatformT();
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const ready = docsReady(resume, cover);
  const both = ready.resume && ready.cover;
  const blocked = dailyLimitReached || (!allowWithoutDocs && !both);
  // 유료화가 켜져 있고 이용권이 없으면 시작 대신 충전부터.
  const credits = useInterviewCredits();
  const noCredits = Boolean(credits?.paywall) && (credits?.credits ?? 0) < 1;
  const row = (label: string, ok: boolean, href: string) => (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${ok ? "bg-[color:var(--v2-good)] text-white" : "border-2 border-[color:var(--v2-line)] bg-white text-transparent"}`} aria-hidden>✓</span>
        <span className="text-[16px] font-semibold text-[color:var(--v2-ink)]">{label}</span>
        <span className={`text-[13px] ${ok ? "text-[color:var(--v2-good)]" : "text-[color:var(--v2-muted)]"}`}>{ok ? t("준비됐어요", "Ready", "已就绪", "Sẵn sàng", "準備OK", "Siap") : t("덜 채웠어요", "Not ready", "未完成", "Chưa xong", "未完成", "Belum")}</span>
      </div>
      {!ok ? (
        <a href={href} className="text-[14px] font-semibold text-[color:var(--v2-accent)] hover:opacity-70">
          {t("채우기", "Fill in", "去填写", "Điền", "書く", "Isi")}
        </a>
      ) : null}
    </div>
  );
  return (
    <Sheet
      tall
      title={t("모의 면접을 시작할까요?", "Start the mock interview?", "开始模拟面试？", "Bắt đầu phỏng vấn thử?", "模擬面接を始めますか？", "Mulai simulasi?")}
      subtitle={title}
      onClose={onClose}
      footer={
        noCredits ? (
          <Button full onClick={() => openInterviewPaywall("needed")}>
            {t("이용권 충전하고 시작하기", "Top up & start", "充值后开始", "Nạp vé & bắt đầu", "チャージして始める", "Isi tiket & mulai")}
          </Button>
        ) : (
          <Button full onClick={onConfirm} disabled={blocked}>
            {t("모의 면접 시작하기", "Start", "开始模拟面试", "Bắt đầu", "模擬面接を始める", "Mulai")}
          </Button>
        )
      }
    >
      <div className="rounded-3xl bg-[#edf1fd] p-5">
        <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t("이렇게 진행돼요", "How it works", "流程", "Cách diễn ra", "進め方", "Cara kerja")}</p>
        <ol className="mt-2 flex flex-col gap-1.5 text-[14px] leading-[1.55] text-[color:var(--v2-ink-2)]">
          <li>① {t("질문 유형을 고르면 AI가 질문을 만들어요", "Pick a type — AI writes the questions", "选择类型，AI 生成问题", "Chọn loại — AI tạo câu hỏi", "タイプを選ぶとAIが質問を作ります", "Pilih tipe — AI membuat pertanyaan")}</li>
          <li>② {t("한 문항씩 답하면 바로 피드백", "Answer one by one, get instant feedback", "逐题回答，立即反馈", "Trả lời từng câu, phản hồi ngay", "1問ずつ答えるとすぐフィードバック", "Jawab satu per satu, umpan balik langsung")}</li>
          <li>③ {t("답은 연습 기록에 남아요", "Answers stay in your history", "回答保存在练习记录中", "Câu trả lời lưu trong lịch sử", "回答は練習記録に残ります", "Jawaban tersimpan di riwayat")}</li>
        </ol>
      </div>
      <p className="mt-5 text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("내 서류", "My documents", "我的材料", "Hồ sơ của tôi", "自分の書類", "Dokumenku")}</p>
      <div className="mt-2 flex flex-col gap-2">
        {row(t("이력서", "Resume", "简历", "CV", "履歴書", "CV"), ready.resume, "/talent/career/resume/editor")}
        {row(t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran"), ready.cover, "/talent/career/cover/editor")}
      </div>
      <p className="mt-3 text-[13px] leading-[1.6] text-[color:var(--v2-muted)]">
        {dailyLimitReached
          ? t(`오늘은 회사 ${dailyLimit}곳까지 연습할 수 있어요. 내일 다시 해 주세요.`, `You can practice up to ${dailyLimit} companies a day. Try tomorrow.`, `每天最多可练习 ${dailyLimit} 家公司，明天再来吧。`, `Mỗi ngày tối đa ${dailyLimit} công ty. Hãy thử lại ngày mai.`, `1日${dailyLimit}社まで練習できます。明日また。`, `Maks ${dailyLimit} perusahaan per hari.`)
          : both
            ? t("서류를 바탕으로 내 경험에 맞춘 질문이 나와요.", "Questions will be tailored to your documents.", "问题会根据你的材料定制。", "Câu hỏi được điều chỉnh theo hồ sơ.", "書類に合わせた質問が出ます。", "Pertanyaan disesuaikan dengan dokumenmu.")
            : allowWithoutDocs
              ? t("서류가 덜 채워져도 시작할 수 있어요. 공고 기반 질문이 나오고, 서류를 채우면 내 경험에 맞춘 질문으로 더 정확해져요.", "You can start anyway — questions come from the job; fuller documents make them more personal.", "材料不完整也能开始，会基于职位出题；完善材料后会更贴合你的经历。", "Vẫn bắt đầu được — câu hỏi dựa trên tin; hồ sơ đầy đủ sẽ sát hơn.", "書類が未完成でも始められます。求人ベースの質問になり、書類を埋めるとより個別化されます。", "Tetap bisa mulai — pertanyaan dari lowongan.")
              : t("내 서류로 연습하려면 이력서와 자기소개서를 먼저 채워 주세요.", "Fill in your resume and cover letter first to practice with them.", "要用材料练习，请先完善简历和自我介绍。", "Hãy hoàn thiện CV và thư trước.", "書類で練習するには先に履歴書と自己PRを。", "Lengkapi CV dan surat lamaran dulu.")}
      </p>
      {credits?.paywall ? (
        <div className="mt-5">
          <CreditLine t={t} credits={credits.credits} per={credits.perSession} onTopUp={() => openInterviewPaywall("topup")} />
        </div>
      ) : null}
    </Sheet>
  );
}
