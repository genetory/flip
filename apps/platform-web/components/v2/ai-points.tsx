"use client";

// AI 포인트(v2) — 잔액 칩(헤더·에디터 상단) · 잔액 카드 · 한 줄 · 버튼 옆 비용 표시 · 충전 시트(토스 결제위젯).
// 서버가 AI_POINTS_ENABLED 를 켜야(enabled) 보인다 — 꺼져 있으면 모두 아무것도 그리지 않는다(지금처럼).
// 충전 시트는 app/v2/layout 에 하나(PointsPaywallHost) — 어디서든 openPointsPaywall() 또는 402 AI_POINTS_REQUIRED 로 열린다.
// 화면 문구에 '무료'는 쓰지 않는다(가입 보너스 안내만 예외).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet } from "./sheets";
import { Button, Spinner } from "./ui";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { createPaymentOrder } from "../../lib/interview-credits";
import { formatPoints, onPointsConfirm, onPointsPaywall, redeemPointCode, refreshAiPoints, useAiCost, useAiPoints, type AiPointProduct, type PointsConfirmRequest, type RedeemError } from "../../lib/ai-points";
import { useToast } from "../toast/ToastProvider";
import { CLIENT_KEY, COUPON, PayAppFields, goPayApp, loadToss, payMode, savedPhone, validPhone, type TossWidgets } from "./interview-paywall";

export const PAYMENTS_HREF = "/talent/payments";

/** 포인트 내역 사유(서버 reason) → 사람이 읽는 이름. 기능 키는 기능 이름으로. */
export function pointReasonLabel(t: PlatformT, r: string): string {
  const L: Record<string, [string, string, string, string, string, string]> = {
    welcome: ["가입 보너스", "Sign-up bonus", "注册奖励", "Thưởng đăng ký", "登録ボーナス", "Bonus daftar"],
    daily: ["매일 적립", "Daily points", "每日积分", "Điểm hằng ngày", "毎日ポイント", "Poin harian"],
    coupon: ["코드 등록", "Code redeemed", "兑换码", "Nhập mã", "コード登録", "Tukar kode"],
    purchase: ["충전", "Top-up", "充值", "Nạp điểm", "チャージ", "Isi ulang"],
    refund: ["환불", "Refund", "退款", "Hoàn tiền", "返金", "Refund"],
    ops_grant: ["운영자 지급", "Granted", "运营发放", "Được tặng", "運営付与", "Diberikan"],
    growth_bonus: ["이벤트 선물", "Gift", "活动赠送", "Quà tặng", "プレゼント", "Hadiah"],
    interview_credit_convert: ["면접 이용권 전환", "Passes converted", "使用券转换", "Đổi vé phỏng vấn", "チケット変換", "Konversi tiket"],
    import_resume: ["이력서 가져오기", "Resume import", "导入简历", "Nhập CV", "履歴書取り込み", "Impor CV"],
    import_cover_letter: ["자기소개서 가져오기", "Cover letter import", "导入自我介绍", "Nhập thư", "自己紹介書取り込み", "Impor surat"],
    interview_questions: ["면접 질문 만들기", "Interview questions", "生成面试问题", "Tạo câu hỏi", "面接質問作成", "Buat pertanyaan"],
    interview_prep: ["면접 예상 질문·답안", "Interview prep", "面试预测与答案", "Chuẩn bị phỏng vấn", "面接対策", "Persiapan wawancara"],
    interview_feedback: ["면접 답변 피드백", "Answer feedback", "回答反馈", "Phản hồi câu trả lời", "回答フィードバック", "Umpan balik jawaban"],
    tailor_analyze: ["공고 맞춤 분석", "Job match analysis", "职位匹配分析", "Phân tích tin tuyển", "求人マッチ分析", "Analisis lowongan"],
    draft_intro: ["자기소개 초안", "Intro draft", "自我介绍草稿", "Nháp giới thiệu", "自己紹介の下書き", "Draf perkenalan"],
    generate_english_intro: ["영문 자기소개", "English intro", "英文自我介绍", "Giới thiệu tiếng Anh", "英文自己紹介", "Perkenalan Inggris"],
    cover_letter: ["자기소개서 AI 작성", "AI cover letter", "AI 撰写自我介绍", "AI viết thư", "AI自己紹介書", "Surat oleh AI"],
    review_resume: ["이력서 AI 점검", "Resume AI check", "简历 AI 检查", "AI kiểm tra CV", "履歴書AIチェック", "Cek CV AI"],
    review_cover: ["자기소개서 AI 점검", "Cover letter AI check", "自我介绍 AI 检查", "AI kiểm tra thư", "自己紹介書AIチェック", "Cek surat AI"],
    polish_resume_items: ["이력서 문장 정리", "Resume polish", "简历整理", "Chỉnh văn CV", "履歴書体に整える", "Rapikan CV"],
    draft_resume_text: ["이력서 문장 만들기", "Resume text draft", "生成简历文字", "Tạo văn CV", "履歴書文の作成", "Buat teks CV"],
    experience_interview: ["경험 정리 질문", "Experience questions", "经历梳理提问", "Câu hỏi kinh nghiệm", "経験の質問", "Tanya pengalaman"],
    experience_bullets: ["경험 문장 만들기", "Experience bullets", "生成经历要点", "Tạo ý kinh nghiệm", "経験の文作成", "Poin pengalaman"],
    experience_title: ["경험 제목 만들기", "Experience title", "生成经历标题", "Tiêu đề kinh nghiệm", "経験タイトル", "Judul pengalaman"],
    experience_tasks: ["주요 업무 정리", "Key tasks", "整理主要工作", "Việc chính", "主な業務", "Tugas utama"],
    polish_intro: ["AI 다듬기", "AI polish", "AI 润色", "AI chỉnh câu", "AIで整える", "Poles AI"],
    polish_experience: ["경력 문장 다듬기", "Experience polish", "润色经历", "Chỉnh kinh nghiệm", "経験文を整える", "Poles pengalaman"],
    summarize_intro: ["자기소개 요약", "Intro summary", "自我介绍摘要", "Tóm tắt giới thiệu", "自己紹介の要約", "Ringkas perkenalan"],
    suggest_skills: ["스킬 추천", "Skill suggestions", "技能推荐", "Gợi ý kỹ năng", "スキル提案", "Saran keahlian"],
    translate_texts: ["번역", "Translation", "翻译", "Dịch", "翻訳", "Terjemahan"],
    role_checklist: ["직무 요건 비교", "Role checklist", "职位要求对比", "So sánh yêu cầu", "職務要件の比較", "Cek syarat peran"],
    import_job: ["공고 가져오기", "Job import", "导入职位", "Nhập tin tuyển", "求人取り込み", "Impor lowongan"],
    career_strengths: ["강점 찾기", "Strengths", "优势分析", "Tìm điểm mạnh", "強み分析", "Cari kekuatan"]
  };
  const l = L[r];
  return l ? t(...l) : t("AI 기능", "AI feature", "AI 功能", "Tính năng AI", "AI機能", "Fitur AI");
}

