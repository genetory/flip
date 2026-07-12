"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "../../../components/launch/rich-text";
import { STUDENT } from "../../../lib/launch/data";
import { requestCoverChat, fetchCoverData, resetCoverData, hasCoverContent, type CoverChatMsg, type CoverData, type CoverSection } from "../../../lib/launch/cover-data";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 3 — 별도 빌더로 가지 않고 AI와 대화하며 자기소개서를 채운다. 백엔드에 자동 저장.
type Msg = { role: "bot" | "user"; text: string };

// 현재 작성하는 문항 표시용 라벨.
const SECTION_LABEL: Record<CoverSection, string> = {
  motive: "지원 동기",
  growth: "성장 과정",
  strength: "성격의 장단점·강점",
  aspiration: "입사 후 포부"
};

export default function CoverCollectPage() {
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [data, setData] = useState<CoverData>({});
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
        setMessages([{ role: "bot", text: `${displayName}님, 다시 오셨네요 👋 이어서 마저 써볼게요!` }]);
      }
      try {
        const { reply, data: merged } = await requestCoverChat([], seed, section);
        setData(merged);
        setMessages((m) =>
          continuing
            ? [...m, { role: "bot", text: reply }]
            : [{ role: "bot", text: reply || `${displayName}님, 반가워요 👋 대화하면서 자기소개서를 함께 채워볼까요?` }]
        );
      } catch {
        setMessages((m) => (continuing ? [...m, { role: "bot", text: "잠시 문제가 생겼어요 😥 다시 한 번 시도해줄래요?" }] : [{ role: "bot", text: "지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?" }]));
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
        if (isDone) setDone(true);
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
            <Link href="/career-launch/week/3" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← 3주차
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🤖</span>
            <div>
              <p className="text-[12px] font-bold text-[#0B46E8]">자기소개서{focus ? " 작성 중" : ""}</p>
              <p className="text-[15px] font-black text-[#0B1227]">{focus ? SECTION_LABEL[focus] : "대화로 자기소개서 채우기"}</p>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
                <div key={i} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🤖</span>
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
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🤖</span>
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
                계속 작성하기
              </button>
              <Link
                href="/career-launch/week/3"
                className="flex h-[46px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
              >
                3주차 페이지로 →
              </Link>
            </div>
          ) : (
            <div className="mt-3">
              {messages.length > 0 && !loading ? (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {["잘 모르겠어요", "예시를 보여주세요", "다음 문항으로"].map((q) => (
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
              <div className="flex items-end gap-2">
                <form
                  className="flex flex-1 items-end gap-2"
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
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
