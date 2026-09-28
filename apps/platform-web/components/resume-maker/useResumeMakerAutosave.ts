"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumeContent, ResumeCoverLetterItem } from "../../lib/member-profile-client";
import { saveBuilderState, saveResumeContent } from "../../lib/resume-maker-client";
import { isCareerLaunchManagedError } from "../../lib/member-profile-client";
import { updateCoverLetter } from "../../lib/cover-letter-client";
import type { ResumeBuilderState } from "../../lib/resume-maker-types";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;

function localKey(resumeId: string) {
  return `aply.resume-maker.draft.${resumeId}`;
}

// 저장 실패 시 입력 유실을 막기 위한 로컬 임시본 읽기(복구용).
export function readLocalDraft(resumeId: string): ResumeBuilderState | null {
  try {
    const raw = localStorage.getItem(localKey(resumeId));
    return raw ? (JSON.parse(raw) as ResumeBuilderState) : null;
  } catch {
    return null;
  }
}

// 디바운스 자동저장 훅. schedule(builder) 호출 시 일정 시간 후 PATCH 로 저장한다.
// 표준 content(기본 필드)는 baseContent 로 보존하고 builder 네임스페이스만 갱신.
export function useResumeMakerAutosave(resumeId: string, baseContent: ResumeContent) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ResumeBuilderState | null>(null);
  const baseRef = useRef<ResumeContent>(baseContent);
  // 서버가 커리어런치 문서라며 거절하면 더 보내지 않는다 — 보낼 때마다 같은 거절이 반복된다.
  const locked = useRef(false);

  useEffect(() => {
    baseRef.current = baseContent;
  }, [baseContent]);

  const flush = useCallback(async () => {
    const builder = pending.current;
    if (!builder || locked.current) return;
    pending.current = null;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setStatus("saving");
    try {
      const saved = await saveBuilderState(resumeId, baseRef.current, builder, new Date().toISOString());
      baseRef.current = saved.content;
      try {
        localStorage.removeItem(localKey(resumeId));
      } catch {
        /* ignore */
      }
      setStatus("saved");
    } catch (err) {
      if (isCareerLaunchManagedError(err)) {
        locked.current = true;
        setStatus("error");
        return;
      }
      // 서버 저장 실패 — 로컬 임시 저장으로 입력 보존.
      try {
        localStorage.setItem(localKey(resumeId), JSON.stringify(builder));
      } catch {
        /* ignore */
      }
      setStatus("error");
    }
  }, [resumeId]);

  const schedule = useCallback(
    (builder: ResumeBuilderState) => {
      if (locked.current) return;
      pending.current = builder;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    },
    [flush]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { status, schedule, flush };
}

// 자기소개서(자소서) 편집 전용 — title/company/resumeId/items 패치를 디바운스 저장.
export type CoverLetterPatch = { title?: string; company?: string | null; resumeId?: string | null; items?: ResumeCoverLetterItem[] };
export function useCoverLetterAutosave(id: string) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<CoverLetterPatch | null>(null);

  const flush = useCallback(async () => {
    const patch = pending.current;
    if (!patch) return;
    pending.current = null;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setStatus("saving");
    try {
      await updateCoverLetter(id, patch);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [id]);

  const schedule = useCallback(
    (patch: CoverLetterPatch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    },
    [flush]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { status, schedule, flush };
}

// 편집 화면 전용 — 전체 content(표준 필드 + builder)를 디바운스 저장.
export function useResumeContentAutosave(resumeId: string) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<ResumeContent | null>(null);
  // 커리어런치 문서로 거절되면 멈춘다(위 훅과 같은 이유).
  const locked = useRef(false);

  const flush = useCallback(async () => {
    const content = pending.current;
    if (!content || locked.current) return;
    pending.current = null;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setStatus("saving");
    try {
      await saveResumeContent(resumeId, content);
      try {
        localStorage.removeItem(localKey(resumeId));
      } catch {
        /* ignore */
      }
      setStatus("saved");
    } catch (err) {
      if (isCareerLaunchManagedError(err)) {
        locked.current = true;
        setStatus("error");
        return;
      }
      try {
        localStorage.setItem(localKey(resumeId), JSON.stringify(content));
      } catch {
        /* ignore */
      }
      setStatus("error");
    }
  }, [resumeId]);

  const schedule = useCallback(
    (content: ResumeContent) => {
      if (locked.current) return;
      pending.current = content;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    },
    [flush]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return { status, schedule, flush };
}
