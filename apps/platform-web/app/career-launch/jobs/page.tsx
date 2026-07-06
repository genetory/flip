import Link from "next/link";
import { RECOMMENDED_JOBS, STUDENT } from "../../../lib/launch/data";
import { Card, Pill, SectionTitle } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

// Week 1 — 프로그램 안에서 AI가 추천한 직무를 보고, 관심 직무 3개를 정한다.
// (지금은 목데이터. 이후 학생 프로필·전공을 분석해 실제 추천으로 연동)
export default function LaunchJobsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-4xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/week/1" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← Week 1
          </Link>

          {/* 헤더 */}
          <div className="mt-3 rounded-2xl border border-[#CFE0FF] bg-[#EDF1FD] p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🪄</span>
              <p className="text-[12.5px] font-bold text-[#0B46E8]">AI 직무 추천</p>
            </div>
            <h1 className="mt-1.5 text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">
              {STUDENT.name}님께 어울리는 직무예요
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968] md:text-[14px]">
              전공·관심사·강점을 바탕으로 추천했어요. 마음이 가는 <b className="text-[#0B46E8]">직무 3개</b>를 골라 이번 주 방향을 정해봐요.
            </p>
          </div>

          {/* 추천 목록 */}
          <div className="mt-7">
            <SectionTitle sub="매칭이 높은 순서로 보여드려요">추천 직무</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {RECOMMENDED_JOBS.map((job) => (
                <Card key={job.id} className="flex flex-col md:!p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[15.5px] font-bold text-[#191F28]">{job.role}</p>
                    <Pill tone="blue">매칭 {job.match}%</Pill>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#4E5968]">{job.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <span key={s} className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968]">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/positions?query=${encodeURIComponent(job.query)}`}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#EDF1FD] py-2.5 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]"
                  >
                    이 직무 공고 보기 →
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* 안내 */}
          <p className="mt-6 text-center text-[12px] text-[#8B95A1]">
            추천 직무는 참고용이에요. 관심 가는 직무를 직접 골라 이력서를 준비하면 돼요.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
