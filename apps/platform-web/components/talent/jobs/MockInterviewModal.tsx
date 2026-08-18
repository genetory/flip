"use client";

// 모의 면접 — 한 문항씩 진행하며 답변·AI 피드백을 받고 저장한다.
// item 있으면 회사 공고 기반(연습 기록을 회사에 노출), 없으면(self) 내 이력서·자기소개서 기반(계정에 저장).
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkle, CaretLeft, CaretRight, CircleNotch } from "@phosphor-icons/react";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { useVisualViewport } from "../../../lib/useVisualViewport";
import { useResumeDoc } from "../../../lib/talent/resume-doc";
import { useCoverDoc } from "../../../lib/talent/cover-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";
import { useSelfMock, saveSelfMockAnswer } from "../../../lib/talent/self-mock";
import { catMeta, CATEGORY_ORDER } from "../../../lib/talent/mock-interview-categories";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { aiInterviewQuestions, aiInterviewFeedback, recordMockInterviewPractice, type PublicPositionListItem, type InterviewQuestion, type InterviewFeedback } from "../../../lib/member-profile-client";
import { getAiUsage, type AiUsage } from "../../../lib/resume-maker-client";
import { AiTicketStatusModal } from "../../resume-maker/AiTicketStatusModal";
import { AiTicketCost } from "../../resume-maker/AiTicketCost";
import type { ResumeDoc } from "../../../lib/talent/resume-doc";
import type { CoverDoc } from "../../../lib/talent/cover-doc";
import type { BasicInfo } from "../../../lib/talent/basic-info";

function resumeToText(doc: ResumeDoc | null, info: BasicInfo): string {
  if (!doc || !Array.isArray(doc.items)) return "";
  const lines: string[] = [];
  if (info.realName) lines.push(`이름: ${info.realName}`);
  if (doc.targetRole) lines.push(`지원 직무: ${doc.targetRole}`);
  for (const it of doc.items) {
    const body = [it.company, it.text].filter(Boolean).join(" ");
    if (body) lines.push(`- [${it.section}] ${body}`);
  }
  return lines.join("\n").slice(0, 8000);
}

function coverToText(doc: CoverDoc | null): string {
  if (!doc || !Array.isArray(doc.items)) return "";
  const lines: string[] = [];
  for (const it of doc.items) {
    const body = (it.text || "").trim();
    if (body) lines.push(`- [${it.question}] ${body}`);
  }
  return lines.join("\n").slice(0, 6000);
}

function jobToText(item: PublicPositionListItem): string {
  return [
    `공고: ${item.title}`,
    item.preferredJobRole ? `직무: ${item.preferredJobRole}` : "",
    item.mockInterviewIntent ? `면접 포커스: ${item.mockInterviewIntent}` : "",
    item.mainResponsibilities ? `주요 업무: ${item.mainResponsibilities}` : "",
    item.requiredQualifications ? `자격 요건: ${item.requiredQualifications}` : ""
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);
}

type Slot = { answer: string; fb: InterviewFeedback | null };

// AI 티켓 부족(서버가 402 + AiWallet 잔액 차감) 여부.
function isQuota(err: unknown): boolean {
  return !!err && typeof err === "object" && (err as { status?: number }).status === 402;
}

