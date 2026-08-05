import { Suspense } from "react";
import { PartnerApplicantsScreen } from "../../../components/partner-app/screens/PartnerApplicantsScreen";

export default function PartnerApplicantsRoute() {
  return (
    <Suspense>
      <PartnerApplicantsScreen />
    </Suspense>
  );
}