/** 비용 배지 — 버튼 글자 오른쪽의 작은 알약 "20P". 버튼 색을 따라 옅게, 잔액이 모자라면 빨갛게. */
export function CostBadge({ cost, className }: { cost: number; className?: string }) {
  const p = useAiPoints();
  if (!p?.enabled || !cost) return null;
  const short = p.balance < cost;
  return (
    <span
      aria-label={`${formatPoints(cost)}`}
      className={`ml-1.5 inline-flex h-5 min-w-[36px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2 text-center text-[11px] font-bold tabular-nums leading-none ${short ? "bg-[#f04452] text-white" : "bg-[color-mix(in_srgb,currentColor_14%,transparent)]"} ${className ?? ""}`}
    >
      {formatPoints(cost)}
    </span>
  );
}

/** 기능 키로 비용 배지 — 포인트가 꺼져 있으면 아무것도 그리지 않는다. */
export function CostTag({ feature, times = 1, className }: { feature: string; times?: number; className?: string }) {
  const cost = useAiCost(feature);
  if (!cost) return null;
  return <CostBadge cost={cost * Math.max(1, times)} className={className} />;
}

/** 쓰기 전 확인 창(30P 이상) — spendGate() 신호를 받아 연다. v2 레이아웃에 하나. */
export function PointsConfirmHost() {
  const t = usePlatformT();
  const p = useAiPoints();
  const [req, setReq] = useState<PointsConfirmRequest | null>(null);
  useEffect(() => onPointsConfirm((r) => setReq(r)), []);
  if (!req) return null;
  const close = (ok: boolean) => {
    req.resolve(ok);
    setReq(null);
  };
  const balance = p?.balance ?? 0;
  return (
    <Sheet
      title={t(`${formatPoints(req.cost)}를 써요`, `This uses ${formatPoints(req.cost)}`, `将使用 ${formatPoints(req.cost)}`, `Sẽ dùng ${formatPoints(req.cost)}`, `${formatPoints(req.cost)}を使います`, `Memakai ${formatPoints(req.cost)}`)}
      subtitle={req.label}
      onClose={() => close(false)}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="neutral" full onClick={() => close(false)}>
            {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
          </Button>
          <Button full onClick={() => close(true)}>
            {t("쓰고 시작하기", "Use & start", "使用并开始", "Dùng & bắt đầu", "使って始める", "Pakai & mulai")}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between rounded-2xl bg-[color:var(--v2-band)] px-4 py-4 text-[15px]">
        <span className="text-[color:var(--v2-ink-3)]">{t("지금 잔액", "Balance now", "当前余额", "Số dư hiện tại", "現在の残高", "Saldo sekarang")}</span>
        <span className="font-bold tabular-nums text-[color:var(--v2-ink)]">
          {formatPoints(balance)} <span className="font-semibold text-[color:var(--v2-muted)]">→ {formatPoints(Math.max(0, balance - req.cost))}</span>
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-[1.6] text-[color:var(--v2-muted)]">
        {t("성공했을 때만 빠져나가요. 실패하면 그대로 돌려드려요.", "Points are only used if it succeeds — otherwise nothing is charged.", "仅在成功时扣除，失败不扣。", "Chỉ trừ khi thành công; thất bại thì không trừ.", "成功したときだけ消費し、失敗したら戻ります。", "Hanya dipotong jika berhasil.")}
      </p>
    </Sheet>
  );
}

/** 헤더·에디터 상단의 잔액 칩 — 쿠폰 그림 + "1,230P", 누르면 포인트·결제 내역. 로그인 + 포인트 켜짐일 때만. */
export function PointsChip({ className }: { className?: string }) {
  const t = usePlatformT();
  const { isAuthenticated } = useAuthSession();
  const pts = useAiPoints(isAuthenticated);
  if (!isAuthenticated || !pts?.enabled) return null;
  return (
    <Link
      href={PAYMENTS_HREF}
      aria-label={t(`AI 포인트 ${formatPoints(pts.balance)}`, `AI points ${formatPoints(pts.balance)}`, `AI 积分 ${formatPoints(pts.balance)}`, `Điểm AI ${formatPoints(pts.balance)}`, `AIポイント ${formatPoints(pts.balance)}`, `Poin AI ${formatPoints(pts.balance)}`)}
      className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[color:var(--v2-accent-weak)] px-3 text-[13px] font-bold tabular-nums text-[color:var(--v2-accent)] transition hover:opacity-80 min-[360px]:pl-2.5 min-[360px]:pr-3.5 ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 쿠폰 그림(흰 바탕 → 곱하기 합성) */}
      <img src={COUPON} alt="" aria-hidden className="hidden h-5 w-5 shrink-0 object-contain mix-blend-multiply min-[360px]:block" />
      {formatPoints(pts.balance)}
    </Link>
  );
}

