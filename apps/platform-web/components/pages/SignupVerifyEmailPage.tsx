"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";
import { resendVerificationEmail } from "../../lib/auth-client";

export function SignupVerifyEmailPage() {
  const { locale } = useLanguage();
  const params = useSearchParams();
  const email = useMemo(() => params.get("email")?.trim() ?? "", [params]);
  const initialVerifyUrl = useMemo(() => params.get("verifyUrl")?.trim() ?? "", [params]);
  const [devVerifyUrl, setDevVerifyUrl] = useState(initialVerifyUrl);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyByLocale = {
    ko: {
      title: "이메일 인증이 필요합니다",
      description: "가입이 완료되었습니다. 인증 메일의 링크를 클릭하면 로그인할 수 있습니다.",
      targetEmailLabel: "인증 대상 이메일",
      targetEmailFallback: "가입한 이메일 주소를 확인해주세요.",
      alreadyVerified: "이미 인증 완료된 계정입니다. 바로 로그인해주세요.",
      resendSent: "인증 메일을 다시 보냈습니다. 받은 편지함을 확인해주세요.",
      resendUnavailable: "인증 메일을 보낼 수 없는 상태입니다. 잠시 후 다시 시도해주세요.",
      resendFailed: "인증 메일 재발송에 실패했습니다.",
      resendLoading: "재발송 중...",
      resendButton: "인증 메일 다시 보내기",
      goLogin: "로그인으로 이동",
      devLinkLabel: "개발 환경 링크"
    },
    en: {
      title: "Email verification required",
      description: "Signup is complete. Click the link in your verification email to sign in.",
      targetEmailLabel: "Verification email",
      targetEmailFallback: "Please check your signup email address.",
      alreadyVerified: "This account is already verified. Please sign in.",
      resendSent: "Verification email resent. Please check your inbox.",
      resendUnavailable: "Unable to send verification email right now. Please try again later.",
      resendFailed: "Failed to resend verification email.",
      resendLoading: "Resending...",
      resendButton: "Resend verification email",
      goLogin: "Go to login",
      devLinkLabel: "Dev environment link"
    },
    "zh-CN": {
      title: "需要邮箱验证",
      description: "注册已完成。点击验证邮件中的链接即可登录。",
      targetEmailLabel: "验证邮箱",
      targetEmailFallback: "请确认你注册时使用的邮箱地址。",
      alreadyVerified: "该账号已完成验证，请直接登录。",
      resendSent: "验证邮件已重新发送，请检查收件箱。",
      resendUnavailable: "当前无法发送验证邮件，请稍后重试。",
      resendFailed: "重新发送验证邮件失败。",
      resendLoading: "重新发送中...",
      resendButton: "重新发送验证邮件",
      goLogin: "前往登录",
      devLinkLabel: "开发环境链接"
    },
    vi: {
      title: "Cần xác minh email",
      description: "Đăng ký đã hoàn tất. Hãy nhấp liên kết trong email xác minh để đăng nhập.",
      targetEmailLabel: "Email xác minh",
      targetEmailFallback: "Vui lòng kiểm tra địa chỉ email bạn đã đăng ký.",
      alreadyVerified: "Tài khoản này đã được xác minh. Vui lòng đăng nhập ngay.",
      resendSent: "Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư.",
      resendUnavailable: "Hiện không thể gửi email xác minh. Vui lòng thử lại sau.",
      resendFailed: "Gửi lại email xác minh thất bại.",
      resendLoading: "Đang gửi lại...",
      resendButton: "Gửi lại email xác minh",
      goLogin: "Đi tới đăng nhập",
      devLinkLabel: "Liên kết môi trường dev"
    },
    ja: {
      title: "メール認証が必要です",
      description: "会員登録が完了しました。認証メールのリンクをクリックするとログインできます。",
      targetEmailLabel: "認証対象メールアドレス",
      targetEmailFallback: "登録したメールアドレスをご確認ください。",
      alreadyVerified: "このアカウントは既に認証済みです。ログインしてください。",
      resendSent: "認証メールを再送信しました。受信トレイをご確認ください。",
      resendUnavailable: "現在、認証メールを送信できません。しばらくしてから再度お試しください。",
      resendFailed: "認証メールの再送信に失敗しました。",
      resendLoading: "再送信中...",
      resendButton: "認証メールを再送信",
      goLogin: "ログインへ移動",
      devLinkLabel: "開発環境リンク"
    },
    id: {
      title: "Verifikasi email diperlukan",
      description: "Pendaftaran selesai. Klik tautan di email verifikasi untuk masuk.",
      targetEmailLabel: "Email verifikasi",
      targetEmailFallback: "Silakan periksa alamat email pendaftaran Anda.",
      alreadyVerified: "Akun ini sudah diverifikasi. Silakan masuk.",
      resendSent: "Email verifikasi telah dikirim ulang. Silakan periksa kotak masuk Anda.",
      resendUnavailable: "Saat ini tidak dapat mengirim email verifikasi. Silakan coba lagi nanti.",
      resendFailed: "Gagal mengirim ulang email verifikasi.",
      resendLoading: "Mengirim ulang...",
      resendButton: "Kirim ulang email verifikasi",
      goLogin: "Ke halaman masuk",
      devLinkLabel: "Tautan lingkungan dev"
    }
  } as const;
  const copy = copyByLocale[locale] ?? copyByLocale.en;

  async function handleResend() {
    if (!email) return;
    setIsSending(true);
    setError(null);
    setNotice(null);

    try {
      const emailLocale = locale === "ko" ? "ko" : locale === "ja" ? "en" : locale === "id" ? "en" : "en";
      const result = await resendVerificationEmail(email, emailLocale);
      if (result.verifyUrl) setDevVerifyUrl(result.verifyUrl);

      if (result.alreadyVerified) {
        setNotice(copy.alreadyVerified);
        return;
      }
      if (result.sent) {
        setNotice(copy.resendSent);
        return;
      }
      setNotice(copy.resendUnavailable);
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.resendFailed);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
          <p className="text-sm text-muted-foreground">
            {email ? `${copy.targetEmailLabel}: ${email}` : copy.targetEmailFallback}
          </p>

          {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="dark" onClick={() => void handleResend()} disabled={!email || isSending}>
              {isSending ? copy.resendLoading : copy.resendButton}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">{copy.goLogin}</Link>
            </Button>
          </div>

          {devVerifyUrl ? (
            <div className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
              {copy.devLinkLabel}:{" "}
              <a className="underline" href={devVerifyUrl}>
                {devVerifyUrl}
              </a>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
