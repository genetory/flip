"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { STUDENT } from "../../../lib/launch/data";
import { requestMaterialChat, type JobChatMsg } from "../../../lib/launch/job-chat-client";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 스텝3 — 선택한 직무·프로필을 참고해 AI 코치가 이력서 재료를 대화로 이끌어낸다.
const KEY_SEL = "career-launch:selected-jobs";
const KEY_MAT = "career-launch:materials";

type Msg = { role: "bot" | "user"; text: string };

export default function LaunchMaterialsPage() {
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const startedRef = useRef(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  const saveMaterials = (list: string[]) => {
    try {
      window.localStorage.setItem(KEY_MAT, JSON.stringify(list));
    } catch {
      // 무시
    }
  };

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    let sel: string[] = [];
    try {
      const s = window.localStorage.getItem(KEY_SEL);
      if (s) sel = JSON.parse(s);
    } catch {
      // 무시
    }
    setSelected(sel);
    setLoading(true);
    void (async () => {
      try {
        const { reply, materials: mats } = await requestMaterialChat([], sel);
        setMaterials(mats);
        setMessages([{ role: "bot", text: reply || `${displayName}님, 반가워요 👋 이력서에 담을 경험을 함께 정리해볼까요?` }]);
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
        const history: JobChatMsg[] = nextMsgs.map((m) => ({ role: m.role, text: m.text }));
        const { reply, materials: mats, done: isDone } = await requestMaterialChat(history, selected);
        if (mats.length) setMaterials(mats);
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          saveMaterials(mats.length ? mats : materials);
          setDone(true);
        }
      } catch {
        setMessages((m) => [...m, { role: "bot", text: "잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?" }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const finishNow = () => {
    saveMaterials(materials);
    setDone(true);
    setMessages((m) => [...m, { role: "bot", text: `좋아요! 지금까지 정리한 재료 ${materials.length}개를 저장했어요. 다음 주에 이 재료로 이력서를 만들어봐요 🙌` }]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-5 pb-4 pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← 대시보드
            </Link>
            <span className="text-[12px] font-bold text-[#0B46E8]">모은 재료 {materials.length}개</span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🤖</span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">이력서 재료 모으기</p>
              <p className="text-[12px] text-[#8B95A1]">AI 코치와 대화하며 경험·성과를 정리해요 · ⏱ 약 15분</p>
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
            {/* 지금까지 모은 재료 미리보기 */}
            {materials.length > 0 ? (
              <div className="flex items-start gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EAFFD1] text-[13px]">📋</span>
                <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#D9F2B8] bg-[#F6FFE9] px-3.5 py-3">
                  <p className="text-[11.5px] font-bold text-[#3A6B00]">모은 이력서 재료</p>
                  <ul className="mt-1.5 space-y-1">
                    {materials.map((mat, i) => (
                      <li key={i} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[#333D4B]">
                        <span className="text-[#3A6B00]">•</span>
                        {mat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
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

          {/* 입력 / 완료 */}
          {done ? (
            <Link
              href="/career-launch/dashboard"
              className="mt-3 flex items-center justify-center rounded-xl bg-[#0B46E8] py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
            >
              대시보드에서 확인하기 →
            </Link>
          ) : (
            <div className="mt-3 flex items-end gap-2">
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
              {materials.length >= 3 ? (
                <button
                  type="button"
                  onClick={finishNow}
                  className="h-[46px] shrink-0 rounded-xl bg-[#B7FF5A] px-4 text-[13.5px] font-black text-[#111] transition hover:brightness-105"
                >
                  정리 완료
                </button>
              ) : null}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
