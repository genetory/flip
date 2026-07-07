"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, STUDENT, type RecommendedJob } from "../../../lib/launch/data";
import { requestJobChat, type JobChatMsg } from "../../../lib/launch/job-chat-client";
import { Pill } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 — AI와 실제로 대화하며 관심 직무를 이끌어낸다. 백엔드(/career-launch/job-chat)가
// 대화를 이어받아 다음 질문 + 후보 풀에서 고른 추천 직무를 돌려주고, 채팅 안에서 바로
// 골라 마음에 드는 3개가 나올 때까지 대화한다.
const MAX_PICK = 3;
const KEY_SEL = "career-launch:selected-jobs";

type Msg =
  | { role: "bot" | "user"; kind: "text"; text: string }
  | { role: "bot"; kind: "jobs"; jobs: RecommendedJob[] };

export default function LaunchJobsPage() {
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const [seeded, setSeeded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [shownRoles, setShownRoles] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");

  const endRef = useRef<HTMLDivElement>(null);

  const rolesToJobs = (roles: string[]): RecommendedJob[] =>
    roles.map((r) => RECOMMENDED_JOBS.find((j) => j.role === r)).filter((j): j is RecommendedJob => Boolean(j));

  const appendFromAi = (reply: string, recommend: string[]) => {
    setMessages((m) => {
      const add: Msg[] = [];
      if (reply) add.push({ role: "bot", kind: "text", text: reply });
      const jobs = rolesToJobs(recommend);
      if (jobs.length) add.push({ role: "bot", kind: "jobs", jobs });
      return [...m, ...add];
    });
    if (recommend.length) setShownRoles((prev) => Array.from(new Set([...prev, ...recommend])));
  };

  // 진입 — 세션 로딩 후 1회. AI에게 첫 인사·질문을 요청한다. ?restart=1 이면 선택 초기화.
  useEffect(() => {
    if (!isReady || seeded) return;
    setSeeded(true);
    const restart = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("restart") === "1";
    let sel: string[] = [];
    if (!restart) {
      try {
        const s = window.localStorage.getItem(KEY_SEL);
        if (s) sel = JSON.parse(s);
      } catch {
        // 무시
      }
    }
    setSelected(sel);
    setLoading(true);
    void (async () => {
      try {
        const { reply, recommend } = await requestJobChat([], sel);
        appendFromAi(reply || `${displayName}님, 반가워요 👋 어떤 일에 관심이 있는지 편하게 이야기해줄래요?`, recommend);
      } catch {
        setMessages([{ role: "bot", kind: "text", text: "지금은 대화를 시작하기 어려워요 😥 잠시 후 다시 들어와줄래요?" }]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, seeded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || loading) return;
    setInput("");
    const nextMsgs: Msg[] = [...messages, { role: "user", kind: "text", text: a }];
    setMessages(nextMsgs);
    setLoading(true);
    void (async () => {
      try {
        const history: JobChatMsg[] = nextMsgs
          .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
          .map((m) => ({ role: m.role, text: m.text }));
        const { reply, recommend } = await requestJobChat(history, selected, shownRoles);
        appendFromAi(reply, recommend);
      } catch {
        setMessages((m) => [...m, { role: "bot", kind: "text", text: "잠시 문제가 생겼어요 😥 다시 한 번 말해줄래요?" }]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const toggleJob = (role: string) => {
    setSaved(false);
    const has = selected.includes(role);
    if (!has && selected.length >= MAX_PICK) return;
    const next = has ? selected.filter((x) => x !== role) : [...selected, role];
    setSelected(next);
    if (!has && next.length === MAX_PICK) {
      setMessages((m) => [
        ...m,
        { role: "bot", kind: "text", text: "좋아요! 마음에 드는 3개를 골랐어요 🎉 아래 ‘선정 완료’를 누르면 저장돼요." }
      ]);
    }
  };

  // 추천에 마음에 드는 게 없을 때 — 직접 입력해 선택에 추가.
  const addCustom = () => {
    const r = custom.trim();
    if (!r || selected.includes(r) || selected.length >= MAX_PICK) return;
    setSaved(false);
    setSelected((prev) => [...prev, r]);
    setCustom("");
    setCustomOpen(false);
    setMessages((m) => [...m, { role: "bot", kind: "text", text: `‘${r}’를 관심 직무에 추가했어요 👍` }]);
  };

  const save = () => {
    try {
      window.localStorage.setItem(KEY_SEL, JSON.stringify(selected));
    } catch {
      // 저장 실패해도 화면 상태 유지
    }
    setSaved(true);
    setMessages((m) => [...m, { role: "bot", kind: "text", text: "저장했어요! 대시보드에서 확인할 수 있어요. 다음 주엔 이 방향으로 이력서를 만들어봐요 🙌" }]);
  };

  // 마지막 추천 묶음 인덱스 — 그 아래에만 '다른 직무 보기 / 직접 입력'을 붙인다.
  const lastJobsIdx = messages.reduce((acc, m, i) => (m.kind === "jobs" ? i : acc), -1);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col px-5 pb-4 pt-4 md:pt-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              ← 대시보드
            </Link>
            <span className="text-[12px] font-bold text-[#0B46E8]">{selected.length}/{MAX_PICK} 선택</span>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🤖</span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">관심 직무 찾기</p>
              <p className="text-[12px] text-[#8B95A1]">AI와 대화하며 마음에 드는 직무 {MAX_PICK}개를 골라요</p>
            </div>
          </div>

          {/* 대화 */}
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) => {
              if (m.kind === "text") {
                return m.role === "bot" ? (
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
                );
              }
              // 추천 직무 묶음(채팅 안에서 바로 선택)
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🤖</span>
                  <div className="grid w-full max-w-[88%] gap-2">
                    {m.jobs.map((job) => {
                      const isSel = selected.includes(job.role);
                      const disabled = !isSel && selected.length >= MAX_PICK;
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={disabled ? undefined : () => toggleJob(job.role)}
                          className={`rounded-2xl border bg-white p-3.5 text-left transition ${
                            isSel ? "border-[#0B46E8] ring-1 ring-[#0B46E8]/30" : disabled ? "border-[#EEF1F5] opacity-55" : "border-[#EEF1F5] hover:border-[#0B46E8]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 text-[11px] font-black ${
                                  isSel ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                              <p className="text-[14.5px] font-bold text-[#191F28]">{job.role}</p>
                            </div>
                            <Pill tone="blue">매칭 {job.match}%</Pill>
                          </div>
                          <p className="mt-1.5 pl-7 text-[12.5px] leading-relaxed text-[#4E5968]">{job.reason}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5 pl-7">
                            {job.skills.map((s) => (
                              <span key={s} className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#4E5968]">
                                {s}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                    {/* 추천이 마음에 안 들 때 — 리스트 바로 아래(채팅 안) */}
                    {i === lastJobsIdx && !saved ? (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => send("추천해준 것 말고 다른 직무도 보고 싶어요")}
                          disabled={loading}
                          className="rounded-full border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-50"
                        >
                          🔄 다른 직무 보기
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomOpen((o) => !o)}
                          disabled={selected.length >= MAX_PICK}
                          className="rounded-full border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-50"
                        >
                          ✏️ 직접 입력
                        </button>
                        {customOpen ? (
                          <span className="inline-flex items-center gap-1.5">
                            <input
                              value={custom}
                              onChange={(e) => setCustom(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                  e.preventDefault();
                                  addCustom();
                                }
                              }}
                              autoFocus
                              placeholder="예: UX 리서처"
                              className="h-8 w-40 rounded-full border border-[#E5E8EB] bg-white px-3 text-[12px] text-[#191F28] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={addCustom}
                              disabled={!custom.trim()}
                              className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${custom.trim() ? "bg-[#0B46E8] text-white" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}
                            >
                              추가
                            </button>
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
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

          {/* 입력 + 선정 완료 */}
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
                  // 한글 IME 조합 중 Enter 는 무시(마지막 글자 중복 방지)
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
            {selected.length > 0 ? (
              saved ? (
                <Link
                  href="/career-launch/dashboard"
                  className="flex h-[46px] shrink-0 items-center rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  대시보드 →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={save}
                  className="h-[46px] shrink-0 rounded-xl bg-[#B7FF5A] px-4 text-[13.5px] font-black text-[#111] transition hover:brightness-105"
                >
                  선정 완료 ({selected.length})
                </button>
              )
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
