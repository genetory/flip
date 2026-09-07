"use client";

// 4주 프로그램 — 칸반 보드(1~4주 가로 스크롤). 홈과 동일 테마(cl-surface).
import { WeekBoard } from "../../../components/launch/WeekBoard";
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
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
          <p className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>4-Week Program</p>
          <h1 className="cl-display mt-2">{t("4주 프로그램", "4-week program", "4周项目", "Chương trình 4 tuần", "4週間プログラム", "Program 4 minggu")}</h1>
          <p className="cl-lead mt-2 max-w-[52ch]">{t("1주차부터 4주차까지, 좌우로 넘기며 이번 주 미션을 하나씩 완료해요.", "Swipe across weeks 1 to 4 and finish this week's missions one by one.", "从第1周到第4周，左右滑动逐一完成本周任务。", "Lướt qua tuần 1 đến 4 và hoàn thành nhiệm vụ từng bước.", "1週目から4週目まで、左右にスワイプして今週のミッションを一つずつ完了しましょう。", "Geser dari minggu 1 sampai 4 dan selesaikan misi satu per satu.")}</p>
          <div className="mt-6 md:mt-8">
            <WeekBoard />
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
