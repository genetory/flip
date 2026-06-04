"use client";

import { FormEvent, MouseEvent, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { CaretLeft, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { getOpsBadgeClassName } from "../../partners/_components/OpsBadge";
import MatchingCandidateDetailPopup from "./_components/MatchingCandidateDetailPopup";
import { getOpsPositionStatusMeta, type PositionStatus } from "../../_components/position-status-meta";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type MatchingMode = "position_to_candidates" | "candidate_to_positions" | "manual";
type MatchingPopupStep = "select" | "loading" | "result";
type MatchingRunLimit = 3 | 5 | 10;

type CandidateItem = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  phoneNumber?: string | null;
  affiliation?: string | null;
  nationality?: string | null;
  gender?: string | null;
  jobTitle: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  createdAt: string;
};

type PositionParticipant = {
  id: string;
  name: string;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
};

type PositionProgressLog = {
  id: string;
  message: string;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
};

type PositionItem = {
  id: string;
  title: string;
  status: PositionStatus;
  preferredNationalities: string[];
  preferredJobRole: string | null;
  hiringCount: number | null;
  requiredQualifications: string | null;
  mainResponsibilities: string | null;
  matchingParticipants: PositionParticipant[];
  postingProgressLogs: PositionProgressLog[];
  createdAt: string;
  partnerOrganization: {
    id: string;
    name: string;
    domain: string;
  } | null;
};

type CandidateMatch = {
  candidate: CandidateItem;
  score: number;
  reasons: string[];
  feedback: string[];
};

type PositionMatch = {
  position: {
    id: string;
    title: string;
    status: PositionStatus;
    preferredJobRole: string | null;
    partnerOrganization: {
      id: string;
      name: string;
      domain: string;
    } | null;
  };
  score: number;
  reasons: string[];
  feedback: string[];
};

type ManualActivity = {
  id: string;
  createdAt: string;
  positionTitle: string;
  candidateName: string;
  note: string | null;
};

type MatchingHistoryResultItem = {
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  positionId?: string;
  positionTitle?: string;
  partnerName?: string | null;
  score?: number;
  reasons?: string[];
  feedback?: string[];
};

type MatchingHistoryItem = {
  id: string;
  mode: "position_to_candidates" | "candidate_to_positions" | string;
  source: "openai" | "rule" | string | null;
  positionId: string | null;
  candidateId: string | null;
  positionTitle: string | null;
  candidateLabel: string | null;
  resultCount: number;
  ranAt: string;
  createdAt: string;
  results: MatchingHistoryResultItem[];
};

type EmbeddedCandidateDetail = {
  id: string;
  label: string;
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? ""); try { return window.localStorage.getItem("platform_access_token") || ""; } catch { return ""; }
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function statusLabel(status: PositionStatus) {
  return getOpsPositionStatusMeta(status).labelKo;
}

function statusTone(status: PositionStatus) {
  return getOpsPositionStatusMeta(status).tone;
}

async function readApiPayload<T>(response: Response): Promise<T & { message?: string }> {
  const text = await response.text();
  if (!text) return {} as T & { message?: string };
  try {
    return JSON.parse(text) as T & { message?: string };
  } catch {
    return { message: text } as T & { message?: string };
  }
}

export default function MatchingManagementPage() {
  const router = useRouter();
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const historyDialogRef = useRef<HTMLDialogElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [lastRunSource, setLastRunSource] = useState<"openai" | "rule" | null>(null);

  const [popupMode, setPopupMode] = useState<MatchingMode | null>(null);
  const [activeMode, setActiveMode] = useState<MatchingMode | null>(null);
  const [popupStep, setPopupStep] = useState<MatchingPopupStep>("select");

  const [positionSearch, setPositionSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [selectedPositionForRun, setSelectedPositionForRun] = useState("");
  const [selectedCandidateForRun, setSelectedCandidateForRun] = useState("");
  const [runLimit, setRunLimit] = useState<MatchingRunLimit>(3);

  const [manualPositionId, setManualPositionId] = useState("");
  const [manualCandidateId, setManualCandidateId] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualActivities, setManualActivities] = useState<ManualActivity[]>([]);
  const [matchingHistories, setMatchingHistories] = useState<MatchingHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState<20 | 40 | 100>(20);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [manualPositionSearch, setManualPositionSearch] = useState("");
  const [manualCandidateSearch, setManualCandidateSearch] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<MatchingHistoryItem | null>(null);
  const [historyDetailView, setHistoryDetailView] = useState<"history" | "candidate">("history");
  const [embeddedHistoryCandidate, setEmbeddedHistoryCandidate] = useState<EmbeddedCandidateDetail | null>(null);

  const [positionRunResult, setPositionRunResult] = useState<{ position: PositionItem; matches: CandidateMatch[] } | null>(null);
  const [candidateRunResult, setCandidateRunResult] = useState<{ candidate: CandidateItem; matches: PositionMatch[] } | null>(null);

  async function fetchData() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const params = new URLSearchParams({
        page: "1",
        pageSize: "100",
        sortBy: "createdAt",
        sortOrder: "desc"
      });

      const [positionsResponse, membersResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/ops/positions?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/members`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const positionsPayload = (await positionsResponse.json()) as {
        ok?: boolean;
        items?: PositionItem[];
        message?: string;
      };
      const membersPayload = (await membersResponse.json()) as {
        ok?: boolean;
        items?: CandidateItem[];
        message?: string;
      };

      if (!positionsResponse.ok || !positionsPayload.ok) {
        setErrorMessage(positionsPayload.message ?? "공고 데이터를 불러오지 못했습니다.");
        return;
      }

      if (!membersResponse.ok || !membersPayload.ok) {
        setErrorMessage(membersPayload.message ?? "후보자 데이터를 불러오지 못했습니다.");
        return;
      }

      const nextPositions = positionsPayload.items ?? [];
      const nextCandidates = (membersPayload.items ?? []).filter((item) => item.role === "STUDENT");
      const nextOpenOrMatchingPositions = nextPositions.filter(
        (position) => position.status === "OPEN"
      );
      const nextPositionPool = nextOpenOrMatchingPositions.length > 0 ? nextOpenOrMatchingPositions : nextPositions;
      setPositions(nextPositions);
      setCandidates(nextCandidates);

      if (!selectedPositionForRun && nextPositionPool.length > 0) setSelectedPositionForRun(nextPositionPool[0].id);
      if (!selectedCandidateForRun && nextCandidates.length > 0) setSelectedCandidateForRun(nextCandidates[0].id);
      if (!manualPositionId && nextPositions.length > 0) setManualPositionId(nextPositions[0].id);
      if (!manualCandidateId && nextCandidates.length > 0) setManualCandidateId(nextCandidates[0].id);
    } catch {
      setErrorMessage("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  // Matching history loads independently so pagination controls don't trigger
  // a full positions/candidates refetch.
  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const params = new URLSearchParams();
      params.set("page", String(historyPage));
      params.set("pageSize", String(historyPageSize));
      const response = await fetch(`${apiBaseUrl}/ops/matching/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await readApiPayload<{
        ok?: boolean;
        items?: MatchingHistoryItem[];
        pagination?: { total?: number; totalPages?: number };
      }>(response));
      if (response.ok && payload.ok) {
        setMatchingHistories(payload.items ?? []);
        setHistoryTotal(payload.pagination?.total ?? 0);
        setHistoryTotalPages(payload.pagination?.totalPages ?? 1);
      }
    } catch {
      // non-fatal — history is a secondary section.
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage, historyPageSize]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (popupMode) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [popupMode]);

  useEffect(() => {
    const dialog = historyDialogRef.current;
    if (!dialog) return;
    if (selectedHistory) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [selectedHistory]);

  const openOrMatchingPositions = useMemo(
    () => positions.filter((position) => position.status === "OPEN"),
    [positions]
  );

  const positionPool = openOrMatchingPositions.length > 0 ? openOrMatchingPositions : positions;

  const filteredPositionsForPopup = useMemo(() => {
    const q = positionSearch.trim().toLowerCase();
    if (!q) return positionPool;
    return positionPool.filter((position) => {
      const partner = position.partnerOrganization?.name?.toLowerCase() ?? "";
      return position.title.toLowerCase().includes(q) || partner.includes(q);
    });
  }, [positionPool, positionSearch]);

  const filteredCandidatesForPopup = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((candidate) => {
      const name = candidate.name?.toLowerCase() ?? "";
      const email = candidate.email.toLowerCase();
      const job = candidate.jobTitle?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q) || job.includes(q);
    });
  }, [candidates, candidateSearch]);

  const filteredPositionsForManual = useMemo(() => {
    const q = manualPositionSearch.trim().toLowerCase();
    if (!q) return positions;
    return positions.filter((position) => {
      const partner = position.partnerOrganization?.name?.toLowerCase() ?? "";
      return position.title.toLowerCase().includes(q) || partner.includes(q);
    });
  }, [positions, manualPositionSearch]);

  const filteredCandidatesForManual = useMemo(() => {
    const q = manualCandidateSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((candidate) => {
      const name = candidate.name?.toLowerCase() ?? "";
      const email = candidate.email.toLowerCase();
      const job = candidate.jobTitle?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q) || job.includes(q);
    });
  }, [candidates, manualCandidateSearch]);

  const progressRows = useMemo(() => {
    return [...positions]
      .sort((a, b) => {
        const statusOrder: Record<PositionStatus, number> = {
          OPEN: 0,
          PENDING_REVIEW: 1,
          DRAFT: 2,
          PAUSED: 3,
          CLOSED: 4,
          REJECTED: 5
        };
        const statusGap = statusOrder[a.status] - statusOrder[b.status];
        if (statusGap !== 0) return statusGap;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((position) => {
        const target = Math.max(1, position.hiringCount ?? 1);
        const matched = position.matchingParticipants.length;
        const ratio = Math.min(100, Math.round((matched / target) * 100));
        const recentLog = position.postingProgressLogs[0];
        return {
          position,
          matched,
          target,
          ratio,
          recentLogMessage: recentLog?.message ?? "진행 로그 없음",
          recentLogAt: recentLog?.createdAt ?? position.createdAt
        };
      })
      .filter((row) => row.matched > 0);
  }, [positions]);

  function openPopup(mode: MatchingMode) {
    setActiveMode(mode);
    setPopupMode(mode);
    setPopupStep("select");
  }

  function requestClosePopup() {
    setPopupMode(null);
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    requestClosePopup();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInsideDialog) requestClosePopup();
  }

  function requestCloseHistoryPopup() {
    setSelectedHistory(null);
    setHistoryDetailView("history");
    setEmbeddedHistoryCandidate(null);
  }

  function handleHistoryDialogCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    requestCloseHistoryPopup();
  }

  function handleHistoryDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInsideDialog) requestCloseHistoryPopup();
  }

  function openHistoryCandidateDetail(candidateId: string, fallbackLabel?: string) {
    const fallback = candidates.find((item) => item.id === candidateId) ?? null;
    const label = fallback?.name || fallback?.email || fallbackLabel || candidateId;
    setEmbeddedHistoryCandidate({ id: candidateId, label });
    setHistoryDetailView("candidate");
  }

  async function startPositionToCandidateMatching() {
    if (!selectedPositionForRun) return;
    setPopupStep("loading");
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/matching/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mode: "position_to_candidates",
          positionId: selectedPositionForRun,
          limit: runLimit
        })
      });

      const payload = (await readApiPayload<{
        ok?: boolean;
        position?: PositionItem;
        matches?: CandidateMatch[];
        source?: "openai" | "rule";
        ranAt?: string;
        message?: string;
      }>(response));

      if (!response.ok || !payload.ok || !payload.position) {
        setErrorMessage(payload.message ?? "공고 기준 매칭 실행에 실패했습니다.");
        return;
      }

      setPositionRunResult({
        position: payload.position,
        matches: payload.matches ?? []
      });
      setCandidateRunResult(null);
      setActiveMode("position_to_candidates");
      setPopupStep("result");
      setLastRunAt(payload.ranAt ?? new Date().toISOString());
      setLastRunSource(payload.source ?? null);
      void fetchData();
      void loadHistory();
    } catch {
      setPopupStep("select");
      setErrorMessage("공고 기준 매칭 실행 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startCandidateToPositionMatching() {
    if (!selectedCandidateForRun) return;
    setPopupStep("loading");
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/matching/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          mode: "candidate_to_positions",
          candidateId: selectedCandidateForRun,
          limit: runLimit
        })
      });

      const payload = (await readApiPayload<{
        ok?: boolean;
        candidate?: CandidateItem;
        matches?: PositionMatch[];
        source?: "openai" | "rule";
        ranAt?: string;
        message?: string;
      }>(response));

      if (!response.ok || !payload.ok || !payload.candidate) {
        setErrorMessage(payload.message ?? "후보자 기준 매칭 실행에 실패했습니다.");
        return;
      }

      setCandidateRunResult({
        candidate: payload.candidate,
        matches: payload.matches ?? []
      });
      setPositionRunResult(null);
      setActiveMode("candidate_to_positions");
      setPopupStep("result");
      setLastRunAt(payload.ranAt ?? new Date().toISOString());
      setLastRunSource(payload.source ?? null);
      void fetchData();
      void loadHistory();
    } catch {
      setPopupStep("select");
      setErrorMessage("후보자 기준 매칭 실행 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitManualMatching(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manualPositionId || !manualCandidateId) return;
    const candidate = candidates.find((item) => item.id === manualCandidateId);
    const position = positions.find((item) => item.id === manualPositionId);
    if (!candidate || !position) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/positions/${manualPositionId}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: candidate.name?.trim() || candidate.email,
          note: manualNote.trim() || undefined
        })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        item?: PositionParticipant;
        message?: string;
      };

      if (!response.ok || !payload.ok || !payload.item) {
        setErrorMessage(payload.message ?? "수동 매칭 등록에 실패했습니다.");
        return;
      }
      const createdItem = payload.item;

      setPositions((prev) =>
        prev.map((item) =>
          item.id === manualPositionId
            ? { ...item, matchingParticipants: [createdItem, ...item.matchingParticipants] }
            : item
        )
      );

      setManualActivities((prev) => [
        {
          id: createdItem.id,
          createdAt: createdItem.createdAt,
          positionTitle: position.title,
          candidateName: candidate.name || candidate.email,
          note: createdItem.note
        },
        ...prev
      ]);
      setManualNote("");
      setActiveMode("manual");
      setPopupStep("result");
      setLastRunAt(new Date().toISOString());
      setLastRunSource(null);
    } catch {
      setErrorMessage("수동 매칭 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const popupTitle =
    popupMode === "position_to_candidates"
      ? "공고 → 후보자 매칭"
      : popupMode === "candidate_to_positions"
        ? "후보자 → 공고 매칭"
        : "운영자 수동 매칭";

  return (
    <section className="ops-content-section">
      <header>
        <h1>매칭 관리</h1>
        <p>각 매칭 모드를 팝업에서 실행하고, 검색/선택 후 매칭 결과를 확인할 수 있습니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>매칭 실행</h2>
          <span className="ops-matching-run-meta">
            {lastRunAt
              ? `최근 실행: ${formatDateTime(lastRunAt)}${lastRunSource ? ` (${lastRunSource.toUpperCase()})` : ""}`
              : "아직 매칭 실행 기록이 없습니다."}
          </span>
        </div>

        <div className="ops-matching-action-buttons">
          <button
            type="button"
            className={activeMode === "position_to_candidates" ? "is-active" : ""}
            onClick={() => openPopup("position_to_candidates")}
          >
            공고 → 후보자 매칭
          </button>
          <button
            type="button"
            className={activeMode === "candidate_to_positions" ? "is-active" : ""}
            onClick={() => openPopup("candidate_to_positions")}
          >
            후보자 ← 공고 매칭
          </button>
          <button type="button" className={activeMode === "manual" ? "is-active" : ""} onClick={() => openPopup("manual")}>
            운영자 수동 매칭
          </button>
        </div>

        {errorMessage ? <p className="ops-form-error">{errorMessage}</p> : null}
      </article>

      <article className="ops-partner-list-card">
        <h2>실시간 매칭 진행 현황</h2>
        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>공고</th>
                <th>상태</th>
                <th>매칭 참여자</th>
                <th>채용 목표</th>
                <th>진행률</th>
                <th>최근 진행 로그</th>
                <th>최근 업데이트</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="ops-table-empty">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : progressRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ops-table-empty">
                    실제 매칭된 포지션이 없습니다.
                  </td>
                </tr>
              ) : (
                progressRows.map((row) => (
                  <tr key={row.position.id}>
                    <td>
                      <strong>{row.position.title}</strong>
                      <div className="ops-matching-cell-sub">{row.position.partnerOrganization?.name || "파트너 미지정"}</div>
                    </td>
                    <td>
                      <span className={getOpsBadgeClassName(statusTone(row.position.status))}>{statusLabel(row.position.status)}</span>
                    </td>
                    <td>{row.matched}명</td>
                    <td>{row.position.hiringCount ? `${row.position.hiringCount}명` : "-"}</td>
                    <td>
                      <div className="ops-matching-progress-track">
                        <span style={{ width: `${row.ratio}%` }} />
                      </div>
                      <div className="ops-matching-cell-sub">{row.ratio}%</div>
                    </td>
                    <td>{row.recentLogMessage}</td>
                    <td>{formatDateTime(row.recentLogAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>매칭 히스토리</h2>
        </div>

        <div className="ops-partner-filters ops-partner-filters--multi">
          <span className="ops-row-sub" style={{ flex: 1, fontSize: 12 }}>
            전체 {historyTotal.toLocaleString()}건
          </span>
          <select
            value={String(historyPageSize)}
            onChange={(e) => {
              setHistoryPageSize(Number(e.target.value) as 20 | 40 | 100);
              setHistoryPage(1);
            }}
            aria-label="페이지 크기"
          >
            <option value="20">20개</option>
            <option value="40">40개</option>
            <option value="100">100개</option>
          </select>
        </div>

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table">
            <thead>
              <tr>
                <th>실행 시각</th>
                <th>모드</th>
                <th>기준</th>
                <th>결과 수</th>
                <th>상위 결과 요약</th>
                <th>소스</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && matchingHistories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ops-table-empty">
                    매칭 히스토리를 불러오는 중입니다...
                  </td>
                </tr>
              ) : matchingHistories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ops-table-empty">
                    저장된 매칭 히스토리가 없습니다.
                  </td>
                </tr>
              ) : (
                matchingHistories.map((history) => {
                  const top = (history.results ?? []).slice(0, 3);
                  const summary = top
                    .map((item) => {
                      if (history.mode === "position_to_candidates") {
                        const label = item.candidateName || item.candidateEmail || item.candidateId || "-";
                        return `${label} (${item.score ?? 0}점)`;
                      }
                      const label = item.positionTitle || item.positionId || "-";
                      return `${label} (${item.score ?? 0}점)`;
                    })
                    .join(", ");
                  const modeLabel = history.mode === "position_to_candidates" ? "공고 → 후보자" : "후보자 → 공고";
                  const baseLabel =
                    history.mode === "position_to_candidates"
                      ? (history.positionTitle ?? history.positionId ?? "-")
                      : (history.candidateLabel ?? history.candidateId ?? "-");

                  return (
                    <tr
                      key={history.id}
                      className="ops-matching-history-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedHistory(history)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedHistory(history);
                        }
                      }}
                    >
                      <td>{formatDateTime(history.ranAt || history.createdAt)}</td>
                      <td>{modeLabel}</td>
                      <td>{baseLabel}</td>
                      <td>{history.resultCount}건</td>
                      <td>{summary || "-"}</td>
                      <td>{history.source ? history.source.toUpperCase() : "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ops-pagination">
          <span>
            총 {historyTotal.toLocaleString()}개 · {historyPage}/{historyTotalPages} 페이지
          </span>
          <div className="ops-pagination-numbers">
            {(() => {
              const maxVisible = 7;
              const buttons: number[] = [];
              const start = Math.max(1, historyPage - 3);
              const end = Math.min(historyTotalPages, start + maxVisible - 1);
              const normalizedStart = Math.max(1, end - maxVisible + 1);
              for (let i = normalizedStart; i <= end; i += 1) buttons.push(i);
              return buttons.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={num === historyPage ? "is-active" : ""}
                  onClick={() => setHistoryPage(num)}
                >
                  {num}
                </button>
              ));
            })()}
          </div>
          <span />
        </div>
      </article>

      <dialog ref={dialogRef} className="ops-modal-dialog" onCancel={handleDialogCancel} onClick={handleDialogClick}>
        <article className="ops-modal-card ops-matching-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <h2>{popupTitle}</h2>
              <button type="button" className="ops-modal-close" onClick={requestClosePopup} aria-label="닫기">
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          </div>

          <div className="ops-modal-scroll-body">
            {popupStep === "loading" && popupMode !== "manual" ? (
              <section className="ops-matching-loading-screen" aria-live="polite">
                <p>매칭 중입니다. 잠시만 기다려주세요...</p>
              </section>
            ) : popupStep === "select" && popupMode === "position_to_candidates" ? (
              <div className="ops-matching-select-panel">
                <input
                  className="ops-partner-filter-search"
                  value={positionSearch}
                  onChange={(e) => setPositionSearch(e.target.value)}
                  placeholder="공고명/파트너사 검색"
                />
                <div className={`ops-matching-select-list ${filteredPositionsForPopup.length === 0 ? "is-empty" : ""}`}>
                  {filteredPositionsForPopup.length === 0 ? (
                    <p className="ops-matching-select-empty">검색 결과가 없습니다.</p>
                  ) : (
                    filteredPositionsForPopup.map((position) => (
                      <button
                        key={position.id}
                        type="button"
                        className={selectedPositionForRun === position.id ? "is-active" : ""}
                        onClick={() => setSelectedPositionForRun(position.id)}
                      >
                        <strong>{position.title}</strong>
                        <span>{position.partnerOrganization?.name || "파트너 미지정"}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : popupStep === "select" && popupMode === "candidate_to_positions" ? (
              <div className="ops-matching-select-panel">
                <input
                  className="ops-partner-filter-search"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="후보자명/이메일/직무 검색"
                />
                <div className={`ops-matching-select-list ${filteredCandidatesForPopup.length === 0 ? "is-empty" : ""}`}>
                  {filteredCandidatesForPopup.length === 0 ? (
                    <p className="ops-matching-select-empty">검색 결과가 없습니다.</p>
                  ) : (
                    filteredCandidatesForPopup.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        className={selectedCandidateForRun === candidate.id ? "is-active" : ""}
                        onClick={() => setSelectedCandidateForRun(candidate.id)}
                      >
                        <strong>{candidate.name || candidate.email}</strong>
                        <span>{candidate.jobTitle || "희망 직무 미입력"}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : popupStep === "select" ? (
              <form id="ops-manual-matching-form" className="ops-partner-form" onSubmit={submitManualMatching}>
                <div className="ops-partner-form-two-cols">
                  <div className="ops-matching-select-panel">
                    <label>
                      공고 검색
                      <input
                        className="ops-partner-filter-search"
                        value={manualPositionSearch}
                        onChange={(e) => setManualPositionSearch(e.target.value)}
                        placeholder="공고명/파트너사 검색"
                      />
                    </label>
                    <div className={`ops-matching-select-list ${filteredPositionsForManual.length === 0 ? "is-empty" : ""}`}>
                      {filteredPositionsForManual.length === 0 ? (
                        <p className="ops-matching-select-empty">검색 결과가 없습니다.</p>
                      ) : (
                        filteredPositionsForManual.map((position) => (
                          <button
                            key={position.id}
                            type="button"
                            className={manualPositionId === position.id ? "is-active" : ""}
                            onClick={() => setManualPositionId(position.id)}
                          >
                            <strong>{position.title}</strong>
                            <span>{position.partnerOrganization?.name || "파트너 미지정"}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="ops-matching-select-panel">
                    <label>
                      후보자 검색
                      <input
                        className="ops-partner-filter-search"
                        value={manualCandidateSearch}
                        onChange={(e) => setManualCandidateSearch(e.target.value)}
                        placeholder="후보자명/이메일/직무 검색"
                      />
                    </label>
                    <div className={`ops-matching-select-list ${filteredCandidatesForManual.length === 0 ? "is-empty" : ""}`}>
                      {filteredCandidatesForManual.length === 0 ? (
                        <p className="ops-matching-select-empty">검색 결과가 없습니다.</p>
                      ) : (
                        filteredCandidatesForManual.map((candidate) => (
                          <button
                            key={candidate.id}
                            type="button"
                            className={manualCandidateId === candidate.id ? "is-active" : ""}
                            onClick={() => setManualCandidateId(candidate.id)}
                          >
                            <strong>{candidate.name || candidate.email}</strong>
                            <span>{candidate.jobTitle || "희망 직무 미입력"}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <label>
                  매칭 메모 (선택)
                  <input value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="추천 이유 또는 운영 메모" />
                </label>
              </form>
            ) : null}

            {popupStep === "result" && popupMode === "position_to_candidates" ? (
              <section className="ops-matching-popup-result ops-matching-popup-result-position">
                <h3>공고 → 후보자 매칭 결과</h3>
                {!positionRunResult ? (
                  <p className="ops-list-empty">공고를 선택하고 매칭 스타트를 눌러주세요.</p>
                ) : (
                  <div className="ops-matching-reco-grid">
                    <article className="ops-matching-reco-card">
                      <h3>{positionRunResult.position.title}</h3>
                      <p>{positionRunResult.position.partnerOrganization?.name || "파트너 미지정"}</p>
                      <ul>
                        {positionRunResult.matches.map((match) => (
                          (() => {
                            const cleanedReasons = (match.reasons ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
                            const cleanedFeedback = (match.feedback ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
                            return (
                          <li
                            key={match.candidate.id}
                            className="ops-matching-clickable-item"
                            onClick={() => router.push(`/dashboard/operations/candidates?candidateId=${match.candidate.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                router.push(`/dashboard/operations/candidates?candidateId=${match.candidate.id}`);
                              }
                            }}
                          >
                            <strong>{match.candidate.name || match.candidate.email}</strong>
                            <span className="ops-matching-score">{match.score}점</span>
                            <small className="ops-matching-reason-3line">
                              <span>매칭 점수 {match.score}점으로 우선 검토 대상에 포함된 후보입니다.</span>
                              <div className="ops-matching-bullet-block">
                                <span className="ops-matching-bullet-title">매칭 근거</span>
                                <ul className="ops-matching-bullet-list">
                                  {cleanedReasons.length === 0 ? <li>기본 매칭 조건 충족</li> : null}
                                  {cleanedReasons.map((reason, idx) => (
                                    <li key={`${match.candidate.id}-reason-${idx}`}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="ops-matching-bullet-block">
                                <span className="ops-matching-bullet-title">매칭률 개선 피드백</span>
                                <ul className="ops-matching-bullet-list">
                                  {cleanedFeedback.length === 0 ? <li>OpenAI 피드백 없음</li> : null}
                                  {cleanedFeedback.map((tip, idx) => (
                                    <li key={`${match.candidate.id}-feedback-${idx}`}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            </small>
                          </li>
                            );
                          })()
                        ))}
                      </ul>
                    </article>
                  </div>
                )}
              </section>
            ) : null}

            {popupStep === "result" && popupMode === "candidate_to_positions" ? (
              <section className="ops-matching-popup-result">
                <h3>후보자 → 공고 매칭 결과</h3>
                {!candidateRunResult ? (
                  <p className="ops-list-empty">후보자를 선택하고 매칭 스타트를 눌러주세요.</p>
                ) : (
                  <div className="ops-matching-reco-grid">
                    <article className="ops-matching-reco-card">
                      <h3>{candidateRunResult.candidate.name || candidateRunResult.candidate.email}</h3>
                      <p>{candidateRunResult.candidate.jobTitle || "희망 직무 미입력"}</p>
                      <ul>
                        {candidateRunResult.matches.map((match) => (
                          (() => {
                            const cleanedReasons = (match.reasons ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
                            const cleanedFeedback = (match.feedback ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
                            return (
                          <li key={match.position.id}>
                            <strong>{match.position.title}</strong>
                            <span className="ops-matching-score">{match.score}점</span>
                            <small className="ops-matching-reason-3line">
                              <span>매칭 점수 {match.score}점으로 추천된 공고입니다.</span>
                              <div className="ops-matching-bullet-block">
                                <span className="ops-matching-bullet-title">매칭 근거</span>
                                <ul className="ops-matching-bullet-list">
                                  {cleanedReasons.length === 0 ? <li>기본 매칭 조건 충족</li> : null}
                                  {cleanedReasons.map((reason, idx) => (
                                    <li key={`${match.position.id}-reason-${idx}`}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="ops-matching-bullet-block">
                                <span className="ops-matching-bullet-title">매칭률 개선 피드백</span>
                                <ul className="ops-matching-bullet-list">
                                  {cleanedFeedback.length === 0 ? <li>OpenAI 피드백 없음</li> : null}
                                  {cleanedFeedback.map((tip, idx) => (
                                    <li key={`${match.position.id}-feedback-${idx}`}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            </small>
                          </li>
                            );
                          })()
                        ))}
                      </ul>
                    </article>
                  </div>
                )}
              </section>
            ) : null}

            {popupStep === "result" && popupMode === "manual" ? (
              <section className="ops-matching-popup-result">
                <h3>수동 매칭 실행 로그</h3>
                {manualActivities.length === 0 ? (
                  <p className="ops-list-empty">수동 매칭 실행 로그가 없습니다.</p>
                ) : (
                  <ul className="ops-matching-activity-list">
                    {manualActivities.map((activity) => (
                      <li key={activity.id}>
                        <strong>{activity.positionTitle}</strong> ← {activity.candidateName}
                        <span>{formatDateTime(activity.createdAt)}</span>
                        <small>{activity.note || "메모 없음"}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}
          </div>

          <div className="ops-modal-fixed-bottom ops-detail-actions">
            {popupStep === "loading" ? (
              <button type="button" className="ops-action-save" disabled>
                매칭 중...
              </button>
            ) : popupStep === "select" ? (
              <>
                <button type="button" className="ops-action-cancel" onClick={requestClosePopup}>
                  취소
                </button>
                {popupMode === "position_to_candidates" ? (
                  <div className="ops-matching-start-controls">
                    <div className="ops-matching-split-start">
                      <button
                        type="button"
                        className="ops-matching-split-main"
                        onClick={startPositionToCandidateMatching}
                        disabled={!selectedPositionForRun}
                      >
                        매칭 스타트
                      </button>
                      <span className="ops-matching-split-divider" aria-hidden />
                      <label className="ops-matching-split-menu" aria-label="매칭 인원 선택">
                        <select
                          className="ops-matching-split-select"
                          value={String(runLimit)}
                          onChange={(e) => setRunLimit(Number(e.target.value) as MatchingRunLimit)}
                          aria-label="매칭 인원"
                        >
                          <option value="3">3명</option>
                          <option value="5">5명</option>
                          <option value="10">10명</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ) : popupMode === "candidate_to_positions" ? (
                  <div className="ops-matching-start-controls">
                    <div className="ops-matching-split-start">
                      <button
                        type="button"
                        className="ops-matching-split-main"
                        onClick={startCandidateToPositionMatching}
                        disabled={!selectedCandidateForRun}
                      >
                        매칭 스타트
                      </button>
                      <span className="ops-matching-split-divider" aria-hidden />
                      <label className="ops-matching-split-menu" aria-label="매칭 인원 선택">
                        <select
                          className="ops-matching-split-select"
                          value={String(runLimit)}
                          onChange={(e) => setRunLimit(Number(e.target.value) as MatchingRunLimit)}
                          aria-label="매칭 인원"
                        >
                          <option value="3">3명</option>
                          <option value="5">5명</option>
                          <option value="10">10명</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    form="ops-manual-matching-form"
                    className="ops-action-save"
                    disabled={submitting || !manualPositionId || !manualCandidateId}
                  >
                    {submitting ? "매칭 중..." : "수동 매칭 확정"}
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" className="ops-action-cancel" onClick={() => setPopupStep("select")}>
                  이전
                </button>
                <button type="button" className="ops-action-save" onClick={requestClosePopup}>
                  닫기
                </button>
              </>
            )}
          </div>
        </article>
      </dialog>

      <dialog
        ref={historyDialogRef}
        className="ops-modal-dialog"
        onCancel={handleHistoryDialogCancel}
        onClick={handleHistoryDialogClick}
      >
        <article
          className={`ops-modal-card ${
            historyDetailView === "candidate" ? "ops-detail-modal-card" : "ops-matching-history-modal-card"
          }`}
        >
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <div className="ops-modal-header-left">
                {historyDetailView === "candidate" ? (
                  <button
                    type="button"
                    className="ops-modal-back"
                    aria-label="이전"
                    onClick={() => {
                      setHistoryDetailView("history");
                      setEmbeddedHistoryCandidate(null);
                    }}
                  >
                    <CaretLeft size={14} weight="bold" aria-hidden />
                  </button>
                ) : null}
                <h2>{historyDetailView === "candidate" ? "후보자 상세정보" : "매칭 히스토리 상세"}</h2>
              </div>
              <button type="button" className="ops-modal-close" onClick={requestCloseHistoryPopup} aria-label="닫기">
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          </div>

          <div className="ops-modal-scroll-body">
            {!selectedHistory ? null : historyDetailView === "history" ? (
              <section className="ops-matching-history-detail">
                <dl className="ops-matching-history-meta">
                  <div>
                    <dt>실행 시각</dt>
                    <dd>{formatDateTime(selectedHistory.ranAt || selectedHistory.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>모드</dt>
                    <dd>{selectedHistory.mode === "position_to_candidates" ? "공고 → 후보자" : "후보자 → 공고"}</dd>
                  </div>
                  <div>
                    <dt>기준</dt>
                    <dd>
                      {selectedHistory.mode === "position_to_candidates"
                        ? (selectedHistory.positionTitle ?? selectedHistory.positionId ?? "-")
                        : (selectedHistory.candidateLabel ?? selectedHistory.candidateId ?? "-")}
                    </dd>
                  </div>
                  <div>
                    <dt>소스</dt>
                    <dd>{selectedHistory.source ? selectedHistory.source.toUpperCase() : "-"}</dd>
                  </div>
                </dl>

                <div className="ops-matching-history-result-list">
                  {(selectedHistory.results ?? []).length === 0 ? (
                    <p className="ops-list-empty">저장된 결과가 없습니다.</p>
                  ) : (
                    <ul>
                      {selectedHistory.results.map((item, idx) => {
                        const title =
                          selectedHistory.mode === "position_to_candidates"
                            ? (item.candidateName || item.candidateEmail || item.candidateId || "-")
                            : (item.positionTitle || item.positionId || "-");
                        const reasons = (item.reasons ?? []).map((row) => row.trim()).filter((row) => row.length > 0);
                        const feedback = (item.feedback ?? []).map((row) => row.trim()).filter((row) => row.length > 0);
                        const candidateId = selectedHistory.mode === "position_to_candidates" ? item.candidateId : undefined;
                        const isCandidateClickable = Boolean(candidateId);
                        return (
                          <li
                            key={`${selectedHistory.id}-${idx}`}
                            className={isCandidateClickable ? "ops-matching-clickable-item" : undefined}
                            role={isCandidateClickable ? "button" : undefined}
                            tabIndex={isCandidateClickable ? 0 : undefined}
                            onClick={
                              isCandidateClickable
                                ? () => {
                                    openHistoryCandidateDetail(candidateId!, title);
                                  }
                                : undefined
                            }
                            onKeyDown={
                              isCandidateClickable
                                ? (event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      openHistoryCandidateDetail(candidateId!, title);
                                    }
                                  }
                                : undefined
                            }
                          >
                            <div className="ops-matching-history-result-top">
                              <strong>{title}</strong>
                              <span className="ops-matching-score">{Math.round(item.score ?? 0)}점</span>
                            </div>
                            {item.partnerName ? <p className="ops-matching-cell-sub">{item.partnerName}</p> : null}
                            {reasons.length > 0 ? (
                              <div className="ops-matching-bullet-block">
                                <span className="ops-matching-bullet-title">매칭 근거</span>
                                <ul className="ops-matching-bullet-list">
                                  {reasons.map((reason, reasonIdx) => (
                                    <li key={`${selectedHistory.id}-${idx}-reason-${reasonIdx}`}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {feedback.length > 0 ? (
                              <div className="ops-matching-bullet-block">
                                <span className="ops-matching-bullet-title">매칭률 개선 피드백</span>
                                <ul className="ops-matching-bullet-list">
                                  {feedback.map((tip, tipIdx) => (
                                    <li key={`${selectedHistory.id}-${idx}-tip-${tipIdx}`}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            ) : (
              <section className="ops-matching-history-candidate-detail">
                {embeddedHistoryCandidate ? (
                  <MatchingCandidateDetailPopup
                    key={embeddedHistoryCandidate.id}
                    apiBaseUrl={apiBaseUrl}
                    candidateId={embeddedHistoryCandidate.id}
                    candidate={candidates.find((item) => item.id === embeddedHistoryCandidate.id) ?? null}
                  />
                ) : (
                  <p className="ops-list-empty">후보자 정보가 없습니다.</p>
                )}
              </section>
            )}
          </div>

          <div className="ops-modal-fixed-bottom ops-detail-actions">
            <button type="button" className="ops-action-save" onClick={requestCloseHistoryPopup}>
              닫기
            </button>
          </div>
        </article>
      </dialog>

    </section>
  );
}
