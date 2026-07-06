import { LAUNCH, WEEKS } from "../../lib/launch/data";
import { Card, LaunchButton, LaunchContainer, Pill, SectionTitle } from "../../components/launch/ui";

// 1. 프로그램 랜딩 페이지
export default function LaunchLandingPage() {
  return (
    <main className="pb-16">
      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#0B1227] to-[#0B46E8] pb-10 pt-14 text-white">
        <LaunchContainer>
          <Pill tone="lime">4주 완성 · 외국인 유학생 전용</Pill>
          <h1 className="mt-4 text-[30px] font-black leading-[1.2] tracking-[-0.02em]">
            APLY Global
            <br />
            Career Launch
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/80">{LAUNCH.tagline}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-white/70">
            매주 미션을 수행하며 4주 만에 기업 제출용 <b className="text-[#B7FF5A]">Global Talent Profile</b>을 완성합니다.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <LaunchButton href="/launch/apply" variant="lime" full>
              지금 참가 신청하기 →
            </LaunchButton>
            <LaunchButton href="/launch/dashboard" variant="outline" full>
              이미 신청했어요 (대시보드)
            </LaunchButton>
          </div>
        </LaunchContainer>
      </section>

      <LaunchContainer className="-mt-6">
        {/* 요약 지표 */}
        <Card className="flex items-center justify-around text-center">
          {[
            { k: "4주", v: "집중 프로그램" },
            { k: "매주", v: "오프라인 세미나" },
            { k: "1:1", v: "미션 피드백" }
          ].map((s) => (
            <div key={s.k}>
              <p className="text-[20px] font-black text-[#0B46E8]">{s.k}</p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">{s.v}</p>
            </div>
          ))}
        </Card>

        {/* 4주 커리큘럼 */}
        <div className="mt-8">
          <SectionTitle sub="매주 목표를 달성하며 프로필을 완성합니다">4주 커리큘럼</SectionTitle>
          <div className="space-y-3">
            {WEEKS.map((w) => (
              <Card key={w.week}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#0B46E8] text-[14px] font-black text-white">W{w.week}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-bold text-[#191F28]">{w.title}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{w.subtitle}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 대상/혜택 */}
        <div className="mt-8">
          <SectionTitle>이런 분께 추천해요</SectionTitle>
          <Card>
            <ul className="space-y-2.5 text-[14px] text-[#333D4B]">
              {[
                "한국 취업을 준비하는 외국인 유학생",
                "이력서·자기소개서를 어떻게 써야 할지 막막한 분",
                "혼자 준비하기 어려워 체계적인 4주 가이드가 필요한 분",
                "기업에 바로 제출할 수 있는 프로필을 만들고 싶은 분"
              ].map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#B7FF5A] text-[10px] font-black text-[#111]">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="mt-8">
          <LaunchButton href="/launch/apply" variant="primary" full>
            참가 신청하기
          </LaunchButton>
          <p className="mt-3 text-center text-[12px] text-[#8B95A1]">신청 후 선발 결과는 이메일로 안내됩니다.</p>
        </div>
      </LaunchContainer>
    </main>
  );
}
