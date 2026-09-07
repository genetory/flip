"use client";

// 4주 프로그램 — 칸반 보드(1~4주 가로 스크롤). 홈과 동일 테마(cl-surface).
import { WeekTabs } from "../../../components/launch/WeekTabs";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../components/AplyFooter";
import { useLaunchT } from "../../../lib/launch/i18n";

export default function ProgramBoardPage() {
  const t = useLaunchT();
  return (
    <div className="cl-surface isolate flex min-h-screen flex-col bg-[#F1F1F4]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:pt-10">
          <p className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>4-Week Program</p>
          <h1 className="cl-display mt-2">{t("4주 프로그램", "4-week program", "4周项目", "Chương trình 4 tuần", "4週間プログラム", "Program 4 minggu")}</h1>
          <p className="cl-lead mt-2 max-w-[52ch]">{t("주차 탭을 눌러 이번 주 미션을 하나씩 완료해요. 이전 주차를 마치면 다음 주차가 열려요.", "Move top to bottom, finishing missions in order all the way to your first job.", "从上到下按顺序完成任务，一路走到就业。", "Từ trên xuống, hoàn thành nhiệm vụ theo thứ tự đến khi có việc.", "上から下へ、順番にミッションを完了して就職まで進みます。", "Dari atas ke bawah, selesaikan misi berurutan hingga kerja.")}</p>
          <div className="mt-6 md:mt-8">
            <WeekTabs />
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
