import PositionManagementPage from "../positions/page";

// 직접등록 포지션 — Aply에 직접 등록한(INTERNAL) 공고만 모아 보는 화면.
// 포지션 관리와 동일한 UI/UX를 소스=INTERNAL로 고정해 재사용한다.
export default function DirectPositionsPage() {
  return <PositionManagementPage forcedSourceProvider="INTERNAL" />;
}
