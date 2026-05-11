"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAccessToken } from "../../../../lib/auth-client";
import { InterviewSlotDetailModal, type SlotDetailItem } from "../../../../components/interviews/InterviewSlotDetailModal";

type SlotStatus = "PROPOSED" | "SELECTED" | "CANCELLED";

type Slot = {
  id: string;
  applicationId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: SlotStatus;
  proposedAt: string;
  selectedAt: string | null;
  cancelledAt: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
};

const STATUS_LABEL: Record<SlotStatus, { label: string; pill: string }> = {
  PROPOSED: { label: "제안됨", pill: "ops-pill-amber" },
  SELECTED: { label: "확정", pill: "ops-pill-green" },
  CANCELLED: { label: "취소", pill: "ops-pill-gray" }
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function PartnerInterviewsPage() {
  const [items, setItems] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SlotStatus | "ALL">("ALL");
  const [detailTarget, setDetailTarget] = useState<SlotDetailItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [calendarAnchor, setCalendarAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = readAccessToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBaseUrl}/partner/interviews`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (!response.ok) {
          if (response.status === 403) throw new Error("회사 정보를 먼저 등록해야 면접 일정을 볼 수 있습니다.");
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { items?: Slot[] };
        setItems(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "면접 일정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [reloadKey]);

  const counts = useMemo(() => {
    const result = { ALL: items.length, PROPOSED: 0, SELECTED: 0, CANCELLED: 0 };
    for (const it of items) result[it.status] += 1;
    return result;
  }, [items]);

  const filtered = useMemo(
    () => (filterStatus === "ALL" ? items : items.filter((s) => s.status === filterStatus)),
    [items, filterStatus]
  );

  return (
    <section className="ops-content-section">
      <header>
        <h1>면접 일정</h1>
        <p>회사 모든 지원자의 면접 슬롯을 한곳에서 확인하세요.</p>
      </header>

      <article className="ops-card">
        <div className="ops-card-header">
          <div className="ops-filter-chip-row">
            {(["ALL", "PROPOSED", "SELECTED", "CANCELLED"] as const).map((key) => {
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
          <div className="ops-view-toggle">
            <button type="button" className={viewMode === "table" ? "is-active" : ""} onClick={() => setViewMode("table")}>
              목록
            </button>
            <button type="button" className={viewMode === "calendar" ? "is-active" : ""} onClick={() => setViewMode("calendar")}>
              캘린더
            </button>
          </div>
        </div>
      </article>

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : error ? (
        <div className="ops-error-card">{error}</div>
      ) : viewMode === "calendar" ? (
        (() => {
          const year = calendarAnchor.getFullYear();
          const month = calendarAnchor.getMonth();
          const firstOfMonth = new Date(year, month, 1);
          const firstWeekday = firstOfMonth.getDay();
          const gridStart = new Date(year, month, 1 - firstWeekday);
          const days: Date[] = [];
          for (let i = 0; i < 42; i++) {
            const d = new Date(gridStart);
            d.setDate(gridStart.getDate() + i);
            days.push(d);
          }
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const monthLabel = `${year}년 ${month + 1}월`;

          const eventsByDay = new Map<string, Slot[]>();
          for (const s of filtered) {
            const d = new Date(s.startsAt);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            const list = eventsByDay.get(key) ?? [];
            list.push(s);
            eventsByDay.set(key, list);
          }

          return (
            <div className="ops-calendar-wrap">
              <div className="ops-calendar-nav">
                <button
                  type="button"
                  className="ops-btn"
                  onClick={() => setCalendarAnchor(new Date(year, month - 1, 1))}
                >
                  ←
                </button>
                <h3>{monthLabel}</h3>
                <div className="ops-row">
                  <button
                    type="button"
                    className="ops-btn"
                    onClick={() => {
                      const now = new Date();
                      setCalendarAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
                    }}
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    className="ops-btn"
                    onClick={() => setCalendarAnchor(new Date(year, month + 1, 1))}
                  >
                    →
                  </button>
                </div>
              </div>
              <div className="ops-calendar-grid">
                {["일", "월", "화", "수", "목", "금", "토"].map((wd) => (
                  <div key={wd} className="ops-calendar-day-head">{wd}</div>
                ))}
                {days.map((d, idx) => {
                  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                  const events = eventsByDay.get(key) ?? [];
                  const isOtherMonth = d.getMonth() !== month;
                  const isToday = d.getTime() === today.getTime();
                  return (
                    <div
                      key={idx}
                      className={`ops-calendar-day ${isOtherMonth ? "is-other-month" : ""} ${isToday ? "is-today" : ""}`}
                    >
                      <span className="ops-calendar-date">{d.getDate()}</span>
                      {events.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setDetailTarget(e as SlotDetailItem)}
                          className={`ops-calendar-event ${e.status === "SELECTED" ? "is-selected" : ""} ${e.status === "CANCELLED" ? "is-cancelled" : ""}`}
                          style={{ border: 0, textAlign: "left", width: "100%" }}
                          title={`${e.candidateName ?? "-"} · ${e.positionTitle ?? "-"}`}
                        >
                          {new Date(e.startsAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} {e.candidateName ?? "-"}
                        </button>
                      ))}
                      {events.length > 3 ? (
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>+{events.length - 3}건</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : filtered.length === 0 ? (
        <div className="ops-empty-card">해당 상태의 면접 일정이 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>지원자</th>
                <th>포지션</th>
                <th>일정</th>
                <th>장소</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const badge = STATUS_LABEL[s.status];
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="ops-row-strong">{s.candidateName ?? "-"}</div>
                      <div className="ops-row-sub">{s.candidateEmail}</div>
                    </td>
                    <td>{s.positionTitle}</td>
                    <td>
                      {formatDateTime(s.startsAt)}
                      <div className="ops-row-sub">~ {formatDateTime(s.endsAt)}</div>
                    </td>
                    <td>{s.location ?? "-"}</td>
                    <td>
                      <span className={`ops-pill ${badge.pill}`}>{badge.label}</span>
                    </td>
                    <td>
                      <div className="ops-table-actions">
                        <button type="button" className="ops-btn" onClick={() => setDetailTarget(s as SlotDetailItem)}>
                          상세
                        </button>
                        <Link href={`/dashboard/partner/applicants/${s.applicationId}`} className="ops-btn">
                          지원자
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </article>
      )}

      <InterviewSlotDetailModal
        open={detailTarget !== null}
        slot={detailTarget}
        viewer="partner"
        onClose={() => setDetailTarget(null)}
        onUpdated={() => setReloadKey((k) => k + 1)}
      />
    </section>
  );
}
