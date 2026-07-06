import { notFound } from "next/navigation";
import Link from "next/link";
import { WEEKS } from "../../../../lib/launch/data";
import { Card, Checklist, LaunchContainer, Pill, SectionTitle, SubmissionBox } from "../../../../components/launch/ui";
import { Header } from "../../../../components/site/Header";
import { Footer } from "../../../../components/site/Footer";

// 5~8. Week 1~4 미션 페이지 (동적 라우트)
export default async function LaunchWeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params;
  const n = Number(week);
  const plan = WEEKS.find((w) => w.week === n);
  if (!plan) notFound();

  const feedbackPill = {
    none: <Pill tone="grey">피드백 없음</Pill>,
    pending: <Pill tone="amber">피드백 대기 중</Pill>,
    done: <Pill tone="green">피드백 완료</Pill>
  }[plan.feedback.status];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
      <LaunchContainer className="pt-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#0B46E8] text-[16px] font-black text-white">W{plan.week}</span>
          <div>
            <p className="text-[12.5px] font-bold text-[#8B95A1]">Week {plan.week} 미션</p>
            <h1 className="text-[18px] font-black tracking-[-0.01em] text-[#0B1227]">{plan.title}</h1>
          </div>
        </div>

        {/* 세미나 정보 */}
        <div className="mt-6">
          <SectionTitle>세미나 정보</SectionTitle>
          <Card className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">{plan.seminar.online ? "💻" : "📍"}</span>
            <div>
              <p className="text-[14px] font-bold text-[#191F28]">{plan.seminar.date}</p>
              <p className="mt-0.5 text-[13px] text-[#4E5968]">{plan.seminar.time}</p>
              <p className="text-[12.5px] text-[#8B95A1]">{plan.seminar.place}</p>
            </div>
          </Card>
        </div>

        {/* 이번 주 목표 */}
        <div className="mt-6">
          <SectionTitle>이번 주 목표</SectionTitle>
          <Card>
            <p className="text-[14px] leading-relaxed text-[#333D4B]">{plan.goal}</p>
          </Card>
        </div>

        {/* 미션 체크리스트 */}
        <div className="mt-6">
          <SectionTitle sub="완료한 항목을 체크하세요">해야 할 미션</SectionTitle>
          <Checklist items={plan.missions} />
        </div>

        {/* 과제 제출 */}
        <div className="mt-6">
          <SectionTitle>과제 제출</SectionTitle>
          <SubmissionBox label={plan.submission.label} initialStatus={plan.submission.status} />
        </div>

        {/* 피드백 상태 */}
        <div className="mt-6">
          <SectionTitle>피드백</SectionTitle>
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-[#4E5968]">피드백 상태</span>
              {feedbackPill}
            </div>
            {plan.feedback.note ? <p className="mt-3 rounded-xl bg-[#F6F8FB] p-3.5 text-[13.5px] leading-relaxed text-[#333D4B]">“{plan.feedback.note}”</p> : null}
          </Card>
        </div>

        {/* 다음 주 이동 */}
        {plan.week < 4 ? (
          <Link href={`/career-launch/week/${plan.week + 1}`} className="mt-7 flex items-center justify-center rounded-xl border border-[#D7DCE3] bg-white py-3 text-[14px] font-bold text-[#191F28]">
            Week {plan.week + 1} 미리보기 →
          </Link>
        ) : (
          <Link href="/career-launch/profile" className="mt-7 flex items-center justify-center rounded-xl bg-[#B7FF5A] py-3.5 text-[14px] font-bold text-[#111]">
            Global Talent Profile 완성하기 →
          </Link>
        )}
      </LaunchContainer>
      </main>
      <Footer />
    </div>
  );
}
