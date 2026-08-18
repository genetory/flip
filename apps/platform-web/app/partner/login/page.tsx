import { Suspense } from "react";
import { PartnerLoginPage } from "../../../components/partner-app/PartnerLoginPage";

export default function PartnerLoginRoute() {
  return (
    <Suspense fallback={null}>
      <PartnerLoginPage />
    </Suspense>
  );
}
