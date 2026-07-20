"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ApplicationDetailView } from "../../../../../../components/applications/ApplicationDetailView";

export default function OpsApplicationDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  if (!id) return null;
  return (
    <section className="ops-content-section">
      <Link href="/dashboard/ops/operations/applications" style={{ fontSize: 12, color: "var(--ink-faint)", textDecoration: "none" }}>
        ← 지원 목록
      </Link>
      <header style={{ marginTop: 8 }}>
        <h1>지원 상세</h1>
        <p>지원자별 전체 진행 타임라인을 확인하고 상태/메모를 관리하세요.</p>
      </header>
      <ApplicationDetailView applicationId={id} viewer="operator" />
    </section>
  );
}
