import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Aply — The career platform connecting global talent with Korean partners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          padding: 80,
          fontFamily: "system-ui, sans-serif"
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, marginBottom: 24 }}>Aply</div>
        <div style={{ fontSize: 36, fontWeight: 500, textAlign: "center", lineHeight: 1.3, opacity: 0.9 }}>
          Connect global talent with Korean partners.
        </div>
        <div style={{ fontSize: 28, marginTop: 32, opacity: 0.7 }}>aply.global</div>
      </div>
    ),
    { ...size }
  );
}
