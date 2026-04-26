import { Suspense } from "react";
import { SignupVerifyEmailPage } from "../../../components/pages/SignupVerifyEmailPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignupVerifyEmailPage />
    </Suspense>
  );
}
