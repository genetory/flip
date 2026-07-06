import { Card, LaunchButton, LaunchContainer } from "../../../../components/launch/ui";

// 3. 신청 완료 페이지
export default function LaunchApplyCompletePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center pb-16">
      <LaunchContainer>
        <Card className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#B7FF5A] text-[30px]">🎉</div>
          <h1 className="mt-5 text-[22px] font-black tracking-[-0.01em] text-[#0B1227]">신청이 접수되었어요!</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">
            APLY Global Career Launch 참가 신청이 완료되었습니다.
            <br />
            선발 결과와 프로그램 일정은 <b>이메일</b>로 안내드립니다.
          </p>

          <div className="mt-6 rounded-2xl bg-[#F6F8FB] p-4 text-left">
            <p className="text-[12.5px] font-bold text-[#191F28]">다음 단계</p>
            <ol className="mt-2 space-y-1.5 text-[13px] text-[#4E5968]">
              <li>1. 서류 검토 후 선발 안내 (3~5일)</li>
              <li>2. 대시보드에서 Week 1 미션 시작</li>
              <li>3. 매주 세미나 참석 + 미션 수행</li>
            </ol>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <LaunchButton href="/launch/dashboard" variant="primary" full>
              대시보드로 이동
            </LaunchButton>
            <LaunchButton href="/launch" variant="outline" full>
              홈으로
            </LaunchButton>
          </div>
        </Card>
      </LaunchContainer>
    </main>
  );
}
