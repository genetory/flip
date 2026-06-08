import { redirect } from "next/navigation";

// 매칭 확률 페이지는 이력서 코칭 안의 "포지션 매칭" 섹션으로 흡수됨.
// 외부 링크나 북마크가 깨지지 않도록 영구 리다이렉트로 처리.
export default function Page() {
  redirect("/resume");
}
