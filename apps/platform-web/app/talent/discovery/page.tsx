import type { Metadata } from "next";
import { TalentDiscoveryPage } from "../../../components/talent/TalentDiscoveryPage";

export const metadata: Metadata = {
  title: "나를 알아가기 — Aply",
  description: "몇 가지 질문으로 나의 강점과 관심 직무 방향을 함께 찾아봐요."
};

export default function TalentDiscoveryRoute() {
  return <TalentDiscoveryPage />;
}
