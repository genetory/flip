import type { Metadata } from "next";
import { TalentAppShell } from "../../../components/talent/app/TalentAppShell";
import { CommunityPage } from "../../../components/pages/CommunityPage";

export const metadata: Metadata = {
  title: "커뮤니티",
  description: "취업 준비생들이 정보와 경험을 나누는 커뮤니티."
};

// GNB '커뮤니티' — 기존 커뮤니티 기능을 talent 앱 셸(GNB/헤더) 안에서 렌더.
export default function TalentCommunityPage() {
  return (
    <TalentAppShell allowGuest>
      <CommunityPage embedded />
    </TalentAppShell>
  );
}
