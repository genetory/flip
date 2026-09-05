"use client";

// Week 3 실전 모의면접 — 세션 채점·리포트 백엔드(startSession/submitAnswer/completeSession)를 쓰되,
// 화면 UI/UX 는 공용 InterviewChatShell 로 4개 유형(자기소개·직무·인성·압박)과 통일한다.
// 진행 중에는 점수/코칭 미노출(실전감). 완료되면 모달을 닫고 카드에서 종합 리포트를 보여준다.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InterviewChatShell, type InterviewShellMsg } from "./InterviewChatShell";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";
import { startSession, submitAnswer, completeSession } from "../../lib/launch/week34";

export function Week3InterviewChat({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const startedRef = useRef(false);
  const [messages, setMessages] = useState<InterviewShellMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [session, setSession] = useState<{ sessionId: string; questionId: string; index: number; total: number } | null>(null);

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
          setMessages([{ role: "bot", text: t("지금은 면접을 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the interview right now 😥 Could you come back in a moment?", "现在无法开始面试 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu phỏng vấn 😥 Bạn quay lại sau một lát nhé?", "今は面接を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai wawancara 😥 Bisa kembali lagi sesaat lagi?") }]);
        }
      } catch {
        setMessages([{ role: "bot", text: t("지금은 면접을 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the interview right now 😥 Could you come back in a moment?", "现在无法开始面试 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu phỏng vấn 😥 Bạn quay lại sau một lát nhé?", "今は面接を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai wawancara 😥 Bisa kembali lagi sesaat lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || finished || !session) return;
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

  const completion = (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#EEF1F5] bg-[#F7F9FF] p-5 text-center">
      <p className="text-[15px] font-black text-[#191F28]">🎉 {t("실전 모의면접이 끝났어요!", "Mock interview complete!", "实战模拟面试结束！", "Đã hoàn tất phỏng vấn thử!", "実戦模擬面接が終わりました！", "Wawancara simulasi selesai!")}</p>
      <p className="break-keep text-[13px] leading-relaxed text-[#4E5968]">{t("종합 리포트와 취약 패턴을 준비했어요. 3주차 페이지에서 확인해요.", "Your report and weakness patterns are ready. See them on the Week 3 page.", "已准备综合报告与弱点模式，请在第3周页面查看。", "Báo cáo và mẫu điểm yếu đã sẵn sàng. Xem ở trang Tuần 3.", "総合レポートと弱点パターンを用意しました。Week 3ページで確認できます。", "Laporan dan pola kelemahan siap. Lihat di halaman Minggu 3.")}</p>
      {embedded ? (
        <button type="button" onClick={onClose} className="mt-1 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("리포트 보기", "See report", "查看报告", "Xem báo cáo", "レポートを見る", "Lihat laporan")}</button>
      ) : (
        <Link href="/career-launch/week/3" className="mt-1 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("리포트 보기", "See report", "查看报告", "Xem báo cáo", "レポートを見る", "Lihat laporan")}</Link>
      )}
    </div>
  );

  return (
    <InterviewChatShell
      embedded={embedded}
      onClose={onClose}
      backHref="/career-launch/week/3"
      weekLabel={t("3주차", "Week 3", "第3周", "Tuần 3", "3週目", "Minggu 3")}
      embeddedTitle={t("실전 모의면접", "Real mock interview", "实战模拟面试", "Phỏng vấn thử", "実戦模擬面接", "Wawancara simulasi")}
      eyebrow={t("3주차 · 실전 모의면접", "Week 3 · Real Mock Interview", "第3周 · 实战模拟面试", "Tuần 3 · Phỏng vấn thử", "Week 3 · 実戦模擬面接", "Minggu 3 · Wawancara simulasi")}
      title={t("공고·서류 기반 종합 실전면접", "Full mock based on your posting & documents", "基于公告与材料的综合实战面试", "Phỏng vấn dựa trên tin & hồ sơ", "求人・書類ベースの総合面接", "Wawancara berbasis lowongan & dokumen")}
      progress={session && !finished ? `${t(`질문 ${session.index}`, `Q ${session.index}`, `问题 ${session.index}`, `Câu ${session.index}`, `質問 ${session.index}`, `Soal ${session.index}`)}${session.total ? ` / ~${session.total}` : ""}` : null}
      messages={messages}
      loading={loading}
      note={t("면접 중에는 점수를 보여주지 않아요 · 끝나면 종합 평가를 드려요 · 💾 자동 저장", "Scores are hidden during the interview · full feedback at the end · 💾 auto-saved", "面试中不显示分数 · 结束后提供综合评价 · 💾 自动保存", "Điểm ẩn trong phỏng vấn · đánh giá đầy đủ khi kết thúc · 💾 tự lưu", "面接中は点数を表示しません · 終了後に総合評価 · 💾 自動保存", "Skor disembunyikan selama wawancara · umpan balik lengkap di akhir · 💾 tersimpan otomatis")}
      placeholder={t("실제 면접처럼 답변해 주세요", "Answer as in a real interview", "像真实面试一样作答", "Trả lời như phỏng vấn thật", "本番のように答えてください", "Jawab seperti wawancara nyata")}
      finished={finished}
      completion={completion}
      inputDisabled={!session}
      onSend={send}
    />
  );
}
