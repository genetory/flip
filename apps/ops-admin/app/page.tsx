"use client";

import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveAdminAuthErrorMessage } from "../lib/auth-errors";

const TOKEN_COOKIE_KEY = "ops_admin_token";

export default function OpsAdminHome() {
  const router = useRouter();
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("!Test1234");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        token?: string;
        user?: { role?: string };
        code?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok || !payload.token) {
        setErrorMessage(resolveAdminAuthErrorMessage(payload.code, payload.message));
        return;
      }

      if (payload.user?.role !== "OPERATOR") {
        setErrorMessage("운영 관리자(OPERATOR) 계정만 로그인할 수 있습니다.");
        return;
      }

      document.cookie = `${TOKEN_COOKIE_KEY}=${payload.token}; Path=/; Max-Age=604800; SameSite=Lax`;
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("서버에 연결할 수 없습니다. API 실행 상태를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ops-page">
      <section className="ops-hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden>
              <img src="/icon_logo.svg" alt="" />
            </span>
          </div>

          <p className="hero-label">
            <ShieldCheck className="hero-label-icon" weight="duotone" aria-hidden />
            운영 관리자 전용
          </p>
          <h1>
            관리자 운영을
            <br />
            한 화면에서
          </h1>
          <p className="hero-desc">
            파트너, 프로그램, 이슈 현황을 통합 관리하는
            <br />
            Flip 운영 관리자 콘솔입니다.
          </p>
        </div>
      </section>

      <section className="ops-login-area">
        <div className="ops-login-card">
          <h2>관리자 로그인</h2>
          <p className="subtitle">운영 콘솔에 접속해 전체 데이터를 관리하세요</p>

          <form className="ops-login-form" onSubmit={handleLogin}>
            <label>
              이메일
              <input
                type="email"
                placeholder="admin@flip.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              <span className="row-between">
                비밀번호
                <a href="#">비밀번호 찾기</a>
              </span>
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {errorMessage ? <p className="ops-login-error">{errorMessage}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "로그인 중..." : "관리자 로그인"}
            </button>
          </form>

          <article className="ops-benefits-box">
            <h3>운영자 기능</h3>
            <ul>
              <li>파트너 계정 및 권한 관리</li>
              <li>프로그램 배치 상태 모니터링</li>
              <li>지원/매칭 운영 지표 확인</li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
