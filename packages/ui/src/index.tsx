import React from "react";

type AppShellProps = {
  title: string;
  subtitle: string;
  sections: React.ReactNode[];
};

export function AppShell({ title, subtitle, sections }: AppShellProps) {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 20px" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.2 }}>{title}</h1>
        <p style={{ margin: "12px 0 0", color: "#475569", fontSize: 17 }}>{subtitle}</p>
      </header>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {sections}
      </section>
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  description: string;
};

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 0 16px rgba(15, 23, 42, 0.08)"
      }}
    >
      <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>{label}</p>
      <p style={{ margin: "8px 0 0", fontWeight: 800, fontSize: 30 }}>{value}</p>
      <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14 }}>{description}</p>
    </article>
  );
}
