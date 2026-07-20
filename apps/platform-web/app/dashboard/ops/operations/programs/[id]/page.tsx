"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProgramDetailView } from "../../../../../../components/programs/ProgramDetailView";

export default function OpsProgramDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  if (!id) return null;
  return (
    <section className="ops-content-section">
      <Link href="/dashboard/ops/operations/programs" style={{ fontSize: 12, color: "var(--ink-faint)", textDecoration: "none" }}>
        ← 프로그램 모니터링
      </Link>
      <header style={{ marginTop: 8 }}>
        <h1>프로그램 상세</h1>
      </header>
      <ProgramDetailView programId={id} viewer="operator" />
    </section>
  );
}
