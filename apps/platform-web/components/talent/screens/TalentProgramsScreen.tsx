"use client";

// 탤런트 프로그램 — 채용 확정 후 온보딩 진행 현황. (레거시 /profile/programs 의 모던 버전, 읽기 전용)
import { useEffect, useState } from "react";
import { Buildings, CalendarBlank, Certificate, ThumbsUp } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { TLoading, TError } from "../ui/primitives";
import { getMyPrograms, type MyProgram } from "../../../lib/member-profile-client";

const STATUS: Record<MyProgram["status"], { label: string; cls: string }> = {
  ACTIVE: { label: "진행 중", cls: "bg-[#EDF1FD] text-[#0B46E8]" },
  COMPLETED: { label: "완료", cls: "bg-[#E7F8EF] text-[#0A9B59]" },
  CANCELLED: { label: "취소", cls: "bg-[#F2F4F6] text-[#8B95A1]" }
};

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("ko-KR");
}
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export function TalentProgramsScreen() {
  const [items, setItems] = useState<MyProgram[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMyPrograms()
      .then((d) => {
        setItems(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">프로그램</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">채용이 확정된 회사와의 온보딩 진행을 확인해요.</p>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🎓</span>
              <p className="mt-3 text-[15px] font-bold text-[#191F28]">아직 진행 중인 프로그램이 없어요</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">합격하면 온보딩 프로그램이 여기에 표시돼요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((p) => {
                const s = STATUS[p.status];
                const upcoming = p.meetings.find((m) => m.status === "SCHEDULED");
                return (
                  <div key={p.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-bold text-[#191F28]">{p.application.position.title}</p>
                      <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]">
                      <Buildings className="h-3.5 w-3.5 text-[#B0B8C1]" /> {p.application.position.partnerOrganization?.name ?? "회사"}
                      · {fmtDate(p.startsAt)}{p.endsAt ? ` ~ ${fmtDate(p.endsAt)}` : " ~"}
                    </p>

                    {upcoming ? (
                      <p className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-[#F5F8FF] px-3 py-2 text-[12.5px] font-semibold text-[#0B46E8]">
                        <CalendarBlank className="h-4 w-4" weight="fill" /> 다음 미팅 · {fmtDateTime(upcoming.scheduledAt)}
                      </p>
                    ) : null}

                    {(p.certificate || p.recommendation) ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {p.certificate ? <span className="inline-flex items-center gap-1 rounded-md bg-[#E7F8EF] px-2 py-1 text-[11.5px] font-bold text-[#0A9B59]"><Certificate className="h-3.5 w-3.5" weight="fill" /> 수료증 발급됨</span> : null}
                        {p.recommendation ? <span className="inline-flex items-center gap-1 rounded-md bg-[#EDF1FD] px-2 py-1 text-[11.5px] font-bold text-[#0B46E8]"><ThumbsUp className="h-3.5 w-3.5" weight="fill" /> 추천서 발급됨</span> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </div>
    </TalentAppShell>
  );
}
