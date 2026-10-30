import { ImageResponse } from "next/og";

// /premium 공유 미리보기 — 영문만 써서 글꼴을 따로 받지 않는다.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "APLY PREMIUM · Early Access";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "radial-gradient(120% 90% at 85% 0%, rgba(100,139,255,0.35) 0%, rgba(100,139,255,0) 55%), #0D1220",
          color: "#F7F8FC"
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: "#C5A878" }}>APLY PREMIUM · EARLY ACCESS</div>
        <div style={{ marginTop: 28, fontSize: 84, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>Your Career</div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>Deserves More.</div>
        <div style={{ marginTop: 32, fontSize: 32, color: "#949BAE" }}>Resume · Interviews · Company matching · Internships in Korea</div>
        <div style={{ marginTop: 56, fontSize: 26, color: "#949BAE" }}>aply.global/premium</div>
      </div>
    ),
    size
  );
}
