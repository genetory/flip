"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  AuthApiError,
  deleteMyAccount,
  reauthWithPassword,
  startOAuthReauth
} from "../../lib/auth-client";
import { usePlatformT } from "../../lib/i18n";

type Step = "intro" | "reauth" | "ready" | "deleting" | "done";

export function AccountDeletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, isAuthenticated, user, logout } = useAuthSession();
  const { locale } = useLanguage();

  const t = usePlatformT();

  const [step, setStep] = useState<Step>("intro");
  const [reauthToken, setReauthToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const provider = user?.authProvider ?? null;

  const providerLabel = useMemo(() => {
    if (provider === "NAVER") return t("네이버", "Naver", "Naver", "Naver", "Naver", "Naver");
    if (provider === "GOOGLE") return t("구글", "Google", "Google", "Google", "Google", "Google");
    if (provider === "KAKAO") return t("카카오", "Kakao", "Kakao", "Kakao", "Kakao", "Kakao");
    return t("이메일", "Email", "邮箱", "Email", "メール", "Email");
  }, [provider, locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fragment = window.location.hash.slice(1);
    if (fragment) {
      const params = new URLSearchParams(fragment);
      const token = params.get("reauth_token");
      if (token) {
        setReauthToken(token);
        setStep("ready");
        if (window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname);
        }
        return;
      }
    }
    const reauthError = searchParams?.get("reauth_error");
    if (reauthError === "mismatch") {
      setErrorMessage(
        t(
          "현재 로그인 계정과 다른 계정으로 인증했습니다. 같은 계정으로 다시 시도해주세요.",
          "You authenticated with a different account. Please retry with the same account.",
          "您使用了与当前登录账户不同的账户。请使用同一账户重试。",
          "Bạn đã xác thực bằng một tài khoản khác. Vui lòng thử lại với cùng tài khoản.",
          "現在ログイン中のアカウントと異なるアカウントで認証されました。同じアカウントで再度お試しください。",
          "Anda mengautentikasi dengan akun yang berbeda. Silakan coba lagi dengan akun yang sama."
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { reauthToken: token } = await reauthWithPassword(password);
      setReauthToken(token);
      setPassword("");
      setStep("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("재인증에 실패했습니다.", "Reauthentication failed.", "重新认证失败。", "Xác thực lại không thành công.", "再認証に失敗しました。", "Autentikasi ulang gagal."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOAuthReauth() {
    if (!provider || provider === "EMAIL") return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const providerKey = provider.toLowerCase() as "naver" | "google" | "kakao";
      const authorizeUrl = await startOAuthReauth(providerKey);
      window.location.href = authorizeUrl;
    } catch (error) {
      setIsSubmitting(false);
      setErrorMessage(error instanceof Error ? error.message : t("재인증을 시작할 수 없습니다.", "Could not start reauthentication.", "无法开始重新认证。", "Không thể bắt đầu xác thực lại.", "再認証を開始できません。", "Tidak dapat memulai autentikasi ulang."));
    }
  }

  async function handleFinalDelete() {
    if (!reauthToken) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    setStep("deleting");
    try {
      await deleteMyAccount(reauthToken);
      try {
        await logout();
      } catch {
        // ignore
      }
      setStep("done");
      window.setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      setStep("ready");
      setIsSubmitting(false);
      const message = error instanceof AuthApiError
        ? (error.code === "REAUTH_REQUIRED"
          ? t(
            "재인증이 만료되었습니다. 다시 인증해주세요.",
            "Reauthentication has expired. Please verify again.",
            "重新认证已过期，请再次验证。",
            "Xác thực lại đã hết hạn. Vui lòng xác minh lại.",
            "再認証の有効期限が切れました。もう一度認証してください。",
            "Autentikasi ulang telah kedaluwarsa. Silakan verifikasi kembali."
          )
          : error.message)
        : t("탈퇴 처리에 실패했습니다.", "Failed to delete the account.", "注销账户失败。", "Xóa tài khoản thất bại.", "退会処理に失敗しました。", "Gagal menghapus akun.");
      setErrorMessage(message);
      if (error instanceof AuthApiError && error.code === "REAUTH_REQUIRED") {
        setReauthToken(null);
        setStep("reauth");
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {t("회원 탈퇴", "Delete account", "注销账户", "Xoá tài khoản", "退会", "Hapus akun")}
          </h1>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="text-sm font-semibold text-destructive">
              {t("탈퇴 전 꼭 확인해주세요", "Before you delete", "注销前请确认", "Vui lòng kiểm tra trước khi xoá", "退会前にご確認ください", "Harap baca sebelum menghapus")}
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
              <li>{t("프로필, 지원, 프로그램, 알림 등 모든 데이터가 즉시 삭제됩니다.", "All data (profile, applications, programs, notifications) will be deleted immediately.", "您的所有数据(资料、申请、项目、通知等)将立即被删除。", "Toàn bộ dữ liệu (hồ sơ, ứng tuyển, chương trình, thông báo) sẽ bị xoá ngay lập tức.", "プロフィール、応募、プログラム、通知などすべてのデータが即座に削除されます。", "Semua data (profil, lamaran, program, notifikasi) akan langsung dihapus.")}</li>
              <li>{t("삭제된 데이터는 복구할 수 없습니다.", "Deleted data cannot be recovered.", "已删除的数据无法恢复。", "Dữ liệu đã xoá không thể khôi phục.", "削除されたデータは復元できません。", "Data yang dihapus tidak dapat dipulihkan.")}</li>
              <li>{t("탈퇴 후에는 동일한 이메일로 다시 가입할 수 있습니다.", "You can re-register with the same email after deletion.", "注销后可以使用相同的邮箱重新注册。", "Sau khi xoá, bạn có thể đăng ký lại bằng cùng email.", "退会後、同じメールアドレスで再登録できます。", "Setelah penghapusan, Anda dapat mendaftar ulang dengan email yang sama.")}</li>
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 md:p-6">
            <h2 className="text-sm font-semibold">
              {t("본인 확인", "Verify it's you", "本人验证", "Xác minh danh tính", "本人確認", "Verifikasi identitas")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {provider === "EMAIL"
                ? t("비밀번호를 입력해 본인 확인을 진행해주세요.", "Enter your password to confirm it's you.", "请输入密码以确认身份。", "Nhập mật khẩu để xác minh danh tính.", "パスワードを入力して本人確認を行ってください。", "Masukkan kata sandi Anda untuk verifikasi.")
                : t(
                  `${providerLabel} 계정으로 다시 로그인해 본인 확인을 진행해주세요.`,
                  `Sign in again with your ${providerLabel} account to confirm it's you.`,
                  `请使用 ${providerLabel} 账户重新登录以确认身份。`,
                  `Đăng nhập lại bằng tài khoản ${providerLabel} để xác minh danh tính.`,
                  `${providerLabel} アカウントで再度ログインし、本人確認を行ってください。`,
                  `Masuk kembali dengan akun ${providerLabel} untuk verifikasi.`
                )}
            </p>

            {step === "ready" || step === "deleting" || step === "done" ? (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {t("본인 확인이 완료되었습니다.", "Verification complete.", "身份验证完成。", "Xác minh hoàn tất.", "本人確認が完了しました。", "Verifikasi selesai.")}
              </p>
            ) : provider === "EMAIL" ? (
              <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
                <label className="block text-sm font-medium">
                  {t("비밀번호", "Password", "密码", "Mật khẩu", "パスワード", "Kata sandi")}
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("비밀번호를 입력해주세요", "Enter your password", "请输入密码", "Nhập mật khẩu", "パスワードを入力してください", "Masukkan kata sandi")}
                    className="mt-2 h-10 w-full rounded-md border border-input/60 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </label>
                <Button type="submit" variant="dark" size="sm" disabled={isSubmitting || !password.trim()}>
                  {isSubmitting
                    ? t("확인 중...", "Verifying...", "验证中...", "Đang xác minh...", "確認中...", "Sedang memverifikasi...")
                    : t("본인 확인", "Verify", "验证", "Xác minh", "本人確認", "Verifikasi")}
                </Button>
              </form>
            ) : provider ? (
              <div className="mt-4">
                <Button type="button" variant="dark" size="sm" onClick={() => void handleOAuthReauth()} disabled={isSubmitting}>
                  {isSubmitting
                    ? t("이동 중...", "Redirecting...", "跳转中...", "Đang chuyển hướng...", "移動中...", "Mengalihkan...")
                    : t(`${providerLabel}로 다시 로그인`, `Sign in again with ${providerLabel}`, `使用 ${providerLabel} 重新登录`, `Đăng nhập lại với ${providerLabel}`, `${providerLabel} で再ログイン`, `Masuk lagi dengan ${providerLabel}`)}
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                {t("계정 정보를 불러오는 중입니다...", "Loading account info...", "正在加载账户信息...", "Đang tải thông tin tài khoản...", "アカウント情報を読み込んでいます...", "Memuat info akun...")}
              </p>
            )}

            {errorMessage ? (
              <p className="mt-3 text-xs font-medium text-destructive">{errorMessage}</p>
            ) : null}
          </section>

          {(step === "ready" || step === "deleting" || step === "done") && (
            <section className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 md:p-6">
              <h2 className="text-sm font-semibold text-destructive">
                {t("회원 탈퇴 확정", "Confirm deletion", "确认注销", "Xác nhận xoá tài khoản", "退会の確定", "Konfirmasi hapus akun")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("아래 버튼을 누르면 즉시 회원 탈퇴가 처리됩니다.", "Pressing the button below will delete your account immediately.", "点击以下按钮将立即注销您的账户。", "Nhấn nút bên dưới để xoá tài khoản ngay lập tức.", "下のボタンを押すと、すぐに退会処理が行われます。", "Menekan tombol di bawah akan menghapus akun Anda segera.")}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={() => void handleFinalDelete()} disabled={isSubmitting || step === "done"}>
                  {step === "deleting"
                    ? t("탈퇴 처리 중...", "Deleting...", "正在注销...", "Đang xoá...", "退会処理中...", "Sedang menghapus...")
                    : step === "done"
                      ? t("탈퇴 완료", "Deleted", "已注销", "Đã xoá", "退会完了", "Akun dihapus")
                      : t("회원 탈퇴하기", "Delete my account", "注销我的账户", "Xoá tài khoản", "退会する", "Hapus akun saya")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push("/profile")} disabled={isSubmitting && step !== "done"}>
                  {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
                </Button>
              </div>
            </section>
          )}

          {step !== "ready" && step !== "deleting" && step !== "done" ? (
            <div className="mt-6">
              <Button variant="ghost" size="sm" onClick={() => router.push("/profile")}>
                {t("취소하고 돌아가기", "Cancel and go back", "取消并返回", "Huỷ và quay lại", "キャンセルして戻る", "Batal dan kembali")}
              </Button>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
