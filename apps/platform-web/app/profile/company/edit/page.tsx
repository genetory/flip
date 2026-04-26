import { Suspense } from "react";
import { PartnerCompanyProfileEditPage } from "../../../../components/pages/PartnerCompanyProfileEditPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartnerCompanyProfileEditPage />
    </Suspense>
  );
}
