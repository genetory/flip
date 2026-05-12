"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ApplicationDetailView } from "../../../../../components/applications/ApplicationDetailView";

export default function PartnerApplicantDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  if (!id) return null;
  return (
    <section className="ops-content-section">
      <Link href="/dashboard/partner/applicants" style={{ fontSize: 12, color: "#6b7280", textDecoration: "none" }}>
        ← 지원자 목록
      </Link>
      <header style={{ marginTop: 8 }}>
        <h1>지원자 상세</h1>
        <p>지원자의 진행 타임라인을 확인하고 면접·과제·상태를 관리하세요.</p>
      </header>
      <ApplicationDetailView applicationId={id} viewer="partner" />
    </section>
  );
}
