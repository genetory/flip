"use client";

// Career Launch 로그인 — 리뉴얼 auth 레이아웃(Toss 톤) 재사용. 학생 전용 프로그램이라
// 기업(PARTNER) 계정은 차단하고, 학생·운영자만 대시보드로 진입시킨다.
import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { AuthApiError, loginWithEmail, clearAccessToken } from "../../lib/auth-client";
import { useLaunchT } from "../../lib/launch/i18n";
import { TalentButton } from "../talent/TalentButton";
import { TalentAuthLayout, TalentField, talentInputClass } from "../talent/auth/TalentAuthLayout";

export function CareerLaunchLoginPage() {
  const t = useLaunchT();
  const router = useRouter();
  const { setAuthenticatedUser } = useAuthSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { user } = await loginWithEmail({ email, password });
      // 학생 전용 — 기업 계정은 차단(운영자는 슈퍼유저로 학생 화면 접근 허용).
      if (user.role === "PARTNER") {
        clearAccessToken();
        setErrorMessage(
          t(
            "Career Launch는 학생 전용 프로그램이에요. 기업 계정으로는 이용할 수 없어요.",
            "Career Launch is for students only. Business accounts can't access it.",
            "Career Launch 是仅面向学生的项目，企业账号无法使用。",
            "Career Launch chỉ dành cho sinh viên. Tài khoản doanh nghiệp không thể sử dụng.",
            "Career Launchは学生専用プログラムです。企業アカウントではご利用いただけません。",
            "Career Launch hanya untuk mahasiswa. Akun bisnis tidak bisa mengakses."
          )
        );
        return;
      }
      setAuthenticatedUser(user);
      router.push("/career-launch/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_VERIFICATION_REQUIRED") {
        const params = new URLSearchParams();
        if (email.trim()) params.set("email", email.trim());
        router.push(`/signup/verify-email?${params.toString()}`);
        router.refresh();
        return;
      }
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("로그인에 실패했어요. 다시 시도해 주세요.", "Login failed. Please try again.", "登录失败，请重试。", "Đăng nhập thất bại. Vui lòng thử lại.", "ログインに失敗しました。もう一度お試しください。", "Gagal masuk. Silakan coba lagi.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TalentAuthLayout
      badge="Career Launch"
      backHref="/"
      title={t("Career Launch 로그인", "Career Launch login", "Career Launch 登录", "Đăng nhập Career Launch", "Career Launch ログイン", "Masuk Career Launch")}
      subtitle={t(
        "외국인 유학생을 위한 4주 한국 취업 준비 부트캠프예요.",
        "A 4-week Korea job-prep bootcamp for international students.",
        "为外国留学生打造的4周韩国就业准备训练营。",
        "Trại huấn luyện 4 tuần chuẩn bị xin việc tại Hàn Quốc cho du học sinh.",
        "外国人留学生のための4週間・韓国就職準備ブートキャンプです。",
        "Bootcamp persiapan kerja di Korea 4 minggu untuk mahasiswa internasional."
      )}
      footer={
        <p className="text-[14px] text-[#8B95A1]">
          {t("아직 계정이 없나요?", "Don't have an account yet?", "还没有账号？", "Chưa có tài khoản?", "アカウントがありませんか？", "Belum punya akun?")}{" "}
          <Link href="/talent/signup?next=/career-launch/dashboard" className="font-bold text-[#0B46E8]">
            {t("학생으로 가입하기", "Sign up as a student", "以学生身份注册", "Đăng ký với tư cách sinh viên", "学生として登録", "Daftar sebagai mahasiswa")}
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TalentField label={t("이메일", "Email", "邮箱", "Email", "メール", "Email")}>
          <input
            type="email"
            placeholder={t("이메일 주소", "Email address", "邮箱地址", "Địa chỉ email", "メールアドレス", "Alamat email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={talentInputClass}
            required
            autoComplete="email"
          />
        </TalentField>
        <TalentField label={t("비밀번호", "Password", "密码", "Mật khẩu", "パスワード", "Kata sandi")}>
          <input
            type="password"
            placeholder={t("비밀번호", "Password", "密码", "Mật khẩu", "パスワード", "Kata sandi")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={talentInputClass}
            required
            autoComplete="current-password"
          />
        </TalentField>
        {errorMessage ? <p className="text-[13.5px] font-medium text-[#F04452]">{errorMessage}</p> : null}
        <TalentButton type="submit" disabled={isSubmitting} variant="primary" size="lg" fullWidth aria-label={t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}>
          {isSubmitting ? t("로그인 중…", "Logging in…", "登录中…", "Đang đăng nhập…", "ログイン中…", "Sedang masuk…") : t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
        </TalentButton>
      </form>
    </TalentAuthLayout>
  );
}
