"use client";

// 모의 면접 이용권 — 결제 창(v2 시트). 어디서든 openInterviewPaywall() 신호를 받으면 열린다(V2Shell 에 하나).
// 잔액 · 상품 셋(1·3·10회) · 토스페이먼츠 결제위젯(결제 수단·약관) · [결제하기]. 결제 후엔 /v2/payments/success 에서 승인.
// 결제 키가 없으면(로컬·준비 전) '결제 준비 중'만 보인다. 화면 문구에 '무료'는 쓰지 않는다(가입 첫 1회만 예외적으로 안내).
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet } from "./sheets";
import { Button, Spinner } from "./ui";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { createPaymentOrder, onInterviewPaywall, refreshInterviewCredits, useInterviewCredits, type InterviewProduct } from "../../lib/interview-credits";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

/** 남은 이용권을 '회 + 답변'으로 — 예: "1회 (답변 5개)", "1회 + 답변 3개", "답변 3개". */
export function creditLabel(t: PlatformT, credits: number, per: number): string {
  const sessions = Math.floor(credits / per);
  const rest = credits % per;
  if (sessions && rest) return t(`${sessions}회 + 답변 ${rest}개`, `${sessions} session${sessions > 1 ? "s" : ""} + ${rest} answers`, `${sessions} 次 + ${rest} 个回答`, `${sessions} lượt + ${rest} câu`, `${sessions}回 + 回答${rest}個`, `${sessions} sesi + ${rest} jawaban`);
  if (sessions && !rest) return t(`${sessions}회 (답변 ${credits}개)`, `${sessions} session${sessions > 1 ? "s" : ""} (${credits} answers)`, `${sessions} 次（${credits} 个回答）`, `${sessions} lượt (${credits} câu)`, `${sessions}回（回答${credits}個）`, `${sessions} sesi (${credits} jawaban)`);
  return t(`답변 ${credits}개`, `${credits} answers`, `${credits} 个回答`, `${credits} câu`, `回答${credits}個`, `${credits} jawaban`);
}

// 이용권 — 지갑 속 카드처럼: 깊은 남색 + 은은한 금빛, 얇은 글자와 가는 선. 다 써도 같은 카드(숫자만 흐리게).
const GOLD = "#f5c451";
const NAVY = "#141a26";

/** 티켓 아이콘(선) — 이모지 대신. */
export function TicketIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M14 6v2M14 11v2M14 16v2" />
    </svg>
  );
}

