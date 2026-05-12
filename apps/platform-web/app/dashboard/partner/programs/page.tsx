"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../lib/auth-client";

type PartnerProgram = {
  id: string;
  applicationId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
  application: {
    id: string;
    candidateUser: { id: string; name: string | null; email: string };
    position: { id: string; title: string };
  };
  meetings: Array<{ id: string; scheduledAt: string; status: string }>;
  certificate: { id: string } | null;
  recommendation: { id: string } | null;
};

const STATUS_LABEL: Record<PartnerProgram["status"], { label: string; pill: string }> = {
  ACTIVE: { label: "진행 중", pill: "ops-pill-blue" },
  COMPLETED: { label: "완료", pill: "ops-pill-green" },
  CANCELLED: { label: "취소", pill: "ops-pill-gray" }
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function PartnerProgramsPage() {
  const [items, setItems] = useState<PartnerProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PartnerProgram["status"] | "ALL">("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/partner/programs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) {
          if (response.status === 403) throw new Error("회사 정보를 먼저 등록해야 프로그램을 볼 수 있습니다.");
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { ok?: boolean; items?: PartnerProgram[] };
        setItems(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로그램 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const counts = useMemo(() => {
    const result = { ALL: items.length, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((p) => p.status === filterStatus)),
    [items, filterStatus]
  );

  return (
    <section className="ops-content-section">
      <header>
        <h1>프로그램 관리</h1>
        <p>합격한 지원자의 인턴십/프로그램 진행을 관리하세요. 정기 면담, 피드백, 수료증/추천서 발급까지 한곳에서.</p>
      </header>

      <article className="ops-card">
        <div className="ops-filter-chip-row">
          {(["ALL", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((key) => {
            const active = filterStatus === key;
            const label = key === "ALL" ? "전체" : STATUS_LABEL[key].label;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`ops-filter-chip ${active ? "is-active" : ""}`}
              >
                {label} <span className="ops-filter-chip-count">{counts[key]}</span>
              </button>
            );
          })}
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">아직 진행 중인 프로그램이 없습니다. 지원자를 합격 처리하면 자동으로 프로그램이 시작됩니다.</div>
      ) : (
        <div className="ops-card-grid">
          {filtered.map((p) => {
            const badge = STATUS_LABEL[p.status];
            const upcoming = p.meetings.find((m) => m.status === "SCHEDULED");
            return (
              <Link key={p.id} href={`/dashboard/partner/programs/${p.id}`} className="ops-list-card">
                <div className="ops-list-card-head">
                  <div>
                    <p className="ops-list-card-title">{p.application.candidateUser.name ?? "-"}</p>
                    <p className="ops-list-card-sub">{p.application.position.title}</p>
                  </div>
                  <span className={`ops-pill ${badge.pill}`}>{badge.label}</span>
                </div>
                <dl className="ops-list-card-meta">
                  <dt>시작</dt>
                  <dd>{formatDate(p.startsAt)}</dd>
                  <dt>종료</dt>
                  <dd>{formatDate(p.endsAt)}</dd>
                  <dt>다음 미팅</dt>
                  <dd>{upcoming ? new Date(upcoming.scheduledAt).toLocaleString("ko-KR") : "-"}</dd>
                </dl>
                {(p.certificate || p.recommendation) ? (
                  <div className="ops-tag-row">
                    {p.certificate ? <span className="ops-pill ops-pill-green">수료증</span> : null}
                    {p.recommendation ? <span className="ops-pill ops-pill-blue">추천서</span> : null}
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
