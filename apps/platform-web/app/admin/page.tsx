"use client";

// aply.global/admin — 관리자(OPERATOR) 전용 로그인. 운영 콘솔(/dashboard/ops)과 동일 권한.
// 관리자 계정으로 로그인하면 운영 콘솔로 이동하고, 관리자가 아니면 접근을 막는다.
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CircleNotch } from "@phosphor-icons/react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { AuthApiError, loginWithEmail, clearAccessToken } from "../../lib/auth-client";

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
      <div className="flex min-h-screen items-center justify-center bg-[#0B1120]">
        <span className="inline-flex items-center gap-2 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> 불러오는 중…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B1120] px-5 py-14">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#182238] text-[#7C93FF]"><ShieldCheck className="h-7 w-7" weight="fill" /></span>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#5B6b8c]">Admin</p>
          <h1 className="mt-1.5 text-[24px] font-black tracking-[-0.02em] text-white">관리자 콘솔 로그인</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#8B95A1]">운영자(Admin) 계정만 접근할 수 있어요.</p>
        </div>

        {isAuthenticated && !isOperator ? (
          // 로그인은 돼 있으나 관리자가 아닌 경우 — 접근 차단 안내.
          <div className="rounded-2xl border border-[#26324a] bg-[#111a2e] p-6 text-center">
            <p className="text-[14px] font-bold text-white">관리자 전용 페이지예요</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#8B95A1]">현재 계정({user?.email})은 관리자 권한이 없어요. 관리자 계정으로 다시 로그인해 주세요.</p>
            <button
              type="button"
              onClick={() => {
                void logout();
              }}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-white text-[14px] font-bold text-[#0B1120] transition hover:bg-[#E5E9F0]"
            >
              로그아웃하고 다시 로그인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#1e2942] bg-[#111a2e] p-6 md:p-7">
            <label className="block">
              <span className="mb-2 block text-[13px] font-semibold text-[#9AA6BF]">이메일</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aply.global"
                required
                autoComplete="email"
                className="h-[50px] w-full rounded-xl border border-[#26324a] bg-[#0B1120] px-4 text-[15px] text-white outline-none transition placeholder:text-[#4B5772] focus:border-[#7C93FF] focus:ring-2 focus:ring-[#7C93FF]/25"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-[13px] font-semibold text-[#9AA6BF]">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                autoComplete="current-password"
                className="h-[50px] w-full rounded-xl border border-[#26324a] bg-[#0B1120] px-4 text-[15px] text-white outline-none transition placeholder:text-[#4B5772] focus:border-[#7C93FF] focus:ring-2 focus:ring-[#7C93FF]/25"
              />
            </label>
            {error ? <p className="mt-3 text-[13px] font-medium text-[#FF8A8A]">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex h-[50px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#3B6BFF] text-[15px] font-bold text-white transition hover:bg-[#2F5AE0] disabled:opacity-60"
            >
              {submitting ? <><CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> 로그인 중…</> : "로그인"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-[12px] text-[#4B5772]">© APLY · 관리자 콘솔</p>
      </div>
    </div>
  );
}
