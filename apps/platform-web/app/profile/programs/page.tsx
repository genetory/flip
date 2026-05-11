import { Suspense } from "react";
import { MyProgramsPage } from "../../../components/pages/MyProgramsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MyProgramsPage />
    </Suspense>
  );
}
