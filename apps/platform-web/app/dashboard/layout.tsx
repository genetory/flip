import "./dashboard.css";
import { DesktopRecommendBanner } from "../../components/dashboard/DesktopRecommendBanner";

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopRecommendBanner />
      {children}
    </>
  );
}
