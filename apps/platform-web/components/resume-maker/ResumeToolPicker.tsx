"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, ChatCircleDots, Circle, CircleNotch, FileText, Target } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { Button } from "../ui/button";
import { getMyResumes, type Resume } from "../../lib/member-profile-client";
import { deriveBuilderState } from "../../lib/resume-maker-client";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { getActiveResumeId, setActiveResumeId } from "../../lib/resume-maker-active";
import { getMyCoverLetters, type CoverLetter } from "../../lib/cover-letter-client";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

// 공고 맞춤·모의 면접 진입 선택 화면 — 사용할 이력서(필수)와 자기소개서(선택)를 함께 고른다.
// 시작하면 /resume-maker/[resumeId]/[tool]?cl=[coverLetterId] 로 이동(자소서는 AI 참고 자료).
export function ResumeToolPicker({ tool }: { tool: "tailor" | "interview" }) {
  const router = useRouter();
  const t = useToolPickerCopy();
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [clId, setClId] = useState<string>(""); // "" = 선택 안 함

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [allResumes, cls] = await Promise.all([getMyResumes(), getMyCoverLetters().catch(() => [])]);
        if (!alive) return;
        const drafts = allResumes.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        if (drafts.length === 0) {
          router.replace("/resume-maker");
          return;
        }
        setResumes(drafts);
        setCoverLetters(cls);
        const active = getActiveResumeId();
        setResumeId(drafts.find((d) => d.id === active)?.id ?? drafts[0].id);
        setLoading(false);
      } catch {
        if (alive) router.replace("/resume-maker");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  function start() {
    if (!resumeId) return;
    setActiveResumeId(resumeId);
    router.push(`/resume-maker/${resumeId}/${tool}${clId ? `?cl=${clId}` : ""}`);
  }

  const ToolIcon = tool === "tailor" ? Target : ChatCircleDots;

  if (loading) {
    return (
      <ResumeMakerShell>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
        </div>
      </ResumeMakerShell>
    );
  }

  return (
    <ResumeMakerShell>
      <section className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-white">
        {/* 헤더 — 홈과 동일하게 상단 이미지 */}
        <div className="container max-w-xl px-4 py-9 sm:px-5 md:py-11">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tool === "tailor" ? "/img_fit_postion.webp" : "/img_fake_interview.webp"} alt="" className="mx-auto mb-5 h-auto w-full max-w-[260px]" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">
              <ToolIcon className="h-3.5 w-3.5" weight="fill" aria-hidden />
              {tool === "tailor" ? t.badgeTailor : t.badgeInterview}
            </span>
            <h1 className="mt-3.5 whitespace-pre-line text-[23px] font-black leading-[1.22] tracking-[-0.03em] text-[#191F28] md:text-[28px]">
              {tool === "tailor" ? t.titleTailor : t.titleInterview}
            </h1>
            <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-[#8B95A1] md:text-[15px]">{t.desc}</p>
          </div>
        </div>

        {/* 선택 영역 */}
        <div className="flex-1 bg-[#F7F9FB]">
          <div className="container flex max-w-xl flex-col gap-7 px-4 py-8 sm:px-5">
            {/* 이력서 선택(필수) */}
            <div>
              <p className="mb-2 px-1.5 text-[13px] font-bold text-[#191F28]">{t.selectResume}</p>
              <div className="rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
                <ul className="space-y-1">
                  {resumes.map((r) => {
                    const pct = computeResumeProgress(r.content, deriveBuilderState(r)).percent;
                    const active = r.id === resumeId;
                    return (
                      <li key={r.id} className={`flex items-center rounded-2xl transition ${active ? "bg-[#EDF1FD]" : "hover:bg-[#F2F4F6]"}`}>
                        <button type="button" onClick={() => setResumeId(r.id)} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
                          {active ? <CheckCircle weight="fill" className="h-5 w-5 shrink-0 text-[#0B46E8]" /> : <Circle weight="bold" className="h-5 w-5 shrink-0 text-[#C9CDD2]" />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-bold text-[#191F28]">{r.title || t.untitled}</span>
                            <span className="mt-0.5 block text-[12.5px] text-[#8B95A1]">{t.completion} {pct}%</span>
                          </span>
                        </button>
                        <Link href={`/resume-maker/${r.id}/edit`} className="mr-1.5 inline-flex shrink-0 items-center rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-[#0B46E8] transition hover:bg-white">
                          {t.editItem}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* 자기소개서 선택(선택) */}
            <div>
              <p className="mb-2 px-1.5 text-[13px] font-bold text-[#191F28]">{t.selectCoverLetter}</p>
              <div className="rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
                <ul className="space-y-1">
                  <li>
                    <button type="button" onClick={() => setClId("")} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${clId === "" ? "bg-[#EDF1FD]" : "hover:bg-[#F2F4F6]"}`}>
                      {clId === "" ? <CheckCircle weight="fill" className="h-5 w-5 shrink-0 text-[#0B46E8]" /> : <Circle weight="bold" className="h-5 w-5 shrink-0 text-[#C9CDD2]" />}
                      <span className="text-[15px] font-semibold text-[#4E5968]">{t.noCoverLetter}</span>
                    </button>
                  </li>
                  {coverLetters.map((x) => {
                    const active = x.id === clId;
                    const done = x.items.filter((it) => it.answer.trim()).length;
                    return (
                      <li key={x.id} className={`flex items-center rounded-2xl transition ${active ? "bg-[#EDF1FD]" : "hover:bg-[#F2F4F6]"}`}>
                        <button type="button" onClick={() => setClId(x.id)} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left">
                          {active ? <CheckCircle weight="fill" className="h-5 w-5 shrink-0 text-[#0B46E8]" /> : <Circle weight="bold" className="h-5 w-5 shrink-0 text-[#C9CDD2]" />}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <FileText weight="bold" className="h-3.5 w-3.5 shrink-0 text-[#8B95A1]" aria-hidden />
                              <span className="truncate text-[15px] font-bold text-[#191F28]">{x.title}</span>
                            </span>
                            <span className="mt-0.5 block text-[12.5px] text-[#8B95A1]">{done}/{x.items.length}</span>
                          </span>
                        </button>
                        <Link href={`/resume-maker/cover-letters/${x.id}`} className="mr-1.5 inline-flex shrink-0 items-center rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-[#0B46E8] transition hover:bg-white">
                          {t.editItem}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <Button variant="default" size="lg" className="w-full" disabled={!resumeId} onClick={start}>
              <ToolIcon weight="fill" /> {tool === "tailor" ? t.startTailor : t.startInterview}
            </Button>
          </div>
        </div>
      </section>
    </ResumeMakerShell>
  );
}
