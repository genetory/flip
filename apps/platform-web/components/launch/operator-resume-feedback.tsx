"use client";

import { useEffect, useState } from "react";
import {
  fetchStudentFeedback,
  createStudentFeedback,
  deleteStudentFeedback,
  type CareerFeedback,
  type FeedbackDocType
} from "../../lib/launch/feedback-client";
import { useLaunchT } from "../../lib/launch/i18n";

// 운영자 이력서 상세 모달에 붙는 Career Launch 피드백 패널.
// 해당 학생에게 남긴 피드백 목록을 보여주고, 새 피드백을 작성/삭제한다.
export function OperatorResumeFeedback({
  studentUserId,
  docId,
  docType = "resume",
  studentName,
  allowDocTypeSelect = false
}: {
  studentUserId: string;
  docId?: string;
  docType?: FeedbackDocType;
  studentName?: string | null;
  allowDocTypeSelect?: boolean;
}) {
  const t = useLaunchT();
  const DOC_LABEL: Record<string, string> = {
    resume: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"),
    cover_letter: t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter"),
    general: t("전체", "General", "全部", "Tổng quát", "全体", "Umum")
  };
  const [items, setItems] = useState<CareerFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState<number | "">("");
  const [docTypeSel, setDocTypeSel] = useState<FeedbackDocType>(allowDocTypeSelect ? "general" : docType);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const activeDocType: FeedbackDocType = allowDocTypeSelect ? docTypeSel : docType;

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await fetchStudentFeedback(studentUserId);
        if (alive) setItems(list);
      } catch {
        // 조회 실패는 빈 목록으로
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [studentUserId]);

  const submit = async () => {
    const text = body.trim();
    if (!text || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await createStudentFeedback({
        studentUserId,
        week: week === "" ? undefined : Number(week),
        docType: activeDocType,
        docId: allowDocTypeSelect ? undefined : docId,
        body: text
      });
      setItems((prev) => [created, ...prev]);
      setBody("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("피드백을 저장하지 못했어요.", "Couldn't save the feedback.", "无法保存反馈。", "Không thể lưu phản hồi.", "フィードバックを保存できませんでした。", "Gagal menyimpan umpan balik."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteStudentFeedback(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      // 삭제 실패 무시(목록 유지)
    }
  };

  return (
    <section className="ops-detail-section">
      <h3>{t("코치 피드백", "Coach feedback", "教练反馈", "Phản hồi của cố vấn", "コーチのフィードバック", "Umpan balik pelatih")} {studentName ? `· ${studentName}` : ""}</h3>

      {/* 작성 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{t("주차", "Week", "周次", "Tuần", "週", "Minggu")}</label>
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
          >
            <option value="">{t("해당 없음", "None", "无", "Không có", "該当なし", "Tidak ada")}</option>
            <option value={1}>Week 1</option>
            <option value={2}>Week 2</option>
            <option value={3}>Week 3</option>
            <option value={4}>Week 4</option>
          </select>
          {allowDocTypeSelect ? (
            <>
              <label style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginLeft: 4 }}>{t("대상", "Target", "对象", "Đối tượng", "対象", "Target")}</label>
              <select
                value={docTypeSel}
                onChange={(e) => setDocTypeSel(e.target.value as FeedbackDocType)}
                style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              >
                <option value="general">{t("전체", "General", "全部", "Tổng quát", "全体", "Umum")}</option>
                <option value="resume">{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</option>
                <option value="cover_letter">{t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Cover letter")}</option>
              </select>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>· {t("{doc} 기준", "Based on {doc}", "基于{doc}", "Dựa trên {doc}", "{doc}を対象", "Berdasarkan {doc}").replace("{doc}", DOC_LABEL[docType] ?? "")}</span>
          )}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder={t("학생에게 전달할 피드백을 작성하세요. 저장하면 학생 대시보드에 바로 표시돼요.", "Write feedback for the student. Once saved, it appears on their dashboard right away.", "填写要发给学生的反馈。保存后会立即显示在学生的仪表板上。", "Viết phản hồi gửi sinh viên. Sau khi lưu, nó hiển thị ngay trên bảng điều khiển của họ.", "学生に伝えるフィードバックを書いてください。保存すると学生のダッシュボードにすぐ表示されます。", "Tulis umpan balik untuk siswa. Setelah disimpan, langsung tampil di dasbor mereka.")}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
        />
        {error ? <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span> : null}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="ops-detail-button"
            disabled={!body.trim() || saving}
            onClick={() => void submit()}
            style={{ background: body.trim() && !saving ? "#0B46E8" : "#cbd5e1", color: "#fff", border: "none", cursor: body.trim() && !saving ? "pointer" : "not-allowed" }}
          >
            {saving ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("피드백 보내기", "Send feedback", "发送反馈", "Gửi phản hồi", "フィードバックを送る", "Kirim umpan balik")}
          </button>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <p style={{ fontSize: 13, color: "#94a3b8" }}>{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
      ) : items.length === 0 ? (
        <p style={{ fontSize: 13, color: "#94a3b8" }}>{t("아직 남긴 피드백이 없어요.", "No feedback left yet.", "还没有留下反馈。", "Chưa có phản hồi nào.", "まだ残したフィードバックがありません。", "Belum ada umpan balik.")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((f) => (
            <div key={f.id} style={{ border: "1px solid #eef2f7", borderRadius: 10, padding: "10px 12px", background: "#f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#64748b" }}>
                {f.week ? <span style={{ fontWeight: 700, color: "#0B46E8" }}>Week {f.week}</span> : null}
                <span>{DOC_LABEL[f.docType] ?? t("전체", "General", "全部", "Tổng quát", "全体", "Umum")}</span>
                <span style={{ marginLeft: "auto" }}>{f.createdAt?.slice(0, 10)}</span>
                {f.readAt ? <span style={{ color: "#16a34a" }}>{t("읽음", "Read", "已读", "Đã đọc", "既読", "Dibaca")}</span> : <span style={{ color: "#f59e0b" }}>{t("미확인", "Unread", "未读", "Chưa đọc", "未読", "Belum dibaca")}</span>}
                <button
                  type="button"
                  onClick={() => void remove(f.id)}
                  style={{ marginLeft: 4, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}
                >
                  {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                </button>
              </div>
              <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: "#191F28", whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{f.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
