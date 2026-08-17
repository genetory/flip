"use client";

// Career Launch 완주 여부 — 수료증 발급 여부를 서버에서 단일 조회. 프로필·GNB 인증 뱃지/테두리에 사용.
// 미등록·미완주 학생은 false. GNB가 페이지마다 마운트되므로 세션 동안 결과를 모듈 캐시로 재사용한다.
import { useEffect, useState } from "react";

const TOKEN_KEY = "platform_access_token";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

// 토큰별 캐시(로그아웃/계정전환 시 무효화). value=완주여부.
let cache: { token: string; promise: Promise<boolean> } | null = null;

async function fetchCompleted(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/career-launch/completed`, { headers: { Authorization: `Bearer ${token}` } });
    const d = (await res.json().catch(() => null)) as { ok?: boolean; completed?: boolean } | null;
    return Boolean(d?.completed);
  } catch {
    return false;
  }
}

export function useCareerLaunchCompleted(): boolean {
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    let alive = true;
    let token = "";
    try { token = window.localStorage.getItem(TOKEN_KEY) ?? ""; } catch { /* no token */ }
    if (!token) return;
    if (!cache || cache.token !== token) cache = { token, promise: fetchCompleted(token) };
    void cache.promise.then((v) => { if (alive) setCompleted(v); });
    return () => { alive = false; };
  }, []);
  return completed;
}
