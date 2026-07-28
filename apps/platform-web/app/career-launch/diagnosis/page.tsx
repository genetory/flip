"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RichText } from "../../../components/launch/rich-text";
import { STUDENT } from "../../../lib/launch/data";
import { requestDiagnosisChat, type DiagnosisResult, type JobChatMsg } from "../../../lib/launch/job-chat-client";
import { fetchProgress, patchProgress } from "../../../lib/launch/progress-client";
import { trackCareerStepComplete, trackCareerFunnel } from "../../../lib/analytics";
import { Card } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

// Week 1 스텝1 — AI 코치가 짧은 대화로 취업 준비 상태를 진단하고, 준비도·강점·보완점을 준다.
// 진단 결과는 백엔드(career-launch/progress)에 계정 기준으로 저장 → 기기 간 동기화.
type Msg = { role: "bot" | "user"; text: string };

export default function LaunchDiagnosisPage() {
  // ?final=1 — 4주차 '수료 진단'. 서버가 이 플래그로 diagnosisFinal 을 기록해
  // 성과 리포트의 '사전 → 사후 향상도'를 만든다.
  const isFinal = useSearchParams().get("final") === "1";
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // 전송 완료(loading true→false) 시 입력창 포커스를 되돌려, 채팅 중 포커스가 풀리지 않게 한다.
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) inputRef.current?.focus();
    prevLoadingRef.current = loading;
  }, [loading]);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  const startChat = () => {
    setResult(null);
    setMessages([]);
    setLoading(true);
    trackCareerFunnel("profile_started");
    void (async () => {
      try {
        const { reply } = await requestDiagnosisChat([]);
        setMessages([{ role: "bot", text: reply || t(`${displayName}님, 반가워요 👋 취업 준비 상태를 함께 점검해볼까요?`, `Hi ${displayName} 👋 Shall we check your job-readiness together?`, `${displayName}，你好 👋 我们一起看看你的求职准备状态吧？`, `Chào ${displayName} 👋 Cùng kiểm tra mức độ sẵn sàng xin việc của bạn nhé?`, `${displayName}さん、こんにちは 👋 就職準備の状態を一緒にチェックしてみましょうか？`, `Hai ${displayName} 👋 Yuk kita cek kesiapan kariermu bersama?`) }]);
      } catch {
        setMessages([{ role: "bot", text: t("지금은 진단을 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the diagnosis right now 😥 Could you come back in a moment?", "现在无法开始诊断 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu chẩn đoán 😥 Bạn quay lại sau một lát nhé?", "今は診断を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai diagnosis 😥 Bisa kembali lagi sebentar lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    // ?restart=1 이면 저장 결과를 무시하고 처음부터 새 진단(완료 시 결과가 덮어씀).
    // ?final=1('수료 진단')도 마찬가지 — 저장된 사전 진단 결과를 보여주면 재진단이 되지 않는다.
    const restart = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("restart") === "1";
    if (restart || isFinal) {
      startChat();
      return;
    }
    // 이전에 진단한 결과가 있으면 대화 대신 그 결과를 바로 보여준다(다시 보기).
    void (async () => {
      try {
        const { diagnosis: s } = await fetchProgress();
        if (s && typeof s.percent === "number") {
          setResult({ percent: s.percent, level: s.level ?? "", strengths: s.strengths ?? [], improvements: s.improvements ?? [] });
          return;
        }
      } catch {
        // 무시하고 새 진단 시작
      }
      startChat();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, result]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || result) return;
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: JobChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, done, result: r } = await requestDiagnosisChat(history);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (done && r) {
          setResult(r);
          trackCareerStepComplete("diagnosis");
          trackCareerFunnel("profile_completed", { percent: r.percent });
          try {
            await patchProgress({
              diagnosis: { percent: r.percent, level: r.level, strengths: r.strengths, improvements: r.improvements },
              ...(isFinal ? { finalDiagnosis: true } : {})
            });
          } catch {
            // 저장 실패해도 화면엔 결과 표시
          }
        }
      } catch {
        setMessages((m) => [...m, { role: "bot", text: t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-5 pb-4 pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/1" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← {t("1주차", "Week 1", "第1周", "Tuần 1", "1週目", "Minggu 1")}
            </Link>
            <Link href="/career-launch/week/1" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            {!result ? (
              <button
                type="button"
                onClick={() => send("이 질문은 건너뛰고 다음으로 넘어갈게요.")}
                disabled={loading}
                className="rounded-full border border-[#D7DCE3] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8] disabled:opacity-40"
              >
                {t("넘어가기", "Skip", "跳过", "Bỏ qua", "スキップ", "Lewati")} ⏭
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="aply" className="h-full w-full object-contain p-1.5" /></span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">{t("취업 준비 상태 자가진단", "Job-Readiness Self-Diagnosis", "求职准备状态自我诊断", "Tự chẩn đoán mức độ sẵn sàng xin việc", "就職準備状態のセルフ診断", "Diagnosis Mandiri Kesiapan Karier")}</p>
              <p className="text-[12px] text-[#8B95A1]">{t("AI 코치와 대화하면 준비도를 알려드려요", "Chat with the AI coach and we'll tell you your readiness", "与 AI 教练对话，我们会告诉你准备程度", "Trò chuyện với huấn luyện viên AI và chúng tôi sẽ cho bạn biết mức độ sẵn sàng", "AIコーチと話すと準備度をお伝えします", "Mengobrol dengan pelatih AI dan kami akan memberi tahu tingkat kesiapanmu")} · ⏱ {t("약 10분", "About 10 min", "约 10 分钟", "Khoảng 10 phút", "約10分", "Sekitar 10 menit")}</p>
            </div>
          </div>

          {/* 대화 */}
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="aply" className="h-full w-full object-contain p-1" /></span>
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                    <RichText text={m.text} />
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#0B46E8] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white"><RichText text={m.text} /></div>
                </div>
              )
            )}
            {loading ? (
              <div className="flex items-end gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="aply" className="h-full w-full object-contain p-1" /></span>
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2]" />
                </div>
              </div>
            ) : null}

            {/* 진단 결과 카드 */}
            {result ? (
              <Card className="md:!p-5">
                <div className="text-center">
                  <p className="text-[12.5px] font-semibold text-[#8B95A1]">{t("나의 취업 준비도", "My Job-Readiness", "我的求职准备度", "Mức sẵn sàng xin việc của tôi", "私の就職準備度", "Tingkat Kesiapan Karierku")}</p>
                  <p className="mt-0.5 text-[38px] font-black leading-none text-[#0B46E8]">
                    {result.percent}
                    <span className="text-[20px]">%</span>
                  </p>
                  {result.level ? <p className="mt-2 text-[13.5px] font-bold text-[#191F28]">{result.level}</p> : null}
                </div>
                {result.strengths.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[12px] font-bold text-[#3A6B00]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                    <ul className="mt-1.5 space-y-1">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="flex gap-1.5 text-[13px] leading-relaxed text-[#333D4B]">
                          <span className="text-[#3A6B00]">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {result.improvements.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-[12px] font-bold text-[#0B46E8]">{t("이번 4주에 집중하면 좋은 점", "Worth focusing on over these 4 weeks", "接下来 4 周值得重点关注的地方", "Điều nên tập trung trong 4 tuần này", "この4週間で集中すると良い点", "Hal yang baik difokuskan selama 4 minggu ini")}</p>
                    <ul className="mt-1.5 space-y-1">
                      {result.improvements.map((s, i) => (
                        <li key={i} className="flex gap-1.5 text-[13px] leading-relaxed text-[#333D4B]">
                          <span className="text-[#0B46E8]">💡</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            ) : null}
            <div ref={endRef} />
          </div>

          {/* 입력 / 완료 */}
          {result ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={startChat}
                className="h-[46px] shrink-0 rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                {t("다시 진단하기", "Diagnose again", "重新诊断", "Chẩn đoán lại", "もう一度診断する", "Diagnosis ulang")}
              </button>
              <Link
                href="/career-launch/week/1"
                className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
              >
                {t("1주차 페이지로", "To Week 1 page", "前往第1周页面", "Đến trang Tuần 1", "1週目のページへ", "Ke halaman Minggu 1")} →
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              {/* 할 말이 없어 막힐 때를 위한 빠른 응답 — 대화가 끊기지 않게 */}
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                    { label: t("아직 준비 안 됐어요", "I'm not ready yet", "我还没准备好", "Tôi chưa sẵn sàng", "まだ準備できていません", "Saya belum siap"), send: "아직 준비 안 됐어요" },
                    { label: t("예시를 보여주세요", "Show me an example", "给我看个例子", "Cho tôi xem ví dụ", "例を見せてください", "Tunjukkan contohnya") , send: "예시를 보여주세요" }
                  ].map((q) => (
                    <button
                      key={q.send}
                      type="button"
                      onClick={() => send(q.send)}
                      className="rounded-full border border-[#D7DCE3] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8]"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              ) : null}
            <form
              className="flex items-end gap-2"
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
                placeholder={t("편하게 답해주세요", "Feel free to answer", "请随意回答", "Cứ thoải mái trả lời", "気軽に答えてください", "Jawab dengan santai")}
                disabled={loading}
                className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none disabled:bg-[#F8FAFC]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={`h-[46px] shrink-0 rounded-xl px-4 text-[14px] font-bold transition ${
                  input.trim() && !loading ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                }`}
              >
                {t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
              </button>
            </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
