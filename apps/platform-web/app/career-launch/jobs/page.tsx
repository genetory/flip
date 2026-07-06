"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recommendJobs, STUDENT } from "../../../lib/launch/data";
import { Card, Pill, SectionTitle } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 — AI와 대화하며 관심 직무를 이끌어낸다. 몇 가지 질문에 답하면 그 내용을
// 바탕으로 어울리는 직무를 추천하고, 거기서 최대 3개를 선택한다.
// (질문·추천은 지금 목업. 이후 실제 AI 대화로 연동)
const MAX_PICK = 3;
const KEY_SEL = "career-launch:selected-jobs";
const KEY_COND = "career-launch:job-conditions";

type Msg = { role: "bot" | "user"; text: string };

const ACKS = ["좋아요 🙂", "그렇군요!", "잘 들었어요 👍", "메모해뒀어요."];

const QUESTIONS = [
  "먼저, 전공이나 학과가 어떻게 되나요? (없으면 관심 분야도 좋아요)",
  "요즘 어떤 분야나 산업에 관심이 가요? 예를 들면 IT·게임·마케팅·금융·디자인처럼요.",
  "평소 어떤 일을 할 때 시간 가는 줄 몰랐어요? 스스로 잘한다고 느낀 것도 좋아요.",
  "이런 일 중에 끌리는 게 있어요? — 만들기(개발)·분석(데이터)·꾸미기(디자인)·기획·알리기(마케팅)·사람 만나기(영업) 중에서요."
];

