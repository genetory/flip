"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recommendJobs, STUDENT, type RecommendedJob } from "../../../lib/launch/data";
import { Pill } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 — AI와 대화하며 관심 직무를 이끌어낸다. 질문 → 채팅 안에서 추천 직무를
// 보여주고 고르게 → 마음에 드는 3개가 나올 때까지 계속 대화하며 새 추천 제시.
// (질문·추천은 지금 목업. 이후 실제 AI 대화로 연동)
const MAX_PICK = 3;
const BATCH = 3;
const KEY_SEL = "career-launch:selected-jobs";
const KEY_COND = "career-launch:job-conditions";

type Msg =
  | { role: "bot" | "user"; kind: "text"; text: string }
  | { role: "bot"; kind: "jobs"; jobs: RecommendedJob[] };

const ACKS = ["좋아요 🙂", "그렇군요!", "잘 들었어요 👍", "메모해뒀어요."];
const QUESTIONS = [
  "먼저, 전공이나 학과가 어떻게 되나요? (없으면 관심 분야도 좋아요)",
  "요즘 어떤 분야나 산업에 관심이 가요? 예를 들면 IT·게임·마케팅·금융·디자인처럼요.",
  "평소 어떤 일을 할 때 시간 가는 줄 몰랐어요? 스스로 잘한다고 느낀 것도 좋아요.",
  "이런 일 중에 끌리는 게 있어요? — 만들기(개발)·분석(데이터)·꾸미기(디자인)·기획·알리기(마케팅)·사람 만나기(영업) 중에서요."
];

export default function LaunchJobsPage() {
  const { user, isReady } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const [seeded, setSeeded] = useState(false);
  const [phase, setPhase] = useState<"asking" | "recommending">("asking");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [qi, setQi] = useState(0);
  const [query, setQuery] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  // 다음 추천 묶음 — 아직 안 보여준 + 선택 안 한 직무에서 상위 몇 개.
  const nextBatch = (q: string, shown: string[], sel: string[]) => {
    const batch = recommendJobs(q)
      .filter((j) => !shown.includes(j.id) && !sel.includes(j.role))
      .slice(0, BATCH);
    return { batch, newShown: [...shown, ...batch.map((j) => j.id)] };
  };

  // 진입 — 세션 로딩 후 1회. 이전 대화가 있으면 이어서 고르게, 없으면 질문부터.
  useEffect(() => {
    if (!isReady || seeded) return;
    // ?restart=1 로 오면(대시보드 '다시 선정') 이전 대화를 무시하고 처음부터 시작.
    const restart = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("restart") === "1";
    let prevAnswers: string[] = [];
    let prevSelected: string[] = [];
    if (!restart) {
      try {
        const s = window.localStorage.getItem(KEY_SEL);
        if (s) prevSelected = JSON.parse(s);
        const c = window.localStorage.getItem(KEY_COND);
        if (c) prevAnswers = (JSON.parse(c) as { answers?: string[] }).answers ?? [];
      } catch {
        // 접근 실패 시 새 대화
      }
    }
    if (prevAnswers.length) {
      const q = prevAnswers.join(" ");
      const { batch, newShown } = nextBatch(q, [], prevSelected);
      setAnswers(prevAnswers);
      setSelected(prevSelected);
      setQuery(q);
      setShownIds(newShown);
      setPhase("recommending");
      setMessages([
        { role: "bot", kind: "text", text: `${displayName}님, 다시 왔네요 👋 이어서 골라볼까요? 마음에 드는 직무를 눌러 고르면 돼요.` },
        { role: "bot", kind: "jobs", jobs: batch }
      ]);
    } else {
      setMessages([
        { role: "bot", kind: "text", text: `${displayName}님, 반가워요 👋 몇 가지만 이야기 나눠보면 어울리는 직무를 찾아드릴게요.` },
        { role: "bot", kind: "text", text: QUESTIONS[0] }
      ]);
    }
    setSeeded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, seeded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a) return;
    setInput("");

    if (phase === "asking") {
      const nextAnswers = [...answers, a];
      const msgs: Msg[] = [...messages, { role: "user", kind: "text", text: a }];
      const nextI = qi + 1;
      if (nextI < QUESTIONS.length) {
        msgs.push({ role: "bot", kind: "text", text: ACKS[qi % ACKS.length] });
        msgs.push({ role: "bot", kind: "text", text: QUESTIONS[nextI] });
        setQi(nextI);
        setAnswers(nextAnswers);
        setMessages(msgs);
      } else {
        const q = nextAnswers.join(" ");
        const { batch, newShown } = nextBatch(q, [], selected);
        msgs.push({ role: "bot", kind: "text", text: "이야기해준 걸 바탕으로 이런 직무들이 어울릴 것 같아요 👇 마음에 드는 걸 눌러서 골라보세요." });
        msgs.push({ role: "bot", kind: "jobs", jobs: batch });
        setAnswers(nextAnswers);
        setQuery(q);
        setShownIds(newShown);
        setPhase("recommending");
        setMessages(msgs);
      }
      return;
    }

    // recommending — 반응을 반영해 새 추천 제시
    const nq = `${query} ${a}`.trim();
    const { batch, newShown } = nextBatch(nq, shownIds, selected);
    const msgs: Msg[] = [...messages, { role: "user", kind: "text", text: a }];
    if (batch.length) {
      msgs.push({ role: "bot", kind: "text", text: "그럼 이런 직무는 어때요? 👇" });
      msgs.push({ role: "bot", kind: "jobs", jobs: batch });
      setShownIds(newShown);
    } else {
      msgs.push({ role: "bot", kind: "text", text: "지금까지 어울리는 직무는 거의 다 보여드렸어요. 관심 분야를 조금 더 구체적으로 알려주면 새로 찾아볼게요!" });
    }
    setQuery(nq);
    setMessages(msgs);
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

  const save = () => {
    try {
      window.localStorage.setItem(KEY_SEL, JSON.stringify(selected));
      window.localStorage.setItem(KEY_COND, JSON.stringify({ answers }));
    } catch {
      // 저장 실패해도 화면 상태 유지
    }
    setSaved(true);
    setMessages((m) => [...m, { role: "bot", kind: "text", text: "저장했어요! 대시보드에서 확인할 수 있어요. 다음 주엔 이 방향으로 이력서를 만들어봐요 🙌" }]);
  };

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
              <p className="text-[12px] text-[#8B95A1]">대화하며 마음에 드는 직무 {MAX_PICK}개를 골라요</p>
            </div>
          </div>

          {/* 대화 */}
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) => {
              if (m.kind === "text") {
                return m.role === "bot" ? (
                  <div key={i} className="flex items-end gap-2">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[13px]">🤖</span>
                    <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] shadow-[0_1px_2px_rgba(17,24,39,0.05)]">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#0B46E8] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">{m.text}</div>
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
                  </div>
                </div>
              );
            })}
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
                placeholder={phase === "asking" ? "답변을 입력하세요" : "더 보고 싶은 방향을 알려줘도 돼요 (예: 개발 쪽 더)"}
                className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className={`h-[46px] shrink-0 rounded-xl px-4 text-[14px] font-bold transition ${
                  input.trim() ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
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
