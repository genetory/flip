"use client";

// Week 3 기본 모의면접(카드형) — 내 이력서·자소서 기반, 유형별(self/job/fit/pressure).
// 질문 카드 → 답변 → 점수·모범답안 → 결과 리스트(오답노트 재도전). 공고별과 동일 구조.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretLeft, X, CircleNotch, PaperPlaneRight } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { PostingResultList } from "./PostingResultList";
import { requestBasicQuestions, scoreBasicAnswer, type BasicFocus } from "../../lib/launch/basic-interview";
import { fetchProgress, patchProgress, type PostingInterviewItem } from "../../lib/launch/progress-client";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";

function scoreTone(s: number): { text: string; bg: string } {
  if (s >= 80) return { text: "text-[#0A9B59]", bg: "bg-[#E7F7EF]" };
  if (s >= 60) return { text: "text-[#0B46E8]", bg: "bg-[#EDF1FD]" };
  if (s >= 40) return { text: "text-[#C77700]", bg: "bg-[#FFF6E5]" };
  return { text: "text-[#F04452]", bg: "bg-[#FEECEC]" };
}

export function BasicInterviewSession({ focus, embedded = false, onClose }: { focus: BasicFocus; embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const startedRef = useRef(false);
  const savedRef = useRef(false);
  const [phase, setPhase] = useState<"loading" | "answering" | "results" | "error">("loading");
  const [questions, setQuestions] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [scoring, setScoring] = useState(false);
  const [items, setItems] = useState<PostingInterviewItem[]>([]);
  const [lastScore, setLastScore] = useState<PostingInterviewItem | null>(null);
  const itemsRef = useRef<PostingInterviewItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const focusLabel: Record<BasicFocus, string> = {
    self: t("자기소개 면접", "Self-Introduction Interview", "自我介绍面试", "Phỏng vấn giới thiệu", "自己紹介面接", "Wawancara Perkenalan"),
    job: t("직무 면접", "Job Interview", "职务面试", "Phỏng vấn chuyên môn", "職務面接", "Wawancara Pekerjaan"),
    fit: t("인성·컬처핏 면접", "Personality & Culture-Fit", "人品·文化契合面试", "Phỏng vấn tính cách & văn hóa", "人柄・カルチャーフィット面接", "Wawancara Kepribadian & Budaya"),
    pressure: t("압박 면접", "Pressure Interview", "压力面试", "Phỏng vấn áp lực", "圧迫面接", "Wawancara Tekanan")
  };
  const label = focusLabel[focus];

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackCareerFunnel("career_basic_interview_started", { focus });
    void (async () => {
      try {
        const qs = await requestBasicQuestions(focus, 5);
        if (qs.length === 0) {
          setPhase("error");
          return;
        }
        setQuestions(qs);
        setPhase("answering");
      } catch {
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    const a = input.trim();
    if (!a || scoring) return;
    setScoring(true);
    try {
      const s = await scoreBasicAnswer(focus, questions[idx], a);
      const item: PostingInterviewItem = { question: questions[idx], answer: a, score: s.score, modelAnswer: s.modelAnswer, feedback: s.feedback, strengths: s.strengths, improvements: s.improvements };
      setItems((prev) => [...prev, item]);
      setLastScore(item);
    } catch {
      // 실패 — 재시도하도록 둠.
    } finally {
      setScoring(false);
    }
  };
  const next = () => {
    setLastScore(null);
    setInput("");
    if (idx < questions.length - 1) setIdx(idx + 1);
    else setPhase("results");
  };

  const saveLog = async () => {
    if (savedRef.current) return;
    const its = itemsRef.current;
    if (its.length === 0) return;
    savedRef.current = true;
    const entry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      title: label,
      at: new Date().toISOString(),
      source: "basic" as const,
      focus,
      items: its
    };
    try {
      trackCareerFunnel("career_basic_interview_completed", { focus, count: its.length });
      const prog = await fetchProgress();
      const prev = Array.isArray(prog.basicInterviews) ? prog.basicInterviews : [];
      await patchProgress({ basicInterviews: [entry, ...prev].slice(0, 40) });
    } catch {
      savedRef.current = false;
    }
  };
  const handleClose = () => {
    void saveLog();
    onClose?.();
  };

  const total = questions.length;

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
          <p className="min-w-0 truncate text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{label}</p>
          <button type="button" onClick={handleClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-4 md:pt-8">
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href="/career-launch/week/3" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]"><CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("3주차", "Week 3", "第3周", "Tuần 3", "3週目", "Minggu 3")}</Link>
              <Link href="/career-launch/week/3" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}

          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("3주차 · 기본 면접", "Week 3 · Basic interview", "第3周 · 基础面试", "Tuần 3 · Phỏng vấn cơ bản", "Week 3 · 基本面接", "Minggu 3 · Wawancara dasar")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{label}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("내 이력서·자기소개서를 바탕으로 한 면접이에요", "Based on your resume and cover letter", "基于你的简历与自我介绍书", "Dựa trên CV và thư giới thiệu của bạn", "あなたの履歴書・自己紹介書に基づく面接です", "Berdasarkan resume dan surat lamaranmu")}</p>
          </div>

          {phase === "loading" ? (
            <div className="mt-8 flex flex-col items-center gap-2 py-10 text-center">
              <CircleNotch className="h-6 w-6 animate-spin text-[#0B46E8]" weight="bold" />
              <p className="text-[13px] text-[#8B95A1]">{t("내 서류에 맞는 면접 질문을 준비하고 있어요…", "Preparing interview questions from your documents…", "正在根据你的材料准备面试问题…", "Đang chuẩn bị câu hỏi từ hồ sơ của bạn…", "あなたの書類に合う面接質問を準備中…", "Menyiapkan pertanyaan dari dokumenmu…")}</p>
            </div>
          ) : phase === "error" ? (
            <div className="mt-8 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-6 text-center">
              <p className="text-[13px] text-[#8B95A1]">{t("질문을 준비하지 못했어요. 이력서·자기소개서를 먼저 작성하면 더 잘 맞춰줘요.", "Couldn't prepare questions. Fill your resume/cover letter first for a better fit.", "无法准备问题。先完成简历/自我介绍书会更贴合。", "Không chuẩn bị được câu hỏi. Hãy điền CV/thư trước.", "質問を準備できませんでした。履歴書・自己紹介書を先に作成すると合わせやすいです。", "Gagal menyiapkan. Isi resume/surat dulu.")}</p>
              <button type="button" onClick={onClose} className="mt-3 rounded-lg border border-[#E5E8EB] px-4 py-2 text-[12.5px] font-bold text-[#4E5968]">{t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}</button>
            </div>
          ) : phase === "answering" ? (
            <div className="mt-5">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF1F5]"><div className="h-full rounded-full bg-[#0B46E8] transition-[width]" style={{ width: `${total ? ((idx + (lastScore ? 1 : 0)) / total) * 100 : 0}%` }} /></div>
                <span className="shrink-0 text-[12px] font-bold text-[#4E5968]">{t(`질문 ${idx + 1}`, `Q ${idx + 1}`, `问题 ${idx + 1}`, `Câu ${idx + 1}`, `質問 ${idx + 1}`, `Soal ${idx + 1}`)} / {total}</span>
              </div>

              <div className="rounded-2xl border border-[#EEF1F5] bg-gradient-to-b from-[#F7F9FF] to-white p-5">
                <p className="flex items-start gap-2 break-keep text-[16px] font-black leading-relaxed text-[#191F28]"><span className="mt-0.5 text-[18px]">🎤</span>{questions[idx]}</p>

                {lastScore ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-11 w-14 flex-col items-center justify-center rounded-lg ${scoreTone(lastScore.score).bg}`}><span className={`text-[17px] font-black leading-none ${scoreTone(lastScore.score).text}`}>{lastScore.score}</span><span className={`text-[9px] font-bold ${scoreTone(lastScore.score).text}`}>/100</span></span>
                      <p className="text-[12.5px] font-bold text-[#4E5968]">{t("이 답변 점수예요", "Your score for this answer", "本次回答得分", "Điểm cho câu trả lời này", "この回答のスコア", "Skor jawaban ini")}</p>
                    </div>
                    {lastScore.feedback ? <div className="rounded-xl bg-[#FAFBFC] p-3 text-[13px] leading-relaxed"><p className="text-[11.5px] font-bold text-[#C77700]">💬 {t("피드백", "Feedback", "反馈", "Nhận xét", "フィードバック", "Umpan balik")}</p><p className="mt-0.5 break-keep text-[#4E5968]">{lastScore.feedback}</p></div> : null}
                    {lastScore.modelAnswer ? <div className="rounded-xl bg-[#F8FAFF] p-3 text-[13px] leading-relaxed"><p className="text-[11.5px] font-bold text-[#0B46E8]">🧭 {t("모범답안", "Model answer", "范例答案", "Câu trả lời mẫu", "模範解答", "Jawaban contoh")}</p><p className="mt-0.5 whitespace-pre-wrap break-keep text-[#333D4B]">{lastScore.modelAnswer}</p></div> : null}
                    <button type="button" onClick={next} className="inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0B1227]">{idx < total - 1 ? t("다음 문제 →", "Next question →", "下一题 →", "Câu tiếp →", "次の質問 →", "Soal berikutnya →") : t("결과 보기 →", "See results →", "查看结果 →", "Xem kết quả →", "結果を見る →", "Lihat hasil →")}</button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder={t("실제 면접이라고 생각하고 답변해보세요", "Answer as if it's a real interview", "把它当作真实面试来作答", "Trả lời như phỏng vấn thật", "本番の面接だと思って答えてください", "Jawab seakan wawancara nyata")} className="w-full resize-none rounded-xl border border-[#E5E8EB] p-3 text-[16px] leading-relaxed outline-none focus:border-[#0B46E8]" />
                    <button type="button" onClick={() => void submit()} disabled={scoring || !input.trim()} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{scoring ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}{t("답변 제출", "Submit answer", "提交回答", "Gửi câu trả lời", "回答を提出", "Kirim jawaban")}</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[14px] font-black text-[#191F28]">{t("면접 결과", "Interview results", "面试结果", "Kết quả phỏng vấn", "面接結果", "Hasil wawancara")}</p>
                {items.length ? <span className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{t("평균", "Avg", "平均", "TB", "平均", "Rata")} {Math.round(items.reduce((s, it) => s + it.score, 0) / items.length)}</span> : null}
              </div>
              <PostingResultList items={items} rescore={(q, a) => scoreBasicAnswer(focus, q, a)} onItemsChange={setItems} />
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
                <p className="break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{t("점수가 낮은 문항은 '다시 답하기'로 오답노트처럼 연습해요. 기록은 저장돼요.", "Retry low-scoring questions like a review note. Your record is saved.", "对低分题用'重新作答'像错题本一样练习。记录会保存。", "Luyện lại câu điểm thấp như sổ sửa lỗi. Bản ghi được lưu.", "点数の低い問題は「もう一度答える」で復習ノートのように練習。記録は保存されます。", "Latih lagi soal berskor rendah. Rekaman tersimpan.")}</p>
                <button type="button" onClick={handleClose} className="shrink-0 rounded-xl bg-[#191F28] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0B1227]">{t("저장하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</button>
              </div>
            </div>
          )}
        </div>
      </main>
      {embedded ? null : <AplyFooter />}
    </div>
  );
}
