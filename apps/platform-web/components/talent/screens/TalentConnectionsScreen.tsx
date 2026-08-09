"use client";

// 탤런트 기업 연결 — 인재풀 등록(동의) + 받은 연결/제안 요청 수락·거절. (레거시 /profile?tab=connections 의 모던 버전)
import { useEffect, useState } from "react";
import { EnvelopeSimple, Buildings } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TLoading, TError } from "../ui/primitives";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { listMyConnections, respondConnection, setTalentPool, type MyConnection } from "../../../lib/candidate-connect-client";
import { getMyResumes, type Resume } from "../../../lib/member-profile-client";

export function TalentConnectionsScreen() {
  const toast = useTalentPopup();
  const [conns, setConns] = useState<MyConnection[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [optIn, setOptIn] = useState(false);
  const [poolBusy, setPoolBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setStatus("loading");
    Promise.all([listMyConnections().catch(() => [] as MyConnection[]), getMyResumes().catch(() => [] as Resume[])])
      .then(([c, r]) => {
        setConns(c);
        setResumes(r);
        const primary = r.find((x) => x.isPrimary) ?? r[0];
        setOptIn(Boolean((primary?.content as { poolOptIn?: unknown } | undefined)?.poolOptIn));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const primary = resumes.find((r) => r.isPrimary) ?? resumes[0];

  async function toggle() {
    if (!primary || poolBusy) return;
    const next = !optIn;
    setPoolBusy(true);
    try {
      await setTalentPool(next);
      setOptIn(next);
      toast.success(next ? "인재풀에 등록했어요" : "인재풀 등록을 껐어요");
    } catch {
      toast.error("변경에 실패했어요.");
    } finally {
      setPoolBusy(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      await respondConnection(id, action);
      setConns((prev) => prev.map((c) => (c.id === id ? { ...c, status: action === "accept" ? "ACCEPTED" : "DECLINED", respondedAt: new Date().toISOString() } : c)));
      toast.success(action === "accept" ? "연결을 수락했어요" : "연결을 거절했어요");
    } catch {
      toast.error("처리에 실패했어요.");
    } finally {
      setBusyId(null);
    }
  }

  const pending = conns.filter((c) => c.status === "PENDING");

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-6">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">기업 연결</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">인재풀에 등록하고, 기업이 보낸 연결·제안을 확인해요.</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            {/* 인재풀 등록 */}
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">인재풀 등록</h2>
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-bold text-[#191F28]">기업 인재 검색에 노출</p>
                    <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">
                      켜면 대표 이력서가 기업 인재 검색에 노출돼요. 연락처는 내가 연결을 수락할 때만 공개되고, 언제든 끌 수 있어요.
                    </p>
                    <p className="mt-1.5 text-[12px] text-[#8B95A1]">이력서와 자기소개서가 어느정도 채워져 있어야 검색 결과에 노출돼요.</p>
                    {!primary ? <p className="mt-1.5 text-[12px] font-semibold text-[#E8890C]">대표 이력서가 있어야 등록할 수 있어요.</p> : null}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={optIn}
                    disabled={!primary || poolBusy}
                    onClick={() => void toggle()}
                    className={`relative mt-0.5 h-7 w-12 flex-none rounded-full transition ${optIn ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"} disabled:opacity-50`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${optIn ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* 받은 연결 요청 */}
            <section>
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">받은 연결 요청 {pending.length ? <span className="text-[#0B46E8]">({pending.length})</span> : null}</h2>
              {conns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🤝</span>
                  <p className="mt-3 text-[15px] font-bold text-[#191F28]">아직 받은 연결 요청이 없어요</p>
                  <p className="mt-1 text-[13px] text-[#8B95A1]">인재풀에 등록하면 기업이 먼저 연락할 수 있어요.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {conns.map((c) => (
                    <div key={c.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                      <div className="flex items-start gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[15px] font-bold text-[#191F28]">{c.orgName}</p>
                            <span className="shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(new Date(c.createdAt).getTime())}</span>
                          </div>
                          {c.message ? <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#4E5968]">“{c.message}”</p> : null}
                          {c.status === "ACCEPTED" && c.partnerEmail ? (
                            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#F5F8FF] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#0B46E8]"><EnvelopeSimple className="h-4 w-4" /> {c.partnerEmail}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        {c.status === "PENDING" ? (
                          <>
                            <button type="button" disabled={busyId === c.id} onClick={() => void respond(c.id, "decline")} className="rounded-xl px-3.5 py-2 text-[13px] font-bold text-[#4E5968] ring-1 ring-[#E4EAF2] transition hover:bg-[#F6F8FB] disabled:opacity-50">거절</button>
                            <button type="button" disabled={busyId === c.id} onClick={() => void respond(c.id, "accept")} className="rounded-xl bg-[#0B46E8] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">수락하기</button>
                          </>
                        ) : c.status === "ACCEPTED" ? (
                          <span className="rounded-lg bg-[#E7F8EF] px-2.5 py-1 text-[12px] font-bold text-[#0A9B59]">수락함</span>
                        ) : (
                          <span className="rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-[12px] font-bold text-[#8B95A1]">거절함</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </TalentAppShell>
  );
}
