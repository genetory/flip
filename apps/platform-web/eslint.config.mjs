// ESLint 설정(flat config).
//
// Next 16 에서 `next lint` 가 제거돼 저장소에 lint 를 돌릴 방법이 없었다(툴링 공백).
// eslint-config-next 16 은 flat config 를 그대로 export 하므로 호환 레이어(FlatCompat)
// 없이 바로 펼쳐 쓴다.
//
// 지금 목적은 "lint 가 돌아가게" 하는 것이다. 기존 코드에 쌓인 위반을 한 번에 고치면
// 화면이 바뀔 위험이 있어 규칙은 Next 권장치 그대로 두고 앱 코드는 건드리지 않았다.
// 규칙 조정과 기존 위반 정리는 별도 작업으로 한다.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  {
    // 빌드 산출물·의존성·생성 파일은 검사하지 않는다.
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", "*.tsbuildinfo"]
  },
  ...nextCoreWebVitals,
  ...nextTypescript
];
