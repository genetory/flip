"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { STUDENT } from "../../../lib/launch/data";
import { requestInterviewChat, type InterviewChatMsg, type InterviewFocus } from "../../../lib/launch/interview";
import { fetchProgress } from "../../../lib/launch/progress-client";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 4 — 이력서·자소서를 근거로 예상 면접 질문 준비(prep) / 모의면접(mock)을 대화로 진행.
type Msg = { role: "bot" | "user"; text: string };

const HEADER: Record<InterviewFocus, { eyebrow: string; title: string; sub: string }> = {
  prep: { eyebrow: "면접 준비", title: "예상 면접 질문 준비", sub: "이력서·자기소개서를 근거로 받을 법한 질문을 함께 정리해요" },
  mock: { eyebrow: "면접 준비", title: "모의면접", sub: "실제 면접처럼 질문하고 답변에 피드백을 드려요" }
};

export default function InterviewPage() {
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [focus, setFocus] = useState<InterviewFocus>("prep");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    const sectionRaw = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("section") : null;
    const f: InterviewFocus = sectionRaw === "mock" ? "mock" : "prep";
    setFocus(f);
    void (async () => {
      // 예상 질문(prep)은 이미 정리해둔 게 있으면 이어서 보여준다.
      try {
        const p = await fetchProgress();
        if (Array.isArray(p.interview?.questions)) setQuestions(p.interview!.questions!);
      } catch {
        // 무시
      }
      try {
        const { reply, questions: qs } = await requestInterviewChat([], f);
        if (qs.length) setQuestions(qs);
        setMessages([{ role: "bot", text: reply || `${displayName}님, 반가워요 👋 함께 면접을 준비해볼까요?` }]);
      } catch {
        setMessages([{ role: "bot", text: "지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?" }]);
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
        const { reply, questions: qs, done: isDone } = await requestInterviewChat(history, focus);
        if (qs.length) setQuestions(qs);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) setDone(true);
      } catch {
        setMessages((m) => [...m, { role: "bot", text: "잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?" }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const h = HEADER[focus];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-5 pb-4 pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/4" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← 4주차
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🎤</span>
            <div>
              <p className="text-[12px] font-bold text-[#0B46E8]">{h.eyebrow}</p>
              <p className="text-[15px] font-black text-[#0B1227]">{h.title}</p>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🎤</span>
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#0B46E8] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">{m.text}</div>
                </div>
              )
            )}
            {/* 예상 질문 준비 — 지금까지 정리한 질문 미리보기 */}
            {focus === "prep" && questions.length > 0 ? (
              <div className="flex items-start gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EAFFD1] text-[13px]">📋</span>
                <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#D9F2B8] bg-[#F6FFE9] px-3.5 py-3">
                  <p className="text-[11.5px] font-bold text-[#3A6B00]">정리한 예상 질문 {questions.length}개</p>
                  <ul className="mt-1.5 space-y-1">
                    {questions.map((q, i) => (
                      <li key={i} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[#333D4B]">
                        <span className="text-[#3A6B00]">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
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

          {done ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setDone(false)}
                className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                계속하기
              </button>
              <Link
                href="/career-launch/week/4"
                className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
              >
                4주차 페이지로 →
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {(focus === "prep"
                    ? ["압박 질문도 보여주세요", "이 질문 답변 방향 알려주세요", "이대로 충분해요"]
                    : ["잘 모르겠어요", "다시 답해볼게요", "피드백 주세요"]
                  ).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-full border border-[#D7DCE3] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8]"
                    >
                      {q}
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
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder={focus === "mock" ? "면접관의 질문에 답해보세요" : "편하게 답해주세요"}
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
                  보내기
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
