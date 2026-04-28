import { Suspense } from "react";
import { ProfilePage } from "../../components/pages/ProfilePage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProfilePage />
    </Suspense>
  );
}
