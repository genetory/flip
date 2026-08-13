"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { usePlatformT } from "../../lib/i18n";

export type ProgramFeedback = {
  id: string;
  content: string;
  rating: number | null;
  createdAt: string;
  authorRole: "STUDENT" | "PARTNER" | "OPERATOR";
  author: { id: string; name: string | null; role: string };
};

export type ProgramMeeting = {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  agenda: string | null;
  location: string | null;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
};

export type ProgramDetail = {
  id: string;
  applicationId: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  notes: string | null;
  application: {
    id: string;
    candidateUser: { id: string; name: string | null; email: string };
    position: {
      id: string;
      title: string;
      partnerOrganization: { id: string; name: string } | null;
    };
  };
  meetings: ProgramMeeting[];
  feedbacks: ProgramFeedback[];
  certificate: { id: string; title: string; content: string; issuedAt: string } | null;
  recommendation: { id: string; content: string; signerName: string; signerTitle: string | null; issuedAt: string } | null;
  schoolCreditRequest: {
    id: string;
    schoolName: string;
    courseCode: string | null;
    credits: number;
    status: "REQUESTED" | "APPROVED" | "REJECTED";
    requestedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
  } | null;
};

type Props = {
  programId: string;
  viewer: "partner" | "student" | "operator";
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ProgramDetailView({ programId, viewer }: Props) {
  const t = usePlatformT();
  const canEditMeta = viewer === "partner" || viewer === "operator";
  const canManageMeetings = viewer === "partner" || viewer === "operator";
  const canIssueArtifacts = viewer === "partner" || viewer === "operator";
  const canRequestCredit = viewer === "student";

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState<ProgramDetail["status"]>("ACTIVE");
  const [startsAtDraft, setStartsAtDraft] = useState("");
  const [endsAtDraft, setEndsAtDraft] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [meetingNotesDraft, setMeetingNotesDraft] = useState<Record<string, string>>({});
  const [updatingMeeting, setUpdatingMeeting] = useState<string | null>(null);

  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("");
  const [postingFeedback, setPostingFeedback] = useState(false);

  const [certTitle, setCertTitle] = useState("");
  const [certContent, setCertContent] = useState("");
  const [issuingCert, setIssuingCert] = useState(false);

  const [recContent, setRecContent] = useState("");
  const [recSigner, setRecSigner] = useState("");
  const [recSignerTitle, setRecSignerTitle] = useState("");
  const [issuingRec, setIssuingRec] = useState(false);

  const [schoolName, setSchoolName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [requestingCredit, setRequestingCredit] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/programs/${programId}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { ok?: boolean; item?: ProgramDetail };
      const p = payload.item ?? null;
      setProgram(p);
      if (p) {
        setStatusDraft(p.status);
        setStartsAtDraft(toDateInputValue(p.startsAt));
        setEndsAtDraft(toDateInputValue(p.endsAt));
        setCertTitle(p.certificate?.title ?? "");
        setCertContent(p.certificate?.content ?? "");
        setRecContent(p.recommendation?.content ?? "");
        setRecSigner(p.recommendation?.signerName ?? "");
        setRecSignerTitle(p.recommendation?.signerTitle ?? "");
        setSchoolName(p.schoolCreditRequest?.schoolName ?? "");
        setCourseCode(p.schoolCreditRequest?.courseCode ?? "");
        setCredits(String(p.schoolCreditRequest?.credits ?? 3));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("프로그램을 불러오지 못했습니다.", "Failed to load program.", "无法加载项目。", "Không thể tải chương trình.", "プログラムを読み込めませんでした。", "Gagal memuat program."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [programId]);

  async function saveMeta() {
    setSavingMeta(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { status: statusDraft };
      if (startsAtDraft) body.startsAt = new Date(`${startsAtDraft}T00:00:00`).toISOString();
      body.endsAt = endsAtDraft ? new Date(`${endsAtDraft}T23:59:59`).toISOString() : null;
      const response = await fetch(`${apiBase()}/programs/${programId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("프로그램 정보 저장 실패", "Failed to save program info", "保存项目信息失败", "Lưu thông tin chương trình thất bại", "プログラム情報の保存に失敗", "Gagal menyimpan info program"));
    } finally {
      setSavingMeta(false);
    }
  }

  async function createMeeting() {
    if (!meetingDate || !meetingTime) {
      setError(t("미팅 날짜와 시간을 입력해 주세요.", "Please enter the meeting date and time.", "请输入会议日期和时间。", "Vui lòng nhập ngày và giờ họp.", "ミーティングの日付と時間を入力してください。", "Silakan masukkan tanggal dan waktu pertemuan."));
      return;
    }
    setCreatingMeeting(true);
    setError(null);
    try {
      const scheduledAt = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
      const body = {
        scheduledAt,
        durationMinutes: Number.parseInt(meetingDuration, 10) || 30,
        agenda: meetingAgenda.trim() || undefined,
        location: meetingLocation.trim() || undefined
      };
      const response = await fetch(`${apiBase()}/programs/${programId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setMeetingDate("");
      setMeetingTime("");
      setMeetingAgenda("");
      setMeetingLocation("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("미팅 추가 실패", "Failed to add meeting", "添加会议失败", "Thêm cuộc họp thất bại", "ミーティングの追加に失敗", "Gagal menambahkan pertemuan"));
    } finally {
      setCreatingMeeting(false);
    }
  }

  async function updateMeeting(meetingId: string, body: Record<string, unknown>) {
    setUpdatingMeeting(meetingId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/program-meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("미팅 업데이트 실패", "Failed to update meeting", "更新会议失败", "Cập nhật cuộc họp thất bại", "ミーティングの更新に失敗", "Gagal memperbarui pertemuan"));
    } finally {
      setUpdatingMeeting(null);
    }
  }

  async function postFeedback() {
    if (!feedbackContent.trim()) {
      setError(t("피드백 내용을 입력해 주세요.", "Please enter feedback content.", "请输入反馈内容。", "Vui lòng nhập nội dung phản hồi.", "フィードバック内容を入力してください。", "Silakan masukkan isi umpan balik."));
      return;
    }
    setPostingFeedback(true);
    setError(null);
    try {
      const body: { content: string; rating?: number } = { content: feedbackContent.trim() };
      const ratingNum = Number.parseInt(feedbackRating, 10);
      if (Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5) body.rating = ratingNum;
      const response = await fetch(`${apiBase()}/programs/${programId}/feedbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setFeedbackContent("");
      setFeedbackRating("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("피드백 작성 실패", "Failed to post feedback", "提交反馈失败", "Gửi phản hồi thất bại", "フィードバックの投稿に失敗", "Gagal mengirim umpan balik"));
    } finally {
      setPostingFeedback(false);
    }
  }

  async function issueCertificate() {
    if (!certTitle.trim() || !certContent.trim()) {
      setError(t("수료증 제목과 내용을 입력해 주세요.", "Please enter the certificate title and content.", "请输入结业证标题和内容。", "Vui lòng nhập tiêu đề và nội dung chứng nhận.", "修了証のタイトルと内容を入力してください。", "Silakan masukkan judul dan isi sertifikat."));
      return;
    }
    setIssuingCert(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/programs/${programId}/certificate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: certTitle.trim(), content: certContent.trim() })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("수료증 발급 실패", "Failed to issue certificate", "颁发结业证失败", "Cấp chứng nhận thất bại", "修了証の発行に失敗", "Gagal menerbitkan sertifikat"));
    } finally {
      setIssuingCert(false);
    }
  }

  async function issueRecommendation() {
    if (!recContent.trim() || !recSigner.trim()) {
      setError(t("추천서 내용과 작성자 이름을 입력해 주세요.", "Please enter the recommendation content and author name.", "请输入推荐信内容和作者姓名。", "Vui lòng nhập nội dung thư giới thiệu và tên người viết.", "推薦状の内容と作成者名を入力してください。", "Silakan masukkan isi surat rekomendasi dan nama penulis."));
      return;
    }
    setIssuingRec(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/programs/${programId}/recommendation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          content: recContent.trim(),
          signerName: recSigner.trim(),
          signerTitle: recSignerTitle.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("추천서 발급 실패", "Failed to issue recommendation", "颁发推荐信失败", "Cấp thư giới thiệu thất bại", "推薦状の発行に失敗", "Gagal menerbitkan surat rekomendasi"));
    } finally {
      setIssuingRec(false);
    }
  }

  async function requestSchoolCredit() {
    if (!schoolName.trim()) {
      setError(t("학교명을 입력해 주세요.", "Please enter the school name.", "请输入学校名称。", "Vui lòng nhập tên trường.", "学校名を入力してください。", "Silakan masukkan nama sekolah."));
      return;
    }
    setRequestingCredit(true);
    setError(null);
    try {
      const creditsNum = Number.parseInt(credits, 10) || 0;
      const response = await fetch(`${apiBase()}/programs/${programId}/school-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          schoolName: schoolName.trim(),
          courseCode: courseCode.trim() || undefined,
          credits: creditsNum
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("학점 인정 요청 실패", "Failed to request school credit", "申请学分认定失败", "Yêu cầu công nhận tín chỉ thất bại", "単位認定リクエストに失敗", "Gagal meminta kredit akademik"));
    } finally {
      setRequestingCredit(false);
    }
  }

  if (loading) {
    return <div className="ops-empty-card">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</div>;
  }
  if (error && !program) {
    return <div className="ops-error-card">{error}</div>;
  }
  if (!program) {
    return <div className="ops-empty-card">{t("프로그램을 찾을 수 없습니다.", "Program not found.", "未找到项目。", "Không tìm thấy chương trình.", "プログラムが見つかりません。", "Program tidak ditemukan.")}</div>;
  }

  const meetingStatusPill = (s: ProgramMeeting["status"]) =>
    s === "COMPLETED" ? "ops-pill-green" : s === "CANCELLED" ? "ops-pill-gray" : "ops-pill-amber";
  const meetingStatusLabel = (s: ProgramMeeting["status"]) =>
    s === "SCHEDULED"
      ? t("예정", "Scheduled", "预定", "Đã lên lịch", "予定", "Terjadwal")
      : s === "COMPLETED"
        ? t("완료", "Completed", "已完成", "Hoàn thành", "完了", "Selesai")
        : t("취소", "Cancelled", "已取消", "Đã hủy", "キャンセル", "Dibatalkan");

  return (
    <div>
      <article className="ops-card">
        <div className="ops-card-header">
          <div>
            <h2 className="ops-card-header" style={{ fontSize: 18, margin: 0 }}>{program.application.candidateUser.name ?? "-"}</h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {program.application.position.partnerOrganization?.name ?? "-"} · {program.application.position.title}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>{program.application.candidateUser.email}</p>
          </div>
        </div>

        <div className="ops-form-grid-3" style={{ marginTop: 16 }}>
          <label className="ops-form-label">
            {t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}
            {canEditMeta ? (
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as ProgramDetail["status"])}
                className="ops-select"
                style={{ marginTop: 4 }}
              >
                <option value="ACTIVE">{t("진행 중", "In progress", "进行中", "Đang tiến hành", "進行中", "Berlangsung")}</option>
                <option value="COMPLETED">{t("완료", "Completed", "已完成", "Hoàn thành", "完了", "Selesai")}</option>
                <option value="CANCELLED">{t("취소", "Cancelled", "已取消", "Đã hủy", "キャンセル", "Dibatalkan")}</option>
              </select>
            ) : (
              <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{program.status}</p>
            )}
          </label>
          <label className="ops-form-label">
            {t("시작일", "Start date", "开始日期", "Ngày bắt đầu", "開始日", "Tanggal mulai")}
            {canEditMeta ? (
              <input type="date" value={startsAtDraft} onChange={(e) => setStartsAtDraft(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            ) : (
              <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDate(program.startsAt)}</p>
            )}
          </label>
          <label className="ops-form-label">
            {t("종료일", "End date", "结束日期", "Ngày kết thúc", "終了日", "Tanggal selesai")}
            {canEditMeta ? (
              <input type="date" value={endsAtDraft} onChange={(e) => setEndsAtDraft(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            ) : (
              <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDate(program.endsAt)}</p>
            )}
          </label>
        </div>
        {canEditMeta ? (
          <div className="ops-row-end" style={{ marginTop: 12 }}>
            <button type="button" onClick={() => void saveMeta()} disabled={savingMeta} className="ops-btn ops-btn-primary">
              {savingMeta ? t("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : t("프로그램 정보 저장", "Save program info", "保存项目信息", "Lưu thông tin chương trình", "プログラム情報を保存", "Simpan info program")}
            </button>
          </div>
        ) : null}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("정기 면담", "Regular meetings", "定期面谈", "Buổi gặp định kỳ", "定期面談", "Pertemuan rutin")}</h3>
        {canManageMeetings ? (
          <div className="ops-soft-card" style={{ marginBottom: 12 }}>
            <div className="ops-form-grid-3">
              <label className="ops-form-label">
                {t("날짜", "Date", "日期", "Ngày", "日付", "Tanggal")}
                <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
              </label>
              <label className="ops-form-label">
                {t("시간", "Time", "时间", "Giờ", "時間", "Waktu")}
                <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
              </label>
              <label className="ops-form-label">
                {t("소요 시간(분)", "Duration (min)", "时长(分钟)", "Thời lượng (phút)", "所要時間(分)", "Durasi (menit)")}
                <input type="number" min={5} max={600} value={meetingDuration} onChange={(e) => setMeetingDuration(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
              </label>
            </div>
            <label className="ops-form-label" style={{ marginTop: 8 }}>
              {t("아젠다 (선택)", "Agenda (optional)", "议程(可选)", "Chương trình (tuỳ chọn)", "アジェンダ(任意)", "Agenda (opsional)")}
              <input type="text" value={meetingAgenda} onChange={(e) => setMeetingAgenda(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            </label>
            <label className="ops-form-label" style={{ marginTop: 8 }}>
              {t("장소 / 링크 (선택)", "Location / link (optional)", "地点/链接(可选)", "Địa điểm / liên kết (tuỳ chọn)", "場所 / リンク(任意)", "Lokasi / tautan (opsional)")}
              <input type="text" value={meetingLocation} onChange={(e) => setMeetingLocation(e.target.value)} className="ops-input" style={{ marginTop: 4 }} />
            </label>
            <div className="ops-row-end" style={{ marginTop: 10 }}>
              <button type="button" onClick={() => void createMeeting()} disabled={creatingMeeting} className="ops-btn ops-btn-primary">
                {creatingMeeting ? t("추가 중...", "Adding...", "添加中...", "Đang thêm...", "追加中...", "Menambahkan...") : t("미팅 추가", "Add meeting", "添加会议", "Thêm cuộc họp", "ミーティングを追加", "Tambah pertemuan")}
              </button>
            </div>
          </div>
        ) : null}
        {program.meetings.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("아직 등록된 면담이 없습니다.", "No meetings scheduled yet.", "暂无已安排的面谈。", "Chưa có buổi gặp nào.", "まだ登録された面談はありません。", "Belum ada pertemuan.")}</p>
        ) : (
          <div className="ops-stack">
            {program.meetings.map((m) => {
              const isUpdating = updatingMeeting === m.id;
              return (
                <div key={m.id} className="ops-soft-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                        {formatDateTime(m.scheduledAt)} ({m.durationMinutes}{t("분", " min", " 分钟", " phút", " 分", " mnt")})
                      </p>
                      {m.agenda ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>{m.agenda}</p> : null}
                      {m.location ? <p className="ops-card-subtle" style={{ marginTop: 2 }}>📍 {m.location}</p> : null}
                    </div>
                    <span className={`ops-pill ${meetingStatusPill(m.status)}`}>{meetingStatusLabel(m.status)}</span>
                  </div>
                  {canManageMeetings && m.status !== "CANCELLED" ? (
                    <div style={{ marginTop: 10 }}>
                      <textarea
                        value={meetingNotesDraft[m.id] ?? m.notes ?? ""}
                        onChange={(e) => setMeetingNotesDraft((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder={t("미팅 노트 (선택)", "Meeting notes (optional)", "会议备注(可选)", "Ghi chú cuộc họp (tuỳ chọn)", "ミーティングノート(任意)", "Catatan pertemuan (opsional)")}
                        rows={2}
                        className="ops-textarea"
                      />
                      <div className="ops-row-end" style={{ marginTop: 8 }}>
                        <button type="button" onClick={() => void updateMeeting(m.id, { status: "CANCELLED" })} disabled={isUpdating} className="ops-btn ops-btn-danger">
                          {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
                        </button>
                        <button type="button" onClick={() => void updateMeeting(m.id, { notes: meetingNotesDraft[m.id] ?? m.notes ?? null })} disabled={isUpdating} className="ops-btn">
                          {t("노트 저장", "Save notes", "保存备注", "Lưu ghi chú", "ノートを保存", "Simpan catatan")}
                        </button>
                        {m.status === "SCHEDULED" ? (
                          <button type="button" onClick={() => void updateMeeting(m.id, { status: "COMPLETED", notes: meetingNotesDraft[m.id] ?? m.notes ?? null })} disabled={isUpdating} className="ops-btn ops-btn-primary">
                            {t("완료 처리", "Mark complete", "标记完成", "Đánh dấu hoàn thành", "完了にする", "Tandai selesai")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : m.notes ? (
                    <p className="ops-card-subtle" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>📝 {m.notes}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("프로그램 피드백", "Program feedback", "项目反馈", "Phản hồi chương trình", "プログラムフィードバック", "Umpan balik program")}</h3>
        <div className="ops-soft-card" style={{ marginBottom: 12 }}>
          <textarea
            value={feedbackContent}
            onChange={(e) => setFeedbackContent(e.target.value)}
            placeholder={viewer === "student" ? t("회사에 전달할 피드백을 작성하세요", "Write feedback for the company", "撰写给公司的反馈", "Viết phản hồi gửi công ty", "会社に伝えるフィードバックを書いてください", "Tulis umpan balik untuk perusahaan") : t("지원자에게 전달할 피드백을 작성하세요", "Write feedback for the applicant", "撰写给申请者的反馈", "Viết phản hồi gửi ứng viên", "応募者に伝えるフィードバックを書いてください", "Tulis umpan balik untuk pelamar")}
            rows={3}
            className="ops-textarea"
          />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <label className="ops-form-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {t("평가 (1-5, 선택)", "Rating (1-5, optional)", "评分(1-5,可选)", "Đánh giá (1-5, tuỳ chọn)", "評価(1-5、任意)", "Penilaian (1-5, opsional)")}
              <input type="number" min={1} max={5} value={feedbackRating} onChange={(e) => setFeedbackRating(e.target.value)} className="ops-input" style={{ width: 70 }} />
            </label>
            <button type="button" onClick={() => void postFeedback()} disabled={postingFeedback} className="ops-btn ops-btn-primary">
              {postingFeedback ? t("등록 중...", "Posting...", "提交中...", "Đang đăng...", "登録中...", "Mengirim...") : t("피드백 등록", "Post feedback", "提交反馈", "Đăng phản hồi", "フィードバックを登録", "Kirim umpan balik")}
            </button>
          </div>
        </div>
        {program.feedbacks.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("아직 등록된 피드백이 없습니다.", "No feedback yet.", "暂无反馈。", "Chưa có phản hồi.", "まだ登録されたフィードバックはありません。", "Belum ada umpan balik.")}</p>
        ) : (
          <div className="ops-stack">
            {program.feedbacks.map((f) => {
              const isPartner = f.authorRole === "PARTNER" || f.authorRole === "OPERATOR";
              return (
                <div key={f.id} style={{ padding: 12, background: isPartner ? "#eff6ff" : "#fdf4ff", borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#374151" }}>
                    <span style={{ fontWeight: 600 }}>
                      {f.author.name ?? "-"} ({isPartner ? t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan") : t("지원자", "Applicant", "申请者", "Ứng viên", "応募者", "Pelamar")})
                      {f.rating ? ` · ${f.rating}/5` : ""}
                    </span>
                    <span className="ops-card-subtle">{formatDateTime(f.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#111827", whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{f.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("수료증", "Certificate", "结业证", "Chứng nhận", "修了証", "Sertifikat")}</h3>
        {program.certificate ? (
          <div style={{ padding: 12, background: "#ecfdf5", borderRadius: 10 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#047857", margin: 0 }}>{program.certificate.title}</p>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>{t("발급일", "Issued", "颁发日期", "Ngày cấp", "発行日", "Tanggal terbit")}: {formatDateTime(program.certificate.issuedAt)}</p>
            <p style={{ fontSize: 13, color: "#065f46", whiteSpace: "pre-wrap", marginTop: 8 }}>{program.certificate.content}</p>
          </div>
        ) : (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("아직 수료증이 발급되지 않았습니다.", "No certificate issued yet.", "尚未颁发结业证。", "Chưa cấp chứng nhận.", "まだ修了証は発行されていません。", "Sertifikat belum diterbitkan.")}</p>
        )}
        {canIssueArtifacts ? (
          <div className="ops-soft-card" style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
              {program.certificate ? t("수료증 수정", "Edit certificate", "编辑结业证", "Sửa chứng nhận", "修了証を編集", "Edit sertifikat") : t("수료증 발급", "Issue certificate", "颁发结业证", "Cấp chứng nhận", "修了証を発行", "Terbitkan sertifikat")}
            </p>
            <input type="text" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder={t("수료증 제목", "Certificate title", "结业证标题", "Tiêu đề chứng nhận", "修了証のタイトル", "Judul sertifikat")} className="ops-input" />
            <textarea value={certContent} onChange={(e) => setCertContent(e.target.value)} placeholder={t("수료 내용 / 프로그램 요약", "Completion details / program summary", "结业内容/项目摘要", "Nội dung hoàn thành / tóm tắt chương trình", "修了内容 / プログラム概要", "Rincian kelulusan / ringkasan program")} rows={4} className="ops-textarea" style={{ marginTop: 8 }} />
            <div className="ops-row-end" style={{ marginTop: 8 }}>
              <button type="button" onClick={() => void issueCertificate()} disabled={issuingCert} className="ops-btn ops-btn-primary">
                {issuingCert ? t("발급 중...", "Issuing...", "颁发中...", "Đang cấp...", "発行中...", "Menerbitkan...") : program.certificate ? t("수정", "Edit", "编辑", "Sửa", "編集", "Edit") : t("발급", "Issue", "颁发", "Cấp", "発行", "Terbitkan")}
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("추천서", "Recommendation", "推荐信", "Thư giới thiệu", "推薦状", "Surat rekomendasi")}</h3>
        {program.recommendation ? (
          <div style={{ padding: 12, background: "#eff6ff", borderRadius: 10 }}>
            <p className="ops-card-subtle" style={{ margin: 0 }}>
              {t("발급일", "Issued", "颁发日期", "Ngày cấp", "発行日", "Tanggal terbit")}: {formatDateTime(program.recommendation.issuedAt)} · {t("작성", "By", "撰写", "Người viết", "作成", "Oleh")}: {program.recommendation.signerName}
              {program.recommendation.signerTitle ? ` (${program.recommendation.signerTitle})` : ""}
            </p>
            <p style={{ fontSize: 13, color: "#1e3a8a", whiteSpace: "pre-wrap", marginTop: 8 }}>{program.recommendation.content}</p>
          </div>
        ) : (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("아직 추천서가 작성되지 않았습니다.", "No recommendation written yet.", "尚未撰写推荐信。", "Chưa viết thư giới thiệu.", "まだ推薦状は作成されていません。", "Surat rekomendasi belum ditulis.")}</p>
        )}
        {canIssueArtifacts ? (
          <div className="ops-soft-card" style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
              {program.recommendation ? t("추천서 수정", "Edit recommendation", "编辑推荐信", "Sửa thư giới thiệu", "推薦状を編集", "Edit surat rekomendasi") : t("추천서 작성", "Write recommendation", "撰写推荐信", "Viết thư giới thiệu", "推薦状を作成", "Tulis surat rekomendasi")}
            </p>
            <textarea value={recContent} onChange={(e) => setRecContent(e.target.value)} placeholder={t("추천 내용", "Recommendation content", "推荐内容", "Nội dung giới thiệu", "推薦内容", "Isi rekomendasi")} rows={5} className="ops-textarea" />
            <div className="ops-form-grid-2" style={{ marginTop: 8 }}>
              <input type="text" value={recSigner} onChange={(e) => setRecSigner(e.target.value)} placeholder={t("작성자 이름", "Author name", "作者姓名", "Tên người viết", "作成者名", "Nama penulis")} className="ops-input" />
              <input type="text" value={recSignerTitle} onChange={(e) => setRecSignerTitle(e.target.value)} placeholder={t("직책 (선택)", "Title (optional)", "职位(可选)", "Chức danh (tuỳ chọn)", "役職(任意)", "Jabatan (opsional)")} className="ops-input" />
            </div>
            <div className="ops-row-end" style={{ marginTop: 8 }}>
              <button type="button" onClick={() => void issueRecommendation()} disabled={issuingRec} className="ops-btn ops-btn-primary">
                {issuingRec ? t("작성 중...", "Writing...", "撰写中...", "Đang viết...", "作成中...", "Menulis...") : program.recommendation ? t("수정", "Edit", "编辑", "Sửa", "編集", "Edit") : t("작성", "Write", "撰写", "Viết", "作成", "Tulis")}
              </button>
            </div>
          </div>
        ) : null}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("학점 인정 요청", "School credit request", "学分认定申请", "Yêu cầu công nhận tín chỉ", "単位認定リクエスト", "Permintaan kredit akademik")}</h3>
        {program.schoolCreditRequest ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background:
                program.schoolCreditRequest.status === "APPROVED"
                  ? "#ecfdf5"
                  : program.schoolCreditRequest.status === "REJECTED"
                    ? "#fef2f2"
                    : "#fffbeb"
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
              {program.schoolCreditRequest.schoolName}
              {program.schoolCreditRequest.courseCode ? ` · ${program.schoolCreditRequest.courseCode}` : ""}
              {` · ${program.schoolCreditRequest.credits}${t("학점", " credits", " 学分", " tín chỉ", " 単位", " SKS")}`}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {t("요청", "Requested", "申请", "Yêu cầu", "申請", "Diminta")}: {formatDateTime(program.schoolCreditRequest.requestedAt)} · {t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}:{" "}
              {program.schoolCreditRequest.status === "REQUESTED"
                ? t("심사 대기", "Under review", "审核中", "Đang xét duyệt", "審査中", "Sedang ditinjau")
                : program.schoolCreditRequest.status === "APPROVED"
                  ? t("승인됨", "Approved", "已批准", "Đã duyệt", "承認済み", "Disetujui")
                  : t("반려", "Rejected", "已拒绝", "Bị từ chối", "却下", "Ditolak")}
              {program.schoolCreditRequest.reviewedAt ? ` (${formatDateTime(program.schoolCreditRequest.reviewedAt)})` : ""}
            </p>
            {program.schoolCreditRequest.reviewNote ? (
              <p style={{ fontSize: 13, color: "#374151", marginTop: 6, whiteSpace: "pre-wrap" }}>📝 {program.schoolCreditRequest.reviewNote}</p>
            ) : null}
          </div>
        ) : (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("학점 인정 요청이 등록되지 않았습니다.", "No school credit request submitted.", "尚未提交学分认定申请。", "Chưa có yêu cầu công nhận tín chỉ.", "単位認定リクエストは登録されていません。", "Belum ada permintaan kredit akademik.")}</p>
        )}
        {canRequestCredit ? (
          <div className="ops-soft-card" style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
              {program.schoolCreditRequest ? t("학점 인정 요청 재제출", "Resubmit credit request", "重新提交学分申请", "Gửi lại yêu cầu tín chỉ", "単位認定リクエストを再提出", "Kirim ulang permintaan kredit") : t("학점 인정 요청", "School credit request", "学分认定申请", "Yêu cầu công nhận tín chỉ", "単位認定リクエスト", "Permintaan kredit akademik")}
            </p>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder={t("학교명", "School name", "学校名称", "Tên trường", "学校名", "Nama sekolah")} className="ops-input" />
            <div className="ops-form-grid-2" style={{ marginTop: 8 }}>
              <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder={t("과목 코드 (선택)", "Course code (optional)", "课程代码(可选)", "Mã môn học (tuỳ chọn)", "科目コード(任意)", "Kode mata kuliah (opsional)")} className="ops-input" />
              <input type="number" min={0} max={20} value={credits} onChange={(e) => setCredits(e.target.value)} placeholder={t("학점", "Credits", "学分", "Tín chỉ", "単位", "SKS")} className="ops-input" />
            </div>
            <div className="ops-row-end" style={{ marginTop: 8 }}>
              <button type="button" onClick={() => void requestSchoolCredit()} disabled={requestingCredit} className="ops-btn ops-btn-primary">
                {requestingCredit ? t("제출 중...", "Submitting...", "提交中...", "Đang gửi...", "提出中...", "Mengirim...") : t("요청 제출", "Submit request", "提交申请", "Gửi yêu cầu", "リクエストを提出", "Kirim permintaan")}
              </button>
            </div>
          </div>
        ) : null}
      </article>

      {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 12 }}>{error}</p> : null}
    </div>
  );
}
