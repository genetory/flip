"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Eye,
  PencilSimple,
  ShareNetwork,
  Sparkle,
  Trash,
  Lightning,
  CaretRight,
  CheckCircle,
  X
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { CipInfoModal } from "../positions/AplyCipBadge";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  deleteMyResume,
  getMyResume,
  getPublicPositionsPage,
  getResumeCoach,
  postResumeCoachSuggest,
  updateMyResume,
  type Resume,
  type ResumeContent,
  type ResumeCoachAction,
  type ResumeCoachActionCategory,
  type ResumeCoachData,
  type ResumeCoachSuggestion,
  type ResumeQualityDimensions,
  type ResumeReadinessDimensions,
  type ResumeReadinessLevel
} from "../../lib/member-profile-client";
import { mapPublicPositionToCard, PositionRow, type PositionCard } from "./PositionsPage";

// ---------------------------------------------------------------------------
// 선택된 이력서의 점수 + 액션 + 매칭 + 챗 패널. 자체 라우트 없이 리스트
// 페이지 안에 인라인으로 펼쳐지는 마스터-디테일 우측(/하단) 영역.
//
// props:
//   resumeId         어떤 이력서를 보여줄지. 변경되면 자동으로 다시 fetch.
//   onResumeUpdated  LLM 추천을 본문에 적용했을 때 호출. 부모 리스트가
//                    카드의 점수 배지를 갱신할 수 있게 새 점수도 전달.
// ---------------------------------------------------------------------------

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}


type LocalizedLabel = { ko: string; en: string; zh: string; vi: string; ja: string; id: string };

const QUALITY_DIMENSION_LABELS: Record<keyof ResumeQualityDimensions, LocalizedLabel> = {
  contentQuality: { ko: "콘텐츠 품질", en: "Content quality", zh: "内容质量",  vi: "Chất lượng nội dung", ja: "コンテンツ品質", id: "Kualitas konten" },
  impact:         { ko: "임팩트",      en: "Impact",          zh: "影响力",    vi: "Tác động",            ja: "インパクト",     id: "Dampak" },
  uniqueness:     { ko: "차별점",      en: "Uniqueness",      zh: "差异化",    vi: "Khác biệt",           ja: "差別化",         id: "Keunikan" },
  visual:         { ko: "시각·형식",   en: "Visual",          zh: "视觉·形式", vi: "Hình thức",           ja: "視覚・形式",     id: "Visual" }
};

const READINESS_DIMENSION_LABELS: Record<keyof ResumeReadinessDimensions, LocalizedLabel> = {
  contact:    { ko: "연락처",          en: "Contact",       zh: "联系方式",  vi: "Liên hệ",         ja: "連絡先",       id: "Kontak" },
  education:  { ko: "학력",            en: "Education",     zh: "学历",      vi: "Học vấn",         ja: "学歴",         id: "Pendidikan" },
  visa:       { ko: "비자 정보",        en: "Visa",          zh: "签证",      vi: "Thị thực",        ja: "ビザ",         id: "Visa" },
  koreaFit:   { ko: "한국 취업 적합도", en: "Korea fit",     zh: "韩国适配度", vi: "Phù hợp Hàn Quốc", ja: "韓国就職適合度", id: "Kecocokan Korea" },
  portfolio:  { ko: "포트폴리오",       en: "Portfolio",     zh: "作品集",    vi: "Hồ sơ năng lực",  ja: "ポートフォリオ", id: "Portofolio" }
};

const LEVEL_META: Record<ResumeReadinessLevel, { label: LocalizedLabel; bg: string; text: string; dot: string }> = {
  submittable: {
    label: { ko: "제출 가능",       en: "Submittable",       zh: "可提交",       vi: "Sẵn sàng nộp",       ja: "提出可能",       id: "Siap dikirim" },
    bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500"
  },
  needs_polish: {
    label: { ko: "보완 후 제출 가능", en: "Needs polish",     zh: "需完善后提交",  vi: "Cần hoàn thiện",     ja: "補強後に提出可", id: "Perlu disempurnakan" },
    bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500"
  },
  not_submittable: {
    label: { ko: "아직 제출 불가",   en: "Not submittable",   zh: "暂不可提交",    vi: "Chưa thể nộp",       ja: "提出不可",       id: "Belum bisa dikirim" },
    bg: "bg-slate-200",   text: "text-slate-700",   dot: "bg-slate-500"
  }
};