/**
 * 포인트 코드 등록 — 쿠폰·리딤·이벤트 코드를 넣으면 그 포인트가 바로 충전된다.
 * fromUrl: 이벤트 링크(/talent/payments?code=XXXX)로 들어오면 칸을 미리 채운다(등록은 사용자가 누른다). 포인트 상태를 불러온 뒤에만 그려져 서버 렌더와 어긋나지 않는다.
 */
export function RedeemCodeBox({ t, fromUrl = false, autoFocus = false }: { t: PlatformT; fromUrl?: boolean; autoFocus?: boolean }) {
  const toast = useToast();
  const [code, setCode] = useState(() => (fromUrl && typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("code") ?? "").trim().toUpperCase().slice(0, 40) : ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RedeemError | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const clean = code.trim().toUpperCase().replace(/\s+/g, "");
  const msg: Record<RedeemError, string> = {
    invalid: t("없는 코드예요. 다시 확인해 주세요.", "That code doesn't exist. Please check it.", "兑换码无效，请再确认。", "Mã không tồn tại. Hãy kiểm tra lại.", "存在しないコードです。ご確認ください。", "Kode tidak ada. Periksa lagi."),
    expired: t("기간이 끝난 코드예요.", "This code has expired.", "该兑换码已过期。", "Mã đã hết hạn.", "期限切れのコードです。", "Kode sudah kedaluwarsa."),
    already: t("이미 등록한 코드예요.", "You've already used this code.", "你已使用过该兑换码。", "Bạn đã dùng mã này.", "登録済みのコードです。", "Kode ini sudah dipakai."),
    group: t("이 이벤트 코드는 한 번만 등록할 수 있어요.", "Only one code per event.", "每个活动只能兑换一次。", "Mỗi sự kiện chỉ nhập 1 mã.", "このイベントのコードは1回だけです。", "Satu kode per acara."),
    exhausted: t("모두 사용된 코드예요.", "This code has been fully used.", "该兑换码已被领完。", "Mã đã hết lượt.", "使い切られたコードです。", "Kode sudah habis."),
    busy: t("잠시 후 다시 해 주세요.", "Please try again shortly.", "请稍后再试。", "Vui lòng thử lại sau.", "少し後でお試しください。", "Coba lagi sebentar."),
    unknown: t("등록하지 못했어요. 잠시 후 다시 해 주세요.", "Couldn't redeem. Try again soon.", "兑换失败，请稍后再试。", "Không nhập được. Thử lại sau.", "登録できませんでした。", "Gagal menukar. Coba lagi.")
  };
  const submit = async () => {
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    setDone(null);
    const r = await redeemPointCode(clean);
    setBusy(false);
    if (r.ok) {
      setDone(r.points);
      setCode("");
      toast.success(t(`${formatPoints(r.points)} 충전됐어요`, `${formatPoints(r.points)} added`, `已充值 ${formatPoints(r.points)}`, `Đã nạp ${formatPoints(r.points)}`, `${formatPoints(r.points)} チャージしました`, `${formatPoints(r.points)} ditambahkan`));
    } else setError(r.error);
  };
  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          autoFocus={autoFocus}
          maxLength={40}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label={t("포인트 코드", "Point code", "积分兑换码", "Mã điểm", "ポイントコード", "Kode poin")}
          placeholder={t("코드 입력", "Enter code", "输入兑换码", "Nhập mã", "コードを入力", "Masukkan kode")}
          className={`h-12 min-w-0 flex-1 rounded-xl bg-[color:var(--v2-fill)] px-4 text-[16px] font-semibold uppercase tracking-[0.06em] text-[color:var(--v2-ink)] outline-none ring-1 transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2 focus:ring-[color:var(--v2-accent)] ${error ? "ring-[#f04452]" : "ring-transparent"}`}
        />
        <button
          type="submit"
          disabled={!clean || busy}
          className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-ink)] px-5 text-[15px] font-bold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? <Spinner /> : null}
          {t("등록", "Redeem", "兑换", "Nhập", "登録", "Tukar")}
        </button>
      </form>
      {error ? <p className="mt-2 px-1 text-[13px] text-[#f04452]">{msg[error]}</p> : null}
      {done != null ? (
        <p className="mt-2 px-1 text-[13px] font-semibold text-[color:var(--v2-accent)]">
          {t(`${formatPoints(done)}가 충전됐어요.`, `${formatPoints(done)} added to your balance.`, `已充值 ${formatPoints(done)}。`, `Đã nạp ${formatPoints(done)}.`, `${formatPoints(done)}がチャージされました。`, `${formatPoints(done)} ditambahkan.`)}
        </p>
      ) : null}
    </div>
  );
}

