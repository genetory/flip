"use client";
import { CaretLeft, X, PaperPlaneRight, ArrowRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RichText } from "./rich-text";
import { STUDENT } from "../../lib/launch/data";
import { requestDiagnosisChat, type DiagnosisResult, type JobChatMsg } from "../../lib/launch/job-chat-client";
import { fetchProgress, patchProgress } from "../../lib/launch/progress-client";
import { trackCareerStepComplete, trackCareerFunnel } from "../../lib/analytics";
import { Card } from "./ui";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

type Msg = { role: "bot" | "user"; text: string };

// 페이지·모달 공용. embedded=true 면 헤더·푸터 없이 모달 셸에 맞춰 렌더.
export function DiagnosisChat({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
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
  // AI 선택형 질문의 보기 — 탭하면 그 답으로 전송.
  const [choices, setChoices] = useState<string[]>([]);

  const endRef = useRef<HTMLDivElement>(null);

  const startChat = () => {
    setResult(null);
    setMessages([]);
    setLoading(true);
    trackCareerFunnel("profile_started");
    void (async () => {
      try {
        const { reply, choices: ch } = await requestDiagnosisChat([]);
        setChoices(ch);
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
        const { diagnosis: s, diagnosisTranscript: tr } = await fetchProgress();
        if (s && typeof s.percent === "number") {
          // '다시 보기' — 저장해 둔 대화 기록이 있으면 질문·답변을 그대로 복원한다.
          if (Array.isArray(tr) && tr.length > 0) {
            setMessages(tr.filter((m) => m && (m.role === "bot" || m.role === "user") && typeof m.text === "string"));
          }
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
    // 내부 고정 스크롤 박스를 없애 컨텐츠가 페이지 스크롤에 함께 흐르도록 함 — 최신 메시지만 부드럽게 보이게.
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, loading, result]);

  // 적당한 지점에서 사용자가 직접 마무리 — 지금까지 대화로 진단 결과를 내달라고 요청.
  const finishNow = () => {
    if (loading || result) return;
    send(t("이제 충분해요. 더 묻지 말고, 지금까지 이야기한 내용만으로 제 취업 준비도를 진단해 주세요.", "That's enough. Please diagnose my job-readiness with what we've discussed so far — no more questions.", "够了。请不要再提问，用目前聊到的内容诊断我的求职准备度。", "Đủ rồi. Đừng hỏi thêm, hãy chẩn đoán mức sẵn sàng của tôi với những gì đã trao đổi.", "もう十分です。これ以上聞かず、今までの内容で私の就職準備度を診断してください。", "Sudah cukup. Tanpa bertanya lagi, diagnosis kesiapan kerja saya dari yang sudah kita bahas."));
  };

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || result) return;
    setInput("");
    setChoices([]);
    const nextMsgs: Msg[] = [...messages, { role: "user", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: JobChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, done, result: r, choices: ch } = await requestDiagnosisChat(history);
        setChoices(done ? [] : ch);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (done && r) {
          setResult(r);
          trackCareerStepComplete("diagnosis");
          trackCareerFunnel("profile_completed", { percent: r.percent });
          try {
            // 결과와 함께 대화 기록(질문·답변)도 저장해 '다시 보기' 때 복원한다.
            const transcript = [...nextMsgs, { role: "bot" as const, text: reply }];
            await patchProgress({
              diagnosis: { percent: r.percent, level: r.level, strengths: r.strengths, improvements: r.improvements },
              diagnosisTranscript: transcript,
              ...(isFinal ? { finalDiagnosis: true } : {})
            });
          } catch {
            // 저장 실패해도 화면엔 결과 표시
          }
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
          <p className="text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{t("첫 커리어 상담", "First career coaching", "求职准备状态自我诊断", "Tự chẩn đoán mức độ sẵn sàng", "就職準備状態のセルフ診断", "Diagnosis Mandiri Kesiapan Karier")}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className={embedded ? "flex-1 overflow-y-auto" : "flex-1 pb-16"}>
        <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-6 md:pb-40 md:pt-10">
          {embedded ? null : (
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/1" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("1주차", "Week 1", "第1周", "Tuần 1", "1週目", "Minggu 1")}
            </Link>
            <Link href="/career-launch/week/1" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
          </div>
          )}

          {/* 마스트헤드 */}
          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("1주차 · 진단", "Week 1 · Diagnosis", "第1周 · 诊断", "Tuần 1 · Chẩn đoán", "Week 1 · 診断", "Minggu 1 · Diagnosis")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{t("첫 커리어 상담", "First career coaching", "求职准备状态自我诊断", "Tự chẩn đoán mức độ sẵn sàng xin việc", "就職準備状態のセルフ診断", "Diagnosis Mandiri Kesiapan Karier")}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("AI 코치와 대화하면 준비도를 알려드려요", "Chat with the AI coach and we'll tell you your readiness", "与 AI 教练对话，我们会告诉你准备程度", "Trò chuyện với huấn luyện viên AI và chúng tôi sẽ cho bạn biết mức độ sẵn sàng", "AIコーチと話すと準備度をお伝えします", "Mengobrol dengan pelatih AI dan kami akan memberi tahu tingkat kesiapanmu")} · ⏱ {t("약 10분", "About 10 min", "约 10 分钟", "Khoảng 10 phút", "約10分", "Sekitar 10 menit")}</p>
          </div>

          {/* 좌: 대화(입력) · 우: 결과(미리보기) — 내 커리어 이력서 빌더와 동일한 2단 */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* ── 좌: 대화 ── */}
            <div className="flex min-w-0 flex-col">
              <div className="min-h-[42vh] space-y-4 rounded-3xl border border-[#EEF1F5] bg-gradient-to-b from-[#F7F9FF] to-white p-4 md:p-5">
                {messages.map((m, i) =>
                  m.role === "bot" ? (
                    <div key={i} className="flex items-end gap-2">
                      <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_1px_3px_rgba(17,24,39,0.08)] ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                      <div className="max-w-[84%] whitespace-pre-wrap break-keep rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[14px] leading-relaxed text-[#191F28] shadow-[0_1px_3px_rgba(17,24,39,0.06)]">
                        <RichText text={m.text} />
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
                    <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_1px_3px_rgba(17,24,39,0.08)] ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" /></span>
                    <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(17,24,39,0.06)]">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#B0B8C1] [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#B0B8C1] [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#B0B8C1]" />
                    </div>
                  </div>
                ) : null}
                {/* AI 선택형 질문의 보기 — 말풍선 아래에 탭 버튼으로 */}
                {choices.length > 0 && !loading ? (
                  <div className="flex flex-wrap gap-2 pl-10">
                    {choices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => send(c)}
                        className="rounded-full border border-[#0B46E8]/30 bg-[#EDF1FD] px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
              <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{t("💬 편하게 모국어로 답해도 돼요 · 💾 자동 저장", "💬 Feel free to answer in your own language · 💾 auto-saved", "💬 可以用你的母语回答 · 💾 自动保存", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 tự động lưu", "💬 母国語で答えてOK · 💾 自動保存", "💬 Boleh menjawab dalam bahasa ibumu · 💾 tersimpan otomatis")}</p>

              {/* 입력 / 완료 */}
              {result ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {/* 대화가 끝나면 이 화면을 벗어나 다음 단계로 갈 수 있게 — 모달이면 닫기, 페이지면 1주차로. */}
                  {embedded ? (
                    <button
                      type="button"
                      onClick={() => onClose?.()}
                      className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
                    >
                      {t("다음 단계로 계속하기", "Continue to the next step", "继续下一步", "Tiếp tục bước tiếp theo", "次のステップへ進む", "Lanjut ke langkah berikutnya")}
                      <ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden />
                    </button>
                  ) : (
                    <Link
                      href="/career-launch/week/1"
                      className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
                    >
                      {t("다음 단계로 계속하기", "Continue to the next step", "继续下一步", "Tiếp tục bước tiếp theo", "次のステップへ進む", "Lanjut ke langkah berikutnya")}
                      <ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={startChat}
                    className="h-[46px] shrink-0 rounded-xl bg-[#F2F4F6] px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
                  >
                    {t("다시 진단하기", "Diagnose again", "重新诊断", "Chẩn đoán lại", "もう一度診断する", "Diagnosis ulang")}
                  </button>
                </div>
              ) : (
                <div className="mt-5">
                  {/* 막힐 때 빠른 응답 + 넘어가기 */}
                  {messages.length > 0 && !loading ? (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {[
                        { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                        { label: t("아직 준비 안 됐어요", "I'm not ready yet", "我还没准备好", "Tôi chưa sẵn sàng", "まだ準備できていません", "Saya belum siap"), send: "아직 준비 안 됐어요" },
                        { label: t("예시를 보여주세요", "Show me an example", "给我看个例子", "Cho tôi xem ví dụ", "例を見せてください", "Tunjukkan contohnya"), send: "예시를 보여주세요" }
                      ].map((q) => (
                        <button
                          key={q.send}
                          type="button"
                          onClick={() => send(q.send)}
                          className="rounded-full bg-[#F2F4F6] px-4 py-2.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]"
                        >
                          {q.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => send("이 질문은 건너뛰고 다음으로 넘어갈게요.")}
                        disabled={loading}
                        className="rounded-full bg-[#F2F4F6] px-4 py-2.5 text-[12.5px] font-semibold text-[#8B95A1] transition hover:bg-[#E5E8EB] disabled:opacity-40"
                      >
                        {t("넘어가기", "Skip", "跳过", "Bỏ qua", "スキップ", "Lewati")} ⏭
                      </button>
                    </div>
                  ) : null}
                  {/* 통합 입력 바 — 텍스트필드와 전송 버튼을 한 컨테이너에 넣어 높이를 정확히 맞춘다(둘 다 44px). */}
                  <form
                    className="flex items-end gap-1.5 rounded-2xl border border-[#E5E8EB] bg-white p-1.5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition focus-within:border-[#0B46E8] focus-within:shadow-[0_0_0_3px_rgba(11,70,232,0.08)]"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                  >
                    <textarea
                      ref={inputRef}
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
                      className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[16px] leading-[1.35] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-0 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                        input.trim() && !loading ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#EEF1F5] text-[#B0B8C1]"
                      }`}
                    >
                      <PaperPlaneRight className="h-5 w-5" weight="fill" aria-hidden />
                    </button>
                  </form>
                  {messages.length > 1 && !loading ? (
                    <button type="button" onClick={finishNow} className="mt-2 w-full rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
                      {t("이 정도면 충분해요 · 진단 결과 보기", "That's enough · see my result", "够了 · 查看诊断结果", "Đủ rồi · xem kết quả", "十分です · 診断結果を見る", "Cukup · lihat hasil")}
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── 우: 결과(미리보기, sticky) ── */}
            <div className={result ? "block" : "hidden lg:block"}>
              <div className="lg:sticky lg:top-20">
                <p className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("진단 결과", "Diagnosis result", "诊断结果", "Kết quả chẩn đoán", "診断結果", "Hasil diagnosis")}</p>
                {result ? (
                  <Card className="md:!p-6">
                    <div className="text-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("나의 취업 준비도", "My Job-Readiness", "我的求职准备度", "Mức sẵn sàng xin việc của tôi", "私の就職準備度", "Tingkat Kesiapan Karierku")}</p>
                      <p className="mt-1.5 text-[42px] font-black leading-none tracking-[-0.02em] text-[#0B46E8]">
                        {result.percent}
                        <span className="text-[20px]">%</span>
                      </p>
                      {result.level ? <p className="mt-2 text-[13.5px] font-bold text-[#191F28]">{result.level}</p> : null}
                      <div className="mx-auto mt-4 h-1.5 max-w-[280px] overflow-hidden rounded-full bg-[#EEF1F5]">
                        <div className="h-full rounded-full bg-[#0B46E8] transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(100, result.percent))}%` }} />
                      </div>
                    </div>
                    {result.strengths.length > 0 ? (
                      <div className="mt-6 border-t border-[#F2F4F6] pt-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0A9B59]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
                        <ul className="mt-1.5 space-y-1">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="flex gap-1.5 text-[13px] leading-relaxed text-[#333D4B]">
                              <span className="text-[#0A9B59]">✓</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {result.improvements.length > 0 ? (
                      <div className="mt-5 border-t border-[#F2F4F6] pt-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0B46E8]">{t("이번 4주에 집중하면 좋은 점", "Worth focusing on over these 4 weeks", "接下来 4 周值得重点关注的地方", "Điều nên tập trung trong 4 tuần này", "この4週間で集中すると良い点", "Hal yang baik difokuskan selama 4 minggu ini")}</p>
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
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-6 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>🧭</span>
                    <p className="mt-3 text-[13.5px] font-bold text-[#191F28]">{t("진단이 끝나면 여기에", "Your result appears here", "诊断结束后显示在这里", "Kết quả sẽ hiện ở đây", "診断が終わるとここに", "Hasil muncul di sini")}</p>
                    <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("대화를 마치면 준비도(%)와 강점·보완점이 정리돼요.", "When the chat ends, your readiness (%) and strengths & areas to improve appear here.", "对话结束后，会整理出你的准备度(%)与优势·待改进点。", "Khi trò chuyện xong, mức sẵn sàng (%) và điểm mạnh & cần cải thiện sẽ hiện ra.", "会話が終わると準備度(%)と強み・補う点がまとまります。", "Setelah obrolan selesai, kesiapan (%) dan kelebihan & area perbaikan akan tampil.")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <AplyFooter />
      </main>
    </div>
  );
}

