"use client";

// 섹션별 AI 대화 모달 — career-launch 이력서·자기소개서를 대화로 채운다.
// request(history) 가 해당 섹션 focus 로 백엔드 챗을 호출하고, 갱신된 데이터를
// 부모(빌더)에 반영한 뒤 {reply, done} 을 돌려준다. 편집 필드·A4 미리보기는 부모가 갱신.
import { useEffect, useRef, useState } from "react";
import { X, PaperPlaneTilt, CircleNotch, Sparkle } from "@phosphor-icons/react";
import { RichText } from "./rich-text";
import { useLaunchT } from "../../lib/launch/i18n";
import { useLockBodyScroll } from "../../lib/talent/useLockBodyScroll";
import { useVisualViewport } from "../../lib/useVisualViewport";

type Msg = { role: "bot" | "user"; text: string };

export function SectionChatModal({
  title,
  request,
  onClose
}: {
  title: string;
  request: (history: Msg[]) => Promise<{ reply: string; done: boolean }>;
  onClose: () => void;
}) {
  const t = useLaunchT();
  useLockBodyScroll();
  const vp = useVisualViewport();
  // AI 일시 사용 불가/한도 감지 → 안내 메시지(커리어 런치는 무료 — 포인트 아님).
  const isQuota = (e: unknown) => e instanceof Error && /quota|402|포인트|ticket/i.test(e.message);
  const quotaText = t(
    "지금은 AI 사용이 많아요. 잠시 후 다시 시도해 주세요.",
    "AI is busy right now. Please try again in a moment.",
    "AI 当前繁忙，请稍后再试。",
    "AI đang bận. Vui lòng thử lại sau giây lát.",
    "現在AIの利用が集中しています。少し後にお試しください。",
    "AI sedang sibuk. Silakan coba lagi sesaat lagi."
  );
  const notifyUsage = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
  };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      setLoading(true);
      try {
        const { reply } = await request([]);
        notifyUsage();
        setMessages([{ role: "bot", text: reply || t("무엇부터 채워볼까요?", "What should we fill in first?", "先填哪一项？", "Bắt đầu từ đâu nhé?", "何から埋めましょうか？", "Mulai dari mana?") }]);
      } catch (e) {
        setMessages([{ role: "bot", text: isQuota(e) ? quotaText : t("지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 시도해줄래요?", "Can't start the chat right now 😥 Please try again in a moment.", "现在无法开始对话 😥 请稍后再试。", "Hiện chưa thể bắt đầu 😥 Vui lòng thử lại sau.", "今は会話を開始できません 😥 少し後にもう一度お試しください。", "Belum bisa memulai 😥 Coba lagi sebentar.") }]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", text: a }];
    setMessages(next);
    setLoading(true);
    void (async () => {
      try {
        const { reply } = await request(next);
        notifyUsage();
        setMessages((m) => [...m, { role: "bot", text: reply }]);
      } catch (e) {
        setMessages((m) => [...m, { role: "bot", text: isQuota(e) ? quotaText : t("잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?", "Something went wrong 😥 Could you say that once more?", "出了点问题 😥 可以再说一次吗？", "Có chút trục trặc 😥 Bạn nói lại nhé?", "少し問題が発生しました 😥 もう一度お願いします。", "Ada masalah 😥 Bisa ulangi?") }]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4" style={vp ? { top: vp.offsetTop, height: vp.height, bottom: "auto" } : undefined} onClick={onClose}>
      <div className="flex h-full w-full max-w-[460px] flex-col overflow-hidden rounded-3xl bg-white sm:h-[76vh] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-2 border-b border-[#EEF1F5] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0B46E8]">{t("AI 코치", "AI coach", "AI 教练", "AI coach", "AIコーチ", "AI coach")}</p>
              <p className="truncate text-[14px] font-black text-[#0B1227]">{title}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F6F8FB]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 대화 */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAFBFC] p-4">
          {messages.map((m, i) =>
            m.role === "bot" ? (
              <div key={i} className="flex items-end gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" />
                </span>
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                  <RichText text={m.text} />
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#0B46E8] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">
                  <RichText text={m.text} />
                </div>
              </div>
            )
          )}
          {loading ? (
            <div className="flex items-end gap-2">
              <span className="flex h-7 w-7 flex-none items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E8EB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img_logo.webp" alt="Aply" className="h-full w-full object-contain p-1" />
              </span>
              <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9CDD2]" />
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        {/* 입력 */}
        <div className="border-t border-[#EEF1F5] p-3">
          <p className="mb-2 flex flex-wrap items-center gap-x-1.5 px-1 text-[11px] text-[#B0B8C1]">
            <span>{t("💬 모국어로 답해도 돼요 · 자동 저장", "💬 Answer in your own language · auto-saved", "💬 可以用母语回答 · 自动保存", "💬 Trả lời bằng tiếng mẹ đẻ · tự động lưu", "💬 母国語で答えてOK · 自動保存", "💬 Jawab dengan bahasa ibu · tersimpan otomatis")}</span>
          </p>
          <form
            className="flex items-end gap-2"
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
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[16px] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] disabled:bg-[#F8FAFC]"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
              className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl transition ${input.trim() && !loading ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}
            >
              {loading ? <CircleNotch className="h-5 w-5 animate-spin" weight="bold" /> : <PaperPlaneTilt className="h-5 w-5" weight="fill" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
