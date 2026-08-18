"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";
import { resendVerificationEmail } from "../../lib/auth-client";
import { usePlatformT } from "../../lib/i18n";

const RESEND_COOLDOWN_SECONDS = 60;
const SUPPORT_EMAIL = "info@flip-ers.com";

export function SignupVerifyEmailPage() {
  const { locale } = useLanguage();
  const t = usePlatformT();
  const params = useSearchParams();
  const email = useMemo(() => params.get("email")?.trim() ?? "", [params]);
  const initialVerifyUrl = useMemo(() => params.get("verifyUrl")?.trim() ?? "", [params]);
  const [devVerifyUrl, setDevVerifyUrl] = useState(initialVerifyUrl);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

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
      resendCooldown: (s: number) => `${s}초 후 다시 시도 가능`,
      goLogin: "로그인으로 이동",
      devLinkLabel: "개발 환경 링크",
      troubleTitle: "인증 메일이 오지 않았나요?",
      trouble1Title: "스팸·정크·프로모션 폴더를 확인해주세요",
      trouble1Body: "메일이 자동으로 다른 폴더로 분류된 경우가 가장 많습니다. 'Aply' 또는 'info@flip-ers.com'을 검색해보세요.",
      trouble2Title: "회사 메일을 사용하시나요?",
      trouble2Body: "기업 메일 서버는 외부 인증 메일을 격리하는 경우가 있습니다. IT 담당자에게 'info@flip-ers.com 발신 메일 허용'을 요청해주세요. 혹은 개인 이메일(Gmail, Naver 등)로 다시 가입하시는 것도 좋은 방법입니다.",
      trouble3Title: "이메일 주소가 잘못되었나요?",
      trouble3Body: "오타가 있다면 회원가입 페이지로 돌아가서 올바른 주소로 다시 가입해주세요.",
      trouble4Title: "그래도 안 오면",
      trouble4Body: "고객지원에 이메일로 문의해주세요. 가입 이메일 주소를 함께 알려주시면 빠르게 도와드리겠습니다.",
      contactSupport: "고객지원에 문의하기",
      backToSignup: "회원가입으로 돌아가기"
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
      resendCooldown: (s: number) => `Retry in ${s}s`,
      goLogin: "Go to login",
      devLinkLabel: "Dev environment link",
      troubleTitle: "Didn't receive the email?",
      trouble1Title: "Check spam, junk, or promotions folders",
      trouble1Body: "This is the most common cause. Search for 'Aply' or 'info@flip-ers.com' in all folders.",
      trouble2Title: "Are you using a work email?",
      trouble2Body: "Corporate mail gateways often quarantine external verification emails. Ask your IT team to allow 'info@flip-ers.com'. Or sign up again with a personal email (Gmail, Naver, etc.).",
      trouble3Title: "Typed the wrong address?",
      trouble3Body: "If there's a typo, head back to signup and use the correct address.",
      trouble4Title: "Still no email?",
      trouble4Body: "Contact our support. Please include your signup email address so we can help you faster.",
      contactSupport: "Contact support",
      backToSignup: "Back to signup"
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
      resendCooldown: (s: number) => `${s}秒后可重试`,
      goLogin: "前往登录",
      devLinkLabel: "开发环境链接",
      troubleTitle: "没有收到验证邮件？",
      trouble1Title: "检查垃圾邮件/促销邮件文件夹",
      trouble1Body: "邮件常被自动归类。请在所有文件夹中搜索 'Aply' 或 'info@flip-ers.com'。",
      trouble2Title: "使用的是公司邮箱？",
      trouble2Body: "企业邮件服务器有时会拦截外部验证邮件。请联系 IT 部门将 'info@flip-ers.com' 加入白名单，或改用个人邮箱重新注册。",
      trouble3Title: "邮箱地址有误？",
      trouble3Body: "如有拼写错误，请返回注册页面使用正确地址重新注册。",
      trouble4Title: "仍未收到？",
      trouble4Body: "请联系客服并附上注册邮箱以便快速处理。",
      contactSupport: "联系客服",
      backToSignup: "返回注册"
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
      resendCooldown: (s: number) => `Thử lại sau ${s} giây`,
      goLogin: "Đi tới đăng nhập",
      devLinkLabel: "Liên kết môi trường dev",
      troubleTitle: "Không nhận được email?",
      trouble1Title: "Kiểm tra thư mục spam/quảng cáo",
      trouble1Body: "Đây là nguyên nhân phổ biến nhất. Tìm 'Aply' hoặc 'info@flip-ers.com' trong mọi thư mục.",
      trouble2Title: "Bạn dùng email công ty?",
      trouble2Body: "Máy chủ email doanh nghiệp đôi khi cách ly email xác minh bên ngoài. Yêu cầu IT cho phép 'info@flip-ers.com', hoặc đăng ký lại bằng email cá nhân.",
      trouble3Title: "Địa chỉ email sai?",
      trouble3Body: "Nếu có lỗi đánh máy, hãy quay lại trang đăng ký và dùng địa chỉ đúng.",
      trouble4Title: "Vẫn không nhận được?",
      trouble4Body: "Liên hệ hỗ trợ và đính kèm địa chỉ email đăng ký để chúng tôi xử lý nhanh hơn.",
      contactSupport: "Liên hệ hỗ trợ",
      backToSignup: "Quay lại đăng ký"
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
      resendCooldown: (s: number) => `${s}秒後に再試行可能`,
      goLogin: "ログインへ移動",
      devLinkLabel: "開発環境リンク",
      troubleTitle: "認証メールが届かない場合",
      trouble1Title: "迷惑メール/プロモーションフォルダを確認",
      trouble1Body: "自動振り分けされる場合が最も多いです。'Aply' または 'info@flip-ers.com' で検索してください。",
      trouble2Title: "会社メールをご利用ですか？",
      trouble2Body: "企業メールサーバーは外部の認証メールを隔離することがあります。IT 担当者に 'info@flip-ers.com' の許可をご依頼いただくか、個人のメールアドレスで再登録ください。",
      trouble3Title: "メールアドレスが間違っている？",
      trouble3Body: "誤字がある場合は会員登録ページに戻り、正しいアドレスで再登録してください。",
      trouble4Title: "それでも届かない場合",
      trouble4Body: "サポート窓口までご連絡ください。登録メールを併記いただけるとスムーズです。",
      contactSupport: "サポートに問い合わせ",
      backToSignup: "会員登録に戻る"
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
      resendCooldown: (s: number) => `Coba lagi dalam ${s}d`,
      goLogin: "Ke halaman masuk",
      devLinkLabel: "Tautan lingkungan dev",
      troubleTitle: "Tidak menerima email?",
      trouble1Title: "Periksa folder spam/promosi",
      trouble1Body: "Ini penyebab paling umum. Cari 'Aply' atau 'info@flip-ers.com' di semua folder.",
      trouble2Title: "Apakah Anda memakai email kantor?",
      trouble2Body: "Server email perusahaan sering memblokir email verifikasi eksternal. Minta tim IT mengizinkan 'info@flip-ers.com', atau daftar ulang dengan email pribadi.",
      trouble3Title: "Salah ketik alamat email?",
      trouble3Body: "Jika ada salah ketik, kembali ke halaman pendaftaran dan gunakan alamat yang benar.",
      trouble4Title: "Masih belum menerima?",
      trouble4Body: "Hubungi dukungan dan sertakan email pendaftaran agar kami dapat membantu lebih cepat.",
      contactSupport: "Hubungi dukungan",
      backToSignup: "Kembali ke pendaftaran"
    }
  } as const;
  const copy = copyByLocale[locale] ?? copyByLocale.en;

  async function handleResend() {
    if (!email || cooldownLeft > 0) return;
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
        setCooldownLeft(RESEND_COOLDOWN_SECONDS);
        return;
      }
      setNotice(copy.resendUnavailable);
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.resendFailed);
    } finally {
      setIsSending(false);
    }
  }

  const supportSubject = encodeURIComponent(
    t(
      "Aply 인증 메일 미수신 문의",
      "Aply verification email not received",
      "Aply 验证邮件未收到咨询",
      "Aply email xác minh chưa nhận được",
      "Aply 認証メール未受信のお問い合わせ",
      "Aply email verifikasi tidak diterima"
    )
  );
  const supportBody = encodeURIComponent(
    t(
      "가입 이메일 주소: ",
      "Signup email address: ",
      "注册邮箱地址：",
      "Địa chỉ email đăng ký: ",
      "登録メールアドレス: ",
      "Alamat email pendaftaran: "
    ) + (email || "")
  );
  const supportMailto = `mailto:${SUPPORT_EMAIL}?subject=${supportSubject}&body=${supportBody}`;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
          <p className="text-sm text-muted-foreground">
            {email ? `${copy.targetEmailLabel}: ${email}` : copy.targetEmailFallback}
          </p>

          {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="dark"
              onClick={() => void handleResend()}
              disabled={!email || isSending || cooldownLeft > 0}
            >
              {isSending
                ? copy.resendLoading
                : cooldownLeft > 0
                  ? copy.resendCooldown(cooldownLeft)
                  : copy.resendButton}
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

          <div className="space-y-4 rounded-xl bg-muted/40 p-5">
            <h2 className="text-base font-semibold">{copy.troubleTitle}</h2>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">1. {copy.trouble1Title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.trouble1Body}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">2. {copy.trouble2Title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.trouble2Body}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">3. {copy.trouble3Title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.trouble3Body}</p>
              <Link
                href="/signup"
                className="inline-block pt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {copy.backToSignup} →
              </Link>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">4. {copy.trouble4Title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.trouble4Body}</p>
              <a
                href={supportMailto}
                className="inline-block pt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {copy.contactSupport} ({SUPPORT_EMAIL}) →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
