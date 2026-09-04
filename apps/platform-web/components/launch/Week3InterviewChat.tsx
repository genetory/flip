"use client";

// Week 3 실전 모의면접 — 세션 채점·리포트 백엔드(startSession/submitAnswer/completeSession)를 그대로 쓰되,
// 1·2주차 채팅과 동일한 풀스크린 채팅 UI(상단 '3주차/종료하고 나가기' · 말풍선 · 하단 입력창)로 진행한다.
// 진행 중에는 점수/코칭 미노출(실전감). 완료되면 모달을 닫고 카드에서 종합 리포트를 보여준다.
import { CaretLeft, X, PaperPlaneRight, CircleNotch, Microphone } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "./rich-text";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { useVisualViewport } from "../../lib/useVisualViewport";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";
import { startSession, submitAnswer, completeSession } from "../../lib/launch/week34";

type Msg = { role: "bot" | "user"; text: string; followUp?: boolean };

export function Week3InterviewChat({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const vp = useVisualViewport();
  const startedRef = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState<{ sessionId: string; questionId: string; index: number; total: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // 전송 완료(loading true→false) 시 입력창 포커스 복원.
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) inputRef.current?.focus();
    prevLoadingRef.current = loading;
  }, [loading]);

  // 세션 시작 — 첫 질문을 봇 말풍선으로.
  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    trackCareerFunnel("career_initial_mock_started");
    void (async () => {
      try {
        const { session: s, question, total } = await startSession("initial_mock");
        if (question) {
          setSession({ sessionId: s.id, questionId: question.id, index: 1, total });
          setMessages([{ role: "bot", text: question.question, followUp: Boolean(question.parentQuestionId) }]);
        } else {
          setMessages([{ role: "bot", text: t("지금은 면접을 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the interview right now 😥 Could you come back in a moment?", "现在无法开始面试 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu phỏng vấn 😥 Bạn quay lại sau một lát nhé?", "今は面接を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai wawancara 😥 Bisa kembali lagi sebentar lagi?") }]);
        }
      } catch {
        setMessages([{ role: "bot", text: t("지금은 면접을 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the interview right now 😥 Could you come back in a moment?", "现在无法开始面试 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu phỏng vấn 😥 Bạn quay lại sau một lát nhé?", "今は面接を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai wawancara 😥 Bisa kembali lagi sesaat lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    const sc = endRef.current?.parentElement;
    if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || finished || !session) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: a }]);
    setLoading(true);
    void (async () => {
      try {
        trackCareerFunnel("career_interview_answer_submitted");
        const { next, done } = await submitAnswer(session.sessionId, session.questionId, a);
        if (done || !next) {
          await completeSession(session.sessionId);
          trackCareerFunnel("career_initial_mock_completed");
          setFinished(true);
        } else {
          setSession({ ...session, questionId: next.id, index: session.index + 1 });
          setMessages((m) => [...m, { role: "bot", text: next.question, followUp: Boolean(next.parentQuestionId) }]);
        }
      } catch (e) {
        const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
        setMessages((m) => [...m, { role: "bot", text: quota ? t("지금은 AI 사용이 많아요. 잠시 후 다시 시도해 주세요.", "AI is busy right now. Please try again in a moment.", "AI 当前繁忙，请稍后再试。", "AI đang bận. Vui lòng thử lại sau giây lát.", "現在AIの利用が集中しています。少し後にお試しください。", "AI sedang sibuk. Silakan coba lagi sesaat lagi.") : t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
          <p className="text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{t("실전 모의면접", "Real mock interview", "实战模拟面试", "Phỏng vấn thử", "実戦模擬面接", "Wawancara simulasi")}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col px-5 pt-4 md:pt-6" style={{ height: vp ? vp.height - 56 : undefined, paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href="/career-launch/week/3" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
                <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("3주차", "Week 3", "第3周", "Tuần 3", "3週目", "Minggu 3")}
              </Link>
              <Link href="/career-launch/week/3" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}
          <div className="mt-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("3주차 · 실전 모의면접", "Week 3 · Real Mock Interview", "第3周 · 实战模拟面试", "Tuần 3 · Phỏng vấn thử", "Week 3 · 実戦模擬面接", "Minggu 3 · Wawancara simulasi")}</p>
              <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{t("공고·서류 기반 종합 실전면접", "Full mock based on your posting & documents", "基于公告与材料的综合实战面试", "Phỏng vấn dựa trên tin & hồ sơ", "求人・書類ベースの総合面接", "Wawancara berbasis lowongan & dokumen")}</h1>
            </div>
            {session && !finished ? (
              <span className="mt-1 shrink-0 rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-bold text-[#4E5968]">{t(`질문 ${session.index}`, `Q ${session.index}`, `问题 ${session.index}`, `Câu ${session.index}`, `質問 ${session.index}`, `Soal ${session.index}`)}{session.total ? ` / ~${session.total}` : ""}</span>
            ) : null}
          </div>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-[#EEF1F5] bg-gradient-to-b from-[#F7F9FF] to-white p-4 md:p-5">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[15px]">🎤</span>
                  <div className="max-w-[84%]">
                    {m.followUp ? <p className="mb-1 text-[11.5px] font-semibold text-[#C77700]">↳ {t("꼬리질문", "Follow-up", "追问", "Câu hỏi tiếp", "追加質問", "Lanjutan")}</p> : null}
                    <div className="whitespace-pre-wrap break-keep rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[14px] leading-relaxed text-[#191F28] shadow-[0_1px_3px_rgba(17,24,39,0.06)]">
                      <RichText text={m.text} />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-br-md bg-[#0B46E8] px-4 py-3 text-[14px] leading-relaxed text-white shadow-[0_2px_8px_-2px_rgba(11,70,232,0.4)]"><RichText text={m.text} /></div>
                </div>
              )
            )}
            {loading ? (
              <div className="flex items-end gap-2">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[15px]">🎤</span>
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2]" />
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]"><Microphone className="mr-1 inline h-3.5 w-3.5" /> {t("면접 중에는 점수를 보여주지 않아요 · 끝나면 종합 평가를 드려요 · 💾 자동 저장", "Scores are hidden during the interview · full feedback at the end · 💾 auto-saved", "面试中不显示分数 · 结束后提供综合评价 · 💾 自动保存", "Điểm ẩn trong phỏng vấn · đánh giá đầy đủ khi kết thúc · 💾 tự lưu", "面接中は点数を表示しません · 終了後に総合評価 · 💾 自動保存", "Skor disembunyikan selama wawancara · umpan balik lengkap di akhir · 💾 tersimpan otomatis")}</p>

          {finished ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-[#EEF1F5] bg-[#F7F9FF] p-5 text-center">
              <p className="text-[15px] font-black text-[#191F28]">🎉 {t("실전 모의면접이 끝났어요!", "Mock interview complete!", "实战模拟面试结束！", "Đã hoàn tất phỏng vấn thử!", "実戦模擬面接が終わりました！", "Wawancara simulasi selesai!")}</p>
              <p className="break-keep text-[13px] leading-relaxed text-[#4E5968]">{t("종합 리포트와 취약 패턴을 준비했어요. 3주차 페이지에서 확인해요.", "Your report and weakness patterns are ready. See them on the Week 3 page.", "已准备综合报告与弱点模式，请在第3周页面查看。", "Báo cáo và mẫu điểm yếu đã sẵn sàng. Xem ở trang Tuần 3.", "総合レポートと弱点パターンを用意しました。Week 3ページで確認できます。", "Laporan dan pola kelemahan siap. Lihat di halaman Minggu 3.")}</p>
              {embedded ? (
                <button type="button" onClick={onClose} className="mt-1 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("리포트 보기", "See report", "查看报告", "Xem báo cáo", "レポートを見る", "Lihat laporan")}</button>
              ) : (
                <Link href="/career-launch/week/3" className="mt-1 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("리포트 보기", "See report", "查看报告", "Xem báo cáo", "レポートを見る", "Lihat laporan")}</Link>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <form
                className="flex items-end gap-1.5 rounded-2xl border border-[#E5E8EB] bg-white p-1.5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition focus-within:border-[#0B46E8] focus-within:shadow-[0_0_0_3px_rgba(11,70,232,0.08)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <textarea ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder={t("실제 면접처럼 답변해 주세요", "Answer as in a real interview", "像真实面试一样作答", "Trả lời như phỏng vấn thật", "本番のように答えてください", "Jawab seperti wawancara nyata")}
                  disabled={loading || !session}
                  className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[16px] leading-[1.35] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-0 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || !session}
                  aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                    input.trim() && !loading && session ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#EEF1F5] text-[#B0B8C1]"
                  }`}
                >
                  {loading ? <CircleNotch className="h-5 w-5 animate-spin" weight="bold" /> : <PaperPlaneRight className="h-5 w-5" weight="fill" aria-hidden />}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      {embedded ? null : <AplyFooter />}
    </div>
  );
}
