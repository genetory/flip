import { Suspense } from "react";
import { AccountDeletePage } from "../../../components/pages/AccountDeletePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AccountDeletePage />
    </Suspense>
  );
}
