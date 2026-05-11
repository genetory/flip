"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";

export type IssueType = "NO_SHOW" | "BEHAVIOR" | "DROPOUT" | "ATTITUDE" | "PAYMENT" | "OTHER";

const TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: "NO_SHOW", label: "노쇼 (면접·면담 불참)" },
  { value: "BEHAVIOR", label: "행동·태도 문제" },
  { value: "DROPOUT", label: "참여 중단" },
  { value: "ATTITUDE", label: "커뮤니케이션 문제" },
  { value: "PAYMENT", label: "정산/결제 이슈" },
  { value: "OTHER", label: "기타" }
];

export function ReportIssueModal({
  open,
  onClose,
  onSubmitted,
  defaultPositionId,
  defaultApplicationId,
  defaultSubjectUserId
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  defaultPositionId?: string;
  defaultApplicationId?: string;
  defaultSubjectUserId?: string;
}) {
  const [type, setType] = useState<IssueType>("OTHER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType("OTHER");
      setTitle("");
      setDescription("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setError("제목과 설명을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          positionId: defaultPositionId,
          applicationId: defaultApplicationId,
          subjectUserId: defaultSubjectUserId
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "신고를 접수하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11, 18, 39, 0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 560,
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 60px -20px rgba(15, 23, 42, 0.4)"
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>이슈 리포트</p>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ background: "transparent", border: 0, fontSize: 22, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>
            ✕
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>유형</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IssueType)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>제목</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 면접 약속 시간에 나타나지 않음"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
            />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>상황 설명</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="언제 · 어디서 · 어떤 일이 있었는지 자세히 적어주세요. 가능하면 증빙(이메일/캡처)도 함께 언급해주세요."
              rows={6}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, resize: "vertical" }}
            />
          </label>
          {error ? <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p> : null}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#0B1227", fontWeight: 600, fontSize: 13, cursor: submitting ? "wait" : "pointer" }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#0B1227", color: "#fff", fontWeight: 600, fontSize: 13, cursor: submitting ? "wait" : "pointer" }}
          >
            {submitting ? "접수 중..." : "리포트 보내기"}
          </button>
        </div>
      </div>
    </div>
  );
}
