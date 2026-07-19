import { redirect } from "next/navigation";

// 목업 완료 화면 제거 — 실제 진입점으로 리다이렉트.
export default function LaunchApplyCompleteRedirect() {
  redirect("/career-launch");
}
