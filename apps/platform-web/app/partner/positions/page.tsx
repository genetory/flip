import { Suspense } from "react";
import { PartnerPositionsScreen } from "../../../components/partner-app/screens/PartnerPositionsScreen";

export default function PartnerPositionsRoute() {
  return (
    <Suspense>
      <PartnerPositionsScreen />
    </Suspense>
  );
}
