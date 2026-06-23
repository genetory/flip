"use client";

import { Wrench } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeBackBar } from "./ResumeBackBar";
import { paperlogy } from "../../lib/fonts";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

// 비공개(작업중) 도구의 '준비 중' 안내 화면.
export function ResumeWipNotice() {
  const t = useToolPickerCopy();
  return (
    <ResumeMakerShell>
      <ResumeBackBar backHref="/resume-maker" backLabel={t.resumeList} title="" />
      <div className="flex min-h-[50vh] items-center justify-center px-5 py-16">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wrench weight="fill" className="h-7 w-7 text-[#0B46E8]" aria-hidden />
          </div>
          <p className={`${paperlogy.className} mt-4 text-xl font-black text-[#0B1227]`}>{t.wipTitle}</p>
          <p className="mt-2 text-[14px] text-muted-foreground">{t.wipDesc}</p>
        </div>
      </div>
    </ResumeMakerShell>
  );
}
