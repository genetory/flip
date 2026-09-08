import { ImageResponse } from "next/og";

// 공유 링크 미리보기용 동적 OG 이미지 — 이름·티어·취업 준비도를 담은 1200×630 카드.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ token: string }> };

const TIER: Record<string, { label: string; bg: string; ink: string; accent: string }> = {
  preparing: { label: "준비 중", bg: "#F2F4F6", ink: "#8B95A1", accent: "#C9CDD2" },
  bronze: { label: "Verified Bronze", bg: "#F6ECE3", ink: "#A96A3E", accent: "#C08457" },
  silver: { label: "Verified Silver", bg: "#EEF1F5", ink: "#5A6472", accent: "#8B95A1" },
  gold: { label: "Verified Gold", bg: "#FBF2D6", ink: "#A97B00", accent: "#E0A500" }
};

export default async function Image({ params }: Props) {
  const { token } = await params;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  type Pass = { name?: string | null; tier?: string; readiness?: number; target?: { role?: string | null }; scores?: Record<string, number | null> };
  let p: Pass | null = null;
  try {
    const res = await fetch(`${apiBase}/career-launch/passport/shared/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (res.ok) p = ((await res.json()) as { passport?: Pass }).passport ?? null;
  } catch {
    /* 실패 시 기본 카드 */
  }

  // 한글 렌더용 폰트(실패해도 라틴은 기본 폰트로 렌더).
  let fontData: ArrayBuffer | null = null;
  try {
    const r = await fetch("https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.woff");
    if (r.ok) fontData = await r.arrayBuffer();
  } catch {
    /* ignore */
  }

  const tier = TIER[p?.tier ?? "preparing"] ?? TIER.preparing;
  const name = (p?.name || "익명 인재").slice(0, 24);
  const role = (p?.target?.role || "").slice(0, 40);
  const readiness = typeof p?.readiness === "number" ? p.readiness : 0;
  const scores: { label: string; v: number | null | undefined }[] = [
    { label: "커리어", v: p?.scores?.career },
    { label: "이력서", v: p?.scores?.resume },
    { label: "자소서", v: p?.scores?.cover },
    { label: "면접", v: p?.scores?.interview }
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(135deg,#0B1227 0%,#132046 60%,#0B46E8 140%)", color: "#fff", padding: "64px 72px", fontFamily: "NotoKR, sans-serif" }}>
        {/* 상단 브랜드 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#8CA8FF", letterSpacing: 4 }}>APLY</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: 2, marginTop: 4 }}>TALENT PASSPORT</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", background: tier.bg, color: tier.ink, borderRadius: 999, padding: "12px 24px", fontSize: 26, fontWeight: 800 }}>
            {p?.tier && p.tier !== "preparing" ? "✓ " : ""}{tier.label}
          </div>
        </div>

        {/* 가운데 — 이름 + 준비도 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, marginTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>{name}</div>
            {role ? <div style={{ fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.72)", marginTop: 14 }}>{role}</div> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 260, height: 260, borderRadius: 999, border: `14px solid ${tier.accent}`, justifyContent: "center", background: "rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 108, fontWeight: 800, lineHeight: 1 }}>{readiness}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 6, letterSpacing: 1 }}>READINESS</div>
          </div>
        </div>

        {/* 하단 — 점수 칩 + 도메인 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
          <div style={{ display: "flex" }}>
            {scores.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: "14px 26px", marginRight: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
                <div style={{ fontSize: 34, fontWeight: 800, marginTop: 2 }}>{typeof s.v === "number" ? s.v : "–"}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: "#8CA8FF" }}>aply.global</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: "NotoKR", data: fontData, style: "normal", weight: 700 }] : undefined
    }
  );
}
