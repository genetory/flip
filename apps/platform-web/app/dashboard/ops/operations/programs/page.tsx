"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";
import { downloadCsv, formatCsvDate } from "../../../../../lib/csv-export";

type OpsProgram = {
  id: string;
  applicationId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
  partnerOrganizationName: string | null;
  hasCertificate: boolean;
  hasRecommendation: boolean;
  schoolCreditStatus: "REQUESTED" | "APPROVED" | "REJECTED" | null;
};

const STATUS_LABEL: Record<OpsProgram["status"], { label: string; pill: string }> = {
  ACTIVE: { label: "진행 중", pill: "ops-pill-blue" },
  COMPLETED: { label: "완료", pill: "ops-pill-green" },
  CANCELLED: { label: "취소", pill: "ops-pill-gray" }
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function OpsProgramsPage() {
  const [items, setItems] = useState<OpsProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OpsProgram["status"] | "ALL">("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/ops/programs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: OpsProgram[] };
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
        <h1>프로그램 진행 모니터링</h1>
        <p>합격→프로그램 단계로 진입한 모든 매칭의 진행 상태를 한눈에 모니터링하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-card-header">
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
          <button
            type="button"
            className="ops-btn"
            onClick={() => {
              downloadCsv(
                "programs",
                ["지원자", "이메일", "회사", "포지션", "상태", "시작일", "종료일", "수료증", "추천서", "학점 상태"],
                filtered.map((p) => [
                  p.candidateName ?? "",
                  p.candidateEmail ?? "",
                  p.partnerOrganizationName ?? "",
                  p.positionTitle ?? "",
                  STATUS_LABEL[p.status].label,
                  formatCsvDate(p.startsAt),
                  formatCsvDate(p.endsAt),
                  p.hasCertificate ? "Y" : "N",
                  p.hasRecommendation ? "Y" : "N",
                  p.schoolCreditStatus ?? ""
                ])
              );
            }}
            disabled={filtered.length === 0}
          >
            CSV 내보내기
          </button>
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">해당 상태의 프로그램이 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>지원자</th>
                <th>회사/포지션</th>
                <th>기간</th>
                <th>발급물</th>
                <th>학점</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const badge = STATUS_LABEL[p.status];
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="ops-row-strong">{p.candidateName ?? "-"}</div>
                      <div className="ops-row-sub">{p.candidateEmail}</div>
                    </td>
                    <td>
                      <div className="ops-row-strong">{p.partnerOrganizationName ?? "-"}</div>
                      <div className="ops-row-sub">{p.positionTitle}</div>
                    </td>
                    <td>{formatDate(p.startsAt)} ~ {formatDate(p.endsAt)}</td>
                    <td>
                      <div className="ops-tag-row">
                        {p.hasCertificate ? <span className="ops-pill ops-pill-green">수료증</span> : null}
                        {p.hasRecommendation ? <span className="ops-pill ops-pill-blue">추천서</span> : null}
                      </div>
                    </td>
                    <td>
                      {p.schoolCreditStatus === "APPROVED"
                        ? <span className="ops-pill ops-pill-green">승인</span>
                        : p.schoolCreditStatus === "REJECTED"
                          ? <span className="ops-pill ops-pill-red">반려</span>
                          : p.schoolCreditStatus === "REQUESTED"
                            ? <span className="ops-pill ops-pill-amber">심사</span>
                            : "-"}
                    </td>
                    <td>
                      <span className={`ops-pill ${badge.pill}`}>{badge.label}</span>
                    </td>
                    <td>
                      <Link href={`/dashboard/ops/operations/programs/${p.id}`} className="ops-btn">
                        상세 →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      )}
    </section>
  );
}
