"use client";

// 이력서 시트 모양의 스켈레톤. 디테일/공유 페이지 둘 다 사용. 실제 시트와
// 같은 외곽(rounded-3xl 카드)과 비슷한 비례로 placeholder를 깔아 줘서
// 로딩이 끝나도 레이아웃이 거의 그대로 이어집니다.

function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export function ResumeSheetSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="container pb-16 pt-6 md:pt-10">
        <div className="mx-auto max-w-4xl">
          {/* Toolbar placeholder (layout toggle + PDF) */}
          <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
            <Bar className="h-9 w-40" />
            <Bar className="h-9 w-32" />
          </div>

          {/* Sheet */}
          <article className="rounded-3xl border border-border bg-white p-6 shadow-sm md:p-10">
            {/* Top Aply mark row */}
            <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
              <Bar className="h-6 w-20" />
              <Bar className="h-3 w-14" />
            </div>

            {/* Hero — photo + name/contact */}
            <div className="flex items-center gap-5 md:gap-6">
              <Bar className="aspect-[3/4] w-24 flex-none rounded-2xl md:w-28" />
              <div className="min-w-0 flex-1 space-y-3">
                <Bar className="h-8 w-2/3 md:h-9" />
                <div className="space-y-2">
                  <Bar className="h-3.5 w-3/4" />
                  <Bar className="h-3.5 w-2/3" />
                  <Bar className="h-3.5 w-1/2" />
                </div>
              </div>
            </div>

            {/* Body — a couple of section blocks */}
            <div className="mt-10 space-y-10">
              {[0, 1, 2].map((i) => (
                <section key={i}>
                  <Bar className="mb-4 h-6 w-32" />
                  <div className="space-y-3">
                    <Bar className="h-4 w-5/6" />
                    <Bar className="h-3.5 w-3/4" />
                    <Bar className="h-3.5 w-4/5" />
                    <Bar className="h-3.5 w-2/3" />
                  </div>
                </section>
              ))}
            </div>

            {/* Footer placeholder */}
            <div className="mt-12 flex flex-col items-center gap-2 border-t border-border pt-6">
              <Bar className="h-9 w-32" />
              <Bar className="h-3 w-56" />
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
