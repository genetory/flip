import { Suspense } from "react";
import { MyAssignmentsPage } from "../../../components/pages/MyAssignmentsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MyAssignmentsPage />
    </Suspense>
  );
}
