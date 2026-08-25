"use client";

// 파트너 공고 상세 — 지원자(탤런트)에게 보이는 것과 동일한 화면(공용 렌더 재사용) + 관리 액션.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PencilSimple, Copy, ShieldCheck } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { PositionDetailHeaderCard, PositionDetailSections } from "../../talent/screens/JobDetailScreen";
import { ProposeCandidateModal } from "../ProposeCandidateModal";
import { PartnerMoreLink, PartnerEmptyCard } from "../ui/cards";
import { PartnerApplicantCard, PartnerParticipantCard } from "../ListCards";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS, usePartnerPositionStatusLabel } from "../../../lib/partner/labels";
import { usePlatformT } from "../../../lib/i18n";
import {
  getMyPartnerPositionById,
  getMyPartnerOrganization,
  getMyPartnerApplicants,
  updateMyPartnerPosition,
  createMyPartnerPosition,
  deleteMyPartnerPosition,
  getPositionMockInterviewParticipants,
  getRecommendedTalentForPosition,
  type PartnerPosition,
  type MyPartnerOrganization,
  type PublicPositionListItem,
  type MockInterviewParticipant,
  type PartnerApplicantListItem,
  type RecommendedTalent
} from "../../../lib/member-profile-client";
import { blindTalentName } from "../../../lib/partner/blind";

// 파트너 공고(+조직) → 지원자 상세 렌더용 PublicPositionListItem.
function toPublicItem(p: PartnerPosition, org: MyPartnerOrganization | null): PublicPositionListItem {
  return {
    ...(p as unknown as PublicPositionListItem),
    sourceKind: "INTERNAL",
    sourceProvider: "INTERNAL",
    sourceExternalId: null,
    sourceUrl: null,
    sourceFetchedAt: null,
    sourceCompanyName: org?.name ?? null,
    sourceDeadlineDate: null,
    sourceDeadlineRolling: false,
    matchingParticipantsCount: 0,
    partnerOrganization: org
      ? {
          id: org.id,
          name: org.name,
          industry: org.industry,
          companySize: org.companySize ?? null,
          officeAddress: org.officeAddress ?? null,
          description: org.description ?? null,
          strengths: org.strengths ?? null,
          website: org.website ?? null,
          socialMedia: org.socialMedia ?? null,
          companyLogoImageData: org.companyLogoImageData ?? null,
          officePhotoImageData: org.officePhotoImageData ?? null
        }
      : null
  };
}

