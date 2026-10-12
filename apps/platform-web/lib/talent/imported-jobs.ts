"use client";

// 모의 면접용으로 가져온 외부 공고 — 계정(서버 Resume.content.renewalImportedJobs)에 저장, 본인만 본다.
// 모의 면접 팝업은 공고 객체(PublicPositionListItem)를 받으므로 같은 모양으로 바꿔 넘긴다(id 는 'ext-…' — 연습 기록은 남기지 않음).
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setImportedJobs, snapshotImportedJobs, subscribeDocs, syncUser, type ImportedJob } from "./renewal-docs-store";
import type { ImportedJobDraft, PublicPositionListItem } from "../member-profile-client";

export type { ImportedJob };

export function useImportedJobs(): ImportedJob[] {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  return useSyncExternalStore(subscribeDocs, snapshotImportedJobs, () => null) ?? [];
}

export function addImportedJob(draft: ImportedJobDraft): ImportedJob {
  const job: ImportedJob = { id: `ext-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), ...draft };
  const cur = snapshotImportedJobs() ?? [];
  // 같은 주소·같은 회사+공고는 새로 넣지 않고 맨 앞으로.
  const rest = cur.filter((j) => !(j.sourceUrl && j.sourceUrl === job.sourceUrl) && !(j.company === job.company && j.title === job.title));
  setImportedJobs([job, ...rest].slice(0, 20));
  return job;
}

export function removeImportedJob(id: string): void {
  setImportedJobs((snapshotImportedJobs() ?? []).filter((j) => j.id !== id));
}

/** 모의 면접 팝업에 넘길 공고 모양. */
export function importedToPosition(j: ImportedJob): PublicPositionListItem {
  return {
    id: j.id,
    title: j.title,
    sourceCompanyName: j.company,
    sourceKind: "EXTERNAL",
    sourceProvider: "OTHER",
    sourceUrl: j.sourceUrl ?? null,
    status: "OPEN",
    mainResponsibilities: j.mainResponsibilities || null,
    requiredQualifications: j.requiredQualifications || null,
    preferredQualifications: j.preferredQualifications || null,
    preferredJobRole: null,
    mockInterviewIntent: null,
    mockInterviewQuestions: null,
    eligibleVisas: [],
    partnerOrganization: null
  } as unknown as PublicPositionListItem;
}