const CATEGORY_LABELS: Record<ResumeCoachActionCategory, LocalizedLabel> = {
  required:    { ko: "필수",  en: "Required",    zh: "必填",  vi: "Bắt buộc",  ja: "必須",  id: "Wajib" },
  recommended: { ko: "추천",  en: "Recommended", zh: "推荐",  vi: "Đề xuất",   ja: "推奨",  id: "Disarankan" },
  optional:    { ko: "선택",  en: "Optional",    zh: "可选",  vi: "Tùy chọn",  ja: "任意",  id: "Opsional" }
};

const CATEGORY_STYLE: Record<ResumeCoachActionCategory, { badge: string; dot: string }> = {
  required:    { badge: "bg-red-100 text-red-700",       dot: "bg-red-500" },
  recommended: { badge: "bg-amber-100 text-amber-800",   dot: "bg-amber-500" },
  optional:    { badge: "bg-slate-100 text-slate-700",   dot: "bg-slate-400" }
};

export function ResumeCoachPanel({
  resumeId,
  onResumeUpdated,
  onResumeDeleted
}: {
  resumeId: string;
  onResumeUpdated?: (resume: Resume) => void;
  onResumeDeleted?: (resumeId: string) => void;
}) {
  const tr = useTr();

  const [resume, setResume] = useState<Resume | null>(null);
  const [coach, setCoach] = useState<ResumeCoachData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [suggestionFor, setSuggestionFor] = useState<ResumeCoachAction | null>(null);
  const [suggestion, setSuggestion] = useState<ResumeCoachSuggestion | null>(null);
  const [suggestionBusy, setSuggestionBusy] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 코치 패널 안의 "가능한 포지션" 섹션은 포지션 탐색의 PositionRow 를
  // 재사용해서 같은 시각·인터랙션(즐겨찾기 칩, CIP 뱃지 등) 을 유지. 데이터는
  // 일반 공개 포지션 리스트에서 일부만 가져옴.
  const { locale } = useLanguage();
  const { user } = useAuthSession();
  const [positionCards, setPositionCards] = useState<PositionCard[]>([]);
  const [cipModalOpen, setCipModalOpen] = useState(false);

  // AI 호출 동의 게이트. 사용자가 처음 AI 액션(추천/챗)을 트리거할 때 한 번
  // 모달로 받아두고 localStorage 에 기록 — 그 다음부터는 묻지 않는다. v1 은
  // 동의 문구가 바뀔 때 재동의 받기 위한 버저닝.
  type PendingAiAction = { kind: "suggest"; action: ResumeCoachAction };
  const CONSENT_KEY = "aply.ai-coach.consent.v1";
  const [aiConsent, setAiConsent] = useState<boolean>(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [pendingAi, setPendingAi] = useState<PendingAiAction | null>(null);
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(CONSENT_KEY)) {
        setAiConsent(true);
      }
    } catch {
      // localStorage 접근 실패 시 안전하게 미동의 상태 유지.
    }
  }, []);


  // resumeId 가 바뀔 때마다 새 이력서 데이터 + 코치 데이터 fetch. 챗과 모달
  // 상태도 새 이력서 기준으로 리셋해서 이전 흔적이 보이지 않게.
  useEffect(() => {
    let cancelled = false;
    setResume(null);
    setCoach(null);
    setLoadError(null);
    setSuggestionFor(null);
    setSuggestion(null);
    setDeleteOpen(false);
    setDeleteError(null);
    void (async () => {
      try {
        const [r, c] = await Promise.all([getMyResume(resumeId), getResumeCoach(resumeId)]);
        if (!cancelled) {
          setResume(r);
          setCoach(c);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : tr("코치 데이터를 불러오지 못했어요.", "Couldn't load coach data.", "无法加载教练数据。", "Không tải được dữ liệu coach.", "コーチデータを読み込めませんでした。", "Tidak dapat memuat data coach."));
      }
    })();
    // 가능한 포지션 — 일반 공개 포지션 API 를 살짝 호출해서 6개. 코치 데이터
    // 로딩과 무관하게 병렬 시작, 실패해도 다른 영역 못 그리는 일은 없음.
    void (async () => {
      try {
        const page = await getPublicPositionsPage({ limit: 6 });
        if (cancelled) return;
        const cards = (page.items ?? []).map((item) => mapPublicPositionToCard(item, locale));
        setPositionCards(cards);
      } catch {
        if (!cancelled) setPositionCards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // locale 이 바뀌어도 list 가 다시 mapping 되는 건 좀 과한 호출이라 dep 에서 뺌.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  async function openSuggestion(action: ResumeCoachAction) {
    if (!action.llmEligible) return;
    // 외부 LLM 으로 이력서 본문을 전송하기 전에 동의를 받음.
    if (!aiConsent) {
      setPendingAi({ kind: "suggest", action });
      setConsentOpen(true);
      return;
    }
    setSuggestionFor(action);
    setSuggestion(null);
    setSuggestionError(null);
    setSuggestionBusy(true);
    try {
      const s = await postResumeCoachSuggest(resumeId, {
        targetSection: action.targetSection as "selfIntroduction" | "summary" | "careers" | "activities",
        targetItemIndex: action.targetItemIndex,
        tone: "impactful"
      });
      setSuggestion(s);
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : tr("AI 제안을 받지 못했어요.", "Couldn't get an AI suggestion.", "无法获取AI建议。", "Không nhận được gợi ý AI.", "AI提案を取得できませんでした。", "Tidak bisa mendapatkan saran AI."));
    } finally {
      setSuggestionBusy(false);
    }
  }

  async function applySuggestion() {
    if (!resume || !suggestion || applying) return;
    setApplying(true);
    try {
      const nextContent: ResumeContent = { ...(resume.content ?? {}) };
      if (suggestion.targetSection === "selfIntroduction" || suggestion.targetSection === "summary") {
        nextContent.selfIntroduction = suggestion.after;
      } else if (suggestion.targetSection === "careers" && typeof suggestion.targetItemIndex === "number") {
        const list = [...(nextContent.careers ?? [])];
        if (list[suggestion.targetItemIndex]) {
          list[suggestion.targetItemIndex] = { ...list[suggestion.targetItemIndex], description: suggestion.after };
          nextContent.careers = list;
        }
      } else if (suggestion.targetSection === "activities" && typeof suggestion.targetItemIndex === "number") {
        const list = [...(nextContent.activities ?? [])];
        if (list[suggestion.targetItemIndex]) {
          list[suggestion.targetItemIndex] = { ...list[suggestion.targetItemIndex], description: suggestion.after };
          nextContent.activities = list;
        }
      }
      const updated = await updateMyResume(resumeId, { content: nextContent });
      setResume(updated);
      const c = await getResumeCoach(resumeId);
      setCoach(c);
      // 리스트 카드의 점수 배지도 같이 갱신될 수 있게 부모에 알림.
      onResumeUpdated?.(updated);
      setSuggestionFor(null);
      setSuggestion(null);
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : tr("적용에 실패했어요.", "Failed to apply.", "应用失败。", "Áp dụng thất bại.", "適用に失敗しました。", "Gagal menerapkan."));
    } finally {
      setApplying(false);
    }
  }

  function grantAiConsent() {
    try {
      window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    } catch {
      // localStorage 차단 환경에서는 세션 동안만 동의가 유효.
    }
    setAiConsent(true);
    setConsentOpen(false);
    const next = pendingAi;
    setPendingAi(null);
    // 사용자가 원래 누르려던 액션을 자동 재실행 — 별도 클릭 한 번 더 안
    // 요구해서 UX 흐름 끊기지 않게.
    if (next?.kind === "suggest") {
      // 다음 tick 에서 호출해야 state 가 적용된 뒤 게이트가 통과됨.
      setTimeout(() => openSuggestion(next.action), 0);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyResume(resumeId);
      // 부모 리스트가 카드를 제거하고 다른 이력서로 selection 을 옮길 수
      // 있도록 알림. 이 컴포넌트는 곧 key 변경으로 언마운트되거나 빈 상태로 전환.
      onResumeDeleted?.(resumeId);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : tr("삭제에 실패했어요.", "Failed to delete.", "删除失败。", "Xóa thất bại.", "削除に失敗しました。", "Gagal menghapus."));
      setDeleting(false);
    }
  }

  // ---- Loading / errors -------------------------------------------------
  if (coach === null && !loadError) {
    return (
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-muted" />
          <div className="h-80 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }
  if (loadError || !coach || !resume) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {loadError ?? tr("이력서를 찾을 수 없어요.", "Resume not found.", "找不到简历。", "Không tìm thấy hồ sơ.", "履歴書が見つかりません。", "Resume tidak ditemukan.")}
      </div>
    );
  }

  const { score, actions } = coach;
  const levelMeta = LEVEL_META[score.level];
  const levelLabel = tr(levelMeta.label.ko, levelMeta.label.en, levelMeta.label.zh, levelMeta.label.vi, levelMeta.label.ja, levelMeta.label.id);
  // 사용자가 다음에 해야 할 일을 한 줄로. required 액션이 있으면 그걸 우선,
  // 없으면 readiness 점수에 따른 일반 안내.
  const requiredCount = actions.filter((a) => a.category === "required").length;
  const statusMessage =
    score.level === "submittable"
      ? tr("기업에 추천 가능한 상태예요", "Ready for partner matching", "可推荐给企业", "Sẵn sàng giới thiệu", "企業に推薦可能", "Siap direkomendasikan")
      : score.level === "needs_polish"
      ? requiredCount > 0
        ? tr(`필수 항목 ${requiredCount}개를 채우면 기업 추천 풀에 진입해요`, `Fill ${requiredCount} required item(s) to enter the partner pool`, `补全 ${requiredCount} 个必填项即可进入企业推荐池`, `Điền ${requiredCount} mục bắt buộc để vào danh sách đề xuất`, `必須項目${requiredCount}件を満たすと推薦プールに入ります`, `Lengkapi ${requiredCount} item wajib untuk masuk pool rekomendasi`)
        : tr("이력서 품질을 조금 더 다듬으면 추천 가능해요", "Polish quality a bit more to be recommendable", "再优化质量即可被推荐", "Cải thiện chất lượng để được đề xuất", "もう少し品質を磨くと推薦可能", "Tingkatkan kualitas agar bisa direkomendasikan")
      : tr("기본 정보부터 채워보세요", "Start with the essentials", "先填好基本信息", "Bắt đầu với thông tin cơ bản", "基本情報から", "Mulai dengan informasi dasar");

  // 액션을 카테고리로 그룹핑 — UI 에서 섹션 헤더 단위로 보여줌
  const actionsByCategory: Record<ResumeCoachActionCategory, ResumeCoachAction[]> = {
    required: actions.filter((a) => a.category === "required"),
    recommended: actions.filter((a) => a.category === "recommended"),
    optional: actions.filter((a) => a.category === "optional")
  };

  return (
    <>
      {/* Action buttons (보기 / 편집 / 공유) */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/resume/${resumeId}/preview`}>
            <Eye className="h-3.5 w-3.5" weight="bold" />
            {tr("이력서 보기", "View", "查看", "Xem", "表示", "Lihat")}
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/resume-maker/${resumeId}/edit`}>
            <PencilSimple className="h-3.5 w-3.5" weight="bold" />
            {tr("편집", "Edit", "编辑", "Sửa", "編集", "Sunting")}
          </Link>
        </Button>
        {resume.shareSlug ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/resume/share/${resume.shareSlug}`} target="_blank" rel="noopener noreferrer">
              <ShareNetwork className="h-3.5 w-3.5" weight="bold" />
              {tr("공유", "Share", "分享", "Chia sẻ", "共有", "Bagikan")}
            </Link>
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
          className="text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <Trash className="h-3.5 w-3.5" weight="bold" />
          {tr("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
        </Button>
      </div>

      {/* Score hero — readiness 배지가 가장 상단. 이력서 품질·제출 준비도
          두 점수를 나란히 보여주고, 각 점수의 차원 바를 아래에. */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        {/* Top: status badge + 한 줄 안내 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${levelMeta.bg} ${levelMeta.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${levelMeta.dot}`} />
            {levelLabel}
          </span>
          <span className="text-[12.5px] text-muted-foreground">{statusMessage}</span>
        </div>

        {/* Dual scores */}
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {/* Quality */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tr("이력서 품질", "Resume quality", "简历质量", "Chất lượng hồ sơ", "履歴書品質", "Kualitas resume")}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold tabular-nums">{score.quality.total}</span>
              <span className="text-[12px] text-muted-foreground">/100</span>
            </div>
            <div className="mt-3 grid gap-2">
              {(Object.keys(score.quality.dimensions) as Array<keyof ResumeQualityDimensions>).map((key) => {
                const value = score.quality.dimensions[key];
                const labels = QUALITY_DIMENSION_LABELS[key];
                const label = tr(labels.ko, labels.en, labels.zh, labels.vi, labels.ja, labels.id);
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <span className="w-20 flex-none text-[11.5px] text-foreground">{label}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-all" style={{ width: `${value}%` }} />
                    </div>
                    <span className="w-7 flex-none text-right text-[11px] font-bold tabular-nums">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Readiness */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {tr("제출 준비도", "Submission readiness", "提交准备度", "Mức sẵn sàng nộp", "提出準備度", "Kesiapan kirim")}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold tabular-nums">{score.readiness.total}</span>
              <span className="text-[12px] text-muted-foreground">/100</span>
            </div>
            <div className="mt-3 grid gap-2">
              {(Object.keys(score.readiness.dimensions) as Array<keyof ResumeReadinessDimensions>).map((key) => {
                const value = score.readiness.dimensions[key];
                const labels = READINESS_DIMENSION_LABELS[key];
                const label = tr(labels.ko, labels.en, labels.zh, labels.vi, labels.ja, labels.id);
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <span className="w-20 flex-none text-[11.5px] text-foreground">{label}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-all" style={{ width: `${value}%` }} />
                    </div>
                    <span className="w-7 flex-none text-right text-[11px] font-bold tabular-nums">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Actions + Matches — 우측 컬럼 폭이 제한적이라 항상 세로 흐름 */}
      <section className="mt-5 space-y-5">
        {/* Actions — 카테고리별 그룹 (필수 / 추천 / 선택) */}
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <header className="mb-4 flex items-center gap-2">
            <Lightning className="h-5 w-5 text-foreground" weight="fill" />
            <h3 className="font-display text-base font-bold">
              {tr("다음 액션", "Next actions", "下一步行动", "Hành động tiếp theo", "次のアクション", "Tindakan berikutnya")}
            </h3>
          </header>
          {actions.length === 0 ? (
            <div className="grid place-items-center gap-3 rounded-2xl bg-muted/40 px-4 py-12 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500" weight="fill" />
              <p className="text-sm font-semibold">
                {tr("개선할 점이 없어요. 완벽한 이력서예요!", "Nothing to improve right now. Perfect resume!", "暂无可改进项。完美简历！", "Không có gì để cải thiện. Hồ sơ hoàn hảo!", "改善点はありません。完璧な履歴書です！", "Tidak ada yang perlu ditingkatkan. Resume sempurna!")}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {(["required", "recommended", "optional"] as ResumeCoachActionCategory[]).map((category) => {
                const items = actionsByCategory[category];
                if (items.length === 0) return null;
                const catLabel = CATEGORY_LABELS[category];
                const catStyle = CATEGORY_STYLE[category];
                return (
                  <div key={category}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${catStyle.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`} />
                        {tr(catLabel.ko, catLabel.en, catLabel.zh, catLabel.vi, catLabel.ja, catLabel.id)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{items.length}</span>
                    </div>
                    <ul className="space-y-2">
                      {items.map((action) => (
                        <li key={action.id}>
                          {/* 카드 전체가 편집 화면 링크. 내부 "AI 추천 보기"
                              버튼은 e.preventDefault() 로 라우팅 가로채기. */}
                          <Link
                            href={`/resume-maker/${resumeId}/edit`}
                            className="block rounded-2xl border border-border bg-background p-4 transition hover:border-foreground/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[13.5px] font-bold">{action.title}</p>
                              <span className="inline-flex flex-none items-center gap-0.5 rounded-full bg-[#b7ff5a] px-2 py-0.5 text-[10px] font-bold text-[#111]">
                                +{action.impactPoints}
                              </span>
                            </div>
                            <p className="mt-1 text-[12.5px] text-muted-foreground">{action.description}</p>
                            {action.llmEligible ? (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openSuggestion(action);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background hover:opacity-90"
                                >
                                  <Sparkle className="h-3 w-3" weight="fill" />
                                  {tr("AI 추천 보기", "Get AI suggestion", "获取AI建议", "Gợi ý AI", "AI提案を見る", "Saran AI")}
                                </button>
                              </div>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 가능한 포지션 — 포지션 탐색의 PositionRow 를 그대로 재사용해서
            카드 모양·CIP 뱃지·외부 링크 처리까지 완전히 같게 보임. 즐겨찾기·
            지원 같은 인터랙션은 코치 화면 컨텍스트에선 의미가 약해 정적 표시.
            "더 보기" 로 자연스럽게 /positions 로 연결. */}
        {positionCards.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
            <header className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-foreground" weight="fill" />
                <h3 className="font-display text-base font-bold">
                  {tr("가능한 포지션", "Open for you", "可申请职位", "Vị trí phù hợp", "応募可能ポジション", "Posisi yang sesuai")}
                </h3>
              </div>
              <Link href="/positions" className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
                {tr("모두 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}
                <CaretRight className="h-3 w-3" weight="bold" />
              </Link>
            </header>
            <div className="space-y-2">
              {positionCards.map((card) => (
                <PositionRow
                  key={card.id}
                  p={card}
                  isOwnPartnerPosting={false}
                  isStudentUser={user?.role === "STUDENT"}
                  isApplied={false}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                  onApply={() => {}}
                  onShowCip={() => setCipModalOpen(true)}
                  locale={locale}
                  compact
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Suggestion modal */}
      {suggestionFor ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI suggestion"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (!applying && !suggestionBusy) {
              setSuggestionFor(null);
              setSuggestion(null);
            }
          }}
        >
          <div
            className="relative flex w-full max-w-2xl max-h-[85vh] flex-col rounded-2xl border border-border bg-card shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                if (!applying && !suggestionBusy) {
                  setSuggestionFor(null);
                  setSuggestion(null);
                }
              }}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header — 타이틀 + 보장 박스 (모달 폭이 좁아져도 항상 보임) */}
            <header className="flex-none border-b border-border px-6 pb-4 pt-6">
              <div className="flex items-center gap-2 pr-8">
                <Sparkle className="h-5 w-5 text-foreground" weight="fill" />
                <h3 className="font-display text-lg font-bold">{suggestionFor.title}</h3>
              </div>
              {suggestion ? (
                <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
                  {tr(
                    "AI 는 기존 이력서에 적힌 사실만 사용해 표현만 다듬어요. 없는 경력·회사·수치는 만들어내지 않아요. 마음에 들지 않으면 적용하지 않아도 됩니다.",
                    "AI rewrites using only what's already in your resume. It doesn't fabricate companies, dates, or metrics. You can skip applying it.",
                    "AI 仅基于您简历中已有的事实进行润色，不会编造公司、日期或数据。可不应用。",
                    "AI chỉ dùng các thông tin có sẵn trong hồ sơ để diễn đạt lại, không bịa thêm công ty, ngày tháng hay số liệu.",
                    "AIは履歴書に既にある事実だけを使って表現を整えます。会社・日付・数値の捏造はしません。",
                    "AI hanya menggunakan fakta yang sudah ada di resume Anda untuk memperhalus, tidak mengarang perusahaan, tanggal, atau angka."
                  )}
                </p>
              ) : null}
            </header>

            {/* Body — 본문(Before/After/Why)만 스크롤. min-h-0 가 flex 아이템이
                실제로 줄어들 수 있게 해줘서 overflow-y-auto 가 동작함. */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {suggestionBusy ? (
                <p className="text-sm text-muted-foreground">
                  {tr("AI 가 추천을 작성하는 중…", "Generating suggestion…", "AI 正在生成建议…", "Đang tạo gợi ý…", "AIが提案を作成中…", "Sedang membuat saran…")}
                </p>
              ) : suggestionError ? (
                <p className="text-sm text-destructive">{suggestionError}</p>
              ) : suggestion ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tr("이전", "Before", "之前", "Trước", "現在", "Sebelum")}</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-[13px] leading-relaxed text-foreground/80">{suggestion.before}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1b7a1b]">{tr("이후", "After", "之后", "Sau", "改善案", "Sesudah")}</p>
                    <p className="mt-1 whitespace-pre-wrap rounded-xl bg-[#b7ff5a]/30 p-3 text-[13px] leading-relaxed">{suggestion.after}</p>
                  </div>
                  {suggestion.why ? (
                    <p className="rounded-xl bg-muted/40 p-3 text-[12.5px] text-muted-foreground">{suggestion.why}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Footer — 버튼 영역. suggestion 결과 있을 때만 노출 */}
            {suggestion ? (
              <footer className="flex flex-none items-center justify-end gap-2 border-t border-border px-6 py-3">
                <Button variant="outline" size="sm" onClick={() => { setSuggestionFor(null); setSuggestion(null); }} disabled={applying}>
                  {tr("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
                </Button>
                <Button variant="dark" size="sm" onClick={applySuggestion} disabled={applying}>
                  {applying
                    ? tr("적용 중…", "Applying…", "应用中…", "Đang áp dụng…", "適用中…", "Menerapkan…")
                    : tr("이력서에 적용", "Apply to resume", "应用到简历", "Áp dụng vào hồ sơ", "履歴書に適用", "Terapkan ke resume")}
                </Button>
              </footer>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Delete confirmation modal */}
      {deleteOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={tr("이력서 삭제", "Delete resume", "删除简历", "Xóa hồ sơ", "履歴書を削除", "Hapus resume")}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            if (!deleting) setDeleteOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-destructive" weight="bold" />
              <h3 className="font-display text-lg font-bold">
                {tr("이력서를 삭제할까요?", "Delete this resume?", "确认删除此简历？", "Xóa hồ sơ này?", "この履歴書を削除しますか？", "Hapus resume ini?")}
              </h3>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">{coach.title}</span>
              {tr(
                " 을(를) 삭제하면 점수·피드백·공유 링크가 모두 함께 사라지고, 되돌릴 수 없어요.",
                " will be permanently removed along with its score, feedback, and share link. This can't be undone.",
                " 将被永久删除，包括评分、反馈和共享链接，且无法恢复。",
                " sẽ bị xóa vĩnh viễn cùng với điểm số, phản hồi và liên kết chia sẻ. Không thể hoàn tác.",
                " はスコア、フィードバック、共有リンクとともに永久に削除されます。元に戻せません。",
                " akan dihapus secara permanen bersama dengan skor, masukan, dan tautan berbagi. Tidak dapat dibatalkan."
              )}
            </p>
            {deleteError ? (
              <p className="mt-3 rounded-lg bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">{deleteError}</p>
            ) : null}
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                {tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? tr("삭제 중…", "Deleting…", "删除中…", "Đang xóa…", "削除中…", "Menghapus…")
                  : tr("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* AI 사용 동의 모달 — 첫 AI 액션 시 한 번만 노출, 이후 localStorage 기반 스킵 */}
      {consentOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={tr("AI 코치 사용 동의", "AI coach consent", "AI教练使用同意", "Đồng ý sử dụng AI coach", "AIコーチ利用同意", "Persetujuan AI coach")}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setConsentOpen(false);
            setPendingAi(null);
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-foreground" weight="fill" />
              <h3 className="font-display text-lg font-bold">
                {tr("AI 코치를 사용해도 될까요?", "Use AI coach?", "可以使用AI教练吗？", "Sử dụng AI coach?", "AIコーチを使ってもいい？", "Gunakan AI coach?")}
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-foreground/85">
              <p>
                {tr(
                  "선택하신 항목의 이력서 내용이 분석을 위해 OpenAI 의 GPT 모델로 전송됩니다.",
                  "Your selected resume text will be sent to OpenAI's GPT model for analysis.",
                  "您所选项目的简历内容将发送至 OpenAI GPT 模型进行分析。",
                  "Nội dung hồ sơ bạn chọn sẽ được gửi đến mô hình GPT của OpenAI để phân tích.",
                  "選択した履歴書のテキストは分析のためOpenAIのGPTモデルに送信されます。",
                  "Konten resume yang Anda pilih akan dikirim ke model GPT OpenAI untuk dianalisis."
                )}
              </p>
              <p>
                {tr(
                  "AI 는 원문에 적힌 사실만 활용하고, 없는 경력·수치·회사를 만들어내지 않습니다. 결과를 적용할지는 매번 본인이 선택합니다.",
                  "The AI uses only what's already in your resume — no fabricated jobs, numbers, or companies. You decide every time whether to apply a suggestion.",
                  "AI 仅基于您简历中的事实，不会编造经历、数据或公司。是否应用建议每次由您决定。",
                  "AI chỉ dùng thông tin đã có trong hồ sơ — không bịa kinh nghiệm, số liệu hay công ty. Bạn quyết định mỗi lần có áp dụng gợi ý hay không.",
                  "AIは履歴書にある事実だけを使い、経歴・数値・会社名を捏造しません。提案を適用するかは毎回ご自身で決めます。",
                  "AI hanya menggunakan info yang sudah ada di resume — tidak mengarang pengalaman, angka, atau perusahaan. Anda yang memutuskan setiap kali apakah menerapkan saran."
                )}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {tr(
                  "동의는 이 디바이스에서 한 번만 기록됩니다.",
                  "Consent is stored once on this device.",
                  "同意仅在此设备记录一次。",
                  "Sự đồng ý chỉ được lưu một lần trên thiết bị này.",
                  "同意はこの端末で一度だけ記録されます。",
                  "Persetujuan disimpan sekali di perangkat ini."
                )}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConsentOpen(false);
                  setPendingAi(null);
                }}
              >
                {tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
              </Button>
              <Button variant="dark" size="sm" onClick={grantAiConsent}>
                {tr("동의하고 계속", "Agree and continue", "同意并继续", "Đồng ý và tiếp tục", "同意して続ける", "Setuju dan lanjut")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* PositionRow 안의 [Aply CIP] 뱃지를 눌렀을 때 뜨는 안내 모달.
          기존 포지션 탐색·상세 페이지에서 쓰는 것과 동일 컴포넌트. */}
      {cipModalOpen ? (
        <CipInfoModal locale={locale} onClose={() => setCipModalOpen(false)} />
      ) : null}
    </>
  );
}
