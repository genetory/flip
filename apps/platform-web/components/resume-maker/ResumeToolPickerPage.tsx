"use client";

import { ResumeMakerLandingPage } from "./ResumeMakerLandingPage";
import { useTailorCopy } from "../../lib/resume-maker-i18n/tailor";
import { useInterviewPrepCopy } from "../../lib/resume-maker-i18n/interview-prep";
import { useLandingCopy } from "../../lib/resume-maker-i18n/landing";

// 공고 맞춤·모의 면접 진입 화면 — 나의 이력서와 같은 카드 목록에서 먼저 이력서를 고르게 한다.
// 고른 이력서를 '현재 이력서'로 지정하고 해당 도구로 들어간다. 이력서가 없으면 만들기/가져오기.
export function ResumeToolPickerPage({ tool }: { tool: "tailor" | "interview" }) {
  const tailor = useTailorCopy();
  const interview = useInterviewPrepCopy();
  const landing = useLandingCopy();
  const c = tool === "tailor" ? tailor : interview;
  return (
    <ResumeMakerLandingPage
      hero={{ badge: c.title, title: c.pickTitle, subtitle: c.pickDesc }}
      pick={{ tool, cta: landing.selectCta }}
    />
  );
}
