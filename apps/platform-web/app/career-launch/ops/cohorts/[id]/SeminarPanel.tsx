"use client";

import { useState } from "react";
import { saveSeminar, deleteSeminar, type CohortSeminar } from "../../../../../lib/launch/enrollment-client";

// 기수 세미나 일정 — 운영자가 주차별로 입력한다. 학생 주차 화면에 그대로 노출된다.
const WEEKS = [1, 2, 3, 4];

type Row = { startsAt: string; title: string; location: string; online: boolean; url: string };

// ISO(UTC) → datetime-local 입력값(로컬 타임존 기준 YYYY-MM-DDTHH:mm)
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function initRows(seminars: CohortSeminar[]): Record<number, Row> {
  const map: Record<number, Row> = {};
  for (const w of WEEKS) {
    const s = seminars.find((x) => x.week === w);
    map[w] = s
      ? { startsAt: toLocalInput(s.startsAt), title: s.title ?? "", location: s.location ?? "", online: s.online, url: s.url ?? "" }
      : { startsAt: "", title: "", location: "", online: false, url: "" };
  }
  return map;
}

export default function SeminarPanel({ cohortId, seminars }: { cohortId: string; seminars: CohortSeminar[] }) {
  const [rows, setRows] = useState<Record<number, Row>>(() => initRows(seminars));
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const patch = (w: number, p: Partial<Row>) => {
    setRows((r) => ({ ...r, [w]: { ...r[w], ...p } }));
    setSaved((s) => ({ ...s, [w]: false }));
  };

  const save = async (w: number) => {
    const row = rows[w];
    if (!row.startsAt) {
      setError(`${w}주차: 날짜·시간을 입력해 주세요.`);
      return;
    }
    setBusy(w);
    setError("");
    try {
      await saveSeminar(cohortId, w, {
        title: row.title.trim() || null,
        startsAt: new Date(row.startsAt).toISOString(),
        location: row.location.trim() || null,
        online: row.online,
        url: row.url.trim() || null
      });
      setSaved((s) => ({ ...s, [w]: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(null);
    }
  };

  const clear = async (w: number) => {
    setBusy(w);
    setError("");
    try {
      await deleteSeminar(cohortId, w);
      setRows((r) => ({ ...r, [w]: { startsAt: "", title: "", location: "", online: false, url: "" } }));
      setSaved((s) => ({ ...s, [w]: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="ops-partner-list-card">
      <div className="ops-partner-list-top">
        <h2>세미나 일정</h2>
        <span className="ops-card-subtle">주차별로 입력하면 학생 화면에 표시돼요</span>
      </div>
      {error ? <p className="ops-form-error">{error}</p> : null}

      <div className="sem-list">
        {WEEKS.map((w) => {
          const row = rows[w];
          return (
            <div key={w} className="sem-row">
              <div className="sem-week">{w}주차</div>
              <div className="sem-fields">
                <div className="sem-line">
                  <input type="datetime-local" className="ops-input sem-dt" value={row.startsAt} onChange={(e) => patch(w, { startsAt: e.target.value })} />
                  <input className="ops-input sem-title" placeholder="제목(선택)" value={row.title} onChange={(e) => patch(w, { title: e.target.value })} />
                  <label className="sem-online">
                    <input type="checkbox" checked={row.online} onChange={(e) => patch(w, { online: e.target.checked })} /> 온라인
                  </label>
                </div>
                <div className="sem-line">
                  <input className="ops-input sem-loc" placeholder={row.online ? "안내 문구(선택)" : "장소"} value={row.location} onChange={(e) => patch(w, { location: e.target.value })} />
                  <input className="ops-input sem-url" placeholder="접속 링크(온라인)" value={row.url} onChange={(e) => patch(w, { url: e.target.value })} />
                </div>
              </div>
              <div className="sem-actions">
                <button type="button" className="ops-btn ops-btn-primary" disabled={busy === w} onClick={() => void save(w)}>
                  {saved[w] ? "저장됨" : "저장"}
                </button>
                <button type="button" className="ops-btn" disabled={busy === w} onClick={() => void clear(w)}>
                  비우기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .sem-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sem-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px;
          border: 1px solid var(--line);
          border-radius: 12px;
        }
        .sem-week {
          flex: 0 0 52px;
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
          padding-top: 8px;
        }
        .sem-fields {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .sem-line {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .sem-dt {
          width: 200px;
        }
        .sem-title {
          flex: 1 1 160px;
          min-width: 140px;
        }
        .sem-loc {
          flex: 1 1 200px;
          min-width: 160px;
        }
        .sem-url {
          flex: 1 1 200px;
          min-width: 160px;
        }
        .sem-online {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12.5px;
          color: var(--ink-soft);
          white-space: nowrap;
        }
        .sem-actions {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
      `}</style>
    </article>
  );
}
