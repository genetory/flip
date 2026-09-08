// 구 주차 상세 페이지 → 4주 프로그램(주차 탭)으로 통합. 해당 주차 탭으로 리다이렉트.
import { redirect } from "next/navigation";

export default async function LaunchWeekRedirect({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const n = Number(week);
  redirect(`/career-launch/program${n >= 1 && n <= 4 ? `?week=${n}` : ""}`);
}
