import { Suspense } from "react";
import { CareerChatScreen } from "../../../../components/talent/screens/CareerChatScreen";

export default function TalentCareerChatRoute() {
  return (
    <Suspense fallback={null}>
      <CareerChatScreen />
    </Suspense>
  );
}
