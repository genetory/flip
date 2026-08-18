"use client";

// Talent 스냅샷 로딩 훅 — 로딩/빈/오류 상태를 화면에 일관되게 제공.
// persona 는 개발용 상태 스위처와 연동된다(실서비스에서는 로그인 사용자 데이터로 대체).
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTalentRepository } from "./repository";
import { readPersona, writePersona } from "./persona-state";
import type { TalentSnapshot } from "./types";
import type { TalentPersonaId } from "./types";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { usePlatformT } from "../i18n";

export type AsyncStatus = "loading" | "ready" | "error";

// 상태(진행/경험 등)는 mock persona 를 쓰되, 사용자 식별 정보(이름)는 기존 로그인 세션에서 가져온다.
function withAuthUser(snapshot: TalentSnapshot, name: string | null): TalentSnapshot {
  if (!name) return snapshot;
  return {
    ...snapshot,
    greetingName: name,
    profile: { ...snapshot.profile, displayName: name }
  };
}

export function useTalentSnapshot() {
  const { user } = useAuthSession();
  const t = usePlatformT();
  const [persona, setPersonaState] = useState<TalentPersonaId | null>(null);
  const [snapshot, setSnapshot] = useState<TalentSnapshot | null>(null);
  const [status, setStatus] = useState<AsyncStatus>("loading");

  // 클라이언트 마운트 후에만 persona 를 읽어 SSR/CSR 불일치를 피한다.
  useEffect(() => {
    setPersonaState(readPersona());
  }, []);

  const load = useCallback(async (id: TalentPersonaId) => {
    setStatus("loading");
    try {
      const data = await getTalentRepository().getSnapshot(id, t);
      setSnapshot(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [t]);

  useEffect(() => {
    if (persona) void load(persona);
  }, [persona, load]);

  const setPersona = useCallback((id: TalentPersonaId) => {
    writePersona(id);
    setPersonaState(id);
  }, []);

  const reload = useCallback(() => {
    if (persona) void load(persona);
  }, [persona, load]);

  // 로그인 세션의 실명/닉네임을 스냅샷에 덧입힌다(없으면 mock 이름 유지).
  const authName = user?.realName || user?.name || null;
  const mergedSnapshot = useMemo(
    () => (snapshot ? withAuthUser(snapshot, authName) : null),
    [snapshot, authName]
  );

  return { persona, snapshot: mergedSnapshot, status, setPersona, reload };
}