export function PartnerPositionDetailScreen({ positionId }: { positionId: string }) {
  const router = useRouter();
  const toast = useTalentPopup();
  const t = usePlatformT();
  const positionLabel = usePartnerPositionStatusLabel();
  const [p, setP] = useState<PartnerPosition | null>(null);
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [participants, setParticipants] = useState<MockInterviewParticipant[]>([]);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [proposeTarget, setProposeTarget] = useState<MockInterviewParticipant | null>(null);
  const [recommended, setRecommended] = useState<RecommendedTalent[]>([]);

  function load() {
    setStatus("loading");
    Promise.all([getMyPartnerPositionById(positionId), getMyPartnerOrganization().catch(() => null)])
      .then(([d, o]) => {
        setP(d);
        setOrg(o);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    void getPositionMockInterviewParticipants(positionId).then(setParticipants).catch(() => setParticipants([]));
    void getRecommendedTalentForPosition(positionId).then(setRecommended).catch(() => setRecommended([]));
    void getMyPartnerApplicants()
      .then((all) => setApplicants(all.filter((a) => a.positionId === positionId)))
      .catch(() => setApplicants([]));
  }

  function markProposed(userId: string) {
    setParticipants((prev) => prev.map((x) => (x.userId === userId ? { ...x, connectionStatus: "PENDING" } : x)));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId]);

  function close() {
    if (busy || !p || p.status === "CLOSED") return;
    if (!window.confirm(t("이 공고를 마감할까요? 지원자에게 더 이상 노출되지 않아요.", "Close this posting? It will no longer be shown to applicants.", "关闭此职位吗？申请者将不再看到它。", "Đóng tin này? Ứng viên sẽ không còn thấy nữa.", "この求人を締め切りますか？応募者には表示されなくなります。", "Tutup lowongan ini? Pelamar tidak akan melihatnya lagi."))) return;
    setBusy(true);
    updateMyPartnerPosition(positionId, { status: "CLOSED" })
      .then((d) => {
        setP(d);
        toast.success(t("공고를 마감했어요", "Posting closed", "职位已关闭", "Đã đóng tin", "求人を締め切りました", "Lowongan ditutup"));
      })
      .catch(() => toast.error(t("마감에 실패했어요.", "Couldn't close the posting.", "关闭失败。", "Không đóng được tin.", "締め切れませんでした。", "Gagal menutup lowongan.")))
      .finally(() => setBusy(false));
  }
  // 공고 복제 — 내용을 그대로 복사해 새 DRAFT로 만들고 편집 화면으로.
  function duplicate() {
    if (busy || !p) return;
    setBusy(true);
    createMyPartnerPosition({
      title: t(`${p.title} (사본)`, `${p.title} (Copy)`, `${p.title}（副本）`, `${p.title} (Bản sao)`, `${p.title}（コピー）`, `${p.title} (Salinan)`),
      status: "DRAFT",
      workType: p.workType ?? undefined,
      employmentType: p.employmentType,
      thumbnailImages: p.thumbnailImages ?? undefined,
      eligibleVisas: p.eligibleVisas ?? undefined,
      preferredNationalities: p.preferredNationalities ?? undefined,
      communicationLanguages: p.communicationLanguages ?? undefined,
      hiringProcess: p.hiringProcess ?? undefined,
      preferredJobRole: p.preferredJobRole ?? undefined,
      hiringCount: p.hiringCount ?? undefined,
      workingHours: p.workingHours ?? undefined,
      workLocation: p.workLocation ?? undefined,
      startDate: p.startDate ?? undefined,
      mainResponsibilities: p.mainResponsibilities ?? undefined,
      requiredQualifications: p.requiredQualifications ?? undefined,
      preferredQualifications: p.preferredQualifications ?? undefined,
      dressCode: p.dressCode ?? undefined,
      wantsPreTraining: p.wantsPreTraining ?? undefined,
      additionalNotes: p.additionalNotes ?? undefined
    })
      .then((created) => {
        toast.success(t("공고를 복제했어요. 내용을 확인하고 게시하세요.", "Posting duplicated. Review the details and publish.", "职位已复制。请检查内容后发布。", "Đã nhân bản tin. Kiểm tra nội dung rồi đăng.", "求人を複製しました。内容を確認して掲載してください。", "Lowongan diduplikat. Periksa lalu terbitkan."));
        router.push(`${partnerRoutes.positions}/${created.id}/edit`);
      })
      .catch(() => {
        toast.error(t("복제에 실패했어요.", "Couldn't duplicate.", "复制失败。", "Không nhân bản được.", "複製できませんでした。", "Gagal menduplikat."));
        setBusy(false);
      });
  }
  function remove() {
    if (busy) return;
    if (!window.confirm(t("이 공고를 삭제할까요? 되돌릴 수 없어요.", "Delete this posting? This can't be undone.", "删除此职位吗？此操作无法撤销。", "Xóa tin này? Không thể hoàn tác.", "この求人を削除しますか？元に戻せません。", "Hapus lowongan ini? Tidak bisa dibatalkan."))) return;
    setBusy(true);
    deleteMyPartnerPosition(positionId)
      .then(() => {
        toast.success(t("공고를 삭제했어요", "Posting deleted", "职位已删除", "Đã xóa tin", "求人を削除しました", "Lowongan dihapus"));
        router.push(partnerRoutes.positions);
      })
      .catch(() => toast.error(t("삭제에 실패했어요.", "Couldn't delete.", "删除失败。", "Không xóa được.", "削除できませんでした。", "Gagal menghapus.")))
      .finally(() => setBusy(false));
  }

  const item = p ? toPublicItem(p, org) : null;
  // 최신순으로 3명까지 보여주기.
  const recentApplicants = [...applicants].sort((a, b) => (b.appliedAt ?? "").localeCompare(a.appliedAt ?? ""));
  const recentParticipants = [...participants].sort((a, b) => b.lastPracticedAt.localeCompare(a.lastPracticedAt));

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && p && item ? (
        <div className="flex flex-col">
          {/* 관리 액션 바 */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[11.5px] font-bold ${PARTNER_POSITION_STATUS[p.status].cls}`}>{positionLabel(p.status)}</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button type="button" onClick={remove} disabled={busy} className="inline-flex h-[40px] items-center justify-center rounded-xl bg-[#FDECEE] px-4 text-[13px] font-bold text-[#F04452] transition hover:bg-[#FBDDE1] disabled:opacity-50">{t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}</button>
              {p.status !== "CLOSED" ? (
                <button type="button" onClick={close} disabled={busy} className="inline-flex h-[40px] items-center justify-center rounded-xl bg-[#F2F4F6] px-4 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">{t("마감", "Close", "关闭", "Đóng", "締切", "Tutup")}</button>
              ) : null}
              <button type="button" onClick={duplicate} disabled={busy} className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#F2F4F6] px-4 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50"><Copy className="h-4 w-4" weight="bold" /> {t("복제", "Duplicate", "复制", "Nhân bản", "複製", "Duplikat")}</button>
              <Link href={`${partnerRoutes.positions}/${p.id}/edit`} className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
                <PencilSimple className="h-4 w-4" weight="bold" /> {t("수정하기", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}
              </Link>
            </div>
          </div>

          {/* 이 공고에 맞는 추천 Talent — Rule-based 매칭 점수순(지원 대기 없이 먼저 찾기) */}
          {recommended.length ? (
            <div className="mb-6">
              <h2 className="mb-1 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("이 공고에 맞는 추천 Talent", "Recommended talent for this role", "适合该职位的推荐人才", "Nhân tài phù hợp vị trí này", "この求人におすすめの人材", "Talenta rekomendasi untuk posisi ini")}</h2>
              <p className="mb-3 break-keep text-[12.5px] text-[#8B95A1]">{t("직무·언어·Readiness를 종합한 매칭 점수순이에요. 눌러서 인터뷰를 제안하세요.", "Ranked by a match score across role, language, and readiness. Tap to invite for an interview.", "按职务、语言、准备度综合匹配分排序。点击可发起面试邀约。", "Xếp theo điểm khớp về vị trí, ngôn ngữ, mức sẵn sàng. Nhấn để mời phỏng vấn.", "職務・言語・準備度を総合したマッチスコア順です。タップして面接を打診しましょう。", "Diurutkan berdasarkan skor kecocokan peran, bahasa, kesiapan. Ketuk untuk undang wawancara.")}</p>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {recommended.map((c) => {
                  const nm = c.name ?? blindTalentName(t, c.desiredJobRole, c.candidateUserId);
                  return (
                    <Link key={c.candidateUserId} href={`${partnerRoutes.talent}/${c.candidateUserId}`} className="group flex w-[230px] shrink-0 flex-col gap-2.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#0B46E8]/40 hover:shadow-[0_6px_20px_-12px_rgba(11,70,232,0.3)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[14px] font-black text-[#0B46E8]">{nm.slice(0, 1)}</span>
                        <span className="rounded-lg bg-[#0B46E8] px-2 py-1 text-[12px] font-black text-white">{t(`매칭 ${c.matchPercent}`, `Match ${c.matchPercent}`, `匹配 ${c.matchPercent}`, `Khớp ${c.matchPercent}`, `適合 ${c.matchPercent}`, `Cocok ${c.matchPercent}`)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-[13.5px] font-bold text-[#191F28]">{nm}</p>
                          {c.passport?.verified ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#0A9B59]" weight="fill" aria-hidden /> : null}
                        </div>
                        {c.desiredJobRole ? <p className="truncate text-[11.5px] text-[#8B95A1]">{c.desiredJobRole}</p> : null}
                      </div>
                      {c.matchReason ? <p className="break-keep text-[11.5px] leading-relaxed text-[#4E5968]">{c.matchReason}</p> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* 지원자 */}
          <div className="mb-6">
            <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`지원자 (${applicants.length})`, `Applicants (${applicants.length})`, `申请者 (${applicants.length})`, `Ứng viên (${applicants.length})`, `応募者 (${applicants.length})`, `Pelamar (${applicants.length})`)}</h2>
            {applicants.length ? (
              <>
                <div className="flex flex-col gap-2.5">
                  {recentApplicants.slice(0, 3).map((a) => (
                    <PartnerApplicantCard key={a.id} a={a} />
                  ))}
                </div>
                {applicants.length > 3 ? (
                  <PartnerMoreLink href={`${partnerRoutes.applicants}?position=${encodeURIComponent(positionId)}`} className="mt-2.5" />
                ) : null}
              </>
            ) : (
              <PartnerEmptyCard emoji="🧑‍💼" title={t("아직 지원자가 없어요", "No applicants yet", "还没有申请者", "Chưa có ứng viên", "まだ応募者がいません", "Belum ada pelamar")} desc={t("게시 중이면 지원자가 여기에 모여요.", "Applicants gather here while it's open.", "职位在招时，申请者会汇集在这里。", "Ứng viên sẽ tập hợp ở đây khi tin đang mở.", "掲載中は応募者がここに集まります。", "Pelamar berkumpul di sini saat lowongan aktif.")} />
            )}
          </div>

          {/* 모의 면접 참여자 — 지원 안 해도 표시, 제안 가능 */}
          {participants.length ? (
            <div className="mb-6">
              <h2 className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`모의 면접 참여자 (${participants.length})`, `Mock participants (${participants.length})`, `模拟面试参与者 (${participants.length})`, `Người phỏng vấn thử (${participants.length})`, `模擬面接参加者 (${participants.length})`, `Peserta simulasi (${participants.length})`)}</h2>
              <div className="flex flex-col gap-2.5">
                {recentParticipants.slice(0, 3).map((m) => (
                  <PartnerParticipantCard
                    key={m.userId}
                    m={{ ...m, positionId, positionTitle: p.title }}
                    onPropose={() => setProposeTarget(m)}
                  />
                ))}
              </div>
              {participants.length > 3 ? (
                <PartnerMoreLink href={`${partnerRoutes.applicants}?position=${encodeURIComponent(positionId)}&tab=mock`} className="mt-2.5" />
              ) : null}
              <p className="mt-2 text-[12px] text-[#8B95A1]">{t("지원하지 않았어도 이 공고 모의 면접을 푼 사람이에요. 제안을 보내 먼저 연결할 수 있어요.", "These people tried this posting's mock interview without applying. Send a proposal to connect first.", "这些人未申请但做过本职位的模拟面试。可发送邀请先行联系。", "Những người này đã thử phỏng vấn của tin dù chưa ứng tuyển. Gửi đề xuất để kết nối trước.", "応募していなくてもこの求人の模擬面接を受けた人です。提案を送って先につながれます。", "Mereka mencoba wawancara simulasi lowongan ini tanpa melamar. Kirim ajakan untuk terhubung lebih dulu.")}</p>
            </div>
          ) : null}

          {/* 모의 면접 관리 */}
          {(() => {
            const configured = Boolean(p.mockInterviewIntent || (p.mockInterviewQuestions?.length ?? 0) > 0);
            return (
              <div className="mb-6 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[17px]" aria-hidden>🎤</span>
                  <p className="text-[14.5px] font-bold text-[#191F28]">{t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}</p>
                  <span className={`rounded-md px-2.5 py-0.5 text-[10.5px] font-bold ${configured ? "bg-[#E7F8EF] text-[#0A9B59]" : "bg-[#FFF3E6] text-[#E8890C]"}`}>{configured ? t("설정됨", "Set up", "已设置", "Đã cài", "設定済み", "Sudah diatur") : t("미설정", "Not set", "未设置", "Chưa cài", "未設定", "Belum diatur")}</span>
                  <Link href={`${partnerRoutes.positions}/${p.id}/edit`} className="ml-auto shrink-0 rounded-lg bg-white px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]">{configured ? t("수정", "Edit", "编辑", "Sửa", "編集", "Ubah") : t("추가하기", "Add", "添加", "Thêm", "追加", "Tambah")}</Link>
                </div>
                {configured ? (
                  <>
                    {p.mockInterviewIntent ? <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{p.mockInterviewIntent}</p> : null}
                    {(p.mockInterviewQuestions?.length ?? 0) > 0 ? (
                      <ol className="mt-2.5 flex flex-col gap-1.5">
                        {p.mockInterviewQuestions!.map((q, i) => (
                          <li key={i} className="flex gap-2 rounded-xl bg-white px-3 py-2 text-[12.5px] leading-relaxed text-[#191F28]">
                            <span className="shrink-0 font-bold text-[#0B46E8]">Q{i + 1}</span>
                            <span className="min-w-0 break-keep">{q}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{t("지원자가 지원 전에 이 포지션 모의 면접을 연습하고 AI 피드백을 받을 수 있어요. 준비 잘 된 지원자가 모입니다.", "Applicants can practice this position's mock interview and get AI feedback before applying, so well-prepared candidates gather.", "申请者可在申请前练习本职位的模拟面试并获得 AI 反馈，从而吸引准备充分的候选人。", "Ứng viên có thể luyện phỏng vấn thử cho vị trí này và nhận phản hồi AI trước khi ứng tuyển, thu hút ứng viên chuẩn bị kỹ.", "応募者は応募前にこのポジションの模擬面接を練習しAIフィードバックを受けられます。準備の整った応募者が集まります。", "Pelamar bisa berlatih wawancara simulasi posisi ini dan mendapat masukan AI sebelum melamar, sehingga kandidat yang siap berkumpul.")}</p>
                )}
              </div>
            );
          })()}

          {/* 지원자에게 보이는 화면과 동일 */}
          <PositionDetailHeaderCard item={item} />
          <PositionDetailSections item={item} />
        </div>
      ) : null}

      {proposeTarget ? (
        <ProposeCandidateModal
          positionId={positionId}
          userId={proposeTarget.userId}
          name={proposeTarget.name}
          onClose={() => setProposeTarget(null)}
          onDone={() => {
            markProposed(proposeTarget.userId);
            setProposeTarget(null);
          }}
        />
      ) : null}
    </PartnerAppShell>
  );
}
