import { OpsTabs } from "../../../components/launch/ops-tabs";

// 운영자 영역 공통 셸 — 상단 탭(학생 관리 / 제출물 / 리포트).
export default function LaunchOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      <OpsTabs />
      {children}
    </div>
  );
}
