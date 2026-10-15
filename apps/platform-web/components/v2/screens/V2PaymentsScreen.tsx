"use client";

// v2 이용권·결제 내역 — 남은 모의 면접 이용권 · [충전] · 결제 내역(환불 가능하면 [환불]) · 이용 내역.
// 셀프 환불: 결제 후 7일 안, 그 결제로 받은 이용권을 쓰지 않았을 때만(서버가 최종 판단). 그 밖엔 고객센터로.
// AI 포인트(서버 AI_POINTS_ENABLED)가 켜져 있으면 — 포인트 카드 · 포인트 내역(받은·쓴, 기능 이름) · 결제 내역 · 기능별 포인트.
import { useCallback, useEffect, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Sheet } from "../sheets";
import { Button, Empty, Masthead, Page, RowsSkeleton, Section, Spinner } from "../ui";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { cancelMyPayment, getMyPayments, openInterviewPaywall, refreshInterviewCredits, useInterviewCredits, type MyPayment } from "../../../lib/interview-credits";
import { CreditTicket } from "../interview-paywall";
import { PointsTicket, pointReasonLabel } from "../ai-points";
import { formatPoints, openPointsPaywall, refreshAiPoints, useAiPoints } from "../../../lib/ai-points";

export function V2PaymentsScreen() {
  return (
    <V2Shell requireAuth>
      <Payments />
    </V2Shell>
  );
}

function reasonLabel(t: PlatformT, r: string): string {
  if (r === "free_trial") return t("가입 첫 1회", "Welcome session", "首次赠送", "Lượt chào mừng", "初回1回", "Sesi sambutan");
  if (r === "purchase") return t("결제", "Purchase", "购买", "Mua", "購入", "Pembelian");
  if (r === "refund") return t("환불", "Refund", "退款", "Hoàn tiền", "返金", "Pengembalian");
  if (r === "ops_grant") return t("운영자 지급", "Granted", "运营发放", "Được tặng", "運営付与", "Diberikan");
  if (r === "prep") return t("예상 질문 만들기", "Likely questions", "生成预测问题", "Tạo câu hỏi", "予想質問", "Prediksi soal");
  return t("답변 피드백", "Answer feedback", "回答反馈", "Phản hồi câu trả lời", "回答フィードバック", "Umpan balik");
}

function statusChip(t: PlatformT, p: MyPayment) {
  if (p.status === "DONE") return <span className="rounded-full bg-[#e8f8f1] px-2 py-0.5 text-[12px] font-bold text-[color:var(--v2-good)]">{t("결제 완료", "Paid", "已支付", "Đã thanh toán", "支払い済み", "Lunas")}</span>;
  if (p.status === "PARTIAL_CANCELED") return <span className="rounded-full bg-[#fff4e8] px-2 py-0.5 text-[12px] font-bold text-[#c2410c]">{t("일부 환불", "Partly refunded", "部分退款", "Hoàn một phần", "一部返金", "Sebagian kembali")}</span>;
  return <span className="rounded-full bg-[color:var(--v2-band)] px-2 py-0.5 text-[12px] font-bold text-[color:var(--v2-muted)]">{t("환불됨", "Refunded", "已退款", "Đã hoàn", "返金済み", "Dikembalikan")}</span>;
}

const won = (t: PlatformT, n: number) => t(`${n.toLocaleString()}원`, `₩${n.toLocaleString()}`, `₩${n.toLocaleString()}`, `₩${n.toLocaleString()}`, `₩${n.toLocaleString()}`, `₩${n.toLocaleString()}`);
const day = (iso: string | null) => (iso ? iso.slice(0, 10).replace(/-/g, ".") : "");

