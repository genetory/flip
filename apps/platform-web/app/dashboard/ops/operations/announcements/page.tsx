"use client";

import { useEffect, useMemo, useState } from "react";
import { LinkSimple } from "@phosphor-icons/react";
import { readAccessToken } from "../../../../../lib/auth-client";

type Severity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
type Audience = "ALL" | "STUDENT" | "PARTNER" | "OPERATOR";

type Announcement = {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  audience: Audience;
  linkPath: string | null;
  active: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const SEVERITY_PILL: Record<Severity, string> = {
  INFO: "ops-pill-blue",
  SUCCESS: "ops-pill-green",
  WARNING: "ops-pill-amber",
  CRITICAL: "ops-pill-red"
};

const SEVERITY_KO: Record<Severity, string> = {
  INFO: "정보",
  SUCCESS: "안내",
  WARNING: "주의",
  CRITICAL: "긴급"
};

const AUDIENCE_KO: Record<Audience, string> = {
  ALL: "모두",
  STUDENT: "학생",
  PARTNER: "파트너",
  OPERATOR: "운영자"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function toLocalDateTimeInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("INFO");
  const [audience, setAudience] = useState<Audience>("ALL");
  const [linkPath, setLinkPath] = useState("");
  const [active, setActive] = useState(true);
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/announcements`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: Announcement[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setDraftId(null);
    setTitle("");
    setBody("");
    setSeverity("INFO");
    setAudience("ALL");
    setLinkPath("");
    setActive(true);
    setEndsAt("");
  }

  function edit(item: Announcement) {
    setDraftId(item.id);
    setTitle(item.title);
    setBody(item.body);
    setSeverity(item.severity);
    setAudience(item.audience);
    setLinkPath(item.linkPath ?? "");
    setActive(item.active);
    setEndsAt(toLocalDateTimeInput(item.endsAt));
  }

  async function save() {
    if (!title.trim() || !body.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body_ = {
        title: title.trim(),
        body: body.trim(),
        severity,
        audience,
        linkPath: linkPath.trim() || undefined,
        active,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null
      };
      const response = await fetch(
        `${apiBase()}/ops/announcements${draftId ? `/${draftId}` : ""}`,
        {
          method: draftId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(body_)
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: Announcement) {
    try {
      const response = await fetch(`${apiBase()}/ops/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ active: !item.active })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    }
  }

  async function remove(item: Announcement) {
    if (!window.confirm(`'${item.title}' 공지를 삭제하시겠습니까?`)) return;
    try {
      const response = await fetch(`${apiBase()}/ops/announcements/${item.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  const activeCount = useMemo(() => items.filter((it) => it.active).length, [items]);

  return (
    <section className="ops-content-section">
      <header>
        <h1>공지사항 관리</h1>
        <p>모든 사용자 또는 특정 역할에게 사이트 상단 배너로 노출되는 공지를 관리합니다.</p>
      </header>

      <article className="ops-card">
        <h2 className="ops-section-title">{draftId ? "공지 수정" : "새 공지 작성"}</h2>
        <div className="ops-form-row">
          <label className="ops-form-label">
            제목
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목"
              className="ops-input"
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="ops-form-label">
            내용
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="공지 본문"
              className="ops-textarea"
              style={{ marginTop: 4 }}
            />
          </label>
          <div className="ops-form-grid-3">
            <label className="ops-form-label">
              심각도
              <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} className="ops-select" style={{ marginTop: 4 }}>
                <option value="INFO">정보 (파랑)</option>
                <option value="SUCCESS">안내 (초록)</option>
                <option value="WARNING">주의 (노랑)</option>
                <option value="CRITICAL">긴급 (빨강)</option>
              </select>
            </label>
            <label className="ops-form-label">
              대상
              <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className="ops-select" style={{ marginTop: 4 }}>
                <option value="ALL">모두</option>
                <option value="STUDENT">학생만</option>
                <option value="PARTNER">파트너만</option>
                <option value="OPERATOR">운영자만</option>
              </select>
            </label>
            <label className="ops-form-label">
              종료 시점 (선택)
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="ops-input"
                style={{ marginTop: 4 }}
              />
            </label>
          </div>
          <label className="ops-form-label">
            연결 링크 (선택)
            <input
              type="text"
              value={linkPath}
              onChange={(e) => setLinkPath(e.target.value)}
              placeholder="/positions/..."
              className="ops-input"
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="ops-form-label" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>활성화 (저장 후 즉시 표시)</span>
          </label>
        </div>
        <div className="ops-row-end" style={{ marginTop: 12 }}>
          {draftId ? (
            <button type="button" onClick={resetForm} className="ops-btn">
              취소
            </button>
          ) : null}
          <button type="button" onClick={() => void save()} disabled={saving} className="ops-btn ops-btn-primary">
            {saving ? "저장 중..." : draftId ? "수정" : "공지 발행"}
          </button>
        </div>
      </article>

      {error ? <div className="ops-error-card">{error}</div> : null}

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="ops-empty-card">아직 등록된 공지가 없습니다.</div>
      ) : (
        <article className="ops-card">
          <h2 className="ops-section-title">전체 공지 ({items.length}건, 활성 {activeCount}건)</h2>
          <div className="ops-stack">
            {items.map((it) => (
              <div key={it.id} className="ops-soft-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ops-tag-row" style={{ marginBottom: 6 }}>
                      <span className={`ops-pill ${SEVERITY_PILL[it.severity]}`}>{SEVERITY_KO[it.severity]}</span>
                      <span className="ops-pill ops-pill-gray">{AUDIENCE_KO[it.audience]}</span>
                      {it.active ? <span className="ops-pill ops-pill-green">활성</span> : <span className="ops-pill ops-pill-gray">비활성</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>{it.title}</p>
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{it.body}</p>
                    {it.linkPath ? (
                      <p className="ops-card-subtle" style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <LinkSimple size={13} weight="bold" aria-hidden /> {it.linkPath}
                      </p>
                    ) : null}
                    <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                      {formatDateTime(it.startsAt)} ~ {it.endsAt ? formatDateTime(it.endsAt) : "(무기한)"}
                    </p>
                  </div>
                  <div className="ops-table-actions">
                    <button type="button" onClick={() => void toggleActive(it)} className="ops-btn">
                      {it.active ? "비활성화" : "활성화"}
                    </button>
                    <button type="button" onClick={() => edit(it)} className="ops-btn">
                      수정
                    </button>
                    <button type="button" onClick={() => void remove(it)} className="ops-btn ops-btn-danger">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
