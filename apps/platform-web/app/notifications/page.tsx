import { Suspense } from "react";
import { NotificationsPage } from "../../components/pages/NotificationsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NotificationsPage />
    </Suspense>
  );
}