function Payments() {
  const t = usePlatformT();
  const pts = useAiPoints();
  const pointsMode = Boolean(pts?.enabled);
  const credits = useInterviewCredits();
  const [data, setData] = useState<{ refundDays: number; items: MyPayment[] } | null>(null);
  const [refund, setRefund] = useState<MyPayment | null>(null);
  const load = useCallback(() => {
    getMyPayments()
      .then((d) => setData({ refundDays: d.refundDays, items: d.items }))
      .catch(() => setData({ refundDays: 7, items: [] }));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const per = credits?.perSession ?? 5;
  useEffect(() => {
    if (pointsMode) void refreshAiPoints();
  }, [pointsMode]);

  const paymentsSection = (
    <Section title={t("결제 내역", "Payments", "支付记录", "Lịch sử thanh toán", "決済履歴", "Riwayat pembayaran")}>
      {data === null ? (
        <RowsSkeleton count={3} thumb={false} />
      ) : !data.items.length ? (
        <Empty>{t("아직 결제한 내역이 없어요.", "No payments yet.", "还没有支付记录。", "Chưa có thanh toán.", "まだ決済はありません。", "Belum ada pembayaran.")}</Empty>
      ) : (
        <ul>
          {data.items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 border-b border-[color:var(--v2-band)] py-4 last:border-b-0">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 truncate text-[16px] font-semibold text-[color:var(--v2-ink)]">{p.orderName}</span>
                  {statusChip(t, p)}
                </span>
                <span className="mt-0.5 block text-[13px] text-[color:var(--v2-faint)]">
                  {[day(p.approvedAt), won(t, p.amount), p.canceledAmount ? t(`환불 ${p.canceledAmount.toLocaleString()}원`, `Refunded ₩${p.canceledAmount.toLocaleString()}`, `退款 ₩${p.canceledAmount.toLocaleString()}`, `Hoàn ₩${p.canceledAmount.toLocaleString()}`, `返金 ₩${p.canceledAmount.toLocaleString()}`, `Kembali ₩${p.canceledAmount.toLocaleString()}`) : null].filter(Boolean).join(" · ")}
                </span>
              </span>
              {p.refundable ? (
                <Button size="sm" variant="neutral" onClick={() => setRefund(p)}>
                  {t("환불", "Refund", "退款", "Hoàn tiền", "返金", "Refund")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="pt-3 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
        {pointsMode
          ? t(`결제 후 ${data?.refundDays ?? 7}일 안에, 충전한 포인트가 그대로 남아 있으면 바로 환불할 수 있어요. 그 밖의 환불은 고객센터(info@flip-ers.com)로 문의해 주세요.`, `Within ${data?.refundDays ?? 7} days, if the topped-up points are still in your balance, you can refund here. For other cases, contact info@flip-ers.com.`, `支付后 ${data?.refundDays ?? 7} 天内且充值积分仍在余额中时，可直接退款。其他情况请联系 info@flip-ers.com。`, `Trong ${data?.refundDays ?? 7} ngày, nếu điểm đã nạp vẫn còn, bạn có thể hoàn tiền tại đây. Khác: info@flip-ers.com.`, `決済後${data?.refundDays ?? 7}日以内で、チャージしたポイントが残っていればここで返金できます。その他は info@flip-ers.com へ。`, `Dalam ${data?.refundDays ?? 7} hari, jika poin isi ulang masih ada, bisa refund di sini. Lainnya: info@flip-ers.com.`)
          : t(`결제 후 ${data?.refundDays ?? 7}일 안에, 받은 이용권을 쓰지 않았다면 바로 환불할 수 있어요. 그 밖의 환불은 고객센터(info@flip-ers.com)로 문의해 주세요.`, `Within ${data?.refundDays ?? 7} days of payment and before using the pass, you can refund right here. For other cases, contact info@flip-ers.com.`, `支付后 ${data?.refundDays ?? 7} 天内且未使用使用券时，可直接退款。其他情况请联系 info@flip-ers.com。`, `Trong ${data?.refundDays ?? 7} ngày và chưa dùng vé, bạn có thể hoàn tiền tại đây. Trường hợp khác liên hệ info@flip-ers.com.`, `決済後${data?.refundDays ?? 7}日以内でチケット未使用ならここで返金できます。その他は info@flip-ers.com へ。`, `Dalam ${data?.refundDays ?? 7} hari dan tiket belum dipakai, bisa refund di sini. Lainnya hubungi info@flip-ers.com.`)}
      </p>
    </Section>
  );
  const refundSheet = refund ? (
    <RefundSheet
      t={t}
      p={refund}
      onClose={() => setRefund(null)}
      onDone={() => {
        setRefund(null);
        load();
        void refreshInterviewCredits();
        void refreshAiPoints();
      }}
    />
  ) : null;

  if (pointsMode && pts) {
    const costs = Object.entries(pts.costs).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
    return (
      <Page>
        <Masthead
          eyebrow={t("포인트·결제", "Points & payments", "积分·支付", "Điểm & thanh toán", "ポイント・決済", "Poin & pembayaran")}
          title={t("AI 포인트", "AI points", "AI 积分", "Điểm AI", "AIポイント", "Poin AI")}
          lede={t("이력서·자기소개서·모의 면접 AI에 함께 써요.", "One balance for resume, cover letter & interview AI.", "简历、自我介绍、模拟面试 AI 通用。", "Dùng chung cho AI CV, thư & phỏng vấn.", "履歴書・自己紹介書・模擬面接のAIに共通。", "Satu saldo untuk AI CV, surat & wawancara.")}
        />
        <div className="-mt-2 px-5 pb-8">
          <PointsTicket t={t} balance={pts.balance} onTopUp={() => openPointsPaywall("topup")} dailyGrant={pts.daily.grant} feedbackCost={pts.costs.interview_feedback} />
          <p className="mt-3 px-1 text-[13px] leading-[1.6] text-[color:var(--v2-muted)]">
            {t(`가입하면 ${formatPoints(pts.daily.welcome)}, 매일 +${formatPoints(pts.daily.grant)}씩 쌓여요(잔액 ${formatPoints(pts.daily.cap)}까지).`, `Sign up for ${formatPoints(pts.daily.welcome)}, then +${formatPoints(pts.daily.grant)} every day (while under ${formatPoints(pts.daily.cap)}).`, `注册即得 ${formatPoints(pts.daily.welcome)}，每天 +${formatPoints(pts.daily.grant)}（余额 ${formatPoints(pts.daily.cap)} 以内）。`, `Đăng ký nhận ${formatPoints(pts.daily.welcome)}, mỗi ngày +${formatPoints(pts.daily.grant)} (khi dưới ${formatPoints(pts.daily.cap)}).`, `登録で${formatPoints(pts.daily.welcome)}、毎日+${formatPoints(pts.daily.grant)}（残高${formatPoints(pts.daily.cap)}まで）。`, `Daftar dapat ${formatPoints(pts.daily.welcome)}, lalu +${formatPoints(pts.daily.grant)} tiap hari (saldo maks ${formatPoints(pts.daily.cap)}).`)}
          </p>
        </div>

        <Section title={t("포인트 내역", "Point history", "积分记录", "Lịch sử điểm", "ポイント履歴", "Riwayat poin")}>
          {!pts.logs.length ? (
            <Empty>{t("아직 내역이 없어요.", "Nothing yet.", "还没有记录。", "Chưa có.", "まだありません。", "Belum ada.")}</Empty>
          ) : (
            <ul>
              {pts.logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 border-b border-[color:var(--v2-band)] py-3 last:border-b-0">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-[color:var(--v2-ink-2)]">{pointReasonLabel(t, l.reason)}</span>
                    <span className="block text-[12px] text-[color:var(--v2-faint)]">{new Date(l.createdAt).toLocaleString("sv-SE").slice(0, 16)}</span>
                  </span>
                  <span className={`shrink-0 text-[15px] font-bold tabular-nums ${l.amount >= 0 ? "text-[color:var(--v2-accent)]" : "text-[color:var(--v2-ink-3)]"}`}>
                    {l.amount >= 0 ? `+${formatPoints(l.amount)}` : `−${formatPoints(-l.amount)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {paymentsSection}

        <Section title={t("기능별 포인트", "Points per feature", "各功能积分", "Điểm theo tính năng", "機能別ポイント", "Poin per fitur")}>
          <ul className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            {costs.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-3 border-b border-[color:var(--v2-band)] py-2.5">
                <span className="min-w-0 truncate text-[14px] text-[color:var(--v2-ink-3)]">{pointReasonLabel(t, k)}</span>
                <span className="shrink-0 text-[14px] font-bold tabular-nums text-[color:var(--v2-ink)]">{formatPoints(v)}</span>
              </li>
            ))}
          </ul>
          <p className="pt-3 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">{t("AI가 결과를 돌려줬을 때만 차감돼요. 오늘의 질문은 하루 1번 포인트 없이 답할 수 있어요.", "Points are only used when the AI returns a result. Today's question can be answered once a day without points.", "仅在 AI 返回结果时扣除。今日问题每天可不扣积分回答 1 次。", "Chỉ trừ khi AI trả kết quả. Câu hỏi hôm nay 1 lần/ngày không tốn điểm.", "AIが結果を返したときだけ減ります。今日の質問は1日1回ポイントなしで。", "Poin hanya terpakai saat AI memberi hasil. Pertanyaan harian sekali sehari tanpa poin.")}</p>
        </Section>
        {refundSheet}
      </Page>
    );
  }

  return (
    <Page>
      <Masthead
        eyebrow={t("이용권·결제", "Passes & payments", "使用券·支付", "Vé & thanh toán", "チケット・決済", "Tiket & pembayaran")}
        title={t("모의 면접 이용권", "Mock interview pass", "模拟面试使用券", "Vé phỏng vấn thử", "模擬面接チケット", "Tiket simulasi")}
        lede={t(`1회 = 답변 ${per}개에 AI 피드백이에요.`, `1 session = AI feedback on ${per} answers.`, `1次 = ${per} 个回答的 AI 反馈。`, `1 lượt = phản hồi AI cho ${per} câu.`, `1回 = 回答${per}個にAIフィードバック。`, `1 sesi = umpan balik AI untuk ${per} jawaban.`)}
      />

      <div className="-mt-2 px-5 pb-8">
        <CreditTicket t={t} credits={credits ? credits.credits : null} per={per} onTopUp={() => openInterviewPaywall("topup")} />
      </div>

      {paymentsSection}

      <Section title={t("이용 내역", "Usage", "使用记录", "Lịch sử dùng", "利用履歴", "Riwayat pemakaian")}>
        {!credits ? (
          <RowsSkeleton count={3} thumb={false} />
        ) : !credits.logs.length ? (
          <Empty>{t("아직 내역이 없어요.", "Nothing yet.", "还没有记录。", "Chưa có.", "まだありません。", "Belum ada.")}</Empty>
        ) : (
          <ul>
            {credits.logs.map((l, i) => (
              <li key={`${l.createdAt}-${i}`} className="flex items-center justify-between gap-3 border-b border-[color:var(--v2-band)] py-3 last:border-b-0">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[color:var(--v2-ink-2)]">{reasonLabel(t, l.reason)}</span>
                  <span className="block text-[12px] text-[color:var(--v2-faint)]">{l.createdAt.slice(0, 16).replace("T", " ")}</span>
                </span>
                <span className={`shrink-0 text-[15px] font-bold tabular-nums ${l.amount >= 0 ? "text-[color:var(--v2-accent)]" : "text-[color:var(--v2-ink-3)]"}`}>
                  {l.amount >= 0 ? `+${l.amount}` : l.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {refundSheet}
    </Page>
  );
}

function RefundSheet({ t, p, onClose, onDone }: { t: PlatformT; p: MyPayment; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await cancelMyPayment(p.id);
      onDone();
    } catch (e) {
      setError((e as { message?: string })?.message || t("환불하지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't refund. Try again soon.", "退款失败，请稍后再试。", "Không hoàn được. Thử lại sau.", "返金できませんでした。", "Gagal refund."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title={t("환불할까요?", "Refund this payment?", "确定退款吗？", "Hoàn tiền?", "返金しますか？", "Refund?")}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="neutral" full onClick={onClose}>
            {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
          </Button>
          <Button full onClick={() => void go()} disabled={busy}>
            {busy ? <Spinner /> : null}
            {t("환불하기", "Refund", "退款", "Hoàn tiền", "返金する", "Refund")}
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl bg-[color:var(--v2-band)] p-4">
        <p className="text-[16px] font-bold text-[color:var(--v2-ink)]">{p.orderName}</p>
        <p className="mt-1 text-[14px] text-[color:var(--v2-ink-3)]">{won(t, p.amount)}</p>
      </div>
      {p.kind === "points" ? (
        <p className="mt-4 text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t(`결제한 ${won(t, p.amount)} 전액이 환불되고, 충전한 ${formatPoints(p.credits)}가 잔액에서 빠져요. 카드사에 따라 환불까지 며칠 걸릴 수 있어요.`, `The full ${won(t, p.amount)} will be refunded and ${formatPoints(p.credits)} removed from your balance. Card refunds can take a few days.`, `将全额退款 ${won(t, p.amount)}，并从余额扣回 ${formatPoints(p.credits)}。退款到账可能需要几天。`, `Hoàn toàn bộ ${won(t, p.amount)} và trừ ${formatPoints(p.credits)} khỏi số dư. Có thể mất vài ngày.`, `${won(t, p.amount)}全額が返金され、${formatPoints(p.credits)}が残高から引かれます。返金まで数日かかる場合があります。`, `${won(t, p.amount)} dikembalikan penuh, ${formatPoints(p.credits)} dikurangi dari saldo.`)}</p>
      ) : (
        <p className="mt-4 text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t(`결제한 ${won(t, p.amount)} 전액이 환불되고, 받은 이용권(답변 ${p.credits}개)은 사라져요. 카드사에 따라 환불까지 며칠 걸릴 수 있어요.`, `The full ${won(t, p.amount)} will be refunded and the ${p.credits} answers removed. Card refunds can take a few days.`, `将全额退款 ${won(t, p.amount)}，获得的使用券（${p.credits} 个回答）将被收回。退款到账可能需要几天。`, `Hoàn toàn bộ ${won(t, p.amount)} và thu hồi ${p.credits} câu. Có thể mất vài ngày.`, `${won(t, p.amount)}全額が返金され、チケット（回答${p.credits}個）は消えます。返金まで数日かかる場合があります。`, `${won(t, p.amount)} dikembalikan penuh, ${p.credits} jawaban dihapus.`)}</p>
      )}
      {error ? <p className="mt-3 text-[14px] text-[color:var(--v2-attention)]">{error}</p> : null}
    </Sheet>
  );
}
