"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../../../../lib/auth-client";

type AppSetting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
  createdAt: string;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function SettingsPage() {
  const [items, setItems] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draftKey, setDraftKey] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const [edit, setEdit] = useState<Record<string, { value: string; description: string }>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/app-settings`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: AppSetting[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정값을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createSetting() {
    const key = draftKey.trim();
    if (!key) {
      setError("키를 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/app-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ key, value: draftValue, description: draftDesc.trim() || undefined })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setDraftKey("");
      setDraftValue("");
      setDraftDesc("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정 추가 실패");
    } finally {
      setSaving(false);
    }
  }

  async function saveSetting(item: AppSetting) {
    const draft = edit[item.id];
    if (!draft) return;
    setUpdating(item.id);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/app-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ key: item.key, value: draft.value, description: draft.description || undefined })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setEdit((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정 저장 실패");
    } finally {
      setUpdating(null);
    }
  }

  async function deleteSetting(item: AppSetting) {
    if (!window.confirm(`설정값 "${item.key}"을(를) 삭제하시겠습니까?`)) return;
    setUpdating(item.id);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/ops/app-settings/${item.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <section className="ops-content-section">
      <header>
        <h1>설정값 관리</h1>
        <p>키-값 형식의 운영 설정값을 추가/수정/삭제하세요. 시스템에서 동적으로 참조하는 설정에 사용됩니다.</p>
      </header>

      <article className="ops-card">
        <h2 className="ops-section-title">새 설정 추가</h2>
        <div className="ops-form-grid-3">
          <label className="ops-form-label">
            키
            <input
              type="text"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="예: feature.matching.enabled"
              className="ops-input"
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="ops-form-label">
            값
            <input
              type="text"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              placeholder="예: true"
              className="ops-input"
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="ops-form-label">
            설명 (선택)
            <input
              type="text"
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              placeholder="이 설정이 어떤 역할을 하는지"
              className="ops-input"
              style={{ marginTop: 4 }}
            />
          </label>
        </div>
        <div className="ops-row-end" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => void createSetting()} disabled={saving} className="ops-btn ops-btn-primary">
            {saving ? "추가 중..." : "설정 추가"}
          </button>
        </div>
      </article>

      {error ? <div className="ops-error-card">{error}</div> : null}

      {loading ? (
        <div className="ops-empty-card">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="ops-empty-card">아직 등록된 설정값이 없습니다.</div>
      ) : (
        <article className="ops-table-card">
          <table>
            <thead>
              <tr>
                <th>키</th>
                <th>값</th>
                <th>설명</th>
                <th>최근 수정</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const draft = edit[it.id];
                const isEditing = Boolean(draft);
                const isUpdating = updating === it.id;
                return (
                  <tr key={it.id}>
                    <td className="ops-row-strong" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {it.key}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={draft.value}
                          onChange={(e) =>
                            setEdit((prev) => ({ ...prev, [it.id]: { ...draft, value: e.target.value } }))
                          }
                          className="ops-input"
                          style={{ height: 28, padding: "0 8px" }}
                        />
                      ) : (
                        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{it.value}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={draft.description}
                          onChange={(e) =>
                            setEdit((prev) => ({ ...prev, [it.id]: { ...draft, description: e.target.value } }))
                          }
                          className="ops-input"
                          style={{ height: 28, padding: "0 8px" }}
                        />
                      ) : (
                        it.description ?? "-"
                      )}
                    </td>
                    <td className="ops-row-sub">{formatDateTime(it.updatedAt)}</td>
                    <td>
                      <div className="ops-table-actions">
                        {isEditing ? (
                          <>
                            <button type="button" onClick={() => void saveSetting(it)} disabled={isUpdating} className="ops-btn ops-btn-primary">
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEdit((prev) => {
                                  const next = { ...prev };
                                  delete next[it.id];
                                  return next;
                                })
                              }
                              className="ops-btn"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEdit((prev) => ({ ...prev, [it.id]: { value: it.value, description: it.description ?? "" } }))
                              }
                              className="ops-btn"
                            >
                              편집
                            </button>
                            <button type="button" onClick={() => void deleteSetting(it)} disabled={isUpdating} className="ops-btn ops-btn-danger">
                              삭제
                            </button>
                          </>
                        )}
                      </div>
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
