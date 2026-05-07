import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "./_components/DashboardSidebar";

const TOKEN_COOKIE_KEY = "partner_admin_token";

async function validatePartner(token: string) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as { ok?: boolean; user?: { role?: string } };
    if (!payload.ok || payload.user?.role !== "PARTNER") return null;
    return payload.user;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_KEY)?.value;
  if (!token) redirect("/");

  const user = await validatePartner(token);
  if (!user) redirect("/");

  return (
    <main className="ops-console-shell">
      <DashboardSidebar />
      <div className="ops-console-main">{children}</div>
    </main>
  );
}
