import { overallProgress, STUDENT } from "../../../lib/launch/data";
import { Card, LaunchButton, Pill, ProgressBar, SectionTitle } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

// 9. 나의 Global Talent Profile 페이지 — 기업 제출용.
const SECTIONS: { key: string; label: string; done: boolean; desc: string }[] = [
  { key: "basic", label: "기본 정보", done: true, desc: "이름 · 학교 · 전공 · 비자" },
  { key: "resume", label: "이력서", done: false, desc: "프로그램에서 만든 대표 이력서" },
  { key: "cover", label: "자기소개서", done: false, desc: "목표 회사용 자기소개서" },
  { key: "portfolio", label: "포트폴리오", done: false, desc: "작업물 · 링크" }
];

export default function LaunchProfilePage() {
  const progress = overallProgress();
  const doneCount = SECTIONS.filter((s) => s.done).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
      <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
        {/* 프로필 헤더 */}
        <Card className="md:!p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-[#0B46E8] text-[22px] font-black text-white">
              {STUDENT.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-[18px] font-black text-[#0B1227]">{STUDENT.name}</p>
              <p className="text-[13px] text-[#8B95A1]">{STUDENT.school} · {STUDENT.major}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-[#4E5968]">프로필 완성도</span>
              <span className="font-black text-[#0B46E8]">{doneCount}/{SECTIONS.length}</span>
            </div>
            <ProgressBar value={(doneCount / SECTIONS.length) * 100} />
          </div>
        </Card>

        {/* 구성 요소 */}
        <div className="mt-7">
          <SectionTitle sub="기업에 제출할 프로필 구성 요소">Global Talent Profile</SectionTitle>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((s) => (
              <Card key={s.key} className="flex items-center justify-between !p-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[13px] ${s.done ? "bg-[#EAFFD1]" : "bg-[#F2F4F6]"}`}>
                    {s.done ? "✅" : "⬜"}
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-[#191F28]">{s.label}</p>
                    <p className="text-[12px] text-[#8B95A1]">{s.desc}</p>
                  </div>
                </div>
                {s.done ? <Pill tone="green">완료</Pill> : <Pill tone="grey">미완성</Pill>}
              </Card>
            ))}
          </div>
        </div>

        {/* 연동 안내 */}
        <div className="mt-7">
          <Card>
            <p className="text-[13.5px] leading-relaxed text-[#4E5968]">
              이력서·자기소개서는 <b className="text-[#0B46E8]">이 프로그램 안에서</b> 만든 내용이 자동으로 연결돼요.
            </p>
            <div className="mt-3 flex gap-2">
              <LaunchButton href="/career-launch/resume" variant="outline">이력서 만들기</LaunchButton>
              <LaunchButton href="/career-launch/cover-letter" variant="outline">자소서 만들기</LaunchButton>
            </div>
          </Card>
        </div>

        {/* 제출 */}
        <div className="mt-8">
          <LaunchButton variant="lime" full href="/career-launch/dashboard">
            {progress >= 100 ? "기업에 제출하기" : "미션을 완료하고 제출할 수 있어요"}
          </LaunchButton>
          <p className="mt-3 text-center text-[12px] text-[#8B95A1]">제출 시 참여 기업에 프로필이 공유됩니다.</p>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
