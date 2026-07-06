"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, STUDENT } from "../../../lib/launch/data";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 스텝3 — 선택한 직무에 맞춘 질문을 AI 채팅처럼 주고받으며 이력서 재료를 모은다.
// (지금은 목업 — 선택 직무의 요구 역량 기반 스크립트 질문. 이후 실제 AI 대화로 연동)
const KEY_SEL = "career-launch:selected-jobs";
const KEY_MAT = "career-launch:materials";

type Msg = { role: "bot" | "user"; text: string };
type QA = { q: string; a: string };

const ACKS = ["좋아요, 잘 적었어요! ✍️", "메모해뒀어요 👍", "고마워요! 하나 더 물어볼게요.", "좋은 재료가 되겠어요 🙌"];

function buildQuestions(roles: string[]): string[] {
  const qs: string[] = [];
  qs.push("먼저 가볍게 시작해볼게요. 어떤 일을 하고 싶고, 왜 그 직무에 관심이 생겼는지 편하게 알려줄래요?");
  roles.slice(0, 3).forEach((role) => {
    const job = RECOMMENDED_JOBS.find((j) => j.role === role);
    if (job) {
      qs.push(`'${role}'은(는) ${job.skills.join(" · ")} 같은 역량을 많이 봐요. 이와 관련해 해본 경험이나 프로젝트가 있으면 하나 소개해줄래요? (아직 없다면 배우고 싶은 것도 좋아요)`);
    } else {
      qs.push(`'${role}'과(와) 관련해서 해본 경험이나 관심 있는 활동이 있으면 알려줄래요?`);
    }
  });
  qs.push("가장 자신 있는 성과나 결과물 하나를 숫자와 함께 이야기해줄래요? (예: '방문자 30% 증가', '동아리 행사 200명 모집')");
  qs.push("어학 실력(한국어·영어 등)이나 가지고 있는 자격증이 있으면 알려주세요.");
  qs.push("보여줄 수 있는 포트폴리오·깃허브·작업물 링크가 있으면 붙여줄래요? (없으면 '없음'이라고 해도 돼요)");
  return qs;
}

export default function LaunchMaterialsPage() {
  const { user } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const [ready, setReady] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<QA[]>([]);
  const [input, setInput] = useState("");
  const [finished, setFinished] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const endRef = useRef<HTMLDivElement>(null);

  // 진입 시 선택 직무를 읽어 질문을 만들고 대화를 시작한다.
  useEffect(() => {
    let roles: string[] = [];
    try {
      const s = window.localStorage.getItem(KEY_SEL);
      if (s) roles = JSON.parse(s);
      const m = window.localStorage.getItem(KEY_MAT);
      if (m) setSavedCount((JSON.parse(m) as QA[]).length);
    } catch {
      // 접근 실패 시 기본 질문만
    }
    const qs = buildQuestions(roles);
    setQuestions(qs);
    const name = user?.name?.trim() || user?.email || STUDENT.name;
    setMessages([
      { role: "bot", text: `${name}님, 반가워요 👋` },
      { role: "bot", text: "선택한 직무에 맞춰 몇 가지 물어볼게요. 편하게 답하면 그대로 이력서 재료가 돼요." },
      { role: "bot", text: qs[0] }
    ]);
    setReady(true);
    // user 는 최초 1회만 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = (raw: string) => {
    const a = raw.trim();
    if (!a || finished) return;
    const nextAnswers = [...answers, { q: questions[qi], a }];
    const msgs: Msg[] = [...messages, { role: "user", text: a }];
    const nextI = qi + 1;
    if (nextI < questions.length) {
      msgs.push({ role: "bot", text: ACKS[qi % ACKS.length] });
      msgs.push({ role: "bot", text: questions[nextI] });
      setQi(nextI);
    } else {
      msgs.push({
        role: "bot",
        text: `정리 끝났어요! 🎉 ${nextAnswers.length}개의 재료를 모았어요. 다음 주에 이 재료로 이력서를 만들면 훨씬 수월해요.`
      });
      try {
        window.localStorage.setItem(KEY_MAT, JSON.stringify(nextAnswers));
      } catch {
        // 저장 실패해도 화면 진행은 유지
      }
      setSavedCount(nextAnswers.length);
      setFinished(true);
    }
    setAnswers(nextAnswers);
    setMessages(msgs);
    setInput("");
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
            {savedCount > 0 ? <span className="text-[12px] font-semibold text-[#0B46E8]">저장된 재료 {savedCount}개</span> : null}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#EDF1FD] text-[16px]">🤖</span>
            <div>
              <p className="text-[15px] font-black text-[#0B1227]">이력서 재료 모으기</p>
              <p className="text-[12px] text-[#8B95A1]">선택한 직무에 맞춘 질문 · 채팅으로 편하게</p>
            </div>
          </div>

          {/* 대화 영역 */}
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#EEF1F5] bg-[#F8FAFC] p-4">
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

          {/* 입력 / 완료 */}
          {finished ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/career-launch/dashboard"
                className="flex flex-1 items-center justify-center rounded-xl bg-[#0B46E8] py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
              >
                대시보드에서 확인하기 →
              </Link>
            </div>
          ) : (
            <form
              className="mt-3 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder="답변을 입력하세요"
                disabled={!ready}
                className="max-h-32 min-h-[46px] flex-1 resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => send("(건너뜀)")}
                className="h-[46px] shrink-0 rounded-xl border border-[#E5E8EB] bg-white px-3 text-[12.5px] font-bold text-[#8B95A1] transition hover:text-[#4E5968]"
              >
                건너뛰기
              </button>
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
