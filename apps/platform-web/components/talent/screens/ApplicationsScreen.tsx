"use client";

// 지원 현황 — 실제 서버 지원 내역(getMyApplications). 상태 탭(전체/지원 완료/면접/결과).
// 별도 상세 화면 없이 리스트 카드에서 바로 이벤트(공고 보기·지원 철회·면접 안내)를 처리한다.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TalentAppShell } from "../app/TalentAppShell";
import { TEmpty, TError, TLoading } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMyApplications, withdrawMyApplication, type MyApplication } from "../../../lib/member-profile-client";

type Tab = "all" | "submitted" | "interview" | "result";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "submitted", label: "지원 완료" },
  { key: "interview", label: "면접" },
  { key: "result", label: "결과" }
];

function inTab(a: MyApplication, tab: Tab): boolean {
  if (tab === "all") return true;
  if (tab === "submitted") return a.status === "SUBMITTED";
  if (tab === "interview") return a.status === "INTERVIEW";
  return a.status === "ACCEPTED" || a.status === "REJECTED";
}

export const APPLICATION_STATUS: Record<MyApplication["status"], { label: string; cls: string }> = {
  SUBMITTED: { label: "지원 완료", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  INTERVIEW: { label: "면접 진행", cls: "bg-[#FFF3E6] text-[#E8890C]" },
  ACCEPTED: { label: "합격", cls: "bg-[#E7F8EF] text-[#12B76A]" },
  REJECTED: { label: "불합격", cls: "bg-[#FDECEE] text-[#F04452]" },
  WITHDRAWN: { label: "지원 철회", cls: "bg-[#F2F4F6] text-[#8B95A1]" }
};

export function ApplicationsScreen() {
  const toast = useTalentPopup();
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("all");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  function load() {
    setStatus("loading");
    getMyApplications()
      .then((list) => {
        setApps(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  function withdraw(app: MyApplication) {
    if (withdrawingId) return;
    if (!window.confirm("이 공고 지원을 철회할까요?")) return;
    setWithdrawingId(app.id);
    withdrawMyApplication(app.id)
      .then(() => {
        setApps((prev) => (prev ? prev.map((a) => (a.id === app.id ? { ...a, status: "WITHDRAWN" } : a)) : prev));
        toast.success("지원을 철회했어요");
      })
      .catch(() => toast.error("철회에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setWithdrawingId(null));
  }

  const counts = useMemo(() => {
    const a = apps ?? [];
    return {
      all: a.length,
      submitted: a.filter((x) => x.status === "SUBMITTED").length,
      interview: a.filter((x) => x.status === "INTERVIEW").length,
      result: a.filter((x) => x.status === "ACCEPTED" || x.status === "REJECTED").length
    } as Record<Tab, number>;
  }, [apps]);

  const list = (apps ?? []).filter((a) => inTab(a, tab));

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">지원 현황</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">지원한 공고의 진행 상태를 확인해요.</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            {/* 상태 탭 — 포지션 탐색과 동일한 언더라인 탭 */}
            <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => {
                const active = tab === t.key;
                const n = counts[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={active ? "page" : undefined}
                    className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${active ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                  >
                    {t.label}
                    {n ? ` ${n}` : ""}
                    {active ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                  </button>
                );
              })}
            </div>

            {list.length === 0 ? (
              <TEmpty
                title={tab === "all" ? "아직 지원한 공고가 없어요" : "해당 상태의 지원이 없어요"}
                description="공고를 둘러보고 관심 있는 곳에 지원해보세요."
                action={<TalentButton href={talentAppRoutes.jobs} variant="soft" size="md">공고 둘러보기</TalentButton>}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {list.map((a) => (
                  <AppCard key={a.id} app={a} onWithdraw={() => withdraw(a)} withdrawing={withdrawingId === a.id} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </TalentAppShell>
  );
}

function AppCard({ app, onWithdraw, withdrawing }: { app: MyApplication; onWithdraw: () => void; withdrawing: boolean }) {
  const s = APPLICATION_STATUS[app.status];
  const canWithdraw = app.status === "SUBMITTED" || app.status === "INTERVIEW";
  const showInterview = app.status === "INTERVIEW" || app.interviewSelectedAt || app.interviewPending;

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
        {app.interviewPending ? <span className="rounded-md bg-[#FFF3E6] px-1.5 py-0.5 text-[11px] font-bold text-[#E8890C]">면접 일정 선택</span> : null}
        {app.unreadMessages > 0 ? <span className="rounded-md bg-[#FDECEE] px-1.5 py-0.5 text-[11px] font-bold text-[#F04452]">문의 {app.unreadMessages}</span> : null}
        <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{formatRelativeTime(new Date(app.submittedAt).getTime())}</span>
      </div>

      <p className="mt-2 text-[15px] font-bold text-[#191F28]">{app.positionTitle}</p>
      <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">{app.partnerOrganizationName ?? "비공개 기업"}</p>

      {showInterview ? (
        <div className="mt-3 rounded-xl bg-[#FBFAF5] px-3.5 py-3">
          <p className="text-[12px] font-bold text-[#E8890C]">면접 안내</p>
          <p className="mt-0.5 text-[12.5px] text-[#4E5968]">
            {app.interviewSelectedAt
              ? `${new Date(app.interviewSelectedAt).toLocaleString("ko-KR")}${app.interviewLocation ? ` · ${app.interviewLocation}` : ""}`
              : app.interviewPending
                ? "회사가 면접 일정을 제안했어요. 가능한 시간을 선택해주세요."
                : "면접 일정이 확정되면 알려드릴게요."}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`${talentAppRoutes.jobs}/${app.positionId}`}
          className="inline-flex items-center rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
        >
          공고 보기
        </Link>
        {canWithdraw ? (
          <button
            type="button"
            onClick={onWithdraw}
            disabled={withdrawing}
            className="inline-flex items-center rounded-xl bg-[#FDECEE] px-3.5 py-2 text-[12.5px] font-bold text-[#F04452] transition hover:bg-[#FBDDE1] disabled:opacity-50"
          >
            지원 철회
          </button>
        ) : null}
      </div>
    </div>
  );
}
