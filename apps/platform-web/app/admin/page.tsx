"use client";

// aply.global/admin — 관리자(OPERATOR) 전용 로그인. 운영 콘솔(/dashboard/ops)과 동일 권한.
// 탤런트·파트너 로그인과 완전히 동일한 너비·간격을 위해 공용 TalentAuthLayout 를 그대로 재사용한다.
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { AuthApiError, loginWithEmail, clearAccessToken } from "../../lib/auth-client";
import { TalentButton } from "../../components/talent/TalentButton";
import { TalentAuthLayout, TalentField, talentInputClass } from "../../components/talent/auth/TalentAuthLayout";

const OPS_HOME = "/dashboard/ops";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isReady, isAuthenticated, setAuthenticatedUser, logout } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isOperator = user?.role === "OPERATOR";

  // 이미 관리자로 로그인돼 있으면 바로 운영 콘솔로.
  useEffect(() => {
    if (isReady && isAuthenticated && isOperator) router.replace(OPS_HOME);
  }, [isReady, isAuthenticated, isOperator, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user: u } = await loginWithEmail({ email, password });
      if (u.role !== "OPERATOR") {
        // 관리자 계정이 아니면 세션을 즉시 폐기하고 접근 차단.
        clearAccessToken();
        setError("관리자 계정만 접근할 수 있어요.");
        return;
      }
      setAuthenticatedUser(u);
      router.replace(OPS_HOME);
      router.refresh();
    } catch (err) {
      if (err instanceof AuthApiError && err.code === "EMAIL_VERIFICATION_REQUIRED") {
        setError("이메일 인증이 필요한 계정이에요.");
        return;
      }
      setError(err instanceof Error ? err.message : "로그인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  // 세션 확인 중 · 관리자 로그인 완료(이동 중) → 폼 깜빡임 방지.
  if (!isReady || (isAuthenticated && isOperator)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="inline-flex items-center gap-2 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> 불러오는 중…</span>
      </div>
    );
  }

  return (
    <TalentAuthLayout
      badge="Admin"
      backHref="/"
      title="관리자 콘솔 로그인"
      subtitle="운영자(Admin) 계정만 접근할 수 있어요."
    >
      {isAuthenticated && !isOperator ? (
        // 로그인은 돼 있으나 관리자가 아닌 경우 — 접근 차단 안내.
        <div className="space-y-4 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-6 text-center">
          <p className="text-[15px] font-bold text-[#191F28]">관리자 전용 페이지예요</p>
          <p className="break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">현재 계정({user?.email})은 관리자 권한이 없어요. 관리자 계정으로 다시 로그인해 주세요.</p>
          <TalentButton type="button" onClick={() => void logout()} variant="primary" size="lg" fullWidth aria-label="로그아웃하고 다시 로그인">
            로그아웃하고 다시 로그인
          </TalentButton>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <TalentField label="이메일">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aply.global"
              className={talentInputClass}
              required
              autoComplete="email"
            />
          </TalentField>
          <TalentField label="비밀번호">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className={talentInputClass}
              required
              autoComplete="current-password"
            />
          </TalentField>
          {error ? <p className="text-[13.5px] font-medium text-[#F04452]">{error}</p> : null}
          <TalentButton type="submit" disabled={submitting} variant="primary" size="lg" fullWidth aria-label="로그인">
            {submitting ? "로그인 중…" : "로그인"}
          </TalentButton>
        </form>
      )}
    </TalentAuthLayout>
  );
}