export default function LaunchJobsPage() {
  const { user } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const [phase, setPhase] = useState<"chat" | "result">("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [saved, setSaved] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  // 진입 — 이전에 선택/대화한 적이 있으면 결과 단계로 복원, 아니면 대화 시작.
  useEffect(() => {
    let restored = false;
    try {
      const s = window.localStorage.getItem(KEY_SEL);
      if (s) setSelected(JSON.parse(s));
      const c = window.localStorage.getItem(KEY_COND);
      if (c) {
        const cond = JSON.parse(c) as { answers?: string[] };
        if (cond.answers?.length) {
          setAnswers(cond.answers);
          setQuery(cond.answers.join(" "));
          setPhase("result");
          restored = true;
        }
      }
    } catch {
      // 접근 실패 시 새 대화
    }
    if (!restored) {
      const name = user?.name?.trim() || user?.email || STUDENT.name;
      setMessages([
        { role: "bot", text: `${name}님, 반가워요 👋 몇 가지만 이야기 나눠보면 어울리는 직무를 찾아드릴게요.` },
        { role: "bot", text: QUESTIONS[0] }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, phase]);

  const sendAnswer = (raw: string) => {
    const a = raw.trim();
    if (!a) return;
    const nextAnswers = [...answers, a];
    const msgs: Msg[] = [...messages, { role: "user", text: a }];
    const nextI = qi + 1;
    if (nextI < QUESTIONS.length) {
      msgs.push({ role: "bot", text: ACKS[qi % ACKS.length] });
      msgs.push({ role: "bot", text: QUESTIONS[nextI] });
      setQi(nextI);
    } else {
      msgs.push({ role: "bot", text: "고마워요! 이야기해준 걸 바탕으로 어울리는 직무를 추천해드릴게요 👇" });
      setQuery(nextAnswers.join(" "));
      setPhase("result");
    }
    setAnswers(nextAnswers);
    setMessages(msgs);
    setInput("");
  };

  const recs = recommendJobs(query);
  const full = selected.length >= MAX_PICK;

  const toggleJob = (role: string) => {
    setSaved(false);
    setSelected((prev) => (prev.includes(role) ? prev.filter((x) => x !== role) : prev.length >= MAX_PICK ? prev : [...prev, role]));
  };

  const addCustom = () => {
    const r = custom.trim();
    if (!r) return;
    setSaved(false);
    setSelected((prev) => (prev.includes(r) || prev.length >= MAX_PICK ? prev : [...prev, r]));
    setCustom("");
  };

  const save = () => {
    try {
      window.localStorage.setItem(KEY_SEL, JSON.stringify(selected));
      window.localStorage.setItem(KEY_COND, JSON.stringify({ answers }));
    } catch {
      // 저장 실패해도 화면 상태 유지
    }
    setSaved(true);
  };

  const restartChat = () => {
    setPhase("chat");
    setQi(0);
    setAnswers([]);
    setQuery("");
    setSaved(false);
    setMessages([
      { role: "bot", text: `${displayName}님, 다시 이야기 나눠볼게요 👋` },
      { role: "bot", text: QUESTIONS[0] }
    ]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-28">
        <div className="mx-auto w-full max-w-4xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← 대시보드
          </Link>

          {/* 헤더 */}
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🤖</span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">관심 직무 찾기</p>
              <p className="text-[12px] text-[#8B95A1]">대화로 어울리는 직무를 찾아 최대 {MAX_PICK}개 선택</p>
            </div>
          </div>

          {/* 대화 */}
          <div className="mt-4 max-h-[440px] space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
            {messages.map((m, i) =>
              m.role === "bot" ? (
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
              )
            )}
            <div ref={endRef} />
          </div>

          {/* 대화 입력(진행 중일 때만) */}
          {phase === "chat" ? (
            <form
              className="mt-3 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendAnswer(input);
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // 한글 IME 조합 중 Enter 는 무시(마지막 글자 중복 방지)
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    sendAnswer(input);
                  }
                }}
                rows={1}
                placeholder="답변을 입력하세요"
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
          ) : (
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={restartChat} className="text-[12.5px] font-bold text-[#8B95A1] underline transition hover:text-[#4E5968]">
                대화 다시 하기
              </button>
            </div>
          )}

          {/* 추천 결과(대화 후) */}
          {phase === "result" ? (
            <>
              <div className="mt-7">
                <SectionTitle sub="대화 내용을 바탕으로 정렬했어요 · 카드를 눌러 선택">추천 직무</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recs.slice(0, 9).map((job) => {
                    const isSel = selected.includes(job.role);
                    const disabled = !isSel && full;
                    return (
                      <Card
                        key={job.id}
                        onClick={disabled ? undefined : () => toggleJob(job.role)}
                        className={`flex flex-col md:!p-5 ${isSel ? "!border-[#0B46E8] ring-1 ring-[#0B46E8]/30" : disabled ? "opacity-55" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 text-[11px] font-black ${
                                isSel ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <p className="text-[15px] font-bold text-[#191F28]">{job.role}</p>
                          </div>
                          <Pill tone="blue">매칭 {job.match}%</Pill>
                        </div>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#4E5968]">{job.reason}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.skills.map((s) => (
                            <span key={s} className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* 직접 추가 */}
              <div className="mt-6">
                <SectionTitle sub="추천에 없는 직무는 직접 넣을 수 있어요">직무 직접 추가</SectionTitle>
                <Card className="flex gap-2 md:!p-4">
                  <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        addCustom();
                      }
                    }}
                    placeholder="예: 프로덕트 애널리스트"
                    className="h-11 flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustom}
                    disabled={!custom.trim() || full}
                    className={`shrink-0 rounded-xl px-4 text-[13.5px] font-bold transition ${
                      custom.trim() && !full ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                    }`}
                  >
                    추가
                  </button>
                </Card>
              </div>

              {/* 선택한 직무 */}
              {selected.length > 0 ? (
                <div className="mt-6">
                  <SectionTitle>선택한 직무 ({selected.length}/{MAX_PICK})</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {selected.map((role) => (
                      <span key={role} className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] py-1.5 pl-3.5 pr-2 text-[13px] font-bold text-[#0B46E8]">
                        {role}
                        <button
                          type="button"
                          onClick={() => toggleJob(role)}
                          aria-label={`${role} 선택 해제`}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[#0B46E8]/70 transition hover:bg-[#0B46E8]/10 hover:text-[#0B46E8]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      {/* 하단 고정 — 선정 완료(결과 단계에서만) */}
      {phase === "result" ? (
        <div className="sticky bottom-0 z-30 border-t border-[#EEF1F5] bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-5 py-3.5">
            <p className="text-[13px] font-semibold text-[#4E5968]">
              {saved ? (
                <span className="text-[#0B46E8]">✓ {selected.length}개 직무를 선정했어요</span>
              ) : (
                <>
                  <span className="font-black text-[#0B46E8]">{selected.length}</span>
                  <span className="text-[#8B95A1]"> / {MAX_PICK} 선택</span>
                </>
              )}
            </p>
            {saved ? (
              <Link href="/career-launch/dashboard" className="rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                대시보드에서 확인하기 →
              </Link>
            ) : (
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={save}
                className={`rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${
                  selected.length > 0 ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                }`}
              >
                선정 완료
              </button>
            )}
          </div>
        </div>
      ) : null}
      <Footer />
    </div>
  );
}