export function MockInterviewModal({ item, onClose }: { item?: PublicPositionListItem; onClose: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  const vp = useVisualViewport();
  const doc = useResumeDoc();
  const coverDoc = useCoverDoc();
  const info = useBasicInfo();
  const savedSelf = useSelfMock();
  const resumeText = resumeToText(doc, info);
  const coverLetterText = coverToText(coverDoc);
  const desiredJobRole = item?.preferredJobRole ?? doc?.targetRole ?? undefined;
  const isSelf = !item;

  // category: null = 유형 선택 화면. "authored"(회사 대표 질문) | 카테고리 키.
  const [category, setCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [slots, setSlots] = useState<Record<number, Slot>>({});
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const authoredQuestions = (item?.mockInterviewQuestions ?? []).filter(Boolean);
  // 공고(JD)가 있으면 '이 공고 맞춤' 카테고리 제공 — 주요업무·자격요건 근거 질문.
  const hasJd = Boolean(item?.mainResponsibilities || item?.requiredQualifications);
  // 이어가기 생성에 쓸 카테고리(회사 대표 질문 경로는 골고루).
  const genCategory = category && category !== "authored" ? category : undefined;

  // AI 티켓 — resume-maker와 동일한 지갑(AiWallet). 질문 생성 3티켓·피드백 1티켓 차감(서버).
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  function refreshUsage() {
    getAiUsage().then(setUsage).catch(() => {});
  }
  // 차감(성공 응답 직후 서버가 fire-and-forget으로 처리)이 반영될 시간을 준 뒤 전역 동기화
  // → 이 모달과 GNB 티켓 뱃지가 함께 줄어든다.
  function syncTickets() {
    if (typeof window === "undefined") return;
    window.setTimeout(() => window.dispatchEvent(new Event("aply:ai-usage-changed")), 700);
  }
  useEffect(() => {
    refreshUsage();
    const on = () => refreshUsage();
    if (typeof window !== "undefined") window.addEventListener("aply:ai-usage-changed", on);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("aply:ai-usage-changed", on);
    };
  }, []);

  // 이력서가 있거나(개인화) 공고(item)가 있으면(JD/직무 기반) 계속 새 질문을 생성할 수 있다.
  // 이력서 없이 공고만 있으면 개인 이력과 무관한 공고/직무 기반 질문이 생성된다.
  const canGenerate = !!resumeText || !!item;

  // 이미 물어본 질문(중복 회피용) + 새 질문 생성 후 중복 제거.
  async function generate(count: number, asked: string[], cat?: string): Promise<InterviewQuestion[]> {
    const qs = await aiInterviewQuestions({
      resumeText,
      coverLetterText: coverLetterText || undefined,
      jobText: item ? jobToText(item) : undefined,
      desiredJobRole,
      askedQuestions: asked,
      count,
      category: cat
    });
    const seen = new Set(asked);
    return qs.filter((q) => q.question && !seen.has(q.question));
  }

  function resetSession() {
    setQuestions(null);
    setIdx(0);
    setSlots({});
    setPrefilled(false);
    setError(null);
    setQuotaBlocked(false);
  }

  // 유형 선택 → 해당 유형 질문 생성(이때 티켓 사용). "authored"는 회사 대표 질문(무료).
  function startCategory(cat: string) {
    resetSession();
    setCategory(cat);
    if (cat === "authored") {
      setQuestions(authoredQuestions.map((q) => ({ question: q, intent: "", category: "other" })));
      setLoading(false);
      return;
    }
    setLoading(true);
    // 한 번에 하나씩 생성 — "다음 질문"마다 새로 만들며 매번 티켓을 사용한다.
    generate(1, [], cat)
      .then((qs) => {
        setQuestions(qs);
        syncTickets();
      })
      .catch((err) => {
        if (isQuota(err)) {
          setQuotaBlocked(true);
          setTicketOpen(true);
          refreshUsage();
        } else {
          setError(t("질문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.", "Couldn't load questions. Please try again shortly.", "无法加载问题，请稍后重试。", "Không thể tải câu hỏi. Vui lòng thử lại sau.", "質問を読み込めませんでした。しばらくして再試行してください。", "Gagal memuat pertanyaan. Coba lagi sebentar."));
        }
      })
      .finally(() => setLoading(false));
  }

  function backToChooser() {
    resetSession();
    setCategory(null);
    setLoading(false);
  }

  // self 모드: 저장된 답변을 한 번 프리필(이어서 보기).
  useEffect(() => {
    if (prefilled || !isSelf || !questions || !savedSelf) return;
    const next: Record<number, Slot> = {};
    questions.forEach((q, i) => {
      const saved = savedSelf.answers.find((a) => a.question === q.question);
      if (saved) {
        next[i] = {
          answer: saved.answer,
          fb: saved.feedback ?? (saved.score != null ? { score: saved.score, strengths: [], improvements: [], sampleAnswer: "" } : null)
        };
      }
    });
    if (Object.keys(next).length) setSlots(next);
    setPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, savedSelf]);

  const total = questions?.length ?? 0;
  const atLast = total > 0 && idx >= total - 1;

  function setAnswerText(i: number, v: string) {
    setSlots((prev) => ({ ...prev, [i]: { answer: v, fb: null } }));
  }

  // 다음 질문 — 남은 질문이 있으면 이동, 없으면 새로 생성해서 이어간다.
  function goNext() {
    if (!questions) return;
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
      return;
    }
    if (!canGenerate || loadingMore) return;
    setLoadingMore(true);
    const asked = questions.map((q) => q.question);
    generate(1, asked, genCategory)
      .then((more) => {
        if (!more.length) return;
        setQuestions((prev) => [...(prev ?? []), ...more]);
        setIdx((v) => v + 1);
        syncTickets();
      })
      .catch((err) => {
        if (isQuota(err)) {
          setTicketOpen(true);
          refreshUsage();
        }
      })
      .finally(() => setLoadingMore(false));
  }

  function getFeedback() {
    if (!questions) return;
    const q = questions[idx];
    const a = (slots[idx]?.answer ?? "").trim();
    if (!a || busy) return;
    setBusy(true);
    aiInterviewFeedback({ question: q.question, answer: a, resumeText: resumeText || undefined, desiredJobRole })
      .then((f) => {
        setSlots((prev) => ({ ...prev, [idx]: { answer: a, fb: f } }));
        // 저장: 공고 모의 → 회사에 노출, self 모의 → 계정에 보관.
        if (item?.id) void recordMockInterviewPractice(item.id, { question: q.question, answer: a, score: f.score }).catch(() => {});
        else saveSelfMockAnswer({ question: q.question, category: q.category, answer: a, score: f.score, feedback: f });
        syncTickets();
      })
      .catch((err) => {
        if (isQuota(err)) {
          setTicketOpen(true);
          refreshUsage();
        }
      })
      .finally(() => setBusy(false));
  }

  // 공고(item)가 있으면 이력서 없이도 진행 가능(공고/직무 기반). 자유 모의(self)만 이력서가 필요.
  const noSource = !resumeText && !item;

  return (
    <>
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" style={vp ? { top: vp.offsetTop, height: vp.height, bottom: "auto" } : undefined} onClick={onClose}>
      <div className="flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-white sm:h-[680px] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[15px] font-black tracking-[-0.02em] text-[#0B1227]"><Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" /> {t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{item ? item.title : t("내 이력서·자기소개서 기반", "Based on my resume & cover letter", "基于我的简历和自我介绍", "Dựa trên CV và thư xin việc của tôi", "私の履歴書・自己PRに基づく", "Berdasarkan resume & surat lamaran saya")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>

        {/* 외부(비-CIP) 공고 면책 — 공고 기반 연습이며 실제 회사 면접과 무관 */}
        {item && item.sourceProvider !== "INTERNAL" ? (
          <div className="border-b border-[#F6ECD6] bg-[#FFFBF3] px-5 py-2.5">
            <p className="break-keep text-[11.5px] leading-relaxed text-[#8B6D3F]">{t("공고 내용을 기반으로 한 연습이에요. 실제 이 회사의 면접 방식·질문과는 무관합니다.", "This practice is based on the job posting only — it has no connection to this company's actual interview.", "本练习仅基于职位描述，与该公司实际面试无关。", "Bài luyện này chỉ dựa trên tin tuyển dụng — không liên quan đến phỏng vấn thực tế của công ty.", "この練習は求人内容に基づくもので、実際のこの会社の面接とは関係ありません。", "Latihan ini hanya berdasarkan lowongan — tidak terkait wawancara asli perusahaan.")}</p>
          </div>
        ) : null}

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {noSource ? (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("이력서가 필요해요", "You need a resume", "需要简历", "Bạn cần một CV", "履歴書が必要です", "Anda perlu resume")}</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">{t("이력서를 만들면 그 내용에 맞춰 예상 질문을 만들어드려요.", "Create a resume and we'll generate questions based on it.", "创建简历后，我们会据此生成预测问题。", "Tạo CV và chúng tôi sẽ tạo câu hỏi dựa trên đó.", "履歴書を作ると、その内容に合わせて予想質問を作ります。", "Buat resume dan kami buat pertanyaan berdasarkan itu.")}</p>
              <Link href={talentAppRoutes.resume} className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("이력서 만들기", "Create resume", "创建简历", "Tạo CV", "履歴書を作成", "Buat resume")}</Link>
            </div>
          ) : category === null ? (
            <CategoryChooser authored={authoredQuestions.length > 0} jobBased={hasJd} onPick={startCategory} />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14">
              <CircleNotch className="h-7 w-7 animate-spin text-[#0B46E8]" weight="bold" />
              <p className="text-[13.5px] text-[#8B95A1]">{t("예상 면접 질문을 준비하고 있어요…", "Preparing your interview questions…", "正在准备预测面试问题…", "Đang chuẩn bị câu hỏi phỏng vấn…", "予想面接質問を準備しています…", "Menyiapkan pertanyaan wawancara…")}</p>
            </div>
          ) : error ? (
            <p className="py-10 text-center text-[13.5px] text-[#F04452]">{error}</p>
          ) : quotaBlocked && (!questions || total === 0) ? (
            <div className="rounded-2xl border border-dashed border-[#F3D9A9] bg-[#FFFBF3] p-8 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("AI 티켓이 부족해요", "Not enough AI tickets", "AI 券不足", "Không đủ vé AI", "AIチケットが不足しています", "Tiket AI tidak cukup")}</p>
              <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{t("모의 면접 질문 생성에는 AI 티켓이 필요해요. 코드로 충전하거나 매일 자동 충전을 기다려 주세요.", "Generating mock interview questions needs AI tickets. Recharge with a code or wait for the daily refill.", "生成模拟面试问题需要 AI 券。请用兑换码充值或等待每日自动补充。", "Tạo câu hỏi cần vé AI. Nạp bằng mã hoặc chờ nạp tự động mỗi ngày.", "模擬面接質問の生成にはAIチケットが必要です。コードでチャージするか毎日の自動チャージをお待ちください。", "Membuat pertanyaan butuh tiket AI. Isi ulang dengan kode atau tunggu isi ulang harian.")}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button type="button" onClick={backToChooser} className="inline-flex h-[44px] items-center justify-center rounded-xl bg-[#F2F4F6] px-4 text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">{t("유형 다시 고르기", "Choose type again", "重新选择类型", "Chọn lại loại", "タイプを選び直す", "Pilih tipe lagi")}</button>
                <button type="button" onClick={() => setTicketOpen(true)} className="inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("티켓 충전하기", "Recharge tickets", "充值券", "Nạp vé", "チケットをチャージ", "Isi ulang tiket")}</button>
              </div>
            </div>
          ) : !questions || total === 0 ? (
            <p className="py-10 text-center text-[13.5px] text-[#8B95A1]">{t("준비된 질문이 없어요.", "No questions available.", "没有可用的问题。", "Không có câu hỏi nào.", "準備された質問がありません。", "Tidak ada pertanyaan.")}</p>
          ) : (
            <>
              <button type="button" onClick={backToChooser} className="mb-3 -mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#8B95A1] transition hover:text-[#4E5968]">
                <CaretLeft className="h-3.5 w-3.5" weight="bold" /> {t("유형 다시 고르기", "Choose type again", "重新选择类型", "Chọn lại loại", "タイプを選び直す", "Pilih tipe lagi")}
              </button>
              <QuestionStep
                index={idx}
                q={questions[idx]}
                intentHint={item?.mockInterviewIntent && idx === 0 ? item.mockInterviewIntent : ""}
                slot={slots[idx]}
                busy={busy}
                onChange={(v) => setAnswerText(idx, v)}
                onFeedback={getFeedback}
              />
            </>
          )}
        </div>

        {/* 하단 내비 — 이전 / 다음 질문(끝이면 새로 생성) */}
        {category !== null && questions && total > 0 ? (
          <div className="flex items-center gap-2 border-t border-[#F2F4F6] px-5 py-3">
            <button
              type="button"
              onClick={() => setIdx((v) => Math.max(0, v - 1))}
              disabled={idx === 0}
              className="flex h-[46px] items-center justify-center gap-1 rounded-2xl bg-[#F2F4F6] px-4 text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-40"
            >
              <CaretLeft className="h-4 w-4" weight="bold" /> {t("이전", "Prev", "上一个", "Trước", "前へ", "Sebelum")}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={loadingMore || (atLast && !canGenerate)}
              className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] px-4 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50"
            >
              {loadingMore ? (
                <><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> {t("새 질문 생성 중…", "Generating…", "生成中…", "Đang tạo…", "生成中…", "Membuat…")}</>
              ) : atLast && canGenerate ? (
                <><Sparkle className="h-4 w-4" weight="fill" /> {t("새로운 질문 생성", "New question", "生成新问题", "Câu hỏi mới", "新しい質問を生成", "Pertanyaan baru")} <AiTicketCost feature="interview_questions" size="md" /></>
              ) : (
                <>{t("다음 질문", "Next", "下一题", "Tiếp", "次の質問", "Berikutnya")} <CaretRight className="h-4 w-4" weight="bold" /></>
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>

    {ticketOpen && usage ? (
      <AiTicketStatusModal
        remaining={usage.remaining}
        resetAt={usage.resetAt || null}
        dailyGrant={usage.dailyGrant}
        onClose={() => setTicketOpen(false)}
      />
    ) : null}
    </>
  );
}

function QuestionStep({
  index,
  q,
  intentHint,
  slot,
  busy,
  onChange,
  onFeedback
}: {
  index: number;
  q: InterviewQuestion;
  intentHint: string;
  slot: Slot | undefined;
  busy: boolean;
  onChange: (v: string) => void;
  onFeedback: () => void;
}) {
  const t = usePlatformT();
  const meta = catMeta(q.category);
  const fb = slot?.fb ?? null;
  const answer = slot?.answer ?? "";
  return (
    <div className="flex flex-col gap-3">
      {intentHint ? (
        <div className="rounded-2xl bg-[#F5F8FF] px-4 py-3">
          <p className="text-[11.5px] font-bold text-[#0B46E8]">{t("이 회사가 보려는 포인트", "What this company looks for", "该公司关注的重点", "Điều công ty này tìm kiếm", "この会社が見たいポイント", "Yang dicari perusahaan ini")}</p>
          <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#4E5968]">{intentHint}</p>
        </div>
      ) : null}

      {/* 카테고리 + 질문 */}
      <div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.badge}`}>
          {meta.emoji} {mockCategoryLabelOf(t, q.category)}
        </span>
        <p className="mt-2.5 flex items-start gap-2 break-keep text-[16px] font-bold leading-relaxed text-[#191F28]">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[11px] font-black text-[#0B46E8]">{index + 1}</span>
          <span>{q.question}</span>
        </p>
        {q.intent ? (
          <p className="mt-2 rounded-lg bg-[#F8FAFB] px-3 py-2 text-[12px] leading-relaxed text-[#8B95A1]">
            <span className="font-bold text-[#0B46E8]">💡 {t("이 질문의 의도 · ", "Why this question · ", "此问题的意图 · ", "Ý đồ câu hỏi · ", "この質問の意図 · ", "Maksud pertanyaan · ")}</span>{q.intent}
          </p>
        ) : null}
      </div>

      <textarea
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={t("답변을 적어보세요. (STAR: 상황·과제·행동·결과)", "Write your answer. (STAR: Situation, Task, Action, Result)", "写下你的回答。（STAR：情境·任务·行动·结果）", "Viết câu trả lời. (STAR: Tình huống·Nhiệm vụ·Hành động·Kết quả)", "回答を書いてください。（STAR：状況・課題・行動・結果）", "Tulis jawaban Anda. (STAR: Situasi·Tugas·Aksi·Hasil)")}
        className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[16px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
      />
      <button
        type="button"
        onClick={onFeedback}
        disabled={!answer.trim() || busy}
        className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl bg-[#0B46E8] px-3.5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-40"
      >
        <Sparkle className="h-3.5 w-3.5" weight="fill" /> {busy ? t("평가 중…", "Evaluating…", "评估中…", "Đang đánh giá…", "評価中…", "Menilai…") : fb ? t("다시 평가받기", "Re-evaluate", "重新评估", "Đánh giá lại", "再評価する", "Nilai ulang") : t("AI 피드백 받기", "Get AI feedback", "获取 AI 反馈", "Nhận phản hồi AI", "AIフィードバックを受ける", "Dapatkan umpan balik AI")}
        {!busy ? <AiTicketCost feature="interview_feedback" size="md" /> : null}
      </button>

      {fb ? <FeedbackCard fb={fb} /> : null}
    </div>
  );
}

function FeedbackCard({ fb }: { fb: InterviewFeedback }) {
  const t = usePlatformT();
  return (
    <div className="mt-1 flex flex-col gap-2.5 rounded-2xl bg-[#F8FAFB] p-4">
      {fb.improvements.length ? (
        <div>
          <p className="text-[11.5px] font-bold text-[#E8890C]">{t("개선하면 좋아요", "Areas to improve", "可改进之处", "Cần cải thiện", "改善するとよい点", "Perlu diperbaiki")}</p>
          <ul className="mt-1 flex flex-col gap-0.5">{fb.improvements.map((s, i) => <li key={i} className="break-keep text-[12.5px] text-[#4E5968]">· {s}</li>)}</ul>
        </div>
      ) : null}
      {fb.sampleAnswer ? (
        <div>
          <p className="text-[11.5px] font-bold text-[#0B46E8]">{t("모범답안(내 이력서 기반)", "Model answer (based on my resume)", "范例答案（基于我的简历）", "Câu trả lời mẫu (dựa trên CV của tôi)", "模範回答（私の履歴書に基づく）", "Jawaban model (berdasarkan resume saya)")}</p>
          <p className="mt-1 whitespace-pre-wrap break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{fb.sampleAnswer}</p>
        </div>
      ) : null}
    </div>
  );
}

function categoryDesc(t: PlatformT, c: string): string {
  switch (c) {
    case "intro":
      return t("자기소개와 지원 동기를 다듬어요", "Refine your intro and motivation", "打磨自我介绍与应聘动机", "Trau chuốt giới thiệu và động lực", "自己紹介と志望動機を磨きます", "Poles perkenalan dan motivasi");
    case "competency":
      return t("직무 역량·문제 해결을 점검해요", "Check job skills and problem-solving", "检验岗位能力与问题解决", "Kiểm tra năng lực và giải quyết vấn đề", "職務能力・問題解決を確認します", "Cek kompetensi dan pemecahan masalah");
    case "experience":
      return t("구체적 경험을 깊이 파고들어요", "Dig deep into specific experiences", "深入挖掘具体经历", "Đào sâu kinh nghiệm cụ thể", "具体的な経験を深掘りします", "Gali pengalaman spesifik");
    case "weakness":
      return t("약점·상황 대처를 연습해요", "Practice weaknesses and handling situations", "练习弱点与情境应对", "Luyện điểm yếu và xử lý tình huống", "弱点・状況対応を練習します", "Latih kelemahan dan penanganan situasi");
    default:
      return "";
  }
}

// 유형 선택 화면 — 고른 유형에 맞춰 질문을 생성한다(생성 시 티켓 사용).
function CategoryChooser({ authored, jobBased, onPick }: { authored: boolean; jobBased?: boolean; onPick: (cat: string) => void }) {
  const t = usePlatformT();
  const cats = CATEGORY_ORDER.filter((c) => c !== "other");
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[16px] font-black tracking-[-0.02em] text-[#0B1227]">{t("어떤 유형으로 연습할까요?", "Which type would you like to practice?", "想练习哪种类型？", "Bạn muốn luyện loại nào?", "どのタイプで練習しますか？", "Tipe apa yang ingin dilatih?")}</p>
        <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("고른 유형에 맞춰 예상 질문을 만들어드려요. 이력서가 있으면 내 경험에 맞춰, 없으면 공고·직무 기반으로 만들어요. 유형은 언제든 다시 고를 수 있어요.", "We'll create questions for your chosen type. With a resume we tailor to your experience; without one, we base them on the posting and role. You can switch types anytime.", "我们会按所选类型生成问题。有简历则按你的经历定制，没有则基于职位与岗位生成。类型可随时更换。", "Chúng tôi tạo câu hỏi theo loại bạn chọn. Có CV thì cá nhân hóa; không có thì dựa trên tin tuyển dụng và vị trí. Có thể đổi loại bất cứ lúc nào.", "選んだタイプで質問を作成します。履歴書があれば経験に合わせ、なければ求人・職務に基づいて作ります。タイプはいつでも変更できます。", "Kami buat pertanyaan sesuai tipe. Dengan resume disesuaikan pengalaman; tanpa itu berdasarkan lowongan dan peran. Ganti tipe kapan saja.")}</p>
      </div>
      {jobBased ? (
        <button type="button" onClick={() => onPick("job")} className="flex items-center gap-3.5 rounded-2xl border border-[#CFE0FF] bg-[#F5F8FF] p-4 text-left transition hover:border-[#0B46E8]/50">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[20px] shadow-[0_2px_10px_rgba(11,70,232,0.1)]" aria-hidden>📌</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-[#191F28]">{t("이 공고 맞춤 질문", "Tailored to this posting", "针对该职位的问题", "Câu hỏi theo tin tuyển dụng", "この求人に特化した質問", "Pertanyaan sesuai lowongan")}</p>
            <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("공고의 주요 업무·자격 요건에 근거한 질문으로 연습해요.", "Practice with questions based on the posting's responsibilities and requirements.", "根据职位的主要职责与任职要求练习。", "Luyện với câu hỏi dựa trên nhiệm vụ và yêu cầu của tin tuyển dụng.", "求人の主な業務・応募要件に基づく質問で練習します。", "Latih dengan pertanyaan berdasarkan tugas dan syarat lowongan.")}</p>
          </div>
          <AiTicketCost feature="interview_questions" tone="muted" size="md" />
        </button>
      ) : null}
      {authored ? (
        <button type="button" onClick={() => onPick("authored")} className="flex items-center gap-3.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4 text-left transition hover:border-[#0B46E8]/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[20px] shadow-[0_2px_10px_rgba(11,70,232,0.1)]" aria-hidden>🏢</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-[#191F28]">{t("이 회사 대표 질문", "This company's key questions", "该公司代表性问题", "Câu hỏi tiêu biểu của công ty", "この会社の代表質問", "Pertanyaan utama perusahaan ini")}</p>
            <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("회사가 준비한 질문으로 연습해요.", "Practice with questions the company prepared.", "用公司准备的问题练习。", "Luyện với câu hỏi công ty chuẩn bị.", "会社が用意した質問で練習します。", "Latihan dengan pertanyaan dari perusahaan.")}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#E7F8EF] px-2 py-1 text-[11px] font-bold text-[#0A9B59]">{t("무료", "Free", "免费", "Miễn phí", "無料", "Gratis")}</span>
        </button>
      ) : null}
      {cats.map((c) => {
        const m = catMeta(c);
        return (
          <button key={c} type="button" onClick={() => onPick(c)} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 text-left transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[20px] ${m.badge}`} aria-hidden>{m.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold text-[#191F28]">{mockCategoryLabelOf(t, c)}</p>
              <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{categoryDesc(t, c)}</p>
            </div>
            <AiTicketCost feature="interview_questions" tone="muted" size="md" />
          </button>
        );
      })}
    </div>
  );
}
