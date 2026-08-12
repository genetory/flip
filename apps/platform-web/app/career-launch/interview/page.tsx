"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "../../../components/launch/rich-text";
import { STUDENT } from "../../../lib/launch/data";
import { requestInterviewChat, type InterviewChatMsg, type InterviewFocus } from "../../../lib/launch/interview";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerStepComplete, trackCareerFunnel } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

// Week 4 — 이력서·자소서를 근거로 유형별 모의면접(자기소개/직무/인성·컬처핏)을 진행한다.
type Msg = { role: "bot" | "user"; text: string };

export default function InterviewPage() {
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
    }
  };
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    const sectionRaw = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("section") : null;
    const f: InterviewFocus = sectionRaw === "job" ? "job" : sectionRaw === "fit" ? "fit" : "self";
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
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
        const { reply, done: isDone } = await requestInterviewChat(history, focus);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          trackCareerStepComplete(`interview_${focus}` as "interview_self" | "interview_job" | "interview_fit");
          trackCareerFunnel("mock_interview_completed", { focus });
          setDone(true);
        }
      } catch {
        setMessages((m) => [...m, { role: "bot", text: t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度言っていただけますか？", "Ada sedikit masalah 😥 Bisa ulangi sekali lagi?") }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const h = HEADER[focus];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-5xl flex-col px-5 pb-4 pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/4" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← {t("4주차", "Week 4", "第4周", "Tuần 4", "4週目", "Minggu 4")}
            </Link>
            <Link href="/career-launch/week/4" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🎤</span>
            <div>
              <p className="text-[12px] font-bold text-[#0B46E8]">{t("모의면접", "Mock Interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara Simulasi")}</p>
              <p className="text-[15px] font-black text-[#0B1227]">{h.title}</p>
            </div>
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
          <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{t("💬 편하게 모국어로 답해도 돼요 · 💾 자동 저장 · ⚡ 메시지당 AI 포인트 1개 소모", "💬 Feel free to answer in your own language · 💾 auto-saved · ⚡ 1 AI point per message", "💬 可以用你的母语回答 · 💾 自动保存 · ⚡ 每条消息消耗1个AI积分", "💬 Bạn có thể trả lời bằng tiếng mẹ đẻ · 💾 tự động lưu · ⚡ 1 điểm AI mỗi tin nhắn", "💬 母国語で答えてOK · 💾 自動保存 · ⚡ メッセージごとにAIポイント1", "💬 Boleh menjawab dalam bahasa ibumu · 💾 tersimpan otomatis · ⚡ 1 poin AI per pesan")}</p>

          {done ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setDone(false)}
                className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                {t("더 연습하기", "Practice more", "继续练习", "Luyện tập thêm", "もっと練習する", "Latihan lagi")}
              </button>
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
      <AplyFooter />
    </div>
  );
}
