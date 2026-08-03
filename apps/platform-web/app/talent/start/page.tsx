import { redirect } from "next/navigation";

// 처음 시작하기 허브는 "내 커리어" 홈으로 통합됨. 기존 링크 호환용 리다이렉트.
export default function TalentStartRoute() {
  redirect("/talent/career");
}