/** 이용권 카드 — 남은 회수를 금빛으로 크게, 아래에 답변 수·1회 기준 · [충전하기]. 0이면 숫자를 흐리게 + 안내. */
export function CreditTicket({ t, credits, per, onTopUp, action, note }: { t: PlatformT; credits: number | null; per: number; onTopUp?: () => void; action?: string; note?: string }) {
  const sessions = credits === null ? 0 : Math.floor(credits / per);
  const rest = credits === null ? 0 : credits % per;
  const empty = credits !== null && credits <= 0;
  return (
    <div className="relative overflow-hidden rounded-[24px] px-6 pb-5 pt-6 text-white shadow-[0_12px_32px_-12px_rgba(20,26,38,0.55)]" style={{ background: "linear-gradient(150deg, #253047 0%, #141a26 62%)" }}>
      {/* 은은한 금빛 — 오른쪽 위 */}
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-25 blur-3xl" style={{ background: GOLD }} />
      <div className="relative flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">{t("모의 면접 이용권", "Mock interview pass", "模拟面试使用券", "Vé phỏng vấn thử", "模擬面接チケット", "Tiket simulasi")}</span>
        <TicketIcon className="h-[18px] w-[18px] text-white/35" />
      </div>
      <p className="relative mt-4 flex items-baseline gap-1.5">
        <span className="text-[56px] font-semibold leading-none tracking-[-0.04em] tabular-nums" style={{ color: empty ? "rgba(255,255,255,0.28)" : GOLD }}>{credits === null ? "…" : sessions}</span>
        <span className="text-[18px] font-medium text-white/70">{t("회", sessions === 1 ? "session" : "sessions", "次", "lượt", "回", "sesi")}</span>
        {rest ? <span className="ml-1 text-[14px] font-medium text-white/45">+ {t(`답변 ${rest}개`, `${rest} answers`, `${rest} 个回答`, `${rest} câu`, `回答${rest}個`, `${rest} jawaban`)}</span> : null}
      </p>
      {/* 티켓 홈 — 작은 반원 + 가는 점선 */}
      <div aria-hidden className="relative -mx-6 mt-5 flex items-center">
        <span className="-ml-2.5 h-5 w-5 shrink-0 rounded-full bg-white" />
        <span className="mx-3 flex-1 border-t border-dashed border-white/15" />
        <span className="-mr-2.5 h-5 w-5 shrink-0 rounded-full bg-white" />
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        {empty || note ? (
          <span className="min-w-0 text-[13px] leading-[1.5] text-white/55">
            {empty ? t("다 썼어요. 충전하면 바로 이어서 연습해요.", "All used. Top up to keep practicing.", "已用完，充值后即可继续练习。", "Đã hết. Nạp để luyện tiếp.", "使い切りました。チャージで続けられます。", "Habis. Isi ulang untuk lanjut.") : note}
          </span>
        ) : (
          <span className="flex min-w-0 gap-6">
            <span>
              <span className="block text-[11px] font-medium text-white/40">{t("남은 답변", "Answers left", "剩余回答", "Câu còn lại", "残り回答", "Sisa jawaban")}</span>
              <span className="mt-0.5 block text-[15px] font-semibold tabular-nums text-white/90">{credits === null ? "…" : t(`${credits}개`, `${credits}`, `${credits} 个`, `${credits}`, `${credits}個`, `${credits}`)}</span>
            </span>
            <span>
              <span className="block text-[11px] font-medium text-white/40">{t("1회", "1 session", "1 次", "1 lượt", "1回", "1 sesi")}</span>
              <span className="mt-0.5 block text-[15px] font-semibold text-white/90">{t(`답변 ${per}개`, `${per} answers`, `${per} 个回答`, `${per} câu`, `回答${per}個`, `${per} jawaban`)}</span>
            </span>
          </span>
        )}
        {onTopUp ? (
          <button type="button" onClick={onTopUp} className="h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold transition hover:brightness-105 active:scale-[0.98]" style={{ background: GOLD, color: NAVY }}>
            {action ?? t("충전하기", "Top up", "充值", "Nạp thêm", "チャージ", "Isi ulang")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** 이용권 한 줄 — 좁은 자리에. 금빛 티켓 아이콘 · 남은 회수 · 글자 버튼 [충전하기 ›]. */
export function CreditLine({ t, credits, per, onTopUp }: { t: PlatformT; credits: number; per: number; onTopUp: () => void }) {
  const empty = credits <= 0;
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3.5">
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: NAVY }}>
        <TicketIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-[15px] leading-[1.4] text-[color:var(--v2-ink-3)]">
        {t("이용권", "Passes", "使用券", "Vé", "チケット", "Tiket")}{" "}
        <b className={`font-bold ${empty ? "text-[color:var(--v2-muted)]" : "text-[color:var(--v2-ink)]"}`}>{empty ? t("다 썼어요", "none left", "已用完", "đã hết", "残りなし", "habis") : creditLabel(t, credits, per)}</b>
      </span>
      <button type="button" onClick={onTopUp} className="shrink-0 whitespace-nowrap text-[14px] font-semibold text-[color:var(--v2-accent)] transition hover:opacity-70">
        {t("충전하기", "Top up", "充值", "Nạp", "チャージ", "Isi")} ›
      </button>
    </div>
  );
}

export function InterviewPaywallHost() {
  const { isAuthenticated } = useAuthSession();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => onInterviewPaywall((r) => setOpen(r)), []);
  if (!open || !isAuthenticated) return null;
  return <PaywallSheet onClose={() => setOpen(null)} />;
}

type TossWidgets = {
  setAmount: (a: { currency: "KRW"; value: number }) => Promise<void>;
  renderPaymentMethods: (o: { selector: string; variantKey?: string }) => Promise<unknown>;
  renderAgreement: (o: { selector: string; variantKey?: string }) => Promise<unknown>;
  requestPayment: (o: { orderId: string; orderName: string; successUrl: string; failUrl: string; customerEmail?: string; customerName?: string }) => Promise<void>;
};
type TossPaymentsFn = (clientKey: string) => { widgets: (o: { customerKey: string }) => TossWidgets };

/** 토스페이먼츠 SDK(v2 standard) — 처음 필요할 때 한 번만 불러온다. */
let sdkLoading: Promise<TossPaymentsFn> | null = null;
function loadToss(): Promise<TossPaymentsFn> {
  const w = window as unknown as { TossPayments?: TossPaymentsFn };
  if (w.TossPayments) return Promise.resolve(w.TossPayments);
  sdkLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.tosspayments.com/v2/standard";
    s.async = true;
    s.onload = () => (w.TossPayments ? resolve(w.TossPayments) : reject(new Error("sdk")));
    s.onerror = () => reject(new Error("sdk"));
    document.head.appendChild(s);
  });
  return sdkLoading;
}

