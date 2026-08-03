"use client";

// 지원 관리 — 실제 지원 준비를 시작한 공고만. 탭(준비 중/지원 완료/면접/결과).
// '관심'은 여기가 아니라 채용공고 > 저장 탭에서 관리한다.
import { useState } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TCard, TChip, TEmpty, TError, TLoading, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { applicationStatusLabels } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import type { Application, ApplicationStatus, TalentSnapshot } from "../../../lib/talent/types";

// 지원 워크스페이스 탭(관심 제외).
const applyTabs: ApplicationStatus[] = ["preparing", "applied", "interview", "result"];

export function ApplicationsScreen() {
  const { snapshot, status, reload } = useTalentSnapshot();
  const [tab, setTab] = useState<ApplicationStatus>("preparing");

  return (
    <TalentAppShell>
      <TPageHeader title="지원" description="지원 준비를 시작한 공고를 준비하고 관리해요. 관심 공고는 채용공고 > 저장에 있어요." />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? <Content snapshot={snapshot} tab={tab} setTab={setTab} /> : null}
    </TalentAppShell>
  );
}

function Content({ snapshot, tab, setTab }: { snapshot: TalentSnapshot; tab: ApplicationStatus; setTab: (t: ApplicationStatus) => void }) {
  const counts = applyTabs.reduce<Record<string, number>>((acc, s) => {
    acc[s] = snapshot.applications.filter((a) => a.status === s).length;
    return acc;
  }, {});
  const list = snapshot.applications.filter((a) => a.status === tab);

  return (
    <div>
      {/* 탭 */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex min-w-max gap-1.5">
          {applyTabs.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              aria-pressed={tab === s}
              className={`rounded-full px-4 py-2 text-[13.5px] font-bold transition ${tab === s ? "bg-[#191F28] text-white" : "bg-white text-[#4E5968] ring-1 ring-inset ring-[#EEF1F5]"}`}
            >
              {applicationStatusLabels[s]}
              {counts[s] ? <span className={`ml-1.5 ${tab === s ? "text-white/70" : "text-[#B0B8C1]"}`}>{counts[s]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <TEmpty
          title={`${applicationStatusLabels[tab]} 단계의 지원이 없어요`}
          description="공고를 둘러보고 관심 있는 곳에 지원을 준비해보세요."
          action={<TalentButton href={talentAppRoutes.jobs} variant="soft" size="md">공고 둘러보기</TalentButton>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((a) => (
            <AppRow key={a.id} app={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppRow({ app }: { app: Application }) {
  const doneSteps = app.steps.filter((s) => s.state === "done").length;
  return (
    <Link href={`${talentAppRoutes.applications}/${app.id}`}>
      <TCard className="p-5 transition hover:border-[#D7DCE3]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-[#191F28]">{app.jobTitle}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{app.company}</p>
          </div>
          <TChip tone={app.status === "applied" || app.status === "interview" || app.status === "result" ? "lime" : "blue"}>
            {applicationStatusLabels[app.status]}
          </TChip>
          <CaretRight className="h-4 w-4 text-[#C4CAD2]" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]">
            <div className="h-full rounded-full bg-[#0B46E8]" style={{ width: `${(doneSteps / app.steps.length) * 100}%` }} />
          </div>
          <span className="text-[12px] text-[#8B95A1]">{doneSteps}/{app.steps.length}</span>
        </div>
      </TCard>
    </Link>
  );
}
