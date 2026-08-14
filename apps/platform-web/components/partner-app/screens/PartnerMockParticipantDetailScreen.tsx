"use client";

// 파트너 — 모의 면접 참여자 상세. 답변 전문 + 프로필 + (미지원 시) 제안.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Clock, ArrowUpRight, FileText, Note } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { ProposeCandidateModal } from "../ProposeCandidateModal";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMockInterviewParticipantDetail, type MockInterviewParticipantDetail } from "../../../lib/member-profile-client";
import { usePlatformT } from "../../../lib/i18n";

export function PartnerMockParticipantDetailScreen({ positionId, userId }: { positionId: string; userId: string }) {
  const t = usePlatformT();
  const [m, setM] = useState<MockInterviewParticipantDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [propose, setPropose] = useState(false);

  function load() {
    setStatus("loading");
    getMockInterviewParticipantDetail(positionId, userId)
      .then((d) => {
        setM(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId, userId]);

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" fallback={`${partnerRoutes.positions}/${positionId}`} />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && m ? (
        <div className="flex flex-col gap-6">
          {/* 헤더 */}
          <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex items-start gap-3.5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px] font-black text-[#0B46E8]">{m.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{m.name}</p>
                  {m.applied ? (
                    <span className="rounded-md bg-[#E7F8EF] px-2.5 py-0.5 text-[11px] font-bold text-[#0A9B59]">{t("지원함", "Applied", "已申请", "Đã ứng tuyển", "応募済み", "Melamar")}</span>
                  ) : (
                    <span className="rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#8B95A1]">{t("미지원", "Not applied", "未申请", "Chưa ứng tuyển", "未応募", "Belum melamar")}</span>
                  )}
                  <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">🎤 {t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}</span>
                </div>
                <p className="mt-1.5 truncate text-[13px] font-semibold text-[#4E5968]">{m.positionTitle}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#8B95A1]">
                  {m.nationality ? <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-[#B0B8C1]" /> {m.nationality}</span> : null}
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#B0B8C1]" /> {t(`${formatRelativeTime(new Date(m.lastPracticedAt).getTime())} 연습`, `Practiced ${formatRelativeTime(new Date(m.lastPracticedAt).getTime())}`, `${formatRelativeTime(new Date(m.lastPracticedAt).getTime())} 练习`, `Luyện tập ${formatRelativeTime(new Date(m.lastPracticedAt).getTime())}`, `${formatRelativeTime(new Date(m.lastPracticedAt).getTime())} 練習`, `Latihan ${formatRelativeTime(new Date(m.lastPracticedAt).getTime())}`)}</span>
                </div>
              </div>
            </div>

            {/* 액션 */}
            <div className="mt-4 flex flex-wrap gap-2">
              {m.applied ? (
                <Link
                  href={`${partnerRoutes.applicants}/${encodeURIComponent(`${m.userId}:${m.positionId}`)}`}
                  className="inline-flex h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  {t("지원자 상세 보기", "View applicant", "查看申请者详情", "Xem chi tiết ứng viên", "応募者詳細を見る", "Lihat pelamar")} <ArrowUpRight className="h-4 w-4" weight="bold" />
                </Link>
              ) : m.connectionStatus === "ACCEPTED" ? (
                <Link href={`${partnerRoutes.talent}/${encodeURIComponent(m.userId)}`} className="inline-flex h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0A9B59] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A8A4F]">
                  {t("수락됨 · 연락처 보기", "Accepted · view contact", "已接受 · 查看联系方式", "Đã chấp nhận · xem liên hệ", "承認済み · 連絡先を見る", "Diterima · lihat kontak")} <ArrowUpRight className="h-4 w-4" weight="bold" />
                </Link>
              ) : m.connectionStatus === "PENDING" ? (
                <span className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl bg-[#F2F4F6] px-4 text-[13.5px] font-bold text-[#8B95A1]">{t("제안 보냄", "Proposal sent", "已发送推荐", "Đã gửi đề xuất", "提案送信済み", "Terkirim")}</span>
              ) : m.connectionStatus === "DECLINED" ? (
                <span className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl bg-[#FDECEE] px-4 text-[13.5px] font-bold text-[#F04452]">{t("제안 거절됨", "Proposal declined", "推荐被拒绝", "Đề xuất bị từ chối", "提案が拒否されました", "Ditolak")}</span>
              ) : (
                <button type="button" onClick={() => setPropose(true)} className="inline-flex h-[44px] flex-1 items-center justify-center rounded-xl bg-[#0B46E8] px-4 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                  {t("제안하기", "Propose", "推荐", "Đề xuất", "提案", "Ajukan")}
                </button>
              )}
            </div>
          </div>

          {/* 서류 — 이력서/자기소개서 */}
          <section>
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("서류", "Documents", "材料", "Hồ sơ", "書類", "Dokumen")}</h2>
            <div className="flex flex-col gap-2.5">
              <Link href={`${partnerRoutes.positions}/${m.positionId}/mock/${encodeURIComponent(m.userId)}/resume`} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><FileText className="h-5 w-5" weight="fill" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-[#191F28]">{t("이력서", "Resume", "简历", "Sơ yếu lý lịch", "履歴書", "Resume")}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.resumeTitle || (m.resumeShareSlug ? t("제출된 이력서 보기", "View submitted resume", "查看已提交简历", "Xem sơ yếu đã nộp", "提出済み履歴書を見る", "Lihat resume terkirim") : t("이력서 확인", "Check resume", "查看简历", "Xem sơ yếu lý lịch", "履歴書を確認", "Cek resume"))}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />
              </Link>
              <Link href={`${partnerRoutes.positions}/${m.positionId}/mock/${encodeURIComponent(m.userId)}/cover`} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Note className="h-5 w-5" weight="fill" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold text-[#191F28]">{t("자기소개서", "Cover letter", "求职信", "Thư xin việc", "志望動機書", "Surat lamaran")}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.coverLetterTitle || (m.coverLetterShareSlug ? t("제출된 자기소개서 보기", "View submitted cover letter", "查看已提交求职信", "Xem thư đã nộp", "提出済み志望動機書を見る", "Lihat surat terkirim") : t("자기소개서 확인", "Check cover letter", "查看求职信", "Xem thư xin việc", "志望動機書を確認", "Cek surat"))}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />
              </Link>
            </div>
          </section>

          {/* 모의 면접 답변 */}
          <section>
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`모의 면접 답변 (${m.answeredCount})`, `Mock interview answers (${m.answeredCount})`, `模拟面试回答 (${m.answeredCount})`, `Câu trả lời phỏng vấn thử (${m.answeredCount})`, `模擬面接の回答 (${m.answeredCount})`, `Jawaban wawancara simulasi (${m.answeredCount})`)}</h2>
            {m.answers.length ? (
              <div className="flex flex-col gap-3">
                {m.answers.map((a, i) => (
                  <div key={i} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 break-keep text-[13.5px] font-bold text-[#191F28]">Q{i + 1}. {a.question}</p>
                      {a.score != null ? <span className="shrink-0 rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{t(`${a.score}점`, `${a.score}`, `${a.score}分`, `${a.score}`, `${a.score}点`, `${a.score}`)}</span> : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-[#4E5968]">{a.answer || t("답변 없음", "No answer", "无回答", "Không có câu trả lời", "回答なし", "Tanpa jawaban")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center text-[13px] text-[#8B95A1]">{t("아직 저장된 답변이 없어요.", "No saved answers yet.", "还没有已保存的回答。", "Chưa có câu trả lời nào được lưu.", "まだ保存された回答がありません。", "Belum ada jawaban tersimpan.")}</div>
            )}
          </section>

          {!m.applied ? (
            <p className="break-keep text-center text-[12px] text-[#8B95A1]">{t("지원하지 않았지만 이 공고 모의 면접을 풀어본 인재예요. 제안을 보내 먼저 연결할 수 있어요.", "This talent hasn't applied but tried the mock interview for this posting. Send a proposal to connect first.", "该人才尚未申请，但做过此职位的模拟面试。可发送推荐先建立联系。", "Nhân tài này chưa ứng tuyển nhưng đã làm phỏng vấn thử cho tin này. Gửi đề xuất để kết nối trước.", "この人材は応募していませんが、この求人の模擬面接を受けました。提案を送って先につながれます。", "Talenta ini belum melamar tapi mencoba wawancara simulasi untuk lowongan ini. Kirim proposal untuk terhubung lebih dulu.")}</p>
          ) : null}
        </div>
      ) : null}

      {propose && m ? (
        <ProposeCandidateModal
          positionId={m.positionId}
          userId={m.userId}
          name={m.name}
          onClose={() => setPropose(false)}
          onDone={() => {
            setM((prev) => (prev ? { ...prev, connectionStatus: "PENDING" } : prev));
            setPropose(false);
          }}
        />
      ) : null}
    </PartnerAppShell>
  );
}
