"use client";

// Week 3 기본 모의면접(카드형) — 내 이력서·자소서 기반, 유형별(self/job/fit/pressure).
// 질문 카드 → 답변 → 점수·모범답안 → 결과 리스트(오답노트 재도전). 공고별과 동일 구조.
// 말로 답하기 — 질문을 소리로 듣고 마이크로 답하면(받아쓴 글은 고칠 수 있다) 내용 점수와 함께 '말하기 리포트'를 준다(문항에 speakingData 로 저장).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretLeft, CircleNotch, PaperPlaneRight, ArrowRight } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { PostingResultList } from "./PostingResultList";
import { requestBasicQuestions, scoreBasicAnswer, type BasicFocus } from "../../lib/launch/basic-interview";
import { fetchProgress, patchProgress, type PostingInterviewItem } from "../../lib/launch/progress-client";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";
import { SpeakButton } from "../v2/practice";
import { SpeakingReportCard } from "./SpeakingReportCard";
import { FollowUpBadge, FollowUpButton, VoiceAnswerControls, useVoiceAnswer } from "./voice-answer";

function scoreTone(s: number): { text: string; bg: string } {
  if (s >= 80) return { text: "text-[color:var(--v2-good)]", bg: "bg-[#E7F7EF]" };
  if (s >= 60) return { text: "text-[color:var(--v2-accent)]", bg: "bg-[color:var(--v2-accent-weak)]" };
  if (s >= 40) return { text: "text-[#c2410c]", bg: "bg-[#fff4e8]" };
  return { text: "text-[color:var(--v2-attention)]", bg: "bg-[#fdeced]" };
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
  const [loadingNext, setLoadingNext] = useState(false); // 다음 질문 생성 중
  const [nextError, setNextError] = useState(false);
  const [items, setItems] = useState<PostingInterviewItem[]>([]);
  const [lastScore, setLastScore] = useState<PostingInterviewItem | null>(null);
  const itemsRef = useRef<PostingInterviewItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  // 말로 답하기 — 받아쓴 글은 답변 칸에 이어 붙고(고칠 수 있음), 제출하면 말하기 리포트도 받는다.
  const voice = useVoiceAnswer((add) => setInput((a) => (a.trim() ? `${a.trim()} ${add}` : add)));
  const pt = voice.pt;
  const qTts = voice.tts;
  // 꼬리 질문 — 질문 자리(idx)별 깊이·면접관 의도
  const [follow, setFollow] = useState<Record<number, { depth: number; intent: string }>>({});
  const depthAt = (i: number) => follow[i]?.depth ?? 0;
  const askFollowUp = (q: string, intent: string) => {
    const at = idx + 1;
    setQuestions((prev) => [...prev.slice(0, at), q, ...prev.slice(at)]);
    setFollow((prev) => ({ ...prev, [at]: { depth: depthAt(idx) + 1, intent } }));
    setIdx(at);
    setLastScore(null);
    setInput("");
    voice.reset();
  };

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
        // 갯수 고정 없음 — 첫 질문 하나만 생성하고, 다음 질문은 답변 제출 후 요청 시 생성.
        const qs = await requestBasicQuestions(focus, 1);
        if (qs.length === 0) {
          setPhase("error");
          return;
        }
        setQuestions(qs.slice(0, 1));
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
    const v = await voice.capture();
    try {
      const q = questions[idx];
      const [s, speakingData] = await Promise.all([scoreBasicAnswer(focus, q, a), voice.analyze(q, v)]);
      const item: PostingInterviewItem = { question: q, answer: a, score: s.score, modelAnswer: s.modelAnswer, feedback: s.feedback, strengths: s.strengths, improvements: s.improvements, ...(speakingData ? { speakingData } : {}), ...(depthAt(idx) > 0 ? { followUp: true } : {}) };
      setItems((prev) => [...prev, item]);
      setLastScore(item);
    } catch {
      // 실패 — 재시도하도록 둠.
    } finally {
      setScoring(false);
    }
  };
  // 다음 질문 — 그때그때 생성(이전 질문과 겹치지 않게 asked 로 전달).
  const next = async () => {
    if (loadingNext) return;
    setLoadingNext(true);
    setNextError(false);
    try {
      const [q] = await requestBasicQuestions(focus, 1, questions);
      if (q) {
        setQuestions((prev) => [...prev, q]);
        setIdx((i) => i + 1);
        setLastScore(null);
        setInput("");
        voice.reset();
      } else {
        setNextError(true);
      }
    } catch {
      setNextError(true);
    } finally {
      setLoadingNext(false);
    }
  };
  const finish = () => setPhase("results");

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

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="border-b border-[color:var(--v2-line)]">
          <div className="mx-auto w-full max-w-3xl px-5 py-3">
            <button type="button" onClick={handleClose} className="-ml-1.5 inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-fill)]"><CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali")}</button>
            <p className="mt-1 truncate text-[17px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{label}</p>
          </div>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-4 md:pt-8">
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href="/career-launch/week/3" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink)]"><CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("Step 3", "Step 3", "Step 3", "Step 3", "Step 3", "Step 3")}</Link>
              <Link href="/career-launch/week/3" className="rounded-xl bg-[color:var(--v2-band)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}

          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--v2-accent)]">{t("Step 3 · 기본 면접", "Step 3 · Basic interview", "Step 3 · 基础面试", "Step 3 · Phỏng vấn cơ bản", "Step 3 · 基本面接", "Step 3 · Wawancara dasar")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-bold leading-[1.2] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[24px]">{label}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-faint)]">{t("내 이력서·자기소개서를 바탕으로 한 면접이에요", "Based on your resume and cover letter", "基于你的简历与自我介绍书", "Dựa trên CV và thư giới thiệu của bạn", "あなたの履歴書・自己紹介書に基づく面接です", "Berdasarkan resume dan surat lamaranmu")}</p>
          </div>

          {phase === "loading" ? (
            <div className="mt-8 flex flex-col items-center gap-2 py-10 text-center">
              <CircleNotch className="h-6 w-6 animate-spin text-[color:var(--v2-accent)]" weight="bold" />
              <p className="text-[13px] text-[color:var(--v2-faint)]">{t("내 서류에 맞는 면접 질문을 준비하고 있어요…", "Preparing interview questions from your documents…", "正在根据你的材料准备面试问题…", "Đang chuẩn bị câu hỏi từ hồ sơ của bạn…", "あなたの書類に合う面接質問を準備中…", "Menyiapkan pertanyaan dari dokumenmu…")}</p>
            </div>
          ) : phase === "error" ? (
            <div className="mt-8 rounded-3xl bg-[color:var(--v2-band)] p-6 text-center">
              <p className="text-[13px] text-[color:var(--v2-faint)]">{t("질문을 준비하지 못했어요. 이력서·자기소개서를 먼저 작성하면 더 잘 맞춰줘요.", "Couldn't prepare questions. Fill your resume/cover letter first for a better fit.", "无法准备问题。先完成简历/自我介绍书会更贴合。", "Không chuẩn bị được câu hỏi. Hãy điền CV/thư trước.", "質問を準備できませんでした。履歴書・自己紹介書を先に作成すると合わせやすいです。", "Gagal menyiapkan. Isi resume/surat dulu.")}</p>
              <button type="button" onClick={() => (onClose ? onClose() : (window.location.href = "/career-launch/program"))} className="mt-3 rounded-xl bg-white px-4 py-2 text-[12.5px] font-bold text-[color:var(--v2-ink-3)]">{t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}</button>
            </div>
          ) : phase === "answering" ? (
            <div className="mt-5">
              {/* 진행 표시 — 갯수 고정 없음, 현재까지 진행한 질문 수만 */}
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--v2-ink-3)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--v2-accent)]" aria-hidden />
                  {t("면접 진행 중", "Interview in progress", "面试进行中", "Đang phỏng vấn", "面接進行中", "Wawancara berlangsung")}
                </span>
                <span className="shrink-0 text-[12px] font-bold tabular-nums text-[color:var(--v2-faint)]">{t(`질문 ${idx + 1}`, `Q ${idx + 1}`, `问题 ${idx + 1}`, `Câu ${idx + 1}`, `質問 ${idx + 1}`, `Soal ${idx + 1}`)}</span>
              </div>

              {/* 질문 카드 */}
              <div className="rounded-3xl bg-[color:var(--v2-band)] p-6">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[13px]" aria-hidden>🎤</span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--v2-accent)]">{t(`면접관 질문 ${idx + 1}`, `Interviewer · Q${idx + 1}`, `面试官提问 ${idx + 1}`, `Người PV · Câu ${idx + 1}`, `面接官の質問 ${idx + 1}`, `Pewawancara · Q${idx + 1}`)}</p>
                </div>
                <div className="mt-3">
                  <FollowUpBadge depth={depthAt(idx)} intent={follow[idx]?.intent} />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="break-keep text-[18px] font-bold leading-[1.5] tracking-[-0.01em] text-[color:var(--v2-ink)]">{questions[idx]}</p>
                  {/* 면접관처럼 질문을 소리로 */}
                  <SpeakButton t={pt} tts={qTts} text={questions[idx] ?? ""} />
                </div>

                {lastScore ? (
                  <div className="mt-5 space-y-3">
                    {/* 점수 히어로 */}
                    <div className="flex items-center gap-3.5 rounded-2xl bg-[color:var(--v2-fill)] p-4">
                      <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${scoreTone(lastScore.score).bg}`}>
                        <span className={`text-[24px] font-bold leading-none ${scoreTone(lastScore.score).text}`}>{lastScore.score}</span>
                        <span className={`text-[10px] font-bold ${scoreTone(lastScore.score).text}`}>/ 100</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[color:var(--v2-ink)]">{lastScore.score >= 75 ? t("아주 좋아요!", "Great answer!", "非常好！", "Rất tốt!", "とても良い！", "Bagus sekali!") : lastScore.score >= 50 ? t("좋아요, 조금만 더!", "Good — a bit more!", "不错，再加把劲！", "Tốt, cố thêm chút!", "良い、あと少し！", "Bagus, sedikit lagi!") : t("보완하면 더 좋아져요", "Room to improve", "还有提升空间", "Còn có thể cải thiện", "改善の余地あり", "Bisa lebih baik")}</p>
                        <p className="mt-0.5 break-keep text-[12px] leading-relaxed text-[color:var(--v2-faint)]">{t("이 답변에 대한 평가예요", "Evaluation of this answer", "对本次回答的评估", "Đánh giá câu trả lời này", "この回答の評価です", "Evaluasi jawaban ini")}</p>
                      </div>
                    </div>
                    {/* 내 답변 */}
                    {lastScore.answer ? <div className="rounded-2xl bg-white p-3.5"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--v2-faint)]">{t("내 답변", "Your answer", "我的回答", "Câu trả lời của tôi", "私の回答", "Jawabanku")}</p><p className="mt-1.5 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[color:var(--v2-ink-3)]">{lastScore.answer}</p></div> : null}
                    {lastScore.feedback ? <div className="rounded-2xl bg-[#fff4e8] p-3.5"><p className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#c2410c]"><span className="h-1.5 w-1.5 rounded-full bg-[#e8590c]" aria-hidden />{t("피드백", "Feedback", "反馈", "Nhận xét", "フィードバック", "Umpan balik")}</p><p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#7A5A17]">{lastScore.feedback}</p></div> : null}
                    {lastScore.modelAnswer ? (
                      <div className="rounded-2xl bg-[color:var(--v2-accent-weak)] p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-[color:var(--v2-accent)]"><span className="h-1.5 w-1.5 rounded-full bg-[color:var(--v2-accent)]" aria-hidden />{t("이렇게 답하면 좋아요", "A stronger way to answer", "这样回答更好", "Cách trả lời tốt hơn", "こう答えると良い", "Cara jawab lebih baik")}</p>
                          {/* 모범 답안을 자연스러운 한국어로 들어 보기 */}
                          <SpeakButton t={pt} tts={qTts} text={lastScore.modelAnswer} />
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#28407A]">{lastScore.modelAnswer}</p>
                      </div>
                    ) : null}
                    {lastScore.speakingData ? <SpeakingReportCard data={lastScore.speakingData} /> : null}
                    <div className="mt-1 flex flex-col gap-2">
                      {/* 실전처럼 — 면접관이 방금 답을 파고든다(질문당 최대 2번) */}
                      <FollowUpButton question={questions[idx]} answer={lastScore.answer} context={label} depth={depthAt(idx)} onReady={askFollowUp} />
                      <button type="button" onClick={() => void next()} disabled={loadingNext} className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--v2-accent)] px-5 py-3 text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
                        {loadingNext ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
                        {loadingNext ? t("다음 질문 준비 중…", "Preparing next…", "准备下一题…", "Đang chuẩn bị…", "次の質問を準備中…", "Menyiapkan…") : t("다음 질문", "Next question", "下一题", "Câu tiếp", "次の質問", "Soal berikutnya")}
                        {loadingNext ? null : <ArrowRight className="h-4 w-4" weight="bold" />}
                      </button>
                      <button type="button" onClick={finish} disabled={loadingNext} className="w-full rounded-2xl bg-[color:var(--v2-band)] px-5 py-2.5 text-[13px] font-bold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)] disabled:opacity-60">
                        {t("여기까지 · 결과 보기", "Finish · see results", "到此为止 · 查看结果", "Dừng · xem kết quả", "ここまで · 結果を見る", "Selesai · lihat hasil")}
                      </button>
                      {nextError ? <p className="text-center text-[12px] font-semibold text-[color:var(--v2-attention)]">{t("다음 질문을 만들지 못했어요. 다시 시도해 주세요.", "Couldn't create the next question. Please try again.", "无法生成下一题，请重试。", "Không tạo được câu hỏi tiếp. Thử lại nhé.", "次の質問を作れませんでした。もう一度お試しください。", "Gagal membuat soal berikutnya. Coba lagi.")}</p> : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6} placeholder={t("말로 답하거나 직접 써 보세요. 받아 적은 글은 고칠 수 있어요.", "Speak or type your answer. You can edit the transcript.", "把它当作真实面试来作答。", "Trả lời như phỏng vấn thật.", "本番の面接だと思って答えてください。", "Jawab seakan wawancara nyata.")} className="w-full resize-none rounded-2xl bg-white p-4 text-[16px] leading-relaxed text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:ring-2" />
                    {/* 말로 답하기 — 실제 면접처럼. 말한 시간·군말·멈춤을 재서 제출하면 말하기 리포트도 받는다 */}
                    <VoiceAnswerControls voice={voice} disabled={scoring} />
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <span className="hidden text-[11.5px] text-[color:var(--v2-faint)] sm:block">{t("💡 결론 먼저, 그다음 경험·근거 순으로", "💡 Conclusion first, then evidence", "💡 先结论，再举证据", "💡 Kết luận trước, rồi dẫn chứng", "💡 結論→根拠の順で", "💡 Kesimpulan dulu, lalu bukti")}</span>
                      <button type="button" onClick={() => void submit()} disabled={scoring || !input.trim()} className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-[color:var(--v2-accent)] px-5 py-3 text-[14px] font-bold text-white transition hover:opacity-90 disabled:opacity-50">{scoring ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}{scoring ? t("채점 중…", "Scoring…", "评分中…", "Đang chấm…", "採点中…", "Menilai…") : t("답변 제출", "Submit answer", "提交回答", "Gửi câu trả lời", "回答を提出", "Kirim jawaban")}</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[14px] font-bold text-[color:var(--v2-ink)]">{t("면접 결과", "Interview results", "面试结果", "Kết quả phỏng vấn", "面接結果", "Hasil wawancara")}</p>
                {items.length ? <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-2.5 py-1 text-[12px] font-bold text-[color:var(--v2-accent)]">{t("평균", "Avg", "平均", "TB", "平均", "Rata")} {Math.round(items.reduce((s, it) => s + it.score, 0) / items.length)}</span> : null}
              </div>
              <PostingResultList items={items} rescore={(q, a) => scoreBasicAnswer(focus, q, a)} onItemsChange={setItems} />
              <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl bg-[color:var(--v2-band)] p-4">
                <p className="break-keep text-[12.5px] leading-relaxed text-[color:var(--v2-ink-3)]">{t("점수가 낮은 문항은 '다시 답하기'로 오답노트처럼 연습해요. 기록은 저장돼요.", "Retry low-scoring questions like a review note. Your record is saved.", "对低分题用'重新作答'像错题本一样练习。记录会保存。", "Luyện lại câu điểm thấp như sổ sửa lỗi. Bản ghi được lưu.", "点数の低い問題は「もう一度答える」で復習ノートのように練習。記録は保存されます。", "Latih lagi soal berskor rendah. Rekaman tersimpan.")}</p>
                <button type="button" onClick={handleClose} className="shrink-0 rounded-xl bg-[color:var(--v2-accent)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90">{t("저장하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</button>
              </div>
            </div>
          )}
        </div>
      </main>
      {embedded ? null : <AplyFooter />}
    </div>
  );
}
