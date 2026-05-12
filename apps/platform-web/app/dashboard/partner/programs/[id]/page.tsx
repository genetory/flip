"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProgramDetailView } from "../../../../../components/programs/ProgramDetailView";

export default function PartnerProgramDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  if (!id) return null;
  return (
    <section className="ops-content-section">
      <Link href="/dashboard/partner/programs" style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>← 프로그램 목록</Link>
      <header style={{ marginTop: 8 }}>
        <h1>프로그램 상세</h1>
      </header>
      <ProgramDetailView programId={id} viewer="partner" />
    </section>
  );
}
