"use client";
import { CaretLeft, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "./rich-text";
import { STUDENT } from "../../lib/launch/data";
import { requestInterviewChat, type InterviewChatMsg, type InterviewFocus, type InterviewReport } from "../../lib/launch/interview";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { useVisualViewport } from "../../lib/useVisualViewport";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { trackCareerStepComplete, trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";

type Msg = { role: "bot" | "user"; text: string };

// 페이지·모달 공용. 모달일 때 section 을 prop 으로 받아 URL 없이 유형을 지정한다.
export function InterviewChat({ embedded = false, onClose, section }: { embedded?: boolean; onClose?: () => void; section?: string }) {
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  const HEADER: Record<InterviewFocus, { title: string; sub: string }> = {
    self: {
      title: t("자기소개 면접", "Self-Introduction Interview", "自我介绍面试", "Phỏng vấn giới thiệu bản thân", "自己紹介面接", "Wawancara Perkenalan Diri"),
      sub: t("1분 자기소개·지원 동기·성격을 실전처럼 답해봐요", "Answer your 1-minute intro, motivation, and personality as if it's real", "像实战一样回答一分钟自我介绍、应聘动机和性格", "Trả lời phần giới thiệu 1 phút, động lực và tính cách như thật", "1分自己紹介・志望動機・性格を実践のように答えてみましょう", "Jawab perkenalan 1 menit, motivasi, dan kepribadian seperti sungguhan")
    },
    job: {
      title: t("직무 면접", "Job Interview", "职务面试", "Phỏng vấn chuyên môn", "職務面接", "Wawancara Pekerjaan"),
      sub: t("선정 직무·경력·프로젝트를 파고드는 실무 면접이에요", "A practical interview digging into your selected job, experience, and projects", "深入探讨选定职务、经历和项目的实务面试", "Phỏng vấn thực tế đào sâu công việc, kinh nghiệm và dự án đã chọn", "選定した職務・経歴・プロジェクトを掘り下げる実務面接です", "Wawancara praktis yang menggali pekerjaan pilihan, pengalaman, dan proyekmu")
    },
    fit: {
      title: t("인성·컬처핏 면접", "Personality & Culture-Fit Interview", "人品·文化契合面试", "Phỏng vấn tính cách & phù hợp văn hóa", "人柄・カルチャーフィット面接", "Wawancara Kepribadian & Kecocokan Budaya"),
      sub: t("협업·가치관·한국 적응 등 태도를 보는 면접이에요", "An interview assessing attitude like teamwork, values, and adapting to Korea", "考察协作、价值观、适应韩国等态度的面试", "Phỏng vấn đánh giá thái độ như hợp tác, giá trị và thích nghi với Hàn Quốc", "協働・価値観・韓国への適応など態度を見る面接です", "Wawancara menilai sikap seperti kerja sama, nilai, dan adaptasi di Korea")
    },
    pressure: {
      title: t("압박 면접", "Pressure Interview", "压力面试", "Phỏng vấn áp lực", "圧迫面接", "Wawancara Tekanan"),
      sub: t("꼬리질문·검증으로 답변의 근거를 파고드는 실전 대비 면접이에요", "A tough round of follow-ups that probes the basis of your answers", "以追问和验证深挖回答依据的实战面试", "Vòng hỏi dồn kiểm chứng cơ sở câu trả lời của bạn", "追い質問・検証で回答の根拠を掘り下げる実戦面接です", "Ronde pertanyaan lanjutan yang menggali dasar jawabanmu")
    }
  };
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const vp = useVisualViewport();
  const startedRef = useRef(false);
  const [focus, setFocus] = useState<InterviewFocus>("self");
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
  const [done, setDone] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    const sectionRaw = section ?? (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("section") : null);
    const f: InterviewFocus = sectionRaw === "job" ? "job" : sectionRaw === "fit" ? "fit" : sectionRaw === "pressure" ? "pressure" : "self";
    setFocus(f);
    trackCareerFunnel("mock_interview_started", { focus: f });
    void (async () => {
      try {
        const { reply } = await requestInterviewChat([], f);
        setMessages([{ role: "bot", text: reply || t(`${displayName}님, 반가워요 👋 모의면접을 시작해볼까요?`, `Hi ${displayName} 👋 Shall we start the mock interview?`, `${displayName}，你好 👋 我们开始模拟面试吧？`, `Chào ${displayName} 👋 Cùng bắt đầu phỏng vấn thử nhé?`, `${displayName}さん、こんにちは 👋 模擬面接を始めましょうか？`, `Hai ${displayName} 👋 Yuk kita mulai wawancara simulasi?`) }]);
      } catch {
        setMessages([{ role: "bot", text: t("지금은 면접을 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the interview right now 😥 Could you come back in a moment?", "现在无法开始面试 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu phỏng vấn 😥 Bạn quay lại sau một lát nhé?", "今は面接を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai wawancara 😥 Bisa kembali lagi sebentar lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  useEffect(() => {
    const _sc = endRef.current?.parentElement;
    if (_sc) _sc.scrollTo({ top: _sc.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || done) return;
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: InterviewChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, done: isDone, report: rep } = await requestInterviewChat(history, focus);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          trackCareerStepComplete(`interview_${focus}` as "interview_self" | "interview_job" | "interview_fit");
          trackCareerFunnel("mock_interview_completed", { focus });
          setDone(true);
          setReport(rep);
        }
      } catch (e) {
        const quota = e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
        setMessages((m) => [...m, { role: "bot", text: quota ? t("AI 포인트를 모두 사용했어요. 충전 후 다시 시도해 주세요.", "You've used all your AI points. Please recharge and try again.", "AI 积分已用完，请充值后再试。", "Bạn đã dùng hết điểm AI. Vui lòng nạp thêm và thử lại.", "AIポイントを使い切りました。チャージ後にもう一度お試しください。", "Poin AI habis. Silakan isi ulang lalu coba lagi.") : t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const h = HEADER[focus];

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
          <p className="text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{h.title}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col px-5 pt-4 md:pt-6" style={{ height: vp ? vp.height - 56 : undefined, paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
          {embedded ? null : (
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/4" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("4주차", "Week 4", "第4周", "Tuần 4", "4週目", "Minggu 4")}
            </Link>
            <Link href="/career-launch/week/4" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
          </div>
          )}
          <div className="mt-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("4주차 · 모의면접", "Week 4 · Mock Interview", "第4周 · 模拟面试", "Tuần 4 · Phỏng vấn thử", "Week 4 · 模擬面接", "Minggu 4 · Wawancara")}</p>
            <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{h.title}</h1>
            <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{h.sub}</p>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🎤</span>
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
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🎤</span>
                <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2]" />
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{t("💬 편하게 모국어로 답해도 돼요 · 💾 자동 저장", "💬 Feel free to answer in your own language · 💾 auto-saved", "💬 可以用你的母语回答 · 💾 自动保存", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 tự động lưu", "💬 母国語で答えてOK · 💾 自動保存", "💬 Boleh menjawab dalam bahasa ibumu · 💾 tersimpan otomatis")}</p>

          {done ? (
            <div className="mt-3 flex flex-col gap-3">
              {report && (report.strengths.length > 0 || report.improvements.length > 0 || report.modelAnswer) ? (
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">{t("이번 면접 준비도 리포트", "Your readiness report", "本次面试准备度报告", "Báo cáo mức sẵn sàng", "今回の準備度レポート", "Laporan kesiapan")}</p>
                  {report.strengths.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[12.5px] font-bold text-[#0A9B59]">💪 {t("잘한 점", "Strengths", "做得好", "Điểm mạnh", "良かった点", "Kelebihan")}</p>
                      <ul className="mt-1 space-y-1">
                        {report.strengths.map((s, i) => (
                          <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {report.improvements.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[12.5px] font-bold text-[#C77700]">✏️ {t("더 다듬을 점", "To improve", "可改进", "Cần cải thiện", "改善点", "Perlu diperbaiki")}</p>
                      <ul className="mt-1 space-y-1">
                        {report.improvements.map((s, i) => (
                          <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {report.modelAnswer ? (
                    <div className="mt-3 rounded-xl bg-[#F8FAFF] p-3">
                      <p className="text-[12.5px] font-bold text-[#0B46E8]">🧭 {t("모범 답변 방향", "Model answer direction", "范例答案方向", "Hướng trả lời mẫu", "模範解答の方向", "Arah jawaban contoh")}</p>
                      <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#333D4B]">{report.modelAnswer}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setDone(false);
                    setReport(null);
                  }}
                  className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
                >
                  {t("더 연습하기", "Practice more", "继续练习", "Luyện tập thêm", "もっと練習する", "Latihan lagi")}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    { label: t("모범 답변 보기", "See a model answer", "查看范例答案", "Xem câu trả lời mẫu", "模範解答を見る", "Lihat jawaban contoh"), send: "모범 답변 보기" },
                    { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                    { label: t("다시 답해볼게요", "Let me answer again", "我再回答一次", "Tôi trả lời lại", "もう一度答えてみます", "Saya jawab lagi") , send: "다시 답해볼게요" }
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
                  placeholder={t("면접관의 질문에 답해보세요", "Answer the interviewer's question", "请回答面试官的问题", "Hãy trả lời câu hỏi của người phỏng vấn", "面接官の質問に答えてみましょう", "Jawab pertanyaan pewawancara")}
                  disabled={loading}
                  className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[16px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none disabled:bg-[#F8FAFC]"
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
      {embedded ? null : <AplyFooter />}
    </div>
  );
}

