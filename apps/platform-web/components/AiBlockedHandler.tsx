"use client";

// AI 가드레일 차단 시 전역 안내 — 이메일 인증 필요(403)면 '인증 메일 받기' 모달,
// 레이트·일일 한도(429)면 토스트. 루트 레이아웃에 1회 마운트.
import { useEffect, useState } from "react";
import { useAuthSession } from "./auth/AuthSessionProvider";
import { useToast } from "./toast/ToastProvider";
import { usePlatformT } from "../lib/i18n";
import { resendVerificationEmail } from "../lib/auth-client";
import { AI_BLOCKED_EVENT, type AiBlockedDetail } from "../lib/ai-blocked";

export function AiBlockedHandler() {
  const { user } = useAuthSession();
  const toast = useToast();
  const t = usePlatformT();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onBlocked = (e: Event) => {
      const detail = (e as CustomEvent<AiBlockedDetail>).detail;
      if (!detail) return;
      if (detail.kind === "verify") {
        setSent(false);
        setOpen(true);
      } else {
        toast.error(detail.message);
      }
    };
    window.addEventListener(AI_BLOCKED_EVENT, onBlocked);
    return () => window.removeEventListener(AI_BLOCKED_EVENT, onBlocked);
  }, [toast]);

  async function resend() {
    if (!user?.email || sending) return;
    setSending(true);
    try {
      await resendVerificationEmail(user.email);
      setSent(true);
      toast.success(t("인증 메일을 보냈어요. 메일함을 확인해 주세요.", "Verification email sent. Please check your inbox.", "验证邮件已发送，请查收邮箱。", "Đã gửi email xác minh. Vui lòng kiểm tra hộp thư.", "認証メールを送りました。メールをご確認ください。", "Email verifikasi terkirim. Cek kotak masukmu."));
    } catch {
      toast.error(t("메일 전송에 실패했어요. 잠시 후 다시 시도해 주세요.", "Couldn't send the email. Please try again shortly.", "邮件发送失败，请稍后再试。", "Không gửi được email. Vui lòng thử lại sau.", "メール送信に失敗しました。少し後にもう一度お試しください。", "Gagal mengirim email. Coba lagi nanti."));
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-[380px] rounded-3xl bg-white p-6 text-center shadow-[0_20px_60px_-20px_rgba(11,18,39,0.4)]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[28px]" aria-hidden>📧</div>
        <h2 className="mt-4 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t("이메일 인증이 필요해요", "Email verification required", "需要邮箱验证", "Cần xác minh email", "メール認証が必要です", "Perlu verifikasi email")}</h2>
        <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t("AI 기능은 이메일 인증 후 이용할 수 있어요. 아래 버튼으로 인증 메일을 받아 인증을 완료해 주세요.", "AI features are available after verifying your email. Get a verification email below and complete verification.", "AI 功能需完成邮箱验证后使用。请点击下方按钮接收验证邮件并完成验证。", "Tính năng AI khả dụng sau khi xác minh email. Nhận email xác minh bên dưới và hoàn tất.", "AI機能はメール認証後にご利用いただけます。下のボタンから認証メールを受け取り認証を完了してください。", "Fitur AI tersedia setelah verifikasi email. Dapatkan email verifikasi di bawah dan selesaikan.")}</p>
        {user?.email ? <p className="mt-2 text-[13px] font-semibold text-[#4E5968]">{user.email}</p> : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={resend}
            disabled={sending || !user?.email}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition enabled:hover:bg-[#0A3ECB] disabled:opacity-50"
          >
            {sending ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…") : sent ? t("다시 보내기", "Resend", "重新发送", "Gửi lại", "再送信", "Kirim ulang") : t("인증 메일 받기", "Send verification email", "接收验证邮件", "Nhận email xác minh", "認証メールを受け取る", "Kirim email verifikasi")}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 items-center justify-center rounded-xl text-[14px] font-bold text-[#8B95A1] transition hover:bg-[#F6F8FB]">
            {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
          </button>
        </div>
      </div>
    </div>
  );
}
