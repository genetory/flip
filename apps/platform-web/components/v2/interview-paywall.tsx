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

/** 남은 이용권을 '회 + 답변'으로 — 예: "1회(답변 5개)", "답변 3개". */
export function creditLabel(t: PlatformT, credits: number, per: number): string {
  const sessions = Math.floor(credits / per);
  const rest = credits % per;
  if (sessions && !rest) return t(`${sessions}회 (답변 ${credits}개)`, `${sessions} session${sessions > 1 ? "s" : ""} (${credits} answers)`, `${sessions} 次（${credits} 个回答）`, `${sessions} lượt (${credits} câu)`, `${sessions}回（回答${credits}個）`, `${sessions} sesi (${credits} jawaban)`);
  return t(`답변 ${credits}개`, `${credits} answers`, `${credits} 个回答`, `${credits} câu`, `回答${credits}個`, `${credits} jawaban`);
}

export function InterviewPaywallHost() {
  const { isAuthenticated } = useAuthSession();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => onInterviewPaywall((r) => setOpen(r)), []);
  if (!open || !isAuthenticated) return null;
  return <PaywallSheet reason={open} onClose={() => setOpen(null)} />;
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

function PaywallSheet({ reason, onClose }: { reason: string; onClose: () => void }) {
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
      {reason === "needed" ? (
        <p className="mb-4 rounded-2xl bg-[#fff4e8] px-4 py-3 text-[14px] leading-[1.55] text-[#c2410c]">{t("이용권을 다 썼어요. 충전하면 바로 이어서 피드백을 받을 수 있어요.", "You're out of passes. Top up to keep getting feedback.", "使用券已用完，充值后可继续获得反馈。", "Bạn đã hết vé. Nạp thêm để tiếp tục.", "チケットを使い切りました。チャージすると続けられます。", "Tiket habis. Isi ulang untuk lanjut.")}</p>
      ) : null}
      <div className="flex items-center justify-between rounded-2xl bg-[color:var(--v2-band)] px-4 py-3.5">
        <span className="text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{t("남은 이용권", "Remaining", "剩余", "Còn lại", "残り", "Sisa")}</span>
        <span className="text-[16px] font-bold text-[color:var(--v2-ink)]">{credits ? creditLabel(t, credits.credits, per) : "…"}</span>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {(credits?.products ?? []).map((p, i) => {
          const on = product?.key === p.key;
          const unit = Math.round(p.amount / p.sessions);
          return (
            <button key={p.key} type="button" onClick={() => setPick(p)} aria-pressed={on} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left transition ${on ? "border-[color:var(--v2-accent)] bg-[#edf1fd]" : "border-transparent bg-[color:var(--v2-fill)]"}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-[color:var(--v2-accent)]" : "border-[color:var(--v2-line)]"}`} aria-hidden>
                {on ? <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--v2-accent)]" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[17px] font-bold text-[color:var(--v2-ink)]">{t(`${p.sessions}회`, `${p.sessions} session${p.sessions > 1 ? "s" : ""}`, `${p.sessions} 次`, `${p.sessions} lượt`, `${p.sessions}回`, `${p.sessions} sesi`)}</span>
                  {i === 1 ? <span className="rounded-full bg-[color:var(--v2-accent)] px-2 py-0.5 text-[11px] font-bold text-white">{t("인기", "Popular", "热门", "Phổ biến", "人気", "Populer")}</span> : null}
                </span>
                <span className="mt-0.5 block text-[13px] text-[color:var(--v2-muted)]">{t(`답변 ${p.credits}개 · 1회 ${unit.toLocaleString()}원`, `${p.credits} answers · ₩${unit.toLocaleString()}/session`, `${p.credits} 个回答 · 每次 ₩${unit.toLocaleString()}`, `${p.credits} câu · ₩${unit.toLocaleString()}/lượt`, `回答${p.credits}個 · 1回 ₩${unit.toLocaleString()}`, `${p.credits} jawaban · ₩${unit.toLocaleString()}/sesi`)}</span>
              </span>
              <span className="shrink-0 text-[17px] font-bold text-[color:var(--v2-ink)]">{t(`${p.amount.toLocaleString()}원`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`, `₩${p.amount.toLocaleString()}`)}</span>
            </button>
          );
        })}
      </div>

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
