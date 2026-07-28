"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "../../../components/launch/rich-text";
import { STUDENT } from "../../../lib/launch/data";
import { requestCoverChat, fetchCoverData, resetCoverData, hasCoverContent, type CoverChatMsg, type CoverData, type CoverSection } from "../../../lib/launch/cover-data";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerStepComplete } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

// Week 3 — 별도 빌더로 가지 않고 AI와 대화하며 자기소개서를 채운다. 백엔드에 자동 저장.
type Msg = { role: "bot" | "user"; text: string };

export default function CoverCollectPage() {
  const t = useLaunchT();
  const { user, isReady } = useAuthSession();
  // 현재 작성하는 문항 표시용 라벨.
  const SECTION_LABEL: Record<CoverSection, string> = {
    motive: t("지원 동기", "Motivation to apply", "应聘动机", "Động lực ứng tuyển", "志望動機", "Motivasi melamar"),
    growth: t("성장 과정", "Personal background", "成长经历", "Quá trình trưởng thành", "成長過程", "Latar belakang"),
    strength: t("성격의 장단점·강점", "Strengths & weaknesses", "性格优缺点·强项", "Điểm mạnh & điểm yếu", "性格の長所・短所", "Kelebihan & kekurangan"),
    aspiration: t("입사 후 포부", "Aspirations after joining", "入职后的抱负", "Định hướng sau khi vào làm", "入社後の抱負", "Aspirasi setelah bergabung")
  };
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [data, setData] = useState<CoverData>({});
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
  const [focus, setFocus] = useState<CoverSection | undefined>(undefined); // 이 스텝이 집중할 문항
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    // ?section=motive|growth|strength|aspiration 이 스텝의 집중 문항(= 리셋 스코프). ?restart=1 이면 그 문항부터 초기화.
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const restart = params.get("restart") === "1";
    const sectionRaw = params.get("section");
    const section = (["motive", "growth", "strength", "aspiration"] as const).find((s) => s === sectionRaw);
    setFocus(section);
    void (async () => {
      let seed: CoverData = {};
      if (restart && section) {
        try {
          await resetCoverData(section);
        } catch {
          // 초기화 실패해도 남은 데이터로 진행
        }
      }
      // 초기화 후 남은 문항(부분 초기화 시)은 seed 로 이어간다. 전체 초기화면 빈 seed.
      try {
        const saved = await fetchCoverData();
        seed = saved.data ?? {};
        setData(seed);
      } catch {
        // 저장분 없음
      }
      // 이어하기(저장분 있음) — 즉시 반기고 미리보기를 띄운다.
      const continuing = hasCoverContent(seed);
      if (continuing) {
        setMessages([{ role: "bot", text: t(`${displayName}님, 다시 오셨네요 👋 이어서 마저 써볼게요!`, `Welcome back, ${displayName} 👋 Let's pick up where we left off!`, `${displayName}，欢迎回来 👋 我们接着把剩下的写完吧！`, `Chào mừng trở lại, ${displayName} 👋 Cùng tiếp tục viết nốt nhé!`, `${displayName}さん、おかえりなさい 👋 続きを一緒に書いていきましょう！`, `Selamat datang kembali, ${displayName} 👋 Ayo lanjutkan menulis yang belum selesai!`) }]);
      }
      try {
        const { reply, data: merged } = await requestCoverChat([], seed, section);
        setData(merged);
        setMessages((m) =>
          continuing
            ? [...m, { role: "bot", text: reply }]
            : [{ role: "bot", text: reply || t(`${displayName}님, 반가워요 👋 대화하면서 자기소개서를 함께 채워볼까요?`, `Hi ${displayName} 👋 Shall we write your cover letter together through a chat?`, `${displayName}，你好 👋 我们边聊边一起完成自我介绍书吧？`, `Chào ${displayName} 👋 Cùng trò chuyện và hoàn thiện thư giới thiệu của bạn nhé?`, `${displayName}さん、こんにちは 👋 会話しながら自己紹介書を一緒に書いていきましょうか？`, `Hai ${displayName} 👋 Yuk kita tulis cover letter-mu bersama sambil mengobrol?`) }]
        );
      } catch {
        setMessages((m) => (continuing ? [...m, { role: "bot", text: t("잠시 문제가 생겼어요 😥 다시 한 번 시도해줄래요?", "Something went wrong 😥 Could you try once more?", "出了点问题 😥 可以再试一次吗？", "Có chút trục trặc 😥 Bạn thử lại một lần nữa nhé?", "少し問題が発生しました 😥 もう一度試していただけますか？", "Ada sedikit masalah 😥 Bisa coba sekali lagi?") }] : [{ role: "bot", text: t("지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?", "We can't start the chat right now 😥 Could you come back in a moment?", "现在无法开始对话 😥 请稍后再进来好吗？", "Hiện chưa thể bắt đầu trò chuyện 😥 Bạn quay lại sau một lát nhé?", "今は会話を開始できません 😥 少し経ってからもう一度来ていただけますか？", "Saat ini belum bisa memulai obrolan 😥 Bisa kembali lagi sebentar lagi?") }]));
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
        const history: CoverChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, data: merged, done: isDone } = await requestCoverChat(history, data, focus);
        setData(merged);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          trackCareerStepComplete("cover");
          setDone(true);
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
            <Link href="/career-launch/week/3" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← {t("3주차", "Week 3", "第3周", "Tuần 3", "3週目", "Minggu 3")}
            </Link>
            <Link href="/career-launch/week/3" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]"><img src="/img_logo.webp" alt="aply" className="h-full w-full object-contain p-1.5" /></span>
            <div>
              <p className="text-[12px] font-bold text-[#0B46E8]">{t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Cover letter")}{focus ? t(" 작성 중", " in progress", " 编写中", " đang viết", " 作成中", " sedang dibuat") : ""}</p>
              <p className="text-[15px] font-black text-[#0B1227]">{focus ? SECTION_LABEL[focus] : t("대화로 자기소개서 채우기", "Write your cover letter through a chat", "边聊边填写自我介绍书", "Hoàn thiện thư giới thiệu qua trò chuyện", "会話で自己紹介書を埋める", "Isi cover letter lewat obrolan")}</p>
            </div>
          </div>

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
            <div ref={endRef} />
          </div>

          {done ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setDone(false)}
                className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                {t("계속 작성하기", "Keep writing", "继续编写", "Tiếp tục viết", "続けて作成する", "Lanjut menulis")}
              </button>
              <Link
                href="/career-launch/week/3"
                className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
              >
                {t("3주차 페이지로", "To Week 3 page", "前往第3周页面", "Đến trang Tuần 3", "3週目のページへ", "Ke halaman Minggu 3")} →
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    { label: t("잘 모르겠어요", "I'm not sure", "我不太清楚", "Tôi không chắc", "よく分かりません", "Saya kurang yakin"), send: "잘 모르겠어요" },
                    { label: t("예시를 보여주세요", "Show me an example", "给我看个例子", "Cho tôi xem ví dụ", "例を見せてください", "Tunjukkan contohnya"), send: "예시를 보여주세요" },
                    { label: t("다음 문항으로", "To the next question", "进入下一题", "Sang câu hỏi tiếp theo", "次の項目へ", "Ke pertanyaan berikutnya") , send: "다음 문항으로" }
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
              <div className="flex items-end gap-2">
                <form
                  className="flex flex-1 items-end gap-2"
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
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
