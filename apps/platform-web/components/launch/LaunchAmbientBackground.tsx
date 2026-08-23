// Career Launch 학생 화면 공용 앰비언트 오로라 배경.
// 사용법: 페이지 루트에 `isolate` 만 추가하고(overflow-hidden 금지 — sticky 헤더가
//   깨진다) 이 컴포넌트를 첫 자식으로 넣는다. 자신은 `fixed`+자체 overflow-hidden
//   으로 뷰포트에 고정·클리핑되고, `-z-10` + 루트의 `isolate`(stacking context)
//   덕분에 루트 흰 배경 위·본문 아래에 깔려 별도 콘텐츠 래핑이 필요 없다.
export function LaunchAmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-[#0B46E8]/[0.12] blur-[140px]" />
      <div className="absolute -right-28 -top-16 h-[440px] w-[440px] rounded-full bg-[#7B9CFF]/[0.15] blur-[140px]" />
      <div className="absolute left-[40%] top-[26%] h-[360px] w-[360px] rounded-full bg-[#10D0C4]/[0.08] blur-[150px]" />
      <div className="absolute -left-16 bottom-[10%] h-[340px] w-[340px] rounded-full bg-[#8B5CF6]/[0.07] blur-[150px]" />
    </div>
  );
}
