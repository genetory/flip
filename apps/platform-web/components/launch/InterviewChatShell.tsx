"use client";

// 모든 모의면접 화면(자기소개·직무·인성·압박 4유형 + 실전 모의면접)이 공유하는 공용 채팅 셸.
// 상단바·뒤로가기·헤더·말풍선·입력창·빠른답변·완료영역의 UI/UX를 한곳에서 통일한다.
// 입력값·스크롤·포커스는 셸이 관리하고, 대화 로직(messages·send·완료)은 각 화면이 주입한다.
import { CaretLeft, X, PaperPlaneRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { RichText } from "./rich-text";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { AplyFooter } from "../AplyFooter";
import { useVisualViewport } from "../../lib/useVisualViewport";
import { useLaunchT } from "../../lib/launch/i18n";

export type InterviewShellMsg = { role: "bot" | "user"; text: string; followUp?: boolean };
export type InterviewQuickReply = { label: string; value: string };

export function InterviewChatShell({
  embedded = false,
  onClose,
  backHref,
  weekLabel,
  embeddedTitle,
  eyebrow,
  title,
  sub,
  progress = null,
  messages,
  loading,
  note,
  placeholder,
  quickReplies = [],
  finished,
  completion,
  inputDisabled = false,
  onSend
}: {
  embedded?: boolean;
  onClose?: () => void;
  backHref: string;
  weekLabel: string;
  embeddedTitle: string;
  eyebrow: string;
  title: string;
  sub?: string;
  progress?: string | null;
  messages: InterviewShellMsg[];
  loading: boolean;
  note: string;
  placeholder: string;
  quickReplies?: InterviewQuickReply[];
  finished: boolean;
  completion?: ReactNode;
  inputDisabled?: boolean;
  onSend: (text: string) => void;
}) {
  const t = useLaunchT();
  const vp = useVisualViewport();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // 전송 완료(loading true→false) 시 입력창 포커스 복원.
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading) inputRef.current?.focus();
    prevLoadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    const sc = endRef.current?.parentElement;
    if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = (raw: string) => {
    const a = raw.trim();
    if (!a || loading || finished || inputDisabled) return;
    setInput("");
    onSend(a);
  };

  return (
    <div className={embedded ? "flex h-[100dvh] flex-col bg-white" : "flex min-h-screen flex-col bg-white"}>
      {embedded ? (
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3">
          <p className="text-[14px] font-black tracking-[-0.01em] text-[#191F28]">{embeddedTitle}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-full text-[#4E5968] transition hover:bg-[#F6F8FB]"><X className="h-5 w-5" weight="bold" /></button>
        </div>
      ) : (
        <CareerLaunchHeader />
      )}
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-5xl flex-col px-5 pt-4 md:pt-6" style={{ height: vp ? vp.height - 56 : undefined, paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
          {embedded ? null : (
            <div className="flex items-center justify-between gap-3">
              <Link href={backHref} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
                <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {weekLabel}
              </Link>
              <Link href={backHref} className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("종료하고 나가기", "Save & exit", "保存并退出", "Lưu & thoát", "保存して終了", "Simpan & keluar")}</Link>
            </div>
          )}
          <div className="mt-3.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{eyebrow}</p>
              <h1 className="mt-1.5 break-keep text-[20px] font-black leading-[1.2] tracking-[-0.02em] text-[#191F28] md:text-[24px]">{title}</h1>
              {sub ? <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{sub}</p> : null}
            </div>
            {progress ? <span className="mt-1 shrink-0 rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-bold text-[#4E5968]">{progress}</span> : null}
          </div>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-[#EEF1F5] bg-gradient-to-b from-[#F7F9FF] to-white p-4 md:p-5">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[15px]">🎤</span>
                  <div className="max-w-[84%]">
                    {m.followUp ? <p className="mb-1 text-[11.5px] font-semibold text-[#C77700]">↳ {t("꼬리질문", "Follow-up", "追问", "Câu hỏi tiếp", "追加質問", "Lanjutan")}</p> : null}
                    <div className="whitespace-pre-wrap break-keep rounded-2xl rounded-bl-md bg-white px-4 py-3 text-[14px] leading-relaxed text-[#191F28] shadow-[0_1px_3px_rgba(17,24,39,0.06)]"><RichText text={m.text} /></div>
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
          <p className="mt-2 text-center text-[11.5px] text-[#B0B8C1]">{note}</p>

          {finished ? (
            <div className="mt-3">{completion}</div>
          ) : (
            <div className="mt-3">
              {quickReplies.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {quickReplies.map((q) => (
                    <button key={q.value} type="button" onClick={() => { if (!loading && !inputDisabled) onSend(q.value); }} className="rounded-full bg-[#F2F4F6] px-4 py-2.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]">{q.label}</button>
                  ))}
                </div>
              ) : null}
              <form
                className="flex items-end gap-1.5 rounded-2xl border border-[#E5E8EB] bg-white p-1.5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] transition focus-within:border-[#0B46E8] focus-within:shadow-[0_0_0_3px_rgba(11,70,232,0.08)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      submit(input);
                    }
                  }}
                  rows={1}
                  placeholder={placeholder}
                  disabled={loading || inputDisabled}
                  className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[16px] leading-[1.35] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-0 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || inputDisabled}
                  aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${input.trim() && !loading && !inputDisabled ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#EEF1F5] text-[#B0B8C1]"}`}
                >
                  <PaperPlaneRight className="h-5 w-5" weight="fill" aria-hidden />
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
