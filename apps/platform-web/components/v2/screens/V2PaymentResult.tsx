"use client";

// 결제 결과 — 토스 결제위젯이 돌려보내는 곳.
//  - success: 주소의 paymentKey·orderId·amount 로 서버 승인(/members/me/payments/confirm) → 이용권이 들어간 걸 보여 준다.
//    새로고침해도 서버가 같은 주문은 한 번만 충전한다.
//  - fail: 토스가 준 사유(code·message)를 보여 주고 다시 시도로.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { V2Shell } from "../V2Shell";
import { Button, Page, Spinner } from "../ui";
import { usePlatformT } from "../../../lib/i18n";
import { confirmPayment, openInterviewPaywall, refreshInterviewCredits } from "../../../lib/interview-credits";
import { creditLabel } from "../interview-paywall";
import { formatPoints, openPointsPaywall, refreshAiPoints, useAiPoints } from "../../../lib/ai-points";

export function V2PaymentResult({ kind }: { kind: "success" | "fail" }) {
  return (
    <V2Shell requireAuth>
      <Result kind={kind} />
    </V2Shell>
  );
}

function Result({ kind }: { kind: "success" | "fail" }) {
  const t = usePlatformT();
  const q = useSearchParams();
  const back = safeBack(q?.get("back"));
  const paymentKey = q?.get("paymentKey") ?? "";
  const orderId = q?.get("orderId") ?? "";
  const amount = Number(q?.get("amount") ?? "0");
  const complete = kind === "success" && Boolean(paymentKey && orderId && amount);
  const pts = useAiPoints();
  const [state, setState] = useState<{ status: "working" | "done" | "error"; points?: boolean; added?: number; credits?: number; message?: string }>({ status: complete ? "working" : "error", message: kind === "fail" ? q?.get("message") ?? undefined : undefined });
  const started = useRef(false);

  useEffect(() => {
    if (!complete || started.current) return;
    started.current = true;
    confirmPayment({ paymentKey, orderId, amount })
      .then((r) => {
        setState({ status: "done", points: r.kind === "points", added: r.added, credits: r.kind === "points" ? (r.balance ?? r.credits) : r.credits });
        void refreshInterviewCredits();
        void refreshAiPoints();
      })
      .catch((e) => setState({ status: "error", message: (e as { message?: string })?.message }));
  }, [complete, paymentKey, orderId, amount]);

  return (
    <Page>
      <div className="px-5 pb-10 pt-14 text-center">
        {state.status === "working" ? (
          <>
            <div className="flex justify-center text-[color:var(--v2-accent)]">
              <Spinner className="h-8 w-8" />
            </div>
            <p className="mt-5 text-[20px] font-bold text-[color:var(--v2-ink)]">{t("결제를 확인하고 있어요", "Confirming your payment", "正在确认支付", "Đang xác nhận thanh toán", "決済を確認しています", "Mengonfirmasi pembayaran")}</p>
            <p className="mt-1.5 text-[14px] text-[color:var(--v2-muted)]">{t("창을 닫지 말아 주세요.", "Please keep this window open.", "请不要关闭窗口。", "Vui lòng không đóng cửa sổ.", "画面を閉じないでください。", "Jangan tutup jendela ini.")}</p>
          </>
        ) : state.status === "done" ? (
          <>
            <p className="text-[48px]" aria-hidden>
              🎉
            </p>
            {state.points ? (
              <>
                <p className="mt-3 text-[22px] font-bold text-[color:var(--v2-ink)]">{t(`${formatPoints(state.added ?? 0)}를 충전했어요`, `${formatPoints(state.added ?? 0)} added`, `已充值 ${formatPoints(state.added ?? 0)}`, `Đã nạp ${formatPoints(state.added ?? 0)}`, `${formatPoints(state.added ?? 0)}をチャージしました`, `${formatPoints(state.added ?? 0)} ditambahkan`)}</p>
                <p className="mt-2 text-[15px] text-[color:var(--v2-ink-3)]">
                  {t("AI 포인트", "AI points", "AI 积分", "Điểm AI", "AIポイント", "Poin AI")} · <b className="tabular-nums">{formatPoints(state.credits ?? 0)}</b>
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-[22px] font-bold text-[color:var(--v2-ink)]">{t("이용권을 넣었어요", "Your pass is ready", "使用券已到账", "Đã nạp vé", "チケットを追加しました", "Tiket sudah masuk")}</p>
                <p className="mt-2 text-[15px] text-[color:var(--v2-ink-3)]">
                  {t("남은 이용권", "Remaining", "剩余", "Còn lại", "残り", "Sisa")} · <b>{creditLabel(t, state.credits ?? 0, 5)}</b>
                </p>
              </>
            )}
            <div className="mx-auto mt-8 max-w-[320px]">
              <Button full href={back}>
                {state.points ? t("이어서 하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan") : t("모의 면접 이어서 하기", "Continue practicing", "继续练习", "Tiếp tục luyện", "練習を続ける", "Lanjut latihan")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[48px]" aria-hidden>
              😥
            </p>
            <p className="mt-3 text-[22px] font-bold text-[color:var(--v2-ink)]">{t("결제가 완료되지 않았어요", "Payment wasn't completed", "支付未完成", "Thanh toán chưa hoàn tất", "決済が完了しませんでした", "Pembayaran belum selesai")}</p>
            <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{state.message || t("돈은 빠져나가지 않았어요. 다시 시도해 주세요.", "You weren't charged. Please try again.", "未扣款，请重试。", "Bạn chưa bị trừ tiền. Hãy thử lại.", "料金は引き落とされていません。もう一度お試しください。", "Tidak ada tagihan. Coba lagi.")}</p>
            <div className="mx-auto mt-8 grid max-w-[320px] gap-2">
              <Button
                full
                onClick={() => {
                  window.history.replaceState(null, "", back);
                  if (pts?.enabled) openPointsPaywall("retry");
                  else openInterviewPaywall("retry");
                }}
              >
                {t("다시 결제하기", "Try again", "重新支付", "Thử lại", "もう一度支払う", "Coba lagi")}
              </Button>
              <Button variant="neutral" full href={back}>
                {t("돌아가기", "Go back", "返回", "Quay lại", "戻る", "Kembali")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}

/** 돌아갈 곳 — 우리 사이트 안의 talent 주소만(다른 곳으로 보내는 주소는 무시). */
function safeBack(v: string | null | undefined): string {
  return v && v.startsWith("/talent/") && !v.startsWith("//") ? v : "/talent/career/interviews";
}
