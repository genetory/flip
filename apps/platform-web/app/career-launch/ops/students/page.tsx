import { OPS_STATS, OPS_STUDENTS } from "../../../../lib/launch/data";
import { Card, LaunchContainer, Pill, ProgressBar, SectionTitle } from "../../../../components/launch/ui";

// 10. 운영자 학생 관리 페이지
const STATUS_TONE = { 지원: "grey", 선발: "blue", 진행중: "amber", 수료예정: "green", 탈락: "grey" } as const;

export default function LaunchOpsStudentsPage() {
  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-[640px] pt-6">
        {/* 요약 지표 */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { k: "신청자", v: OPS_STATS.applicants },
            { k: "선발", v: OPS_STATS.selected },
            { k: "수료 예상", v: OPS_STATS.expectedCompletion }
          ].map((s) => (
            <Card key={s.k} className="!p-4 text-center">
              <p className="text-[22px] font-black text-[#0B46E8]">{s.v}</p>
              <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{s.k}</p>
            </Card>
          ))}
        </div>

        <div className="mt-7">
          <SectionTitle sub={`선발 ${OPS_STATS.selected}명 · 진행 중`}>학생 목록</SectionTitle>
          <div className="space-y-2.5">
            {OPS_STUDENTS.map((st) => (
              <Card key={st.id} className="!p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">
                      {st.name.charAt(0)}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-[14px] font-bold text-[#191F28]">
                        {st.name}
                        {st.top ? <span title="우수 후보자">⭐</span> : null}
                      </p>
                      <p className="text-[12px] text-[#8B95A1]">{st.school} · {st.major}</p>
                    </div>
                  </div>
                  <Pill tone={STATUS_TONE[st.status]}>{st.status}</Pill>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11.5px]">
                    <span className="text-[#8B95A1]">Week {st.week} · 진행률 {st.progress}%</span>
                    <span className="flex gap-1.5">
                      <span className={st.resumeDone ? "text-emerald-600" : "text-[#C9CDD2]"}>이력서{st.resumeDone ? "✓" : "·"}</span>
                      <span className={st.interviewDone ? "text-emerald-600" : "text-[#C9CDD2]"}>면접{st.interviewDone ? "✓" : "·"}</span>
                    </span>
                  </div>
                  <ProgressBar value={st.progress} height={7} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </LaunchContainer>
    </main>
  );
}
