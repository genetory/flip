"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichText } from "../../../components/launch/rich-text";
import { STUDENT } from "../../../lib/launch/data";
import { requestMaterialChat, type JobChatMsg } from "../../../lib/launch/job-chat-client";
import { fetchProgress, patchProgress } from "../../../lib/launch/progress-client";
import { trackCareerStepComplete } from "../../../lib/analytics";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 스텝3 — 선택한 직무·프로필을 참고해 AI 코치가 그 직무를 깊이 이해하도록 대화로 이끈다.
// 선정 직무·정리한 직무정보는 백엔드(progress)에 저장 → 기기 간 동기화.
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
    void patchProgress({ materials: list }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
  };

  // 정리한 직무 정보는 대화가 이어져도 지우지 않고 계속 쌓는다(중복 제외).
  const mergeMaterials = (prev: string[], next: string[]) => {
    const seen = new Set(prev.map((m) => m.trim()));
    const merged = [...prev];
    for (const item of next) {
      const t = item.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        merged.push(item);
      }
    }
    return merged;
  };

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    // ?restart=1 이면 정리한 정보를 비우고 처음부터(선정 직무는 그대로 두고).
    const restart = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("restart") === "1";
    void (async () => {
      // 선정 직무 + 이전에 정리해둔 직무 정보를 백엔드에서 복원해 이어서 쌓는다.
      let sel: string[] = [];
      let initialMats: string[] = [];
      try {
        const { selectedJobs, materials: savedMat } = await fetchProgress();
        if (Array.isArray(selectedJobs)) sel = selectedJobs;
        setSelected(sel);
        if (restart) {
          setMaterials([]);
          saveMaterials([]); // 백엔드도 비워 진짜 처음부터
        } else if (Array.isArray(savedMat) && savedMat.length) {
          initialMats = savedMat;
          setMaterials(savedMat);
        }
      } catch {
        // 무시
      }
      try {
        // 이미 정리한 정보를 함께 보내 AI가 같은 걸 다시 묻지 않고 이어가게 한다.
        const { reply, materials: mats } = await requestMaterialChat([], sel, initialMats);
        if (mats.length) setMaterials((prev) => mergeMaterials(prev, mats));
        setMessages([{ role: "bot", text: reply || `${displayName}님, 반가워요 👋 선정한 직무를 함께 자세히 알아볼까요?` }]);
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
        const { reply, materials: mats, done: isDone } = await requestMaterialChat(history, selected, materials);
        const merged = mats.length ? mergeMaterials(materials, mats) : materials;
        if (mats.length) {
          setMaterials(merged);
          saveMaterials(merged); // 대화 도중에도 계속 저장해 쌓아둔다.
        }
        setMessages((m) => [...m, { role: "bot", text: reply }]);
        if (isDone) {
          saveMaterials(merged);
          trackCareerStepComplete("materials");
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
    trackCareerStepComplete("materials");
    setDone(true);
    setMessages((m) => [...m, { role: "bot", text: `좋아요! 지금까지 정리한 직무 정보 ${materials.length}개를 저장했어요. 다음 주엔 이 방향으로 이력서를 만들어봐요 🙌` }]);
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
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] font-bold text-[#0B46E8]">정리한 정보 {materials.length}개</span>
              {!done ? (
                <button
                  type="button"
                  onClick={() => send("이 직무는 여기까지 하고 다음으로 넘어갈게요.")}
                  disabled={loading}
                  className="rounded-full border border-[#D7DCE3] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8] hover:text-[#0B46E8] disabled:opacity-40"
                >
                  넘어가기 ⏭
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🤖</span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">선정 직무 깊이 알기</p>
              <p className="text-[12px] text-[#8B95A1]">AI 코치와 대화하며 선정 직무를 깊이 이해해요 · ⏱ 약 10분</p>
            </div>
          </div>

          {/* 대화 */}
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
            {/* 지금까지 모은 재료 미리보기 */}
            {materials.length > 0 ? (
              <div className="flex items-start gap-2">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EAFFD1] text-[13px]">📋</span>
                <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#D9F2B8] bg-[#F6FFE9] px-3.5 py-3">
                  <p className="text-[11.5px] font-bold text-[#3A6B00]">정리한 직무 정보</p>
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
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setDone(false)}
                className="flex h-[46px] items-center justify-center rounded-xl border border-[#D7DCE3] bg-white px-4 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
              >
                계속 정리하기
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
                  {["잘 모르겠어요", "더 자세히 알려주세요", "다음으로 넘어갈래요"].map((q) => (
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
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
