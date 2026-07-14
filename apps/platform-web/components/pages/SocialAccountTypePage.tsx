"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { AuthApiError, finalizeSocialSignup, type SocialProvider } from "../../lib/auth-client";

export function SocialAccountTypePage() {
  const router = useRouter();
  const { setAuthenticatedUser } = useAuthSession();
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const isZh = locale === "zh-CN";
  const isVi = locale === "vi";
  const isJa = locale === "ja";
  const isId = locale === "id";
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    isKo ? ko : isZh ? zh : isVi ? vi : isJa ? ja : isId ? id : en;

  const [ctx, setCtx] = useState<string | null>(null);
  const [provider, setProvider] = useState<SocialProvider | null>(null);
  const [accountType, setAccountType] = useState<"GENERAL" | "BUSINESS">("GENERAL");
  const [nextPath, setNextPath] = useState<string>("/profile");
  // 실명·이메일 — 운영상 학생에게 연락해야 하므로 실제 값이 필요하다.
  // provider 가 주는 값: 네이버=실명, 카카오=닉네임, 구글=표시이름 → 네이버만 신뢰할 수 있다.
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [needEmail, setNeedEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fragment = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(fragment);
    const ctxValue = params.get("ctx");
    const providerValue = params.get("provider");
    const nextValue = params.get("next");
    if (!ctxValue || (providerValue !== "naver" && providerValue !== "google" && providerValue !== "kakao")) {
      setErrorMessage(t("가입 정보가 만료되었습니다. 다시 시도해주세요.", "Signup session expired. Please try again.", "注册信息已过期，请重新尝试。", "Phiên đăng ký đã hết hạn. Vui lòng thử lại.", "登録情報の有効期限が切れました。もう一度お試しください。", "Informasi pendaftaran telah kedaluwarsa. Silakan coba lagi."));
      return;
    }
    setCtx(ctxValue);
    setProvider(providerValue);
    setNeedEmail(params.get("hasEmail") === "0");
    // 네이버가 준 이름은 실명이므로 미리 채워준다(사용자가 고칠 수 있음).
    const providerName = params.get("pname") ?? "";
    if (providerValue === "naver" && providerName) setRealName(providerName);
    if (nextValue && nextValue.startsWith("/") && !nextValue.startsWith("//")) {
      setNextPath(nextValue);
    }
  }, [isKo, isZh, isVi, isJa, isId]);

  // Event-landing flows (e.g. /events/saju) skip the account-type picker
  // — just register as GENERAL automatically so the viral funnel is one
  // continuous flow. Business intent always requires the manual picker.
  const isEventFlow = nextPath.startsWith("/events/");

  // 이벤트 플로우는 이 화면을 건너뛰고 자동 가입한다 —
  // 단, 실명/이메일이 비면 값을 지어낼 수 없으므로 그때는 화면을 보여주고 물어본다.
  const canAutoFinalize = Boolean(ctx && provider && !needEmail && realName.trim());
  useEffect(() => {
    if (!isEventFlow || !canAutoFinalize || isSubmitting) return;
    void handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEventFlow, canAutoFinalize]);

  async function handleSubmit() {
    if (!ctx || !provider || isSubmitting) return;
    if (!realName.trim()) {
      setErrorMessage(t("실명을 입력해주세요.", "Please enter your legal name.", "请输入真实姓名。", "Vui lòng nhập họ tên thật.", "本名を入力してください。", "Silakan masukkan nama asli Anda."));
      return;
    }
    if (needEmail && !email.trim()) {
      setErrorMessage(t("이메일을 입력해주세요.", "Please enter your email.", "请输入邮箱。", "Vui lòng nhập email.", "メールアドレスを入力してください。", "Silakan masukkan email Anda."));
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { user } = await finalizeSocialSignup({
        provider,
        ctx,
        accountType,
        realName: realName.trim(),
        ...(needEmail ? { email: email.trim() } : {})
      });
      setAuthenticatedUser(user);
      if (typeof window !== "undefined") {
        window.location.replace(nextPath);
        return;
      }
      router.replace(nextPath);
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EXPIRED_SIGNUP_CONTEXT") {
        setErrorMessage(t("가입 세션이 만료되었습니다. 다시 시도해주세요.", "Signup session expired. Please try again.", "注册会话已过期，请重新尝试。", "Phiên đăng ký đã hết hạn. Vui lòng thử lại.", "登録セッションの有効期限が切れました。もう一度お試しください。", "Sesi pendaftaran telah kedaluwarsa. Silakan coba lagi."));
      } else if (error instanceof AuthApiError && error.code === "INVALID_SIGNUP_CONTEXT") {
        setErrorMessage(t("유효하지 않은 가입 세션입니다.", "Invalid signup session.", "注册会话无效。", "Phiên đăng ký không hợp lệ.", "無効な登録セッションです。", "Sesi pendaftaran tidak valid."));
      } else {
        setErrorMessage(error instanceof Error ? error.message : t("가입에 실패했습니다.", "Signup failed.", "注册失败。", "Đăng ký thất bại.", "登録に失敗しました。", "Pendaftaran gagal."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const accountTypeOptions: Array<{
    value: "GENERAL" | "BUSINESS";
    label: string;
    description: string;
  }> = [
    {
      value: "GENERAL",
      label: t("일반회원", "General", "普通会员", "Thành viên cá nhân", "一般会員", "Anggota umum"),
      description: t("포지션 탐색, 지원, 커뮤니티 참여", "Browse positions, apply, and join the community", "浏览职位、申请、参与社区", "Tìm vị trí, ứng tuyển, tham gia cộng đồng", "ポジション検索、応募、コミュニティ参加", "Telusuri posisi, lamar, dan bergabung dengan komunitas")
    },
    {
      value: "BUSINESS",
      label: t("파트너회원", "Partner", "合作企业会员", "Thành viên đối tác", "パートナー会員", "Anggota mitra"),
      description: t("포지션 등록, 후보자 매칭", "Post positions and match with candidates", "发布职位、匹配候选人", "Đăng vị trí, kết nối ứng viên", "ポジション登録、候補者マッチング", "Pasang posisi dan cocokkan dengan kandidat")
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <section>
          <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-6 md:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t("회원 유형을 선택해주세요", "Choose your account type", "请选择会员类型", "Vui lòng chọn loại tài khoản", "会員タイプを選択してください", "Silakan pilih tipe akun")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(
                "가입 마지막 단계입니다. 사용하실 유형을 선택해주세요.",
                "This is the final step. Pick the type that fits you best.",
                "这是注册的最后一步，请选择适合您的会员类型。",
                "Đây là bước cuối cùng. Hãy chọn loại tài khoản phù hợp với bạn.",
                "登録の最終ステップです。ご利用になるタイプを選択してください。",
                "Ini langkah terakhir. Pilih tipe yang paling sesuai untuk Anda."
              )}
            </p>

            <div className="mt-6 space-y-2">
              {accountTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setAccountType(option.value);
                    setErrorMessage(null);
                  }}
                  disabled={!ctx || !provider || isSubmitting}
                  className={
                    accountType === option.value
                      ? "block w-full rounded-md border-2 border-foreground bg-card p-4 text-left transition"
                      : "block w-full rounded-md border border-input/60 bg-card p-4 text-left transition hover:border-foreground/40"
                  }
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>

            {/* 실명 — 학교 제출 문서·연락에 필요. 네이버는 provider 값을 미리 채워둔다. */}
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="social-realname" className="block text-sm font-semibold">
                  {t("실명", "Legal name", "真实姓名", "Họ tên thật", "本名", "Nama asli")}
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(
                    "지원서·수료증 등 공식 서류에 사용돼요. 닉네임이 아닌 실제 이름을 입력해주세요.",
                    "Used on official documents such as applications and certificates. Please use your real name, not a nickname.",
                    "将用于申请书、结业证书等正式文件。请填写真实姓名，而非昵称。",
                    "Được dùng cho hồ sơ, giấy chứng nhận và các giấy tờ chính thức. Vui lòng nhập tên thật, không phải biệt danh.",
                    "応募書類や修了証などの公式書類に使われます。ニックネームではなく本名を入力してください。",
                    "Digunakan untuk dokumen resmi seperti lamaran dan sertifikat. Masukkan nama asli, bukan nama panggilan."
                  )}
                </p>
                <input
                  id="social-realname"
                  value={realName}
                  onChange={(e) => {
                    setRealName(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  maxLength={120}
                  className="mt-2 h-11 w-full rounded-md border border-input/60 bg-card px-3 text-sm outline-none focus:border-foreground/60"
                  placeholder={t("예) 홍길동", "e.g. Jane Doe", "例）张三", "VD) Nguyen Van A", "例）山田太郎", "Contoh) Budi Santoso")}
                />
              </div>

              {/* 이메일 — provider 가 주지 않은 경우에만. 가짜 주소를 만들지 않는다. */}
              {needEmail ? (
                <div>
                  <label htmlFor="social-email" className="block text-sm font-semibold">
                    {t("이메일", "Email", "邮箱", "Email", "メールアドレス", "Email")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      "연동한 계정에서 이메일을 받지 못했어요. 안내를 받을 이메일을 입력해주세요.",
                      "We couldn't get an email from your social account. Please enter one so we can reach you.",
                      "未能从您的社交账号获取邮箱，请输入可接收通知的邮箱。",
                      "Chúng tôi không nhận được email từ tài khoản mạng xã hội của bạn. Vui lòng nhập email để nhận thông báo.",
                      "連携したアカウントからメールアドレスを取得できませんでした。ご案内を受け取るメールを入力してください。",
                      "Kami tidak mendapat email dari akun sosial Anda. Masukkan email agar kami bisa menghubungi Anda."
                    )}
                  </p>
                  <input
                    id="social-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    disabled={isSubmitting}
                    maxLength={200}
                    className="mt-2 h-11 w-full rounded-md border border-input/60 bg-card px-3 text-sm outline-none focus:border-foreground/60"
                    placeholder="you@example.com"
                  />
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <p className="mt-4 text-sm font-medium text-destructive">{errorMessage}</p>
            ) : null}

            <div className="mt-6">
              <Button
                variant="dark"
                size="lg"
                className="h-11 w-full"
                onClick={() => void handleSubmit()}
                disabled={!ctx || !provider || isSubmitting}
              >
                {isSubmitting
                  ? t("가입 중...", "Signing up...", "注册中...", "Đang đăng ký...", "登録中...", "Sedang mendaftar...")
                  : t("계속하기", "Continue", "继续", "Tiếp tục", "続行", "Lanjut")}
              </Button>
            </div>

            {!ctx && !errorMessage ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {t("가입 정보를 확인하는 중입니다...", "Checking signup info...", "正在确认注册信息...", "Đang kiểm tra thông tin đăng ký...", "登録情報を確認中です...", "Memeriksa info pendaftaran...")}
              </p>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
