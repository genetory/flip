import { ImageResponse } from "next/og";
import type { PublicPositionListItem } from "../../../lib/member-profile-client";

export const runtime = "nodejs";
export const alt = "Job posting on Aply";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000";

async function fetchPosition(id: string): Promise<PublicPositionListItem | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/positions/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 }
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { ok?: boolean; item?: PublicPositionListItem };
    if (!payload?.ok || !payload.item) return null;
    return payload.item;
  } catch {
    return null;
  }
}

function employmentLabel(value: PublicPositionListItem["employmentType"]): string {
  switch (value) {
    case "FULL_TIME":
      return "Full-time";
    case "INTERN":
      return "Internship";
    case "PART_TIME":
      return "Part-time";
    case "UNPAID_INTERN":
      return "Unpaid Intern";
    default:
      return "Open Position";
  }
}

export default async function Image({ params }: { params: { id: string } }) {
  const position = await fetchPosition(params.id);
  const title = position?.title ?? "Job posting";
  const company = position?.partnerOrganization?.name ?? position?.sourceCompanyName ?? "Aply Partner";
  const location = position?.workLocation ?? null;
  const employment = position ? employmentLabel(position.employmentType) : "Open Position";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
          padding: 72,
          fontFamily: "system-ui, sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Aply</div>
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              border: "2px solid rgba(248,250,252,0.35)",
              fontSize: 22,
              fontWeight: 600,
              opacity: 0.85
            }}
          >
            {employment}
          </div>
        </div>
        <div
          style={{
            marginTop: 60,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 600, opacity: 0.9 }}>{company}</div>
          {location ? <div style={{ fontSize: 24, opacity: 0.7 }}>📍 {location}</div> : null}
          <div style={{ fontSize: 22, opacity: 0.5, marginTop: 8 }}>aply.global</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
