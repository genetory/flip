"use client";

// 이력서/자소서에 입력된 항목을 커리어 기록(피드)으로 백필·동기화(멱등). 홈/내 커리어 공용.
import { useEffect } from "react";
import { useResumeDoc } from "./resume-doc";
import { useCoverDoc } from "./cover-doc";
import { ensureFeedEntry } from "./career-feed";
import { SECTION_META } from "./career-chat";
import { talentAppRoutes } from "./app-nav";

export function useCareerHistorySync() {
  const resumeDoc = useResumeDoc();
  const coverDoc = useCoverDoc();

  useEffect(() => {
    resumeDoc?.items.forEach((it, idx) => {
      ensureFeedEntry(`resume:${it.id}`, it.text, it.section, {
        label: `이력서 · ${SECTION_META[it.section].label}`,
        href: talentAppRoutes.resume,
        createdAt: resumeDoc.createdAt + idx
      });
    });
    coverDoc?.items.forEach((it, idx) => {
      if (it.text.trim()) {
        ensureFeedEntry(`cover:${it.id}`, it.text.trim(), "experience", {
          emoji: "📝",
          label: `자기소개서 · ${it.question}`,
          href: talentAppRoutes.cover,
          createdAt: coverDoc.createdAt + idx
        });
      }
    });
  }, [resumeDoc, coverDoc]);
}
