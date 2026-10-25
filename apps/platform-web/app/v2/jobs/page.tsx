import { Suspense } from "react";
import { V2JobsScreen } from "../../../components/v2/screens/V2JobsScreen";

export default function V2JobsRoute() {
  // 화면이 ?tab= 을 읽는다(useSearchParams) — 정적 렌더를 위해 Suspense 로 감싼다.
  return (
    <Suspense>
      <V2JobsScreen />
    </Suspense>
  );
}
