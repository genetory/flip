import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const TOKEN_COOKIE_KEY = "partner_admin_token";

async function fetchWithAuth<T>(path: string, token: string): Promise<T | null> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_KEY)?.value;

  if (!token) {
    redirect("/");
  }

  const dashboard = await fetchWithAuth<{ ok: boolean; message: string }>("/partner/dashboard", token);
  const me = await fetchWithAuth<{
    ok: boolean;
    user: { email: string; name: string | null; role: string; partnerType: string | null };
  }>("/auth/me", token);

  if (!dashboard || !me?.ok) {
    redirect("/");
  }

  return (
    <main className="partner-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>파트너 대시보드</h1>
          <p>로그인 상태가 확인되었습니다. 이제 실제 기능 화면을 연결하면 됩니다.</p>
        </div>
        <form action="/logout" method="post">
          <button type="submit" className="logout-button">
            로그아웃
          </button>
        </form>
      </header>

      <section className="dashboard-grid">
        <article>
          <h2>계정 정보</h2>
          <ul>
            <li>
              <span>이메일</span>
              <strong>{me.user.email}</strong>
            </li>
            <li>
              <span>권한</span>
              <strong>{me.user.role}</strong>
            </li>
            <li>
              <span>파트너 타입</span>
              <strong>{me.user.partnerType ?? "-"}</strong>
            </li>
          </ul>
        </article>
        <article>
          <h2>접근 상태</h2>
          <p>{dashboard.message}</p>
          <p>다음 단계에서 공고 관리, 지원자 관리, 학생 검색 모듈을 이 영역에 배치하면 됩니다.</p>
        </article>
      </section>
    </main>
  );
}
