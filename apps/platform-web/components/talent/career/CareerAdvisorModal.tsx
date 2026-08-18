"use client";

// AI 커리어 상담 — 대화로 '무엇을 하고 싶은지'를 깊이 탐색하고, 마지막에 어울리는 포지션을 정리해 준다.
import { useEffect, useRef, useState } from "react";
import { X, PaperPlaneTilt, Sparkle, CircleNotch, ArrowClockwise } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { careerAdvise, type AdvisorMsg } from "../../../lib/talent/career-advisor-client";
import { loadAdvisorChat, saveAdvisorChat, clearAdvisorChat } from "../../../lib/talent/career-advisor-store";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT } from "../../../lib/i18n";

type Msg = { role: "bot" | "user"; text: string };

export function CareerAdvisorModal({ onClose }: { onClose: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  const { user } = useAuthSession();
  const uid = user?.id ?? "anon";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const started = useRef(false);

  // 대화 기록 → API 형식.
  const history = (msgs: Msg[]): AdvisorMsg[] => msgs.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text }));

  const greetFallback = t(
    "안녕하세요! 저는 당신에게 어울리는 일을 함께 찾아갈 AI 커리어 상담사예요. 혹시 지금 마음에 두고 있는, 하고 싶은 직무가 있으세요? 있으면 그 일에 대해 더 깊이 이야기 나눠보고, 아직 없다면 함께 찾아드릴게요. 😊",
    "Hi! I'm your AI career counselor, here to find work that fits you. Do you already have a role in mind you'd like to do? If so, let's dig into it together — if not, we'll figure one out. 😊",
    "你好！我是你的 AI 职业顾问，帮你找到适合的工作。你现在心里有想做的职位吗？有的话我们就深入聊聊，没有的话就一起找找。😊",
    "Xin chào! Tôi là cố vấn nghề nghiệp AI, giúp bạn tìm công việc phù hợp. Bạn đã có vị trí nào muốn làm chưa? Nếu có, hãy cùng tìm hiểu sâu hơn — nếu chưa, mình sẽ cùng tìm nhé. 😊",
    "こんにちは！あなたに合う仕事を一緒に探すAIキャリア相談員です。今、やってみたい職種はありますか？あれば一緒に深く掘り下げ、まだなら一緒に見つけましょう。😊",
    "Hai! Saya konselor karier AI, membantu menemukan pekerjaan yang cocok untukmu. Sudah ada posisi yang ingin kamu jalani? Kalau ada, mari bahas lebih dalam — kalau belum, kita cari bersama. 😊"
  );
  const errFallback = t(
    "지금은 대화를 잇기 어려워요 😥 잠시 후 다시 시도해 주실래요?",
    "I can't continue right now 😥 Could you try again in a moment?",
    "现在无法继续对话 😥 请稍后再试好吗？",
    "Hiện chưa thể tiếp tục 😥 Bạn thử lại sau một lát nhé?",
    "今は会話を続けられません 😥 少し経ってからもう一度お試しください。",
    "Belum bisa melanjutkan sekarang 😥 Coba lagi sebentar lagi ya."
  );

  // 스크롤 항상 하단으로.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // 인사말 요청(대화 처음 시작할 때).
  function kickoff() {
    setLoading(true);
    void careerAdvise([])
      .then((r) => setMessages([{ role: "bot", text: r.reply || greetFallback }]))
      .catch(() => setMessages([{ role: "bot", text: greetFallback }]))
      .finally(() => setLoading(false));
  }

  // 첫 진입 — 저장된 대화가 있으면 이어보고, 없으면 인사말.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const saved = loadAdvisorChat(uid);
    if (saved.length) setMessages(saved as Msg[]);
    else kickoff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 대화가 바뀌면 로컬에 저장 → 다시 열어도 이어볼 수 있게.
  useEffect(() => {
    if (messages.length) saveAdvisorChat(uid, messages);
  }, [messages]);

  // 완전히 새로 시작 — 저장 기록 삭제 후 인사말부터.
  function resetChat() {
    clearAdvisorChat(uid);
    setConfirmReset(false);
    setInput("");
    setMessages([]);
    kickoff();
  }

  function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    void careerAdvise(history(next))
      .then((r) => setMessages((cur) => [...cur, { role: "bot", text: r.reply || errFallback }]))
      .catch(() => setMessages((cur) => [...cur, { role: "bot", text: errFallback }]))
      .finally(() => {
        setLoading(false);
        inputRef.current?.focus();
      });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm">
      <div className="relative flex h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-white sm:h-[720px] sm:rounded-3xl">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[15px] font-black tracking-[-0.02em] text-[#0B1227]"><Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" /> {t("AI 커리어 상담", "AI career chat", "AI 职业咨询", "Tư vấn nghề AI", "AIキャリア相談", "Konsultasi karier AI")}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{t("나에게 어울리는 직무와 방향을 함께 찾아요", "Find roles and direction that fit you", "一起找到适合你的职位与方向", "Cùng tìm vị trí và hướng đi phù hợp", "自分に合う職種と方向を一緒に探す", "Temukan peran & arah yang cocok")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={messages.length === 0}
              className="flex h-9 items-center gap-1 rounded-2xl px-2.5 text-[12px] font-bold text-[#8B95A1] transition hover:bg-[#F2F4F6] disabled:opacity-40"
            >
              <ArrowClockwise className="h-4 w-4" weight="bold" /> {t("새로 시작", "Restart", "重新开始", "Bắt đầu lại", "やり直す", "Mulai ulang")}
            </button>
            <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* 대화 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={m.role === "user"
                  ? "max-w-[82%] whitespace-pre-wrap break-keep rounded-2xl rounded-tr-md bg-[#0B46E8] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white"
                  : "max-w-[88%] whitespace-pre-wrap break-keep rounded-2xl rounded-tl-md bg-[#F4F6F9] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28]"}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 pl-1 text-[#8B95A1]">
                <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
                <span className="text-[12.5px]">{t("생각하고 있어요…", "Thinking…", "思考中…", "Đang suy nghĩ…", "考えています…", "Sedang berpikir…")}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* 입력 */}
        <div className="border-t border-[#F2F4F6] px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder={t("편하게 이야기해 주세요…", "Share freely…", "随便聊聊…", "Cứ chia sẻ…", "気軽に話してください…", "Ceritakan saja…")}
              className="max-h-[120px] min-h-[44px] flex-1 resize-none break-keep rounded-2xl bg-[#F5F6F8] px-3.5 py-3 text-[16px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition hover:bg-[#0A3ECB] disabled:opacity-40"
            >
              <PaperPlaneTilt className="h-5 w-5" weight="fill" />
            </button>
          </div>
        </div>

        {/* 새로 시작 확인 — 대화가 날아가기 전에 한번 더 확인 */}
        {confirmReset ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0B1227]/35 p-6 backdrop-blur-sm">
            <div className="w-full max-w-[320px] rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(11,18,39,0.22)]">
              <p className="text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{t("대화를 새로 시작할까요?", "Restart the conversation?", "重新开始对话？", "Bắt đầu lại cuộc trò chuyện?", "会話をやり直しますか？", "Mulai ulang percakapan?")}</p>
              <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("지금까지의 상담 내용이 모두 지워지고 처음부터 다시 시작해요.", "Your whole conversation so far will be erased and start over.", "目前的咨询内容将全部清除并从头开始。", "Toàn bộ nội dung tư vấn sẽ bị xóa và bắt đầu lại.", "これまでの相談内容がすべて消えて最初からになります。", "Seluruh percakapan akan dihapus dan dimulai ulang.")}</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-xl bg-[#F2F4F6] py-2.5 text-[13.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
                <button type="button" onClick={resetChat} className="flex-1 rounded-xl bg-[#F04452] py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#D93A48]">{t("새로 시작", "Restart", "重新开始", "Bắt đầu lại", "やり直す", "Mulai ulang")}</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
