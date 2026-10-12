"use client";

// v2 모의 면접 연습 도구 — 10분 모의 면접 세트 · 1분 자기소개 만들기 · 한국 면접 매너 퀴즈.
// 목록 줄만 이어지면 심심해서, 도구마다 색·모양이 다른 타일로 연다(PracticeTools).
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "./sheets";
import { Button, Spinner } from "./ui";
import { DictationControls, LevelChip, PracticeSheet, useDictation } from "./practice";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { aiInterviewFeedback, type InterviewFeedback } from "../../lib/member-profile-client";
import { draftResumeText } from "../../lib/resume-maker-client";
import { useResumeDoc } from "../../lib/talent/resume-doc";
import { useBasicInfo } from "../../lib/talent/basic-info";
import { saveSelfMockAnswer, useSelfMock } from "../../lib/talent/self-mock";
import { mockCategoryLabelOf } from "../../lib/talent/career-labels";
import { DAILY_QUESTIONS, kstDay, pickDailyQuiz, pickInterviewSet, questionText, type DailyQuestion } from "../../lib/talent/interview-daily";
import { resumeToText } from "../talent/jobs/MockInterviewModal";

const INTRO_Q = DAILY_QUESTIONS[0];

/** 연습 도구 타일 — 색이 다른 큰 카드 셋(매너 퀴즈는 외국인 지원자에게만). */
export function PracticeTools({ t, showQuiz }: { t: PlatformT; showQuiz: boolean }) {
  const [open, setOpen] = useState<"set" | "intro" | "quiz" | null>(null);
  const quizDone = useQuizResult();
  const selfMock = useSelfMock();
  const intro = (selfMock?.answers ?? []).find((a) => a.question === INTRO_Q.ko);
  return (
    <>
      <div className={`grid gap-3 ${showQuiz ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {/* 10분 모의 면접 — 진한 남색 그라데이션 */}
        <button type="button" onClick={() => setOpen("set")} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b2b6b] via-[#2441b8] to-[#3d6bff] p-5 text-left text-white transition hover:shadow-[0_10px_30px_rgba(36,65,184,0.35)]">
          <span aria-hidden className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
          <span className="relative inline-flex h-7 items-center rounded-full bg-white/15 px-2.5 text-[12px] font-bold">⏱ {t("10분", "10 min", "10分钟", "10 phút", "10分", "10 mnt")}</span>
          <p className="relative mt-3 text-[20px] font-bold leading-[1.35]">{t("실전처럼 모의 면접", "A full mock interview", "像实战一样模拟面试", "Phỏng vấn thử như thật", "本番さながらの模擬面接", "Simulasi seperti nyata")}</p>
          <p className="relative mt-1 text-[14px] leading-[1.55] text-white/80">{t("자기소개부터 마지막 말까지 5문항, 끝나면 결과 카드", "5 questions, intro to closing — then a report card", "从自我介绍到最后陈述 5 题，结束后出结果卡", "5 câu từ giới thiệu đến kết — rồi thẻ kết quả", "自己紹介から最後の一言まで5問、終わると結果カード", "5 soal, dari perkenalan sampai penutup")}</p>
          <span className="relative mt-4 inline-flex items-center gap-1 text-[14px] font-bold">
            {t("시작하기", "Start", "开始", "Bắt đầu", "始める", "Mulai")} <span className="transition group-hover:translate-x-0.5">→</span>
          </span>
        </button>

        {/* 1분 자기소개 — 따뜻한 주황 */}
        <button type="button" onClick={() => setOpen("intro")} className="group relative overflow-hidden rounded-3xl bg-[#fff4e8] p-5 text-left transition hover:bg-[#ffecd6]">
          <span aria-hidden className="absolute right-4 top-4 text-[40px] leading-none opacity-90">🎤</span>
          <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[12px] font-bold text-[#e8590c]">{t("가장 먼저 받는 질문", "Always asked first", "必问第一题", "Luôn hỏi đầu tiên", "最初に必ず聞かれる", "Selalu ditanya pertama")}</span>
          <p className="mt-3 text-[20px] font-bold leading-[1.35] text-[color:var(--v2-ink)]">{t("1분 자기소개", "1-minute self-intro", "1分钟自我介绍", "Tự giới thiệu 1 phút", "1分自己紹介", "Perkenalan 1 menit")}</p>
          <p className="mt-1 text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">
            {intro ? t(`저장된 자기소개 ${intro.answer.trim().length}자 · 다듬고 소리 내어 연습`, `Saved (${intro.answer.trim().length} chars) — polish & rehearse`, `已保存 ${intro.answer.trim().length} 字 · 打磨并朗读练习`, `Đã lưu ${intro.answer.trim().length} ký tự — chỉnh & tập nói`, `保存済み${intro.answer.trim().length}字・磨いて声に出して練習`, `Tersimpan ${intro.answer.trim().length} karakter`) : t("이력서로 초안을 만들고, 시간 재며 소리 내어 연습", "Draft from your resume, rehearse with a timer", "用简历生成初稿，计时朗读练习", "Tạo bản nháp từ CV, tập nói có hẹn giờ", "履歴書から下書き、時間を計って声に出して練習", "Buat draf dari CV, latihan dengan timer")}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-bold text-[#e8590c]">
            {intro ? t("다듬기", "Polish", "打磨", "Chỉnh sửa", "磨く", "Perbaiki") : t("만들기", "Create", "制作", "Tạo", "作る", "Buat")} <span className="transition group-hover:translate-x-0.5">→</span>
          </span>
        </button>

        {/* 매너 퀴즈 — 민트 */}
        {showQuiz ? (
          <button type="button" onClick={() => setOpen("quiz")} className="group relative overflow-hidden rounded-3xl bg-[#e8f8f1] p-5 text-left transition hover:bg-[#d9f3e7]">
            <span aria-hidden className="absolute right-4 top-4 text-[40px] leading-none">🙇</span>
            <span className="inline-flex h-7 items-center rounded-full bg-white px-2.5 text-[12px] font-bold text-[color:var(--v2-good)]">{t("오늘의 3문제", "3 a day", "今日3题", "3 câu hôm nay", "今日の3問", "3 soal hari ini")}</span>
            <p className="mt-3 text-[20px] font-bold leading-[1.35] text-[color:var(--v2-ink)]">{t("한국 면접 매너 퀴즈", "Korean interview etiquette", "韩国面试礼仪测验", "Quiz phép lịch sự PV Hàn", "韓国面接マナークイズ", "Kuis etiket wawancara Korea")}</p>
            <p className="mt-1 text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">
              {quizDone !== null ? t(`오늘 3문제 중 ${quizDone}개 맞혔어요`, `You got ${quizDone}/3 today`, `今天3题答对${quizDone}题`, `Hôm nay đúng ${quizDone}/3`, `今日は3問中${quizDone}問正解`, `Benar ${quizDone}/3 hari ini`) : t("인사·호칭·연봉 질문… 헷갈리는 것만 모았어요", "Greetings, titles, salary questions…", "问候、称呼、薪资问题……", "Chào hỏi, xưng hô, câu hỏi lương…", "挨拶・呼び方・年収の質問…", "Salam, sapaan, pertanyaan gaji…")}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-bold text-[color:var(--v2-good)]">
              {quizDone !== null ? t("다시 보기", "Review", "再看", "Xem lại", "見直す", "Tinjau") : t("풀어 보기", "Play", "开始答题", "Làm thử", "解いてみる", "Main")} <span className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </button>
        ) : null}
      </div>
      {open === "set" ? <InterviewSetSheet onClose={() => setOpen(null)} /> : null}
      {open === "intro" ? <SelfIntroSheet onClose={() => setOpen(null)} /> : null}
      {open === "quiz" ? <QuizSheet onClose={() => setOpen(null)} /> : null}
    </>
  );
}

// ── 10분 모의 면접 세트 ─────────────────────────────────
type SetAnswer = { q: DailyQuestion; answer: string; ms: number };

function InterviewSetSheet({ onClose }: { onClose: () => void }) {
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

  const begin = () => {
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
    // 오늘 AI 이용 한도에 걸려 평가 못 한 답이 있으면 결과 카드에서 알려 준다.
    setLimitHit(settled.some((r) => r.status === "rejected" && (r.reason as { status?: number })?.status === 429));
    fb.forEach((f, i) => {
      if (f) saveSelfMockAnswer({ question: all[i].q.ko, category: all[i].q.category, answer: all[i].answer.trim(), score: f.score, feedback: { score: f.score, strengths: f.strengths, improvements: f.improvements, sampleAnswer: f.sampleAnswer } });
    });
    setResults(fb);
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
          <div className="rounded-3xl bg-gradient-to-br from-[#1b2b6b] to-[#3d6bff] p-6 text-white">
            <p className="text-[13px] font-bold text-white/70">{t("실제 면접 순서 그대로", "Same order as a real interview", "与真实面试顺序相同", "Đúng thứ tự phỏng vấn thật", "本番と同じ順番", "Urutan seperti wawancara nyata")}</p>
            <p className="mt-1 text-[22px] font-bold leading-[1.35]">{t("5문항 · 약 10분", "5 questions · ~10 min", "5题 · 约10分钟", "5 câu · ~10 phút", "5問・約10分", "5 soal · ~10 menit")}</p>
            <ol className="mt-4 flex flex-col gap-2">
              {questions.map((q, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14px] text-white/90">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[12px] font-bold">{i + 1}</span>
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
          <p className="mt-2 text-[21px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{questionText(t, questions[idx])}</p>
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b2b6b] to-[#3d6bff] p-6 text-white">
            <span aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <p className="relative text-[13px] font-bold text-white/70">{t("모의 면접 결과", "Mock interview result", "模拟面试结果", "Kết quả phỏng vấn thử", "模擬面接の結果", "Hasil simulasi")}</p>
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
    <div className="rounded-2xl bg-white/12 px-2 py-3" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
      <p className="text-[19px] font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-white/75">{label}</p>
    </div>
  );
}

// ── 1분 자기소개 만들기 ─────────────────────────────────
// 초안(이력서로 AI) → 다듬기(글자 수·예상 시간) → 소리 내어 연습(60초 프롬프터) → 저장 / AI 피드백.
function SelfIntroSheet({ onClose }: { onClose: () => void }) {
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

function useQuizResult(): number | null {
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

function QuizSheet({ onClose }: { onClose: () => void }) {
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
