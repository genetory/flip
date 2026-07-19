import { redirect } from "next/navigation";

// 참가 신청은 대학이 배포하는 초대코드로 진행한다(자가등록).
// 과거의 목업 신청 폼은 제출이 저장되지 않고 가짜 완료 화면만 보여줬으므로,
// 실제 진입점(로그인 → 초대코드 등록)인 Career Launch 홈으로 보낸다.
export default function LaunchApplyRedirect() {
  redirect("/career-launch");
}
