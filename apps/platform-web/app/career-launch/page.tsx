import { LoginPage } from "../../components/pages/LoginPage";

// 첫 화면 — aply.global 로그인 화면 재사용. 로그인 후 /career-launch/dashboard 로.
// (프로그램 진입이라 사이트 헤더/푸터는 숨김 = chromeless)
export default function LaunchLoginRoute() {
  return (
    <LoginPage
      defaultNext="/career-launch/dashboard"
      brandTitle="Career Launch Bootcamp"
      brandSubtitle="외국인 유학생을 위한 4주 한국 취업 준비 부트캠프"
    />
  );
}
