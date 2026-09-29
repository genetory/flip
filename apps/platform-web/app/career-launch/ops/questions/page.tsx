"use client";

// 커리어런치 학생 질문 답변 콘솔 — 학생이 홈에서 남긴 질문에 운영진이 답한다.
// 질문이 들어오면 Discord 로 알림이 가고, 답을 달면 학생에게 인앱·이메일 알림이 간다.
import { useEffect, useState } from "react";
import { ChatCircleDots, CheckCircle, CircleNotch, PaperPlaneRight } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../../components/AplyFooter";
import { fetchOpsQuestions, answerQuestion, type OpsQuestion } from "../../../../lib/launch/question-client";

type Status = "pending" | "answered" | "all";
const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "미답변" },
  { key: "answered", label: "답변 완료" },
  { key: "all", label: "전체" }
];

function when(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function OpsQuestionsPage() {
  const [status, setStatus] = useState<Status>("pending");
  const [items, setItems] = useState<OpsQuestion[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const reload = async (next: Status = status) => {
    setLoading(true);
    try {
      const r = await fetchOpsQuestions(next);
      setItems(r.items);
      setPending(r.pending);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const send = async (q: OpsQuestion) => {
    const answer = (drafts[q.id] ?? q.answer ?? "").trim();
    if (!answer || busy) return;
    setBusy(q.id);
    setMsg("");
    try {
      await answerQuestion(q.id, answer);
      setDrafts((prev) => ({ ...prev, [q.id]: "" }));
      setMsg("답변을 보냈어요. 학생에게 알림이 갑니다.");
      await reload(status);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "답변을 보내지 못했어요.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-4xl px-5 pt-8">
          <h1 className="text-[24px] font-black tracking-[-0.02em] text-[#191F28]">
            <ChatCircleDots className="mr-1 inline h-6 w-6 text-[#0B46E8]" weight="fill" /> 학생 질문
          </h1>
          <p className="mt-1 text-[13px] text-[#8B95A1]">
            학생이 커리어런치 홈에서 남긴 질문이에요. 미답변 {pending.toLocaleString()}건 · 답을 달면 학생에게 알림이 갑니다.
          </p>

          <div className="mt-4 flex gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatus(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${status === tab.key ? "bg-[#191F28] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E8EBEE]"}`}
              >
                {tab.label}
                {tab.key === "pending" && pending > 0 ? ` ${pending}` : ""}
              </button>
            ))}
          </div>
          {msg ? <p className="mt-2 text-[12px] text-[#4E5968]">{msg}</p> : null}

          {loading ? (
            <p className="mt-6 flex items-center gap-2 text-[13px] text-[#8B95A1]">
              <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> 불러오는 중…
            </p>
          ) : items.length === 0 ? (
            <p className="mt-6 text-[13px] text-[#8B95A1]">{status === "pending" ? "답변을 기다리는 질문이 없어요." : "질문이 없어요."}</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {items.map((q) => (
                <div key={q.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-black text-[#191F28]">{q.student?.name || q.student?.email || "학생"}</p>
                    {q.student?.email ? <span className="text-[11.5px] text-[#8B95A1]">{q.student.email}</span> : null}
                    <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#4E5968]">{q.stepNo ? `${q.stepNo}주차` : "주차 미지정"}</span>
                    <span className="text-[11px] text-[#8B95A1]">{when(q.createdAt)}</span>
                    {q.answered ? (
                      <span className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-[#0A9B59]">
                        <CheckCircle className="h-3.5 w-3.5" weight="fill" /> 답변 완료{q.answeredByName ? ` · ${q.answeredByName}` : ""}
                      </span>
                    ) : (
                      <span className="text-[11.5px] font-bold text-[#C77700]">미답변</span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[#FAFBFC] p-2.5 text-[13px] leading-relaxed text-[#191F28]">{q.body}</p>
                  {q.answer ? (
                    <div className="mt-2 rounded-xl bg-[#F5F8FF] p-2.5">
                      <p className="text-[11px] font-bold text-[#0B46E8]">보낸 답변{q.answeredAt ? ` · ${when(q.answeredAt)}` : ""}</p>
                      <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#191F28]">{q.answer}</p>
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={drafts[q.id] ?? ""}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      rows={3}
                      placeholder={q.answered ? "답변을 고치려면 새로 적어 주세요(덮어써요)." : "답변을 적어 주세요."}
                      className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void send(q)}
                        disabled={busy === q.id || !(drafts[q.id] ?? "").trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B46E8] px-3.5 py-2 text-[13px] font-bold leading-none text-white transition hover:bg-[#0A3ECB] disabled:cursor-default disabled:opacity-50"
                      >
                        {busy === q.id ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <PaperPlaneRight className="h-4 w-4" weight="fill" />}
                        {q.answered ? "답변 수정" : "답변 보내기"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
