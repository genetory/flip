"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { getMyResumes } from "../../lib/member-profile-client";
import { isResumeMakerDraft } from "../../lib/resume-maker-client";
import { getActiveResumeId, setActiveResumeId } from "../../lib/resume-maker-active";

// 공고 맞춤·모의 면접의 id 없는 진입(/resume-maker/tailor 등).
// 현재(혹은 가장 최근) 이력서로 바로 들어가고, 이력서가 하나도 없으면 홈(빈 이력서 카드)으로 보낸다.
// 더 이상 별도 '이력서 선택' 화면을 띄우지 않는다.
export function ResumeToolEntry({ tool }: { tool: "tailor" | "interview" }) {
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const drafts = (await getMyResumes())
          .filter(isResumeMakerDraft)
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        if (!alive) return;
        const activeId = getActiveResumeId();
        const target = drafts.find((d) => d.id === activeId) ?? drafts[0];
        if (target) {
          setActiveResumeId(target.id);
          router.replace(`/resume-maker/${target.id}/${tool}`);
        } else {
          router.replace("/resume-maker");
        }
      } catch {
        if (alive) router.replace("/resume-maker");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, tool]);

  return (
    <ResumeMakerShell>
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
      </div>
    </ResumeMakerShell>
  );
}
