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

  // 커뮤니티 콘텐츠 생성 도구
  const [genPosts, setGenPosts] = useState(5);
  const [genCommentsMin, setGenCommentsMin] = useState(1);
  const [genCommentsMax, setGenCommentsMax] = useState(5);
  const [genDaysBack, setGenDaysBack] = useState(14);
  const [genRunning, setGenRunning] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ postsCreated: number; commentsCreated: number } | null>(null);

  const runGenerate = async () => {
    const token = readAccessToken();
    if (!token) {
      setGenError("로그인이 필요합니다. 운영자 계정으로 다시 로그인 후 시도해주세요.");
      return;
    }
    try {
      setGenRunning(true);
      setGenError(null);
      const response = await fetch(`${apiBaseUrl}/ops/community/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          posts: genPosts,
          commentsMin: genCommentsMin,
          commentsMax: Math.max(genCommentsMin, genCommentsMax),
          daysBack: genDaysBack
        })
      });
      const payload = (await response.json()) as { ok?: boolean; postsCreated?: number; commentsCreated?: number; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "생성에 실패했습니다.");
      }
      setGenResult({ postsCreated: payload.postsCreated ?? 0, commentsCreated: payload.commentsCreated ?? 0 });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "생성에 실패했습니다.");
    } finally {
      setGenRunning(false);
    }
  };

  const [candRunning, setCandRunning] = useState(false);
  const [candResult, setCandResult] = useState<{ created: number; total: number } | null>(null);
  const [candError, setCandError] = useState<string | null>(null);
  const [delPostsRunning, setDelPostsRunning] = useState(false);
  const [delPostsResult, setDelPostsResult] = useState<number | null>(null);

  const postOps = async (path: string) => {
    const token = readAccessToken();
    if (!token) throw new Error("로그인이 필요합니다. 운영자 계정으로 다시 로그인 후 시도해주세요.");
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: "{}"
    });
    const payload = (await response.json()) as Record<string, unknown> & { ok?: boolean; message?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.message ?? "요청에 실패했습니다.");
    return payload;
  };

  const runSeedCandidates = async () => {
    try {
      setCandRunning(true);
      setCandError(null);
      const payload = await postOps("/ops/community/seed-candidates");
      setCandResult({ created: Number(payload.created ?? 0), total: Number(payload.total ?? 0) });
    } catch (err) {
      setCandError(err instanceof Error ? err.message : "후보자 생성에 실패했습니다.");
    } finally {
      setCandRunning(false);
    }
  };

  const runDeleteNonOperatorPosts = async () => {
    if (!window.confirm("운영자가 작성한 글을 제외한 모든 커뮤니티 글(과 댓글)을 삭제합니다. 계속할까요?")) return;
    try {
      setDelPostsRunning(true);
      const payload = await postOps("/ops/community/delete-non-operator");
      setDelPostsResult(Number(payload.deleted ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDelPostsRunning(false);
    }
  };

  const numField = (label: string, value: number, setValue: (n: number) => void, min: number, max: number) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 600, color: "#374151" }}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        disabled={genRunning}
        style={{ width: 110, height: 36, padding: "0 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 }}
      />
    </label>
  );

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
          <h2>커뮤니티 콘텐츠 생성</h2>
        </div>
        <p style={{ marginTop: 8 }}>
          시드된 외국인 후보자 계정으로 커뮤니티 글과 댓글을 각자의 모국어·대학생 말투로 생성합니다. 작성 시간은 설정한 기간 내에서 과거 랜덤으로 분포됩니다.
        </p>
        <div className="ops-inline-actions" style={{ marginTop: 14, gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          {numField("글 개수", genPosts, setGenPosts, 1, 100)}
          {numField("댓글 최소", genCommentsMin, setGenCommentsMin, 0, 20)}
          {numField("댓글 최대", genCommentsMax, setGenCommentsMax, 0, 20)}
          {numField("과거 기간(일)", genDaysBack, setGenDaysBack, 0, 365)}
          <button
            type="button"
            className="ops-partner-add-button"
            style={{ background: "#0B46E8", color: "#fff" }}
            onClick={() => void runGenerate()}
            disabled={genRunning}
          >
            {genRunning ? "생성 중..." : "생성하기"}
          </button>
        </div>
        {genError ? <p style={{ marginTop: 12, color: "#b42318" }}>{genError}</p> : null}
        {genResult ? (
          <p style={{ marginTop: 12, color: "#047857" }}>
            ✓ 생성 완료 — 글 {genResult.postsCreated.toLocaleString()}개, 댓글 {genResult.commentsCreated.toLocaleString()}개
          </p>
        ) : null}

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
            글 생성 전에 외국인 후보자 계정이 필요합니다. 아래로 후보자 20명을 시드하고, 자유게시판을 운영자 글만 남기고 정리할 수 있어요.
          </p>
          <div className="ops-inline-actions" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="ops-partner-add-button"
              onClick={() => void runSeedCandidates()}
              disabled={candRunning}
            >
              {candRunning ? "생성 중..." : "후보자 20명 생성"}
            </button>
            <button
              type="button"
              className="ops-partner-add-button"
              style={{ background: "#b42318", color: "#fff" }}
              onClick={() => void runDeleteNonOperatorPosts()}
              disabled={delPostsRunning}
            >
              {delPostsRunning ? "삭제 중..." : "자유게시판 정리 (운영자 글만 남김)"}
            </button>
          </div>
          {candError ? <p style={{ marginTop: 10, color: "#b42318" }}>{candError}</p> : null}
          {candResult ? (
            <p style={{ marginTop: 10, color: "#047857" }}>
              ✓ 후보자 시드 완료 — 신규 {candResult.created}명 (총 {candResult.total}명)
            </p>
          ) : null}
          {delPostsResult !== null ? (
            <p style={{ marginTop: 10, color: "#047857" }}>✓ 정리 완료 — {delPostsResult.toLocaleString()}개 글 삭제</p>
          ) : null}
        </div>
      </article>

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