/** 잔액 카드 — 모의 면접 이용권 카드와 같은 결(연파랑 + 쿠폰 그림 + 티켓 홈). */
export function PointsTicket({ t, balance, onTopUp, note, dailyGrant, feedbackCost }: { t: PlatformT; balance: number | null; onTopUp?: () => void; note?: string; dailyGrant?: number; feedbackCost?: number }) {
  const empty = balance !== null && balance <= 0;
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-[color:var(--v2-accent-weak)] px-6 pb-5 pt-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- 쿠폰 그림(흰 바탕 → 곱하기 합성) */}
      <img src={COUPON} alt="" aria-hidden className="pointer-events-none absolute -right-3 -top-2 h-[124px] w-[124px] object-contain mix-blend-multiply" style={{ maskImage: "radial-gradient(closest-side, #000 72%, transparent 100%)", WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent 100%)" }} />
      <p className="relative text-[13px] font-bold text-[color:var(--v2-accent)]">{t("AI 포인트", "AI points", "AI 积分", "Điểm AI", "AIポイント", "Poin AI")}</p>
      <p className="relative mt-3 flex items-baseline gap-1">
        <span className={`text-[48px] font-extrabold leading-none tracking-[-0.04em] tabular-nums ${empty ? "text-[color:var(--v2-faint)]" : "text-[color:var(--v2-ink)]"}`}>{balance === null ? "…" : balance.toLocaleString("en-US")}</span>
        <span className="text-[20px] font-bold text-[color:var(--v2-ink-3)]">P</span>
      </p>
      <div aria-hidden className="relative -mx-6 mt-5 flex items-center">
        <span className="-ml-2.5 h-5 w-5 shrink-0 rounded-full bg-white" />
        <span className="mx-3 flex-1 border-t-2 border-dashed border-white" />
        <span className="-mr-2.5 h-5 w-5 shrink-0 rounded-full bg-white" />
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        {empty || note ? (
          <span className="min-w-0 text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">
            {empty ? t("다 썼어요. 충전하면 바로 이어서 써요.", "All used. Top up to keep going.", "已用完，充值后即可继续。", "Đã hết. Nạp để dùng tiếp.", "使い切りました。チャージで続けられます。", "Habis. Isi ulang untuk lanjut.") : note}
          </span>
        ) : (
          <span className="flex min-w-0 gap-5">
            {dailyGrant ? (
              <span>
                <span className="block text-[11px] font-semibold text-[color:var(--v2-muted)]">{t("매일 적립", "Daily", "每日", "Hằng ngày", "毎日", "Harian")}</span>
                <span className="mt-0.5 block text-[15px] font-bold tabular-nums text-[color:var(--v2-ink)]">+{formatPoints(dailyGrant)}</span>
              </span>
            ) : null}
            {feedbackCost ? (
              <span>
                <span className="block whitespace-nowrap text-[11px] font-semibold text-[color:var(--v2-muted)]">{t("면접 답변 1개", "1 answer", "1 个回答", "1 câu trả lời", "回答1個", "1 jawaban")}</span>
                <span className="mt-0.5 block text-[15px] font-bold tabular-nums text-[color:var(--v2-ink)]">{formatPoints(feedbackCost)}</span>
              </span>
            ) : null}
          </span>
        )}
        {onTopUp ? (
          <button type="button" onClick={onTopUp} className="h-10 shrink-0 whitespace-nowrap rounded-full bg-[color:var(--v2-accent)] px-5 text-[14px] font-bold text-white transition hover:opacity-90 active:scale-[0.98]">
            {t("충전하기", "Top up", "充值", "Nạp thêm", "チャージ", "Isi ulang")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** 잔액 한 줄 — 좁은 자리에. "AI 포인트 1,230P · 충전하기 ›" (+ 작은 설명). */
export function PointsLine({ t, balance, hint, onTopUp }: { t: PlatformT; balance: number; hint?: string; onTopUp: () => void }) {
  const empty = balance <= 0;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- 쿠폰 그림(흰 바탕 → 곱하기 합성) */}
      <img src={COUPON} alt="" aria-hidden className="hidden h-11 w-11 shrink-0 object-contain mix-blend-multiply min-[360px]:block" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-[color:var(--v2-muted)]">
          {t("AI 포인트", "AI points", "AI 积分", "Điểm AI", "AIポイント", "Poin AI")}
          {hint ? <span className="font-medium"> · {hint}</span> : null}
        </span>
        <span className={`block text-[16px] font-bold leading-[1.35] tabular-nums ${empty ? "text-[color:var(--v2-muted)]" : "text-[color:var(--v2-ink)]"}`}>{formatPoints(balance)}</span>
      </span>
      <button type="button" onClick={onTopUp} className="shrink-0 whitespace-nowrap text-[14px] font-semibold text-[color:var(--v2-accent)] transition hover:opacity-70">
        {t("충전하기", "Top up", "充值", "Nạp", "チャージ", "Isi")} ›
      </button>
    </div>
  );
}

/** 충전 시트 호스트 — v2 레이아웃에 하나. */
export function PointsPaywallHost() {
  const { isAuthenticated } = useAuthSession();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => onPointsPaywall((r) => setOpen(r)), []);
  if (!open || !isAuthenticated) return null;
  return <PointsPaywallSheet onClose={() => setOpen(null)} />;
}

function PointsPaywallSheet({ onClose }: { onClose: () => void }) {
  const t = usePlatformT();
  const pathname = usePathname() ?? PAYMENTS_HREF;
  const { user } = useAuthSession();
  const pts = useAiPoints();
  const [pick, setPick] = useState<AiPointProduct | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgets = useRef<TossWidgets | null>(null);
  const mode = payMode(pts?.paymentsEnabled, pts?.paymentProvider);
  const payable = mode !== null;
  const [phone, setPhone] = useState(savedPhone);
  const products = pts?.products ?? [];
  const product = pick ?? products.find((p) => p.badge === "popular") ?? products[0] ?? null;
  const feedbackCost = pts?.costs.interview_feedback ?? 0;

  useEffect(() => {
    void refreshAiPoints();
  }, []);

  // 결제위젯 — 처음 한 번만 만들고(같은 자리에 두 번 그리면 오류), 상품을 바꾸면 금액만 바꾼다.
  const amount = product?.amount ?? 0;
  const userId = user?.id ?? null;
  const init = useRef<Promise<TossWidgets> | null>(null);
  useEffect(() => {
    if (mode !== "toss" || !amount || !userId) return;
    let alive = true;
    (async () => {
      try {
        init.current ??= (async () => {
          const Toss = await loadToss();
          const w = Toss(CLIENT_KEY).widgets({ customerKey: `u-${userId}` });
          await w.setAmount({ currency: "KRW", value: amount });
          await Promise.all([w.renderPaymentMethods({ selector: "#toss-payment-method", variantKey: "DEFAULT" }), w.renderAgreement({ selector: "#toss-agreement", variantKey: "AGREEMENT" })]);
          return w;
        })();
        const w = await init.current;
        await w.setAmount({ currency: "KRW", value: amount });
        widgets.current = w;
        if (alive) setReady(true);
      } catch (e) {
        console.warn("[toss] widget failed", e);
        if (alive) setError(t("결제 화면을 불러오지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't load the payment screen. Try again soon.", "无法加载支付页面，请稍后再试。", "Không tải được trang thanh toán.", "決済画面を読み込めませんでした。", "Gagal memuat halaman pembayaran."));
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, amount, userId, t]);

  const pay = async () => {
    if (!product) return;
    if (mode === "payapp") {
      setBusy(true);
      setError(null);
      try {
        await goPayApp(product.key, phone, pathname);
      } catch (e) {
        setError((e as { message?: string })?.message || t("결제를 시작하지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't start the payment. Try again soon.", "无法开始支付，请稍后再试。", "Không bắt đầu thanh toán được.", "決済を開始できませんでした。", "Gagal memulai pembayaran."));
        setBusy(false);
      }
      return;
    }
    if (!widgets.current) return;
    setBusy(true);
    setError(null);
    try {
      const order = await createPaymentOrder(product.key);
      const back = encodeURIComponent(pathname);
      await widgets.current.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${window.location.origin}/v2/payments/success?back=${back}`,
        failUrl: `${window.location.origin}/v2/payments/fail?back=${back}`,
        customerEmail: user?.email ?? undefined,
        customerName: user?.realName || user?.name || undefined
      });
    } catch (e) {
      if ((e as { code?: string })?.code !== "USER_CANCEL") setError(t("결제를 시작하지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't start the payment. Try again soon.", "无法开始支付，请稍后再试。", "Không bắt đầu thanh toán được.", "決済を開始できませんでした。", "Gagal memulai pembayaran."));
    } finally {
      setBusy(false);
    }
  };

  // 할인율 — 가장 작은 상품의 1P 가격 대비.
  const base = products[0] ? products[0].amount / products[0].total : 0;
  const days = pts?.refundDays ?? 7;
  return (
    <Sheet
      tall
      title={t("AI 포인트 충전", "Top up AI points", "充值 AI 积分", "Nạp điểm AI", "AIポイントをチャージ", "Isi poin AI")}
      subtitle={t("이력서·자기소개서·모의 면접 AI에 함께 써요", "One balance for resume, cover letter & interview AI", "简历、自我介绍、模拟面试 AI 通用", "Dùng chung cho AI CV, thư & phỏng vấn", "履歴書・自己紹介書・模擬面接のAIに共通", "Satu saldo untuk AI CV, surat & wawancara")}
      onClose={onClose}
      footer={
        payable ? (
          <Button full onClick={() => void pay()} disabled={(mode === "payapp" ? !validPhone(phone) : !ready) || busy || !product}>
            {busy ? <Spinner /> : null}
            {product ? t(`${product.amount.toLocaleString()}원 결제하기`, `Pay ₩${product.amount.toLocaleString()}`, `支付 ₩${product.amount.toLocaleString()}`, `Thanh toán ₩${product.amount.toLocaleString()}`, `₩${product.amount.toLocaleString()} を支払う`, `Bayar ₩${product.amount.toLocaleString()}`) : t("결제하기", "Pay", "支付", "Thanh toán", "支払う", "Bayar")}
          </Button>
        ) : undefined
      }
    >
      <PointsTicket
        t={t}
        balance={pts ? pts.balance : null}
        note={t(`쓴 만큼만 줄어요. 충전한 포인트를 그대로 갖고 있으면 ${days}일 안에 환불돼요.`, `Only what you use is deducted. Unused top-ups can be refunded within ${days} days.`, `按使用扣除。充值积分未使用可在 ${days} 天内退款。`, `Chỉ trừ khi dùng. Chưa dùng có thể hoàn trong ${days} ngày.`, `使った分だけ減ります。未使用なら${days}日以内に返金できます。`, `Berkurang saat dipakai. Bisa refund ${days} hari jika belum dipakai.`)}
      />

      <p className="mt-6 text-[17px] font-bold text-[color:var(--v2-ink)]">{t("얼마나 충전할까요?", "How much?", "充值多少？", "Nạp bao nhiêu?", "いくらチャージしますか？", "Berapa banyak?")}</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {products.map((p) => {
          const on = product?.key === p.key;
          const off = base ? Math.round((1 - p.amount / p.total / base) * 100) : 0;
          const answers = feedbackCost ? Math.floor(p.total / feedbackCost) : 0;
          return (
            <button key={p.key} type="button" onClick={() => setPick(p)} aria-pressed={on} className={`relative flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${on ? "bg-white ring-2 ring-[color:var(--v2-accent)] shadow-[0_8px_24px_-12px_rgba(11,70,232,0.35)]" : "bg-[color:var(--v2-fill)] hover:bg-[color:var(--v2-band)]"}`}>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[17px] font-bold tabular-nums text-[color:var(--v2-ink)]">{formatPoints(p.total)}</span>
                  {p.badge === "popular" ? <span className="rounded-full bg-[color:var(--v2-accent-weak)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--v2-accent)]">{t("인기", "Popular", "热门", "Phổ biến", "人気", "Populer")}</span> : null}
                  {p.badge === "best" ? <span className="rounded-full bg-[color:var(--v2-ink)] px-2 py-0.5 text-[11px] font-bold text-white">{t("가장 알뜰", "Best value", "最划算", "Tiết kiệm nhất", "一番お得", "Paling hemat")}</span> : null}
                </span>
                <span className="mt-0.5 block whitespace-nowrap text-[13px] text-[color:var(--v2-muted)]">
                  {p.bonus > 0 ? (
                    <span className="font-semibold text-[color:var(--v2-accent)]">{t(`보너스 +${formatPoints(p.bonus)}`, `+${formatPoints(p.bonus)} bonus`, `赠送 +${formatPoints(p.bonus)}`, `Thưởng +${formatPoints(p.bonus)}`, `ボーナス +${formatPoints(p.bonus)}`, `Bonus +${formatPoints(p.bonus)}`)}</span>
                  ) : (
                    t("기본", "Basic", "基础", "Cơ bản", "ベーシック", "Dasar")
                  )}
                  {/* 좁은 화면(320)에선 답변 개수를 숨겨 한 줄로 */}
                  {answers ? <span className="hidden min-[360px]:inline"> · {t(`면접 답변 ${answers}개`, `${answers} answers`, `${answers} 个回答`, `${answers} câu`, `回答${answers}個`, `${answers} jawaban`)}</span> : null}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {off > 0 ? <span className="block text-[12px] font-bold text-[color:var(--v2-attention)]">{off}% {t("할인", "off", "优惠", "giảm", "お得", "hemat")}</span> : null}
                <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t(`${p.amount.toLocaleString()}원`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`)}</span>
              </span>
            </button>
          );
        })}
      </div>
      {product && pts ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-fill)] px-3 py-2.5 text-[14px] text-[color:var(--v2-ink-3)]">
          {t("충전하면", "After top-up", "充值后", "Sau khi nạp", "チャージ後", "Setelah isi")} <span aria-hidden>→</span> <b className="tabular-nums text-[color:var(--v2-ink)]">{formatPoints(pts.balance + product.total)}</b>
        </p>
      ) : null}

      {mode === "payapp" ? (
        <PayAppFields t={t} phone={phone} onPhone={setPhone} />
      ) : mode === "toss" ? (
        <div className="mt-5">
          <div id="toss-payment-method" />
          <div id="toss-agreement" />
          {!ready && !error ? (
            <div className="flex justify-center py-6 text-[color:var(--v2-muted)]">
              <Spinner />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3 text-[14px] leading-[1.55] text-[color:var(--v2-muted)]">{t("결제를 준비하고 있어요. 조금만 기다려 주세요.", "Payments are coming soon.", "支付功能即将上线。", "Thanh toán sắp ra mắt.", "決済は準備中です。", "Pembayaran segera hadir.")}</p>
      )}
      {error ? <p className="mt-3 text-[14px] text-[color:var(--v2-attention)]">{error}</p> : null}
      <SheetCodeToggle t={t} />
      <Link href={PAYMENTS_HREF} onClick={onClose} className="mt-4 inline-block text-[13px] font-semibold text-[color:var(--v2-muted)] underline underline-offset-2">
        {t("포인트·결제 내역 보기", "See points & payments", "查看积分·支付记录", "Xem điểm & thanh toán", "ポイント・決済履歴を見る", "Lihat poin & pembayaran")}
      </Link>
      <p className="mt-4 text-[12px] leading-[1.6] text-[color:var(--v2-faint)]">
        {pts?.daily.grant
          ? t(`매일 접속하면 +${formatPoints(pts.daily.grant)}(${formatPoints(pts.daily.cap)}까지). 오늘의 질문은 하루 1번 포인트 없이 답할 수 있어요.`, `Visit each day for +${formatPoints(pts.daily.grant)} (up to ${formatPoints(pts.daily.cap)}). Today's question can be answered once a day without points.`, `每天登录 +${formatPoints(pts.daily.grant)}（最多 ${formatPoints(pts.daily.cap)}）。今日问题每天可不扣积分回答 1 次。`, `Vào mỗi ngày +${formatPoints(pts.daily.grant)} (tối đa ${formatPoints(pts.daily.cap)}). Câu hỏi hôm nay trả lời 1 lần/ngày không tốn điểm.`, `毎日アクセスで +${formatPoints(pts.daily.grant)}（${formatPoints(pts.daily.cap)}まで）。今日の質問は1日1回ポイントなしで答えられます。`, `Masuk tiap hari +${formatPoints(pts.daily.grant)} (maks ${formatPoints(pts.daily.cap)}). Pertanyaan hari ini sekali sehari tanpa poin.`)
          : null}
      </p>
    </Sheet>
  );
}

