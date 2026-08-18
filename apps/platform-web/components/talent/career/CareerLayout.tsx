"use client";

// 내 커리어 공용 레이아웃 — 앱 셸 + 콘텐츠.
// 내 커리어 홈이 유일한 허브. 상세(경험·프로필·이력서 등)에는 통일된 뒤로가기만 둔다.
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { talentAppRoutes } from "../../../lib/talent/app-nav";

export function CareerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const isHub = pathname === talentAppRoutes.career;
  return (
    <TalentAppShell>
      {!isHub ? <TalentBackButton className="mb-5" /> : null}
      {children}
    </TalentAppShell>
  );
}
