// Talent 전용 디자인 토큰.
// 전역 CSS(globals.css)·tailwind.config 는 Partner/Admin 에 영향을 줄 수 있어 건드리지 않는다.
// 여기서는 JS 값(색상·그라디언트)만 중앙화하고, Tailwind 클래스는 각 컴포넌트에서
// 프로젝트 컨벤션대로 arbitrary 리터럴(bg-[#0B46E8] 등)로 사용한다.
//
// 방향: 밝은 흰 배경, 아주 옅은 블루/그린 섹션, 브랜드 블루가 메인,
//       라임은 완료·성장·다음 단계, 부드러운 라운드 + 얇은 테두리 + 약한 그림자.

export const talentColors = {
  // 브랜드 블루(메인)
  blue: "#0B46E8",
  blueHover: "#0A3ECB",
  blueDeep: "#0B1227",
  blueTint: "#EDF1FD", // 옅은 블루 배경
  blueTintSoft: "#F5F8FF", // 더 옅은 섹션 배경
  // 라임(완료·성장·다음 단계)
  lime: "#B7FF5A",
  limeSoft: "#EAFFD1",
  limeBorder: "#A6EF3F",
  limeText: "#3A6B00",
  greenTintSoft: "#F3FBEE", // 옅은 그린 섹션 배경
  // 잉크/그레이(Toss 계열)
  ink: "#191F28",
  inkSoft: "#4E5968",
  inkFaint: "#8B95A1",
  line: "#E5E8EB",
  surface: "#F6F8FB",
  white: "#FFFFFF"
} as const;

// 인라인 style 용 그라디언트(히어로 등).
export const talentGradients = {
  heroSoft: "linear-gradient(180deg, #F5F8FF 0%, #FFFFFF 60%)"
} as const;
