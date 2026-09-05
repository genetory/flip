"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BasicInterviewSession } from "../../../components/launch/BasicInterviewSession";
import type { BasicFocus } from "../../../lib/launch/basic-interview";

function Inner() {
  const sp = useSearchParams();
  const raw = sp.get("focus");
  const focus: BasicFocus = raw === "job" ? "job" : raw === "fit" ? "fit" : raw === "pressure" ? "pressure" : "self";
  return <BasicInterviewSession focus={focus} />;
}

export default function LaunchBasicInterviewPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
