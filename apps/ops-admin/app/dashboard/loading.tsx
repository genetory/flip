export default function Loading() {
  return (
    <section className="ops-content-section">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-60 rounded bg-slate-200" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-24 rounded-xl bg-slate-200" />
          <div className="h-24 rounded-xl bg-slate-200" />
          <div className="h-24 rounded-xl bg-slate-200" />
        </div>
        <div className="h-72 rounded-xl bg-slate-200" />
      </div>
    </section>
  );
}
