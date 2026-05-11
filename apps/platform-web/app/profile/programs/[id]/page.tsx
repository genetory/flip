import { Suspense } from "react";
import { MyProgramDetailPage } from "../../../../components/pages/MyProgramDetailPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MyProgramDetailPage />
    </Suspense>
  );
}
