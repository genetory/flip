import { Suspense } from "react";
import { V2PaymentResult } from "../../../../components/v2/screens/V2PaymentResult";

export default function V2PaymentSuccessRoute() {
  return (
    <Suspense>
      <V2PaymentResult kind="success" />
    </Suspense>
  );
}
