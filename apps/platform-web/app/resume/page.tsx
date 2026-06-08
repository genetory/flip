import { ResumeCoachListPage } from "../../components/pages/ResumeCoachListPage";

// 이력서 코칭 진입 화면. GNB "이력서 코칭" 메뉴가 여기로 옴.
// 비로그인 사용자는 클라이언트 컴포넌트 안에서 /login 으로 게이트.
export default function Page() {
  return <ResumeCoachListPage />;
}
