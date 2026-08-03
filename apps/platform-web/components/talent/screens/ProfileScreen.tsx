"use client";

// 프로필 — 기본 인적 정보(실명·이메일·연락처·주소·사진) + 관심 직무.
// 소개·경험·학력·스킬 등은 이후 채팅/피드로 자동 정리된다.
import { CareerLayout } from "../career/CareerLayout";
import { BasicInfoForm } from "../career/BasicInfoForm";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { TLoading, TError, TPageHeader } from "../ui/primitives";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import type { TalentSnapshot } from "../../../lib/talent/types";

export function ProfileScreen() {
  const { snapshot, status, reload } = useTalentSnapshot();
  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? <Content snapshot={snapshot} /> : null}
    </CareerLayout>
  );
}

function Content({ snapshot }: { snapshot: TalentSnapshot }) {
  return (
    <div className="flex flex-col gap-4">
      <TPageHeader title="프로필" description="이력서·자기소개서에 쓰이는 기본 정보예요. 나머지는 나중에 채워져요." />
      <BasicInfoForm defaultName={snapshot.profile.displayName} />
      <JobInterestCard variant="edit" />
    </div>
  );
}