function PaywallSheet({ onClose }: { onClose: () => void }) {
  const t = usePlatformT();
  const pathname = usePathname() ?? "/v2/interviews";
  const { user } = useAuthSession();
  const credits = useInterviewCredits();
  const [pick, setPick] = useState<InterviewProduct | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgets = useRef<TossWidgets | null>(null);
  const payable = Boolean(CLIENT_KEY) && Boolean(credits?.paymentsEnabled);
  const product = pick ?? credits?.products[1] ?? credits?.products[0] ?? null;

  useEffect(() => {
    void refreshInterviewCredits();
  }, []);

  // 결제위젯 — 처음 한 번만 만들고(같은 자리에 두 번 그리면 오류), 상품을 바꾸면 금액만 바꾼다.
  const amount = product?.amount ?? 0;
  const userId = user?.id ?? null;
  const init = useRef<Promise<TossWidgets> | null>(null);
  useEffect(() => {
    if (!payable || !amount || !userId) return;
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
  }, [payable, amount, userId, t]);

  const pay = async () => {
    if (!product || !widgets.current) return;
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
      // 결제창을 닫은 경우(USER_CANCEL)는 조용히.
      if ((e as { code?: string })?.code !== "USER_CANCEL") setError(t("결제를 시작하지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't start the payment. Try again soon.", "无法开始支付，请稍后再试。", "Không bắt đầu thanh toán được.", "決済を開始できませんでした。", "Gagal memulai pembayaran."));
    } finally {
      setBusy(false);
    }
  };

  const per = credits?.perSession ?? 5;
  return (
    <Sheet
      tall
      title={t("모의 면접 이용권", "Mock interview pass", "模拟面试使用券", "Vé phỏng vấn thử", "模擬面接チケット", "Tiket simulasi")}
      subtitle={t(`1회 = 답변 ${per}개에 AI 피드백`, `1 session = AI feedback on ${per} answers`, `1次 = ${per} 个回答的 AI 反馈`, `1 lượt = phản hồi AI cho ${per} câu`, `1回 = 回答${per}個にAIフィードバック`, `1 sesi = umpan balik AI untuk ${per} jawaban`)}
      onClose={onClose}
      footer={
        payable ? (
          <Button full onClick={() => void pay()} disabled={!ready || busy || !product}>
            {busy ? <Spinner /> : null}
            {product ? t(`${product.amount.toLocaleString()}원 결제하기`, `Pay ₩${product.amount.toLocaleString()}`, `支付 ₩${product.amount.toLocaleString()}`, `Thanh toán ₩${product.amount.toLocaleString()}`, `₩${product.amount.toLocaleString()} を支払う`, `Bayar ₩${product.amount.toLocaleString()}`) : t("결제하기", "Pay", "支付", "Thanh toán", "支払う", "Bayar")}
          </Button>
        ) : undefined
      }
    >
      {/* 다 썼을 때 안내는 아래 티켓(연한 주황)이 대신한다 */}
      <CreditTicket t={t} credits={credits ? credits.credits : null} per={per} note={t("쓴 만큼만 줄어요. 7일 안에 안 쓰면 환불돼요.", "Only used passes count. Unused can be refunded in 7 days.", "按使用扣除，7 天内未用可退款。", "Chỉ trừ khi dùng. Chưa dùng hoàn trong 7 ngày.", "使った分だけ減り、7日以内未使用なら返金可。", "Berkurang saat dipakai. Refund 7 hari jika belum dipakai.")} />

      <p className="mt-6 text-[17px] font-bold text-[color:var(--v2-ink)]">{t("얼마나 충전할까요?", "How many?", "充值多少？", "Nạp bao nhiêu?", "いくつチャージしますか？", "Berapa banyak?")}</p>
      <div className="mt-3 flex flex-col gap-2.5">
        {(credits?.products ?? []).map((p, i, all) => {
          const on = product?.key === p.key;
          const unit = Math.round(p.amount / p.sessions);
          const base = all[0] ? all[0].amount / all[0].sessions : unit;
          const off = Math.round((1 - unit / base) * 100);
          const best = i === all.length - 1 && all.length > 1;
          return (
            <button key={p.key} type="button" onClick={() => setPick(p)} aria-pressed={on} className={`relative flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${on ? "bg-white ring-2 ring-[#141a26] shadow-[0_8px_24px_-12px_rgba(20,26,38,0.35)]" : "bg-[color:var(--v2-fill)] hover:bg-[color:var(--v2-band)]"}`}>
              <span className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${on ? "text-[#f5c451]" : "bg-white text-[color:var(--v2-ink)]"}`} style={on ? { background: NAVY } : undefined} aria-hidden>
                <span className="text-[20px] font-bold leading-none">{p.sessions}</span>
                <span className="mt-0.5 text-[10px] font-bold opacity-80">{t("회", "x", "次", "lượt", "回", "x")}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[16px] font-bold text-[color:var(--v2-ink)]">{t(`${p.sessions}회 이용권`, `${p.sessions}-session pass`, `${p.sessions} 次券`, `Vé ${p.sessions} lượt`, `${p.sessions}回券`, `Tiket ${p.sessions} sesi`)}</span>
                  {i === 1 && !best ? <span className="rounded-full bg-[#fdf3d7] px-2 py-0.5 text-[11px] font-bold text-[#a0700a]">{t("인기", "Popular", "热门", "Phổ biến", "人気", "Populer")}</span> : null}
                  {best ? <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-[#f5c451]" style={{ background: NAVY }}>{t("가장 알뜰", "Best value", "最划算", "Tiết kiệm nhất", "一番お得", "Paling hemat")}</span> : null}
                </span>
                <span className="mt-0.5 block whitespace-nowrap text-[13px] text-[color:var(--v2-muted)]">
                  {t(`답변 ${p.credits}개`, `${p.credits} answers`, `${p.credits} 个回答`, `${p.credits} câu`, `回答${p.credits}個`, `${p.credits} jawaban`)}
                  {/* 좁은 화면(320)에선 회당 가격을 숨겨 한 줄로 */}
                  <span className="hidden min-[360px]:inline"> · {t(`1회 ${unit.toLocaleString()}원`, `₩${unit.toLocaleString()}/session`, `每次 ₩${unit.toLocaleString()}`, `₩${unit.toLocaleString()}/lượt`, `1回 ₩${unit.toLocaleString()}`, `₩${unit.toLocaleString()}/sesi`)}</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                {off > 0 ? <span className="block text-[12px] font-bold text-[#f04452]">{off}% {t("할인", "off", "优惠", "giảm", "お得", "hemat")}</span> : null}
                <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t(`${p.amount.toLocaleString()}원`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`)}</span>
              </span>
            </button>
          );
        })}
      </div>
      {product && credits ? (
        // 충전하면 얼마가 되는지 — 고른 상품 기준
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-fill)] px-3 py-2.5 text-[14px] text-[color:var(--v2-ink-3)]">
          {t("충전하면", "After top-up", "充值后", "Sau khi nạp", "チャージ後", "Setelah isi")} <span aria-hidden>→</span> <b className="text-[color:var(--v2-ink)]">{creditLabel(t, credits.credits + product.credits, per)}</b>
        </p>
      ) : null}

      {payable ? (
        <div className="mt-5">
          {/* 토스페이먼츠 결제위젯이 그려지는 자리 */}
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
      <Link href="/v2/payments" onClick={onClose} className="mt-4 inline-block text-[13px] font-semibold text-[color:var(--v2-muted)] underline underline-offset-2">
        {t("이용권·결제 내역 보기", "See passes & payments", "查看使用券·支付记录", "Xem vé & thanh toán", "チケット・決済履歴を見る", "Lihat tiket & pembayaran")}
      </Link>
      <p className="mt-4 text-[12px] leading-[1.6] text-[color:var(--v2-faint)]">{t("오늘의 질문은 하루 1번 이용권 없이 답할 수 있어요. 결제한 이용권은 쓴 만큼만 줄어요.", "Today's question can be answered once a day without a pass. Passes only decrease as you use them.", "今日问题每天可免券回答 1 次。使用券按实际使用扣除。", "Câu hỏi hôm nay được trả lời 1 lần/ngày không cần vé.", "今日の質問は1日1回チケットなしで答えられます。", "Pertanyaan hari ini bisa dijawab sekali sehari tanpa tiket.")}</p>
    </Sheet>
  );
}
