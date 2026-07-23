"use client";

import Link from "next/link";
import { ArrowLeft, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationDetailView } from "../../../../../components/applications/ApplicationDetailView";
import { readAccessToken } from "../../../../../lib/auth-client";

export default function PartnerApplicantDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params?.id[0] : "";
  const [ids, setIds] = useState<string[]>([]);

  // 목록 순서를 불러와 이전/다음 지원자 이동(트리아지 속도). 실패해도 상세는 정상.
  useEffect(() => {
    void (async () => {
      try {
        const token = readAccessToken();
        const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
        const res = await fetch(`${base}/partner/applications`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        const payload = (await res.json()) as { ok?: boolean; items?: { id: string }[] };
        if (payload.ok && payload.items) setIds(payload.items.map((i) => i.id));
      } catch {
        // no-op
      }
    })();
  }, []);

  if (!id) return null;
  const idx = ids.indexOf(id);
  const prevId = idx > 0 ? ids[idx - 1] : null;
  const nextId = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;

  return (
    <section className="ops-content-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link href="/dashboard/partner/applicants" style={{ fontSize: 12, color: "var(--ink-faint)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={13} weight="bold" aria-hidden /> 지원자 목록
        </Link>
        {idx >= 0 ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{idx + 1} / {ids.length}</span>
            {prevId ? (
              <Link href={`/dashboard/partner/applicants/${prevId}`} className="ops-btn"><CaretLeft size={13} weight="bold" aria-hidden /> 이전</Link>
            ) : (
              <button type="button" className="ops-btn" disabled><CaretLeft size={13} weight="bold" aria-hidden /> 이전</button>
            )}
            {nextId ? (
              <Link href={`/dashboard/partner/applicants/${nextId}`} className="ops-btn">다음 <CaretRight size={13} weight="bold" aria-hidden /></Link>
            ) : (
              <button type="button" className="ops-btn" disabled>다음 <CaretRight size={13} weight="bold" aria-hidden /></button>
            )}
          </div>
        ) : null}
      </div>
      <header style={{ marginTop: 8 }}>
        <h1>지원자 상세</h1>
        <p>지원자의 진행 타임라인을 확인하고 면접·과제·상태를 관리하세요.</p>
      </header>
      <ApplicationDetailView applicationId={id} viewer="partner" />
    </section>
  );
}
