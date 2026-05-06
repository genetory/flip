export default function Loading() {
  return (
    <main className="container py-10 md:py-14">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-56 rounded bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-xl bg-muted" />
          <div className="h-28 rounded-xl bg-muted" />
          <div className="h-28 rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  );
}