/** 충전 시트 안 '코드가 있나요?' — 누르면 코드 입력칸이 열린다. */
function SheetCodeToggle({ t }: { t: PlatformT }) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="mt-5">
        <p className="mb-2 text-[15px] font-bold text-[color:var(--v2-ink)]">{t("포인트 코드 등록", "Redeem a code", "兑换积分码", "Nhập mã điểm", "ポイントコード登録", "Tukar kode poin")}</p>
        <RedeemCodeBox t={t} autoFocus />
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setOpen(true)} className="mt-5 block text-[14px] font-semibold text-[color:var(--v2-accent)]">
      {t("쿠폰·이벤트 코드가 있나요?", "Have a coupon or event code?", "有优惠码或活动码？", "Có mã quà tặng?", "クーポン・イベントコードをお持ちですか？", "Punya kode kupon/acara?")}
    </button>
  );
}

/** 모의 면접 화면용 한 줄 — "AI 포인트 · 답변 1개 20P / 1,230P · 충전하기 ›". */
export function InterviewPointsLine({ t, balance, feedbackCost, onTopUp }: { t: PlatformT; balance: number; feedbackCost: number; onTopUp: () => void }) {
  const c = formatPoints(feedbackCost);
  return <PointsLine t={t} balance={balance} hint={t(`답변 1개 ${c}`, `${c}/answer`, `每个回答 ${c}`, `${c}/câu`, `回答1個 ${c}`, `${c}/jawaban`)} onTopUp={onTopUp} />;
}
