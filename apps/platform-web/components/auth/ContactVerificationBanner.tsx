"use client";

import { useState } from "react";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { useAuthSession } from "./AuthSessionProvider";
import { useToast } from "../toast/ToastProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import { resendVerificationEmail } from "../../lib/auth-client";

// 실제 도달 가능한 이메일인지 — 빈 값·예전 가짜 도메인(@noemail.local)은 도달 불가.
function isReachableEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return Boolean(e) && !e.endsWith("@noemail.local");
}

type Copy = Record<PlatformLocale, string>;
const pick = (m: Copy, locale: PlatformLocale) => m[locale] ?? m.ko;

const MSG_REACHABLE: Copy = {
  ko: "연락 가능한 이메일 인증이 필요합니다. 보내드린 인증 메일을 확인해 주세요.",
  en: "Please verify your email so we can reach you. Check the verification email we sent.",
  "zh-CN": "请验证您的邮箱以便我们联系您。请查收我们发送的验证邮件。",
  vi: "Vui lòng xác minh email để chúng tôi có thể liên hệ. Kiểm tra email xác minh đã gửi.",
  ja: "ご連絡のためメール認証が必要です。送信した認証メールをご確認ください。",
  id: "Verifikasi email Anda agar kami dapat menghubungi. Cek email verifikasi yang kami kirim."
};
const MSG_UNREACHABLE: Copy = {
  ko: "연락 가능한 이메일이 없습니다. 프로필에서 이메일을 등록해 주세요.",
  en: "No reachable email on file. Please add your email in your profile.",
  "zh-CN": "没有可联系的邮箱。请在个人资料中添加邮箱。",
  vi: "Chưa có email liên hệ. Vui lòng thêm email trong hồ sơ.",
  ja: "連絡可能なメールがありません。プロフィールでメールを登録してください。",
  id: "Belum ada email yang bisa dihubungi. Tambahkan email di profil Anda."
};
const BTN_RESEND: Copy = {
  ko: "인증 메일 다시 보내기",
  en: "Resend verification",
  "zh-CN": "重新发送验证邮件",
  vi: "Gửi lại email xác minh",
  ja: "認証メールを再送",
  id: "Kirim ulang verifikasi"
};
const BTN_ADD_EMAIL: Copy = {
  ko: "이메일 등록",
  en: "Add email",
  "zh-CN": "添加邮箱",
  vi: "Thêm email",
  ja: "メール登録",
  id: "Tambah email"
};
const TOAST_SENT: Copy = {
  ko: "인증 메일을 다시 보냈어요. 메일함을 확인해 주세요.",
  en: "Verification email sent. Please check your inbox.",
  "zh-CN": "已重新发送验证邮件，请查收。",
  vi: "Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư.",
  ja: "認証メールを再送しました。メールをご確認ください。",
  id: "Email verifikasi terkirim. Silakan cek kotak masuk."
};
const TOAST_FAIL: Copy = {
  ko: "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  en: "Failed to send email. Please try again shortly.",
  "zh-CN": "邮件发送失败，请稍后重试。",
  vi: "Gửi email thất bại. Vui lòng thử lại sau.",
  ja: "メール送信に失敗しました。しばらくして再度お試しください。",
  id: "Gagal mengirim email. Coba lagi sebentar lagi."
};

// 로그인했지만 "연락 가능한 검증 이메일"이 없는 사용자에게 상시 노출되는 상단 배너.
// 소프트 게이트 정책: 서비스 이용은 막지 않되, 지원 등 핵심 액션 전에 연락처 확보를 유도한다.
export function ContactVerificationBanner() {
  const { user, isReady, isAuthenticated } = useAuthSession();
  const toast = useToast();
  const { locale } = useLanguage();
  const [sending, setSending] = useState(false);

  // contactVerified 가 명시적으로 false 일 때만 노출(미정/true 는 숨김).
  if (!isReady || !isAuthenticated || !user || user.contactVerified !== false) return null;

  const userEmail = user.email;
  const reachable = isReachableEmail(userEmail);
  const emailLocale = locale === "en" ? "en" : "ko"; // 인증 메일 템플릿은 ko/en 지원.

  async function handleResend() {
    if (!reachable || sending) return;
    setSending(true);
    try {
      await resendVerificationEmail(userEmail, emailLocale);
      toast.success(pick(TOAST_SENT, locale));
    } catch {
      toast.error(pick(TOAST_FAIL, locale));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 print:hidden">
      <div className="container flex items-center gap-3 py-2">
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <p className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-amber-900 md:text-[13px]">
          {reachable ? pick(MSG_REACHABLE, locale) : pick(MSG_UNREACHABLE, locale)}
        </p>
        {reachable ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={sending}
            className="shrink-0 whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-[12px] font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
          >
            {pick(BTN_RESEND, locale)}
          </button>
        ) : (
          <Link
            href="/profile"
            className="shrink-0 whitespace-nowrap rounded-full bg-amber-500 px-3 py-1 text-[12px] font-bold text-white transition hover:bg-amber-600"
          >
            {pick(BTN_ADD_EMAIL, locale)}
          </Link>
        )}
      </div>
    </div>
  );
}
