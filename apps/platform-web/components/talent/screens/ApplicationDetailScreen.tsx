"use client";

// 지원 상세 — 실제 서버 지원 내역(getMyApplications) 기반. 상태·면접 안내·공고 링크·철회.
import { useEffect, useState } from "react";
import { TalentBackButton } from "../TalentBackButton";
import { TalentAppShell } from "../app/TalentAppShell";
import { TCard, TError, TLoading } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { getMyApplications, withdrawMyApplication, type MyApplication } from "../../../lib/member-profile-client";
import { APPLICATION_STATUS } from "./ApplicationsScreen";

export function ApplicationDetailScreen({ appId }: { appId: string }) {
  const toast = useTalentPopup();
  const [app, setApp] = useState<MyApplication | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [withdrawing, setWithdrawing] = useState(false);

  function load() {
    setStatus("loading");
    getMyApplications()
      .then((list) => {
        setApp(list.find((a) => a.id === appId) ?? null);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  function withdraw() {
    if (!app || withdrawing) return;
    if (!window.confirm("이 공고 지원을 철회할까요?")) return;
    setWithdrawing(true);
    withdrawMyApplication(app.id)
      .then(() => {
        setApp((prev) => (prev ? { ...prev, status: "WITHDRAWN" } : prev));
        toast.success("지원을 철회했어요");
      })
      .catch(() => toast.error("철회에 실패했어요. 잠시 후 다시 시도해주세요."))
      .finally(() => setWithdrawing(false));
  }

  const canWithdraw = app && (app.status === "SUBMITTED" || app.status === "INTERVIEW");

  return (
    <TalentAppShell maxWidth="4xl">
      <TalentBackButton className="mb-4" />

      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}
      {status === "ready" && !app ? <p className="py-20 text-center text-[14px] text-[#8B95A1]">지원 정보를 찾을 수 없어요.</p> : null}

      {status === "ready" && app ? (
        <div className="flex flex-col gap-4">
          <TCard className="p-6">
            <span className={`inline-flex rounded-md px-2 py-1 text-[12px] font-bold ${APPLICATION_STATUS[app.status].cls}`}>{APPLICATION_STATUS[app.status].label}</span>
            <h1 className="mt-3 text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{app.positionTitle}</h1>
            <p className="mt-1 text-[14px] font-semibold text-[#4E5968]">{app.partnerOrganizationName ?? "비공개 기업"}</p>
            <p className="mt-2 text-[12.5px] text-[#B0B8C1]">{new Date(app.submittedAt).toLocaleDateString("ko-KR")} 지원</p>
          </TCard>

          {/* 면접 안내 */}
          {app.status === "INTERVIEW" || app.interviewSelectedAt || app.interviewPending ? (
            <TCard className="p-6">
              <h2 className="text-[15px] font-bold text-[#191F28]">면접 안내</h2>
              {app.interviewSelectedAt ? (
                <p className="mt-2 text-[13.5px] text-[#4E5968]">
                  {new Date(app.interviewSelectedAt).toLocaleString("ko-KR")}
                  {app.interviewLocation ? ` · ${app.interviewLocation}` : ""}
                </p>
              ) : app.interviewPending ? (
                <p className="mt-2 text-[13.5px] text-[#4E5968]">회사가 면접 일정을 제안했어요. 가능한 시간을 선택해주세요.</p>
              ) : (
                <p className="mt-2 text-[13.5px] text-[#8B95A1]">면접 일정이 확정되면 알려드릴게요.</p>
              )}
            </TCard>
          ) : null}

          {/* 액션 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <TalentButton href={`${talentAppRoutes.jobs}/${app.positionId}`} variant="secondary" size="lg">공고 다시 보기</TalentButton>
            {canWithdraw ? (
              <button
                type="button"
                onClick={withdraw}
                disabled={withdrawing}
                className="inline-flex h-[52px] items-center justify-center rounded-2xl px-5 text-[15px] font-bold text-[#F04452] transition hover:bg-[#FDECEE] disabled:opacity-50"
              >
                지원 철회
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </TalentAppShell>
  );
}
