"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { STUDENT } from "../../../lib/launch/data";
import { requestDiagnosisChat, type DiagnosisResult, type JobChatMsg } from "../../../lib/launch/job-chat-client";
import { fetchProgress, patchProgress } from "../../../lib/launch/progress-client";
import { Card } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 스텝1 — AI 코치가 짧은 대화로 취업 준비 상태를 진단하고, 준비도·강점·보완점을 준다.
// 진단 결과는 백엔드(career-launch/progress)에 계정 기준으로 저장 → 기기 간 동기화.
type Msg = { role: "bot" | "user"; text: string };

export default function LaunchDiagnosisPage() {
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  const startChat = () => {
    setResult(null);
    setMessages([]);
    setLoading(true);
    void (async () => {
      try {
        const { reply } = await requestDiagnosisChat([]);
        setMessages([{ role: "bot", text: reply || `${displayName}님, 반가워요 👋 취업 준비 상태를 함께 점검해볼까요?` }]);
      } catch {
        setMessages([{ role: "bot", text: "지금은 진단을 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?" }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
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
          try {
            await patchProgress({ diagnosis: { percent: r.percent, level: r.level, strengths: r.strengths, improvements: r.improvements } });
          } catch {
            // 저장 실패해도 화면엔 결과 표시
          }
        }
      } catch {
        setMessages((m) => [...m, { role: "bot", text: "잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?" }]);
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
              ← 1주차
            </Link>
            {!result ? (
              <button
                type="button"
                onClick={() => send("이 질문은 건너뛰고 다음으로 넘어갈게요.")}
                disabled={loading}
                className="rounded-full border border-[#D7DCE3] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8] disabled:opacity-40"
              >
                넘어가기 ⏭
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🤖</span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">취업 준비 상태 자가진단</p>
              <p className="text-[12px] text-[#8B95A1]">AI 코치와 대화하면 준비도를 알려드려요 · ⏱ 약 10분</p>
            </div>
          </div>

          {/* 대화 */}
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🤖</span>
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
            {loading ? (
              <div className="flex items-end gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🤖</span>
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
                  <p className="text-[12.5px] font-semibold text-[#8B95A1]">나의 취업 준비도</p>
                  <p className="mt-0.5 text-[38px] font-black leading-none text-[#0B46E8]">
                    {result.percent}
                    <span className="text-[20px]">%</span>
                  </p>
                  {result.level ? <p className="mt-2 text-[13.5px] font-bold text-[#191F28]">{result.level}</p> : null}
                </div>
                {result.strengths.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[12px] font-bold text-[#3A6B00]">강점</p>
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
                    <p className="text-[12px] font-bold text-[#0B46E8]">이번 4주에 집중하면 좋은 점</p>
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
                다시 진단하기
              </button>
              <Link
                href="/career-launch/week/1"
                className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
              >
                1주차 페이지로 →
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              {/* 할 말이 없어 막힐 때를 위한 빠른 응답 — 대화가 끊기지 않게 */}
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {["잘 모르겠어요", "아직 준비 안 됐어요", "예시를 보여주세요"].map((q) => (
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
                placeholder="편하게 답해주세요"
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
