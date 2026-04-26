"use client";

import { BuildingOffice, GlobeHemisphereWest } from "@phosphor-icons/react/dist/ssr";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveAdminAuthErrorMessage } from "../lib/auth-errors";

const TOKEN_COOKIE_KEY = "partner_admin_token";

export default function PartnerAdminHome() {
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

      if (payload.user?.role !== "PARTNER" && payload.user?.role !== "OPERATOR") {
        setErrorMessage("파트너 권한 계정만 로그인할 수 있습니다.");
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
    <main className="partner-page">
      <section className="partner-hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden>
              <img src="/icon_logo.svg" alt="" />
            </span>
          </div>

          <span className="badge">
            <BuildingOffice className="badge-icon" weight="duotone" aria-hidden />
            파트너 전용
          </span>

          <h1>
            최고의 인재를
            <br />
            채용하세요
          </h1>

          <p>
            Flip에서 우수한 인턴십 인재를 만나고,
            <br />
            파트너의 미래를 함께 설계하세요.
          </p>

          <div className="hero-stats">
            <article>
              <strong>3,000+</strong>
              <span>등록된 학생</span>
            </article>
            <article>
              <strong>95%</strong>
              <span>매칭 성공률</span>
            </article>
          </div>
        </div>
      </section>

      <section className="partner-login-area">
        <div className="locale">
          <GlobeHemisphereWest className="locale-globe" weight="duotone" aria-hidden />
          <span>🇰🇷</span>
        </div>

        <div className="login-card">
          <h2>파트너 로그인</h2>
          <p className="subtitle">인턴십 프로그램을 관리하세요</p>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              이메일
              <input
                type="email"
                placeholder="example@company.com"
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

            {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <article className="benefits-box">
            <h3>
              <BuildingOffice className="benefits-title-icon" weight="duotone" aria-hidden />
              <span>파트너 혜택</span>
            </h3>
            <ul>
              <li>인턴십 공고 등록</li>
              <li>지원자 관리</li>
              <li>학생 프로필 열람</li>
            </ul>
          </article>

          <div className="divider">또는</div>

          <div className="link-block">
            <p>
              계정이 없으신가요? <a href="#">회원가입</a>
            </p>
            <p>
              학생이신가요? <a href="#">학생 로그인</a>
            </p>
          </div>
        </div>

        <p className="copyright">© 2026 주식회사 플리퍼스(Flip-ers). All rights reserved.</p>
      </section>
    </main>
  );
}
