"use client";

// 4주 프로그램 — 주차 탭. 홈과 동일 테마(cl-surface). ?week=N 으로 특정 주차 선택.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WeekTabs } from "../../../components/launch/WeekTabs";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../components/AplyFooter";
import { useLaunchT } from "../../../lib/launch/i18n";

function BoardWithParam() {
  const sp = useSearchParams();
  const w = Number(sp.get("week"));
  return <WeekTabs initialWeek={w >= 1 && w <= 4 ? w : undefined} />;
}

export default function ProgramBoardPage() {
  const t = useLaunchT();
  return (
    <div className="cl-surface isolate flex min-h-screen flex-col bg-[#F1F1F4]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <p className="cl-eyebrow" style={{ color: "var(--cl-faint)" }}>4-Week Program</p>
          <h1 className="cl-display mt-2">{t("4주 프로그램", "4-week program", "4周项目", "Chương trình 4 tuần", "4週間プログラム", "Program 4 minggu")}</h1>
          <p className="cl-lead mt-2 max-w-[52ch] whitespace-pre-line">{t("주차 탭을 눌러 이번 주 미션을 하나씩 완료해요.\n이전 주차를 마치면 다음 주차가 열려요.", "Tap a week tab and finish this week's missions one by one.\nFinishing a week unlocks the next.", "点击周标签，逐一完成本周任务。\n完成上一周即可解锁下一周。", "Chạm vào tab tuần và hoàn thành nhiệm vụ tuần này.\nHoàn thành một tuần sẽ mở tuần kế.", "週タブを押して今週のミッションを一つずつ完了します。\n前の週を終えると次の週が開きます。", "Ketuk tab minggu dan selesaikan misi minggu ini.\nMenyelesaikan satu minggu membuka minggu berikutnya.")}</p>
          <div className="mt-6 md:mt-8">
            <Suspense fallback={null}>
              <BoardWithParam />
            </Suspense>
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
