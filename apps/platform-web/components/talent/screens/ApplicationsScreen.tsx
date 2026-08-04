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
      <TPageHeader title="지원" description="지원 준비를 시작한 공고를 준비하고 관리해요. 관심 공고는 포지션 탐색 > 저장에 있어요." />
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
      {/* 탭 — 포지션 탐색과 동일한 언더라인 스타일 */}
      <div className="mb-5 flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {applyTabs.map((s) => {
          const active = tab === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              aria-current={active ? "page" : undefined}
              className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${active ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
            >
              {applicationStatusLabels[s]}{counts[s] ? ` ${counts[s]}` : ""}
              {active ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
            </button>
          );
        })}
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
