import { OPS_STATS } from "../../../../lib/launch/data";
import { Card, LaunchContainer, ProgressBar, SectionTitle } from "../../../../components/launch/ui";

// 12. 운영자 결과 리포트 페이지
export default function LaunchOpsReportPage() {
  const funnel = [
    { label: "신청자", value: OPS_STATS.applicants },
    { label: "선발", value: OPS_STATS.selected },
    { label: "수료 예상", value: OPS_STATS.expectedCompletion }
  ];
  const maxFunnel = funnel[0].value;

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-[640px] pt-6">
        {/* 핵심 지표 */}
        <SectionTitle sub="2026 여름 1기 기준">결과 리포트</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { k: "신청자 수", v: `${OPS_STATS.applicants}명`, tone: "text-[#0B46E8]" },
            { k: "선발 인원", v: `${OPS_STATS.selected}명`, tone: "text-[#0B46E8]" },
            { k: "수료 예상", v: `${OPS_STATS.expectedCompletion}명`, tone: "text-emerald-600" },
            { k: "우수 후보자", v: `${OPS_STATS.topCandidates}명`, tone: "text-[#3A6B00]" }
          ].map((s) => (
            <Card key={s.k} className="!p-4">
              <p className={`text-[24px] font-black ${s.tone}`}>{s.v}</p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">{s.k}</p>
            </Card>
          ))}
        </div>

        {/* 완성률 */}
        <div className="mt-7">
          <SectionTitle>진행 지표</SectionTitle>
          <Card className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[#4E5968]">이력서 완성률</span>
                <span className="font-black text-[#0B46E8]">{OPS_STATS.resumeCompletionRate}%</span>
              </div>
              <ProgressBar value={OPS_STATS.resumeCompletionRate} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[#4E5968]">모의면접 완료율</span>
                <span className="font-black text-[#0B46E8]">{OPS_STATS.mockInterviewRate}%</span>
              </div>
              <ProgressBar value={OPS_STATS.mockInterviewRate} />
            </div>
          </Card>
        </div>

        {/* 퍼널 */}
        <div className="mt-7">
          <SectionTitle sub="신청 → 선발 → 수료">참여 퍼널</SectionTitle>
          <Card className="space-y-3.5">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold text-[#4E5968]">{f.label}</span>
                  <span className="font-bold text-[#191F28]">{f.value}명</span>
                </div>
                <div className="h-8 w-full overflow-hidden rounded-lg bg-[#F2F4F6]">
                  <div
                    className="flex h-full items-center justify-end rounded-lg pr-2 text-[11px] font-bold text-white"
                    style={{ width: `${Math.max(12, (f.value / maxFunnel) * 100)}%`, background: "linear-gradient(90deg,#0B46E8,#4F7BFF)" }}
                  >
                    {Math.round((f.value / maxFunnel) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <p className="mt-6 text-center text-[11.5px] text-[#B0B8C1]">* MVP 목데이터입니다. 실제 지표는 백엔드 연동 후 표시됩니다.</p>
      </LaunchContainer>
    </main>
  );
}
