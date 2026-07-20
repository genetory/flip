import { LoginPage } from "../../components/pages/LoginPage";

export default function Page() {
  // 메인 로그인에서만 학생/파트너 안내 토글을 노출(커리어런치 등 재사용처는 미노출).
  return <LoginPage showRoleToggle />;
}
