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
    <div className="cl-surface isolate flex min-h-screen flex-col bg-[color:var(--v2-bg,#fff)]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <p className="text-[15px] font-semibold text-[color:var(--v2-muted)]">4-Step Program</p>
          <h1 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">{t("4단계 프로그램", "4-step program", "4个步骤的项目", "Chương trình 4 bước", "4ステッププログラム", "Program 4 langkah")}</h1>
          <p className="mt-2.5 max-w-[52ch] text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)] whitespace-pre-line">{t("단계 탭을 눌러 이번 단계 미션을 하나씩 완료해요.\n이전 단계를 마치면 다음 단계가 열려요.", "Tap a step tab and finish this step's missions one by one.\nFinishing a step unlocks the next.", "点击步骤标签，逐一完成本步骤任务。\n完成上一步骤即可解锁下一步骤。", "Chạm vào tab bước và hoàn thành nhiệm vụ của bước này.\nHoàn thành một bước sẽ mở bước kế.", "ステップタブを押してこのステップのミッションを一つずつ完了します。\n前のステップを終えると次のステップが開きます。", "Ketuk tab langkah dan selesaikan misi langkah ini.\nMenyelesaikan satu langkah membuka langkah berikutnya.")}</p>
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
