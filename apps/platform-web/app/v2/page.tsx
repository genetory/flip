import { redirect } from "next/navigation";

// v2 입구 — 홈으로.
export default function V2Index() {
  redirect("/v2/home");
}
