"use client";

// 공고 상세 — 포지션 탐색 상세(PositionDetailPage)와 동일한 내용, UI 는 Talent 톤.
// 핵심 정보 / 상세 안내 / 기업 정보 + 저장·지원.
import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, BookmarkSimple, ArrowSquareOut, Buildings, LinkSimple, Star, X } from "@phosphor-icons/react";
import { TalentBackButton } from "../TalentBackButton";
import { toggleCompanyFollow, useFollowedCompanies } from "../../../lib/talent/company-follow";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { notifyApplied, notifySavedPosition } from "../../../lib/talent/activity-log";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { TalentAppShell } from "../app/TalentAppShell";
import { TCard, TChip, TError, TLoading } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { AplyCipBadgeButton } from "../../positions/AplyCipBadge";
import { TalentCipModal } from "../jobs/TalentCipModal";
import { MockInterviewModal } from "../jobs/MockInterviewModal";
import { MockGateModal, DocStatus } from "../jobs/MockGateModal";
import { ApplyReadinessBanner } from "../ApplyReadinessBanner";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { parseOfficePhotos } from "../../../lib/image-upload";
import {
  getPublicPositionById,
  getMyFavoritePositions,
  getMyAppliedPositions,
  addMyFavoritePosition,
  removeMyFavoritePosition,
  applyMyPosition,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";

function companySizeLabel(t: PlatformT, size: string): string | undefined {
  switch (size) {
    case "SIZE_1_10":
      return t("1~10인", "1–10", "1~10人", "1–10 người", "1~10人", "1–10 orang");
    case "SIZE_UNDER_30":
      return t("30인 이하", "≤30", "30人以下", "≤30 người", "30人以下", "≤30 orang");
    case "SIZE_UNDER_50":
      return t("50인 이하", "≤50", "50人以下", "≤50 người", "50人以下", "≤50 orang");
    case "SIZE_OVER_100":
      return t("100인 이상", "100+", "100人以上", "100+ người", "100人以上", "100+ orang");
    default:
      return undefined;
  }
}

const dashText = (t: PlatformT) => t("정보 없음", "N/A", "暂无信息", "Chưa có", "情報なし", "Tidak ada");
const orDash = (t: PlatformT, v: string | null | undefined) => (v && v.trim() ? v : dashText(t));

export function JobDetailScreen({ jobId }: { jobId: string }) {
  const t = usePlatformT();
  const toast = useTalentPopup();
  const { locale } = useLanguage();
  const [item, setItem] = useState<PublicPositionListItem | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [cipOpen, setCipOpen] = useState(false);
  const [mockOpen, setMockOpen] = useState(false);
  const [mockGateOpen, setMockGateOpen] = useState(false);

  function load() {
    setStatus("loading");
    getPublicPositionById(jobId, { locale })
      .then((it) => {
        setItem(it);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(() => {
    load();
    void getMyFavoritePositions()
      .then((list) => setSaved(list.some((p) => p.id === jobId)))
      .catch(() => setSaved(false));
    void getMyAppliedPositions()
      .then((list) => setApplied(list.some((p) => p.id === jobId)))
      .catch(() => setApplied(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, locale]);

  function toggleSave() {
    const willSave = !saved;
    setSaved(willSave);
    if (willSave) notifySavedPosition(t, jobId, view?.title);
    const req = willSave ? addMyFavoritePosition(jobId) : removeMyFavoritePosition(jobId);
    void req.catch(() => {
      setSaved(!willSave);
      toast.error(t("저장에 실패했어요", "Failed to save", "保存失败", "Lưu thất bại", "保存に失敗しました", "Gagal menyimpan"));
    });
  }

  // 내부(CIP) 공고 실제 지원 — 팝업에서 서류 완성 확인 후 호출.
  function submitApply() {
    if (applied || applying) return;
    setApplying(true);
    applyMyPosition(jobId)
      .then(() => {
        setApplied(true);
        setApplyOpen(false);
        notifyApplied(t, jobId, view?.title ?? "", view?.company ?? "");
        toast.success(t("지원이 접수됐어요", "Your application was received", "已收到您的申请", "Đã nhận đơn ứng tuyển của bạn", "応募を受け付けました", "Lamaran Anda telah diterima"));
      })
      .catch(() => toast.error(t("지원에 실패했어요. 잠시 후 다시 시도해주세요.", "Application failed. Please try again shortly.", "申请失败，请稍后重试。", "Ứng tuyển thất bại. Vui lòng thử lại sau.", "応募に失敗しました。しばらくして再試行してください。", "Lamaran gagal. Coba lagi sebentar.")))
      .finally(() => setApplying(false));
  }

  const view = item ? toPositionView(item, t) : null;

  return (
    <TalentAppShell maxWidth="4xl" allowGuest>
      <TalentBackButton className="mb-4" />

      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && item && view ? (
        <div className="pb-24 md:pb-0">
          {/* 헤더 */}
          <PositionDetailHeaderCard item={item} onShowCip={() => setCipOpen(true)} />

          {/* 지원 준비도 넛지 — 미완성 시 상시 노출 */}
          <ApplyReadinessBanner variant="compact" className="mt-4" />

          {/* 모의 면접 — 회사가 준비했거나(CIP 내부) 공고 JD가 있으면(외부 원티드 등) 노출 */}
          {item.mockInterviewIntent || (item.mockInterviewQuestions?.length ?? 0) > 0 || item.mainResponsibilities || item.requiredQualifications ? (
            <div className="mt-4">
              <button type="button" onClick={() => setMockGateOpen(true)} className="group/mock flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#DCE7FF] bg-gradient-to-br from-[#E8F0FF] to-[#F6FAFF] py-4 pl-5 pr-3 text-left transition hover:border-[#0B46E8]/45">
                <span className="min-w-0 flex-1">
                  <span className="block break-keep text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{item.sourceProvider === "INTERNAL" ? t("이 회사 모의 면접 미리 풀기", "Try this company's mock interview", "提前练习该公司模拟面试", "Thử phỏng vấn thử của công ty này", "この会社の模擬面接を先に解く", "Coba wawancara simulasi perusahaan ini") : t("이 공고 기반 모의 면접 풀기", "Try a mock interview from this posting", "基于该职位的模拟面试", "Phỏng vấn thử dựa trên tin tuyển dụng này", "この求人を基にした模擬面接", "Wawancara simulasi berdasarkan lowongan ini")}</span>
                  <span className="mt-1 block break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{t("지원 전에 예상 질문을 풀고 AI 피드백을 받아보세요.", "Practice likely questions and get AI feedback before applying.", "申请前练习可能的问题并获得 AI 反馈。", "Luyện câu hỏi dự kiến và nhận phản hồi AI trước khi ứng tuyển.", "応募前に予想質問を解いてAIフィードバックを受けましょう。", "Latih pertanyaan dan dapat umpan balik AI sebelum melamar.")}</span>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/img_ai_interview.webp" alt="" aria-hidden className="h-[96px] w-[96px] shrink-0 object-contain transition group-hover/mock:scale-105" />
              </button>
              {item.sourceProvider !== "INTERNAL" ? (
                <p className="mt-1.5 break-keep px-1 text-[11.5px] leading-relaxed text-[#8B95A1]">
                  {t("※ 공고 내용을 기반으로 한 연습이에요. 실제 이 회사의 면접 방식·질문과는 무관합니다.", "※ Practice based on the job posting only — it has no connection to this company's actual interview.", "※ 仅基于职位描述的练习，与该公司实际面试无关。", "※ Chỉ luyện tập dựa trên tin tuyển dụng — không liên quan đến phỏng vấn thực tế của công ty này.", "※ 求人内容に基づく練習です。実際のこの会社の面接とは関係ありません。", "※ Latihan berdasarkan lowongan saja — tidak terkait dengan wawancara asli perusahaan ini.")}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* 상단 액션 (데스크톱) */}
          <div className="mt-4 hidden justify-end gap-2 md:flex">
            <TalentButton
              onClick={toggleSave}
              variant={saved ? "soft" : "secondary"}
              size="lg"
              aria-label={saved ? t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "保存を解除", "Batal simpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
              className={saved ? "" : "!border-0 !bg-[#F2F4F6] !text-[#4E5968] hover:!bg-[#E5E8EB]"}
            >
              <BookmarkSimple className="h-4 w-4" weight={saved ? "fill" : "regular"} /> {saved ? t("저장됨", "Saved", "已收藏", "Đã lưu", "保存済み", "Tersimpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
            </TalentButton>
            <ApplyButton view={view} applied={applied} applying={applying} onApply={() => setApplyOpen(true)} />
          </div>

          {/* 핵심 정보 · 상세 안내 · 기업 정보 */}
          <PositionDetailSections item={item} />

          {/* 데스크톱 액션 */}
          <div className="mt-6 hidden justify-end gap-2 md:flex">
            <TalentButton
              onClick={toggleSave}
              variant={saved ? "soft" : "secondary"}
              size="lg"
              aria-label={saved ? t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "保存を解除", "Batal simpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
              className={saved ? "" : "!border-0 !bg-[#F2F4F6] !text-[#4E5968] hover:!bg-[#E5E8EB]"}
            >
              <BookmarkSimple className="h-4 w-4" weight={saved ? "fill" : "regular"} /> {saved ? t("저장됨", "Saved", "已收藏", "Đã lưu", "保存済み", "Tersimpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
            </TalentButton>
            <ApplyButton view={view} applied={applied} applying={applying} onApply={() => setApplyOpen(true)} />
          </div>

          {/* 모바일 하단 고정 CTA */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EEF1F5] bg-white/95 p-3 backdrop-blur md:hidden" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
            <div className="mx-auto flex max-w-4xl items-center gap-2">
              <button
                type="button"
                onClick={toggleSave}
                aria-label={saved ? t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "保存を解除", "Batal simpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")}
                className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl ${saved ? "bg-[#EDF1FD] text-[#0B46E8]" : "bg-[#F2F4F6] text-[#8B95A1]"}`}
              >
                <BookmarkSimple className="h-5 w-5" weight={saved ? "fill" : "regular"} />
              </button>
              <div className="flex-1">
                <ApplyButton view={view} applied={applied} applying={applying} onApply={() => setApplyOpen(true)} fullWidth />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {cipOpen ? <TalentCipModal locale={locale} onClose={() => setCipOpen(false)} /> : null}
      {mockOpen && item ? <MockInterviewModal item={item} onClose={() => setMockOpen(false)} /> : null}
      {mockGateOpen ? (
        <MockGateModal
          allowWithoutDocs
          onClose={() => setMockGateOpen(false)}
          onConfirm={() => {
            setMockGateOpen(false);
            setMockOpen(true);
          }}
        />
      ) : null}
      {applyOpen ? <ApplyModal applying={applying} onClose={() => setApplyOpen(false)} onConfirm={submitApply} /> : null}
    </TalentAppShell>
  );
}

// 지원 전 서류 완성도 확인 팝업 — 이력서·자기소개서가 모두 완성돼야 지원 가능.
function ApplyModal({ applying, onClose, onConfirm }: { applying: boolean; onClose: () => void; onConfirm: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const ready = rp >= 100 && cp >= 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.18)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-7 pt-7">
          <div>
            <h2 className="text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{t("이 공고에 지원할까요?", "Apply to this job?", "申请该职位？", "Ứng tuyển việc này?", "この求人に応募しますか？", "Lamar lowongan ini?")}</h2>
            <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t("지원 서류(이력서·자기소개서)가 준비됐는지 확인해요.", "Let's check your resume and cover letter are ready.", "确认你的简历和自我介绍是否已准备好。", "Kiểm tra CV và thư xin việc đã sẵn sàng chưa.", "応募書類（履歴書・自己PR）が準備できているか確認します。", "Pastikan resume dan surat lamaran Anda siap.")}</p>
          </div>
          <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} onClick={onClose} className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 px-7">
          <DocStatus label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")} pct={rp} href={talentAppRoutes.resume} />
          <DocStatus label={t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Surat lamaran")} pct={cp} href={talentAppRoutes.cover} />
        </div>

        {!ready ? (
          <p className="mx-7 mt-4 rounded-xl bg-[#FDECEE] px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-[#F04452]">
            {t("서류를 완성해야 지원할 수 있어요. 미완성 서류를 마저 채워주세요.", "Complete your documents before applying. Please finish the unfinished ones.", "完成材料后才能申请。请补全未完成的材料。", "Hoàn tất hồ sơ trước khi ứng tuyển. Hãy hoàn thiện phần còn thiếu.", "書類を完成させると応募できます。未完成の書類を仕上げてください。", "Lengkapi dokumen sebelum melamar. Selesaikan yang belum selesai.")}
          </p>
        ) : null}

        <div className="px-7 pb-7 pt-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ready || applying}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] px-5 text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying ? t("지원 중…", "Applying…", "申请中…", "Đang ứng tuyển…", "応募中…", "Melamar…") : t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplyButton({
  view,
  applied,
  applying,
  onApply,
  fullWidth
}: {
  view: ReturnType<typeof toPositionView>;
  applied: boolean;
  applying: boolean;
  onApply: () => void;
  fullWidth?: boolean;
}) {
  const t = usePlatformT();
  // 외부 공고 → 외부 링크로.
  if (view.external && view.externalUrl) {
    return (
      <TalentButton href={view.externalUrl} external variant="primary" size="lg" fullWidth={fullWidth} aria-label={t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")}>
        {t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")} <ArrowSquareOut className="h-4 w-4" />
      </TalentButton>
    );
  }
  // 내부(CIP) 공고 → 실제 지원(applyMyPosition).
  return (
    <TalentButton
      onClick={onApply}
      disabled={applied || applying}
      variant={applied ? "soft" : "primary"}
      size="lg"
      fullWidth={fullWidth}
      aria-label={applied ? t("지원 완료", "Applied", "已申请", "Đã ứng tuyển", "応募済み", "Terlamar") : t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")}
    >
      {applied ? t("지원 완료", "Applied", "已申请", "Đã ứng tuyển", "応募済み", "Terlamar") : applying ? t("지원 중…", "Applying…", "申请中…", "Đang ứng tuyển…", "応募中…", "Melamar…") : t("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")}
    </TalentButton>
  );
}

// 값이 링크(URL/도메인)면 새 탭으로 열 수 있게 href 반환, 아니면 undefined.
function toHref(v: string | null | undefined): string | undefined {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(s)) return `https://${s}`;
  return undefined;
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[13px] text-[#8B95A1]">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-right text-[13.5px] font-medium text-[#0B46E8] hover:underline">
          {value} <ArrowSquareOut className="h-3.5 w-3.5 shrink-0" />
        </a>
      ) : (
        <span className="break-keep text-right text-[13.5px] font-medium text-[#191F28]">{value}</span>
      )}
    </div>
  );
}

function DetailBlock({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h3 className="text-[13px] font-bold text-[#8B95A1]">{title}</h3>
      <p className="mt-1.5 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#191F28]">{text}</p>
    </section>
  );
}

// 관심 회사 토글 — 실제 서버(company-follow) 저장. 계정 설정 '관심 회사'와 동일 소스.
function CompanyFollowButton({ name }: { name: string }) {
  const t = usePlatformT();
  const interested = useFollowedCompanies().includes(name);
  return (
    <button
      type="button"
      onClick={() => toggleCompanyFollow(name, t)}
      aria-pressed={interested}
      className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-[12.5px] font-bold transition ${
        interested ? "bg-[#EDF1FD] text-[#0B46E8] hover:bg-[#E1E9FC]" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
      }`}
    >
      <Star className="h-3.5 w-3.5" weight={interested ? "fill" : "regular"} /> {interested ? t("관심 회사", "Following", "已关注", "Đang theo dõi", "関心企業", "Diikuti") : t("관심 추가", "Follow", "关注", "Theo dõi", "関心追加", "Ikuti")}
    </button>
  );
}

// 회사 헤더 — 썸네일 + 회사명 + 관심 회사. 카드 밖 맨 상단에 노출.
// large: 회사 상세 화면용(회사명·썸네일 크게).
// 공고 상세 헤더 카드 — 지원자·파트너 공용. onShowCip 있으면 CIP 뱃지 노출.
export function PositionDetailHeaderCard({ item, onShowCip }: { item: PublicPositionListItem; onShowCip?: () => void }) {
  const t = usePlatformT();
  const view = toPositionView(item, t);
  const heroImage = item.thumbnailImages?.[0] || null;
  return (
    <TCard className="overflow-hidden p-0">
      {heroImage ? (
        <div className="h-[240px] w-full overflow-hidden bg-[#F2F4F6] md:h-[340px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {view.isInternal && onShowCip ? <AplyCipBadgeButton onClick={onShowCip} size="md" className="!py-1.5" /> : null}
          {view.sourceLabel ? <TChip>{view.sourceLabel}</TChip> : null}
        </div>
        <h1 className="mt-3 text-[24px] font-black leading-[1.25] tracking-[-0.02em] text-[#0B1227]">{view.title}</h1>
        <p className="mt-2 text-[15px] font-semibold text-[#4E5968]">
          {view.isInternal && view.company && !view.isUndisclosedCompany ? (
            <Link href={`/talent/company/${encodeURIComponent(view.company)}`} className="transition hover:text-[#0B46E8] hover:underline">{view.company}</Link>
          ) : (
            view.company
          )}
          {item.partnerOrganization?.industry ? <span className="font-normal text-[#8B95A1]"> · {partnerIndustryLabel(item.partnerOrganization.industry)}</span> : null}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[#8B95A1]">
          <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {view.location}</span>
          <span>{view.employmentLabel}</span>
          {view.workTypeLabel ? <span>{view.workTypeLabel}</span> : null}
          {view.deadlineText ? <span>{t("마감", "Deadline", "截止", "Hạn chót", "締切", "Tenggat")} {view.deadlineText}</span> : null}
        </div>
      </div>
    </TCard>
  );
}

// 공고 상세 본문 — 핵심 정보 · 상세 안내 · 기업 정보. 지원자·파트너 공용.
export function PositionDetailSections({ item }: { item: PublicPositionListItem }) {
  const t = usePlatformT();
  return (
    <>
      <TCard className="mt-4 p-6">
        <h2 className="text-[15px] font-bold text-[#191F28]">{t("핵심 정보", "Key info", "关键信息", "Thông tin chính", "主要情報", "Info utama")}</h2>
        <div className="mt-3 divide-y divide-[#F2F4F6]">
          <InfoRow label={t("희망 직무", "Role", "期望职位", "Vị trí mong muốn", "希望職種", "Peran")} value={orDash(t, item.preferredJobRole)} />
          <InfoRow label={t("희망 인원", "Openings", "招聘人数", "Số lượng tuyển", "募集人数", "Jumlah lowongan")} value={item.hiringCount ? t(`${item.hiringCount}명`, `${item.hiringCount}`, `${item.hiringCount}人`, `${item.hiringCount} người`, `${item.hiringCount}名`, `${item.hiringCount} orang`) : dashText(t)} />
          <InfoRow label={t("근무 시간", "Working hours", "工作时间", "Giờ làm việc", "勤務時間", "Jam kerja")} value={orDash(t, item.workingHours)} />
          <InfoRow label={t("근무 복장", "Dress code", "着装要求", "Trang phục", "服装", "Aturan busana")} value={orDash(t, item.dressCode)} />
          <InfoRow label={t("등록일", "Posted", "发布日期", "Ngày đăng", "登録日", "Tanggal posting")} value={item.createdAt ? item.createdAt.slice(0, 10) : dashText(t)} />
        </div>
      </TCard>

      <TCard className="mt-4 p-6">
        <h2 className="text-[15px] font-bold text-[#191F28]">{t("상세 안내", "Details", "详细说明", "Chi tiết", "詳細案内", "Detail")}</h2>
        <div className="mt-4 flex flex-col gap-5">
          <DetailBlock title={t("주요 업무", "Responsibilities", "主要职责", "Nhiệm vụ chính", "主な業務", "Tanggung jawab")} text={orDash(t, item.mainResponsibilities)} />
          <DetailBlock title={t("필수 자격 요건", "Requirements", "任职要求", "Yêu cầu bắt buộc", "必須要件", "Persyaratan")} text={orDash(t, item.requiredQualifications)} />
          {item.preferredQualifications ? (
            <DetailBlock title={t("우대 사항", "Preferred", "加分项", "Ưu tiên", "優遇事項", "Nilai plus")} text={item.preferredQualifications} />
          ) : null}
          <DetailBlock title={t("채용 프로세스", "Hiring process", "招聘流程", "Quy trình tuyển dụng", "採用プロセス", "Proses rekrutmen")} text={orDash(t, item.hiringProcess)} />
        </div>
      </TCard>

      <div className="mt-6">
        <CompanyHeader item={item} />
      </div>
      <CompanySection item={item} />
    </>
  );
}

export function CompanyHeader({ item, large = false }: { item: PublicPositionListItem; large?: boolean }) {
  const org = item.partnerOrganization;
  if (!org) return null;
  const logo = org.companyLogoImageData || null;
  const box = large ? "h-16 w-16" : "h-14 w-14";
  const nameCls = large ? "text-[24px]" : "text-[18px]";
  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <span className={`${box} shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="h-full w-full object-cover" />
        </span>
      ) : (
        // 로고 없으면 유저 프로필과 동일한 이니셜 플레이스홀더.
        <span className={`flex ${box} shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] ${large ? "text-[24px]" : "text-[20px]"} font-black text-[#0B46E8]`}>{org.name.slice(0, 1)}</span>
      )}
      <Link href={`/talent/company/${encodeURIComponent(org.name)}`} className={`min-w-0 truncate ${nameCls} font-black tracking-[-0.02em] text-[#0B1227] transition hover:text-[#0B46E8] hover:underline`}>
        {org.name}
      </Link>
      <CompanyFollowButton name={org.name} />
    </div>
  );
}

export function CompanySection({ item }: { item: PublicPositionListItem }) {
  const t = usePlatformT();
  const org = item.partnerOrganization;
  if (!org) return null;
  const photos = parseOfficePhotos(org.officePhotoImageData);
  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* 기업 개요 */}
      <TCard className="p-6">
        <div className="flex items-center gap-1.5">
          <Buildings className="h-4 w-4 text-[#4E5968]" />
          <h2 className="text-[15px] font-bold text-[#191F28]">{t("기업 정보", "Company info", "企业信息", "Thông tin công ty", "企業情報", "Info perusahaan")}</h2>
        </div>

        <div className="mt-4 divide-y divide-[#F2F4F6]">
          <InfoRow label={t("기업 규모", "Company size", "企业规模", "Quy mô công ty", "企業規模", "Ukuran perusahaan")} value={org.companySize ? companySizeLabel(t, org.companySize) ?? org.companySize : dashText(t)} />
          <InfoRow label={t("산업", "Industry", "行业", "Ngành", "業界", "Industri")} value={org.industry ? partnerIndustryLabel(org.industry) : dashText(t)} />
          <InfoRow label={t("사무실 주소", "Office address", "办公地址", "Địa chỉ văn phòng", "オフィス住所", "Alamat kantor")} value={orDash(t, org.officeAddress)} />
          <InfoRow label={t("웹사이트", "Website", "网站", "Website", "ウェブサイト", "Situs web")} value={orDash(t, org.website)} href={toHref(org.website)} />
          <InfoRow label={t("소셜 미디어", "Social media", "社交媒体", "Mạng xã hội", "SNS", "Media sosial")} value={orDash(t, org.socialMedia)} href={toHref(org.socialMedia)} />
        </div>

        {org.website ? (
          <a href={org.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0B46E8] hover:underline">
            <LinkSimple className="h-4 w-4" /> {t("회사 홈페이지", "Company website", "公司主页", "Trang web công ty", "会社ホームページ", "Situs perusahaan")}
          </a>
        ) : null}
      </TCard>

      {/* 회사 사진 */}
      {photos.length ? (
        <TCard className="p-6">
          <h2 className="text-[15px] font-bold text-[#191F28]">{t("회사 사진", "Office photos", "公司照片", "Ảnh công ty", "会社の写真", "Foto kantor")}</h2>
          {photos.length === 1 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt={t("회사 사진", "Office photo", "公司照片", "Ảnh công ty", "会社の写真", "Foto kantor")} className="h-[200px] w-full object-cover" />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {photos.map((src, i) => (
                <div key={`${i}-${src.slice(0, 24)}`} className="aspect-[4/3] overflow-hidden rounded-xl border border-[#EEF1F5] bg-[#F2F4F6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={t(`회사 사진 ${i + 1}`, `Office photo ${i + 1}`, `公司照片 ${i + 1}`, `Ảnh công ty ${i + 1}`, `会社の写真 ${i + 1}`, `Foto kantor ${i + 1}`)} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </TCard>
      ) : null}

      {/* 기업 소개 */}
      {org.description?.trim() ? (
        <TCard className="p-6">
          <h2 className="text-[15px] font-bold text-[#191F28]">{t("기업 소개", "About the company", "企业简介", "Giới thiệu công ty", "企業紹介", "Tentang perusahaan")}</h2>
          <p className="mt-3 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#4E5968]">{org.description}</p>
        </TCard>
      ) : null}

      {/* 회사 자랑거리 */}
      {org.strengths?.trim() ? (
        <TCard className="p-6">
          <h2 className="text-[15px] font-bold text-[#191F28]">{t("회사 자랑거리", "Company highlights", "公司亮点", "Điểm nổi bật", "会社の自慢", "Keunggulan perusahaan")}</h2>
          <p className="mt-3 whitespace-pre-line break-keep text-[14px] leading-[1.75] text-[#4E5968]">{org.strengths}</p>
        </TCard>
      ) : null}
    </div>
  );
}
