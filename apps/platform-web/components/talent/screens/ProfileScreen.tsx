"use client";

// 프로필 — 기본 인적 정보(실명·이메일·연락처·주소·사진) + 관심 직무.
// 소개·경험·학력·스킬 등은 이후 채팅/피드로 자동 정리된다.
import { CareerLayout } from "../career/CareerLayout";
import { BasicInfoForm } from "../career/BasicInfoForm";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { TPageHeader } from "../ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";

export function ProfileScreen() {
  return (
    <CareerLayout>
      <Content />
    </CareerLayout>
  );
}

function Content() {
  const { user } = useAuthSession();
  const defaultName = user?.realName || user?.name || "";
  return (
    <div className="flex flex-col gap-12">
      <TPageHeader title="프로필" description="이력서·자기소개서에 쓰이는 기본 정보예요. 나머지는 나중에 채워져요." />
      <section>
        <SectionTitle>기본 정보</SectionTitle>
        <BasicInfoForm defaultName={defaultName} />
      </section>
      <section>
        <SectionTitle>관심 직무</SectionTitle>
        <JobInterestCard variant="edit" />
      </section>
    </div>
  );
}

// 홈 화면과 동일한 섹션 타이틀.
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{children}</p>;
}
