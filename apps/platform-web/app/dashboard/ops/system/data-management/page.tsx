"use client";

import { useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

const CONFIRM_PHRASE = "DELETE";

type WipeResult = {
  ok: boolean;
  before: number;
  deleted: number;
  preserved?: number;
  message?: string;
};

type WipeKind = "positions" | "users";

export default function DataManagementPage() {
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [positionConfirm, setPositionConfirm] = useState("");
  const [userConfirm, setUserConfirm] = useState("");
  const [running, setRunning] = useState<WipeKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Partial<Record<WipeKind, WipeResult>>>({});

  const runWipe = async (kind: WipeKind, confirm: string) => {
    if (confirm !== CONFIRM_PHRASE) {
      setError(`확인 문구가 일치하지 않습니다. "${CONFIRM_PHRASE}"를 정확히 입력해주세요.`);
      return;
    }
    const label = kind === "positions" ? "모든 포지션" : "모든 유저 (test/@test.com 제외)";
    if (!window.confirm(`${label}을(를) 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    const token = readAccessToken();
    if (!token) {
      setError("로그인이 필요합니다. 운영자 계정으로 다시 로그인 후 시도해주세요.");
      return;
    }
    const path = kind === "positions" ? "/ops/data/delete-all-positions" : "/ops/data/delete-non-seed-users";
    try {
      setRunning(kind);
      setError(null);
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ confirm: CONFIRM_PHRASE })
      });
      const payload = (await response.json()) as WipeResult;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "삭제 작업에 실패했습니다.");
      }
      setResults((prev) => ({ ...prev, [kind]: payload }));
      if (kind === "positions") setPositionConfirm("");
      else setUserConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 작업에 실패했습니다.");
    } finally {
      setRunning(null);
    }
  };

  const positionResult = results.positions;
  const userResult = results.users;

  return (
    <section className="ops-content-section">
      <header>
        <h1>데이터 관리</h1>
        <p>운영 데이터를 일괄 삭제합니다. 작업은 즉시 적용되며 되돌릴 수 없으니 신중히 사용하세요.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>모든 포지션 삭제</h2>
        </div>
        <p style={{ marginTop: 8 }}>
          INTERNAL / BUDDIES / KOWORK / WANTED / OTHER 모든 소스의 포지션 + 자식 데이터(지원 내역, 매칭 기록, 상태 이력 등)를 삭제합니다.
        </p>
        <div className="ops-inline-actions" style={{ marginTop: 14, gap: 10, alignItems: "center" }}>
          <input
            type="text"
            value={positionConfirm}
            onChange={(e) => setPositionConfirm(e.target.value)}
            placeholder={`확인 문구 "${CONFIRM_PHRASE}" 입력`}
            disabled={running !== null}
            style={{
              flex: 1,
              maxWidth: 260,
              height: 36,
              padding: "0 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14
            }}
          />
          <button
            type="button"
            className="ops-partner-add-button"
            style={{ background: "#b42318", color: "#fff" }}
            onClick={() => void runWipe("positions", positionConfirm)}
            disabled={running !== null || positionConfirm !== CONFIRM_PHRASE}
          >
            {running === "positions" ? "삭제 중..." : "모든 포지션 삭제"}
          </button>
        </div>
        {positionResult ? (
          <p style={{ marginTop: 12, color: "#047857" }}>
            ✓ 삭제 완료 — {positionResult.deleted.toLocaleString()}건 삭제 (이전: {positionResult.before.toLocaleString()}건)
          </p>
        ) : null}
      </article>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>모든 유저 삭제 (test/@test.com 시드 계정 제외)</h2>
        </div>
        <p style={{ marginTop: 8 }}>
          이메일이 <code>@test.com</code>으로 끝나는 시드 계정(<code>test@test.com</code>, <code>partner@test.com</code>,{" "}
          <code>student@test.com</code> 등)과 현재 로그인한 운영자 본인을 제외한 모든 사용자 + 자식 데이터(프로필, 지원 내역,
          후보자 정보 등)를 삭제합니다.
        </p>
        <div className="ops-inline-actions" style={{ marginTop: 14, gap: 10, alignItems: "center" }}>
          <input
            type="text"
            value={userConfirm}
            onChange={(e) => setUserConfirm(e.target.value)}
            placeholder={`확인 문구 "${CONFIRM_PHRASE}" 입력`}
            disabled={running !== null}
            style={{
              flex: 1,
              maxWidth: 260,
              height: 36,
              padding: "0 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14
            }}
          />
          <button
            type="button"
            className="ops-partner-add-button"
            style={{ background: "#b42318", color: "#fff" }}
            onClick={() => void runWipe("users", userConfirm)}
            disabled={running !== null || userConfirm !== CONFIRM_PHRASE}
          >
            {running === "users" ? "삭제 중..." : "모든 유저 삭제"}
          </button>
        </div>
        {userResult ? (
          <p style={{ marginTop: 12, color: "#047857" }}>
            ✓ 삭제 완료 — {userResult.deleted.toLocaleString()}건 삭제, {(userResult.preserved ?? 0).toLocaleString()}건 보존
            (이전: {userResult.before.toLocaleString()}건)
          </p>
        ) : null}
      </article>

      {error ? (
        <article className="ops-partner-list-card" style={{ borderColor: "#fecaca" }}>
          <p style={{ color: "#b42318" }}>{error}</p>
        </article>
      ) : null}
    </section>
  );
}
