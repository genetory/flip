"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CULTURE_LESSONS } from "../../../../lib/launch/data";
import { Card } from "../../../../components/launch/ui";
import { Header } from "../../../../components/site/Header";
import { Footer } from "../../../../components/site/Footer";

// Week 별 '한국 기업문화·예절' 학습 카드. 핵심 포인트를 읽고 '학습 완료'로 체크하면
// 대시보드 스텝이 완료 처리된다(career-launch:done-steps 에 스텝 id 저장).
const KEY_DONE = "career-launch:done-steps";

export default function CultureLessonPage() {
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  const lesson = CULTURE_LESSONS[id];
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY_DONE);
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      if (list.includes(id)) setDone(true);
    } catch {
      // 무시
    }
  }, [id]);

  const complete = () => {
    try {
      const raw = window.localStorage.getItem(KEY_DONE);
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      if (!list.includes(id)) {
        list.push(id);
        window.localStorage.setItem(KEY_DONE, JSON.stringify(list));
      }
    } catch {
      // 저장 실패해도 화면 완료 처리
    }
    setDone(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← 대시보드
          </Link>

          {!lesson ? (
            <Card className="mt-4 text-[14px] text-[#4E5968]">학습 내용을 찾을 수 없어요. 대시보드로 돌아가주세요.</Card>
          ) : (
            <>
              {/* 헤더 */}
              <div className="mt-3 rounded-2xl border border-[#CFE0FF] bg-[#EDF1FD] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <span className="text-[20px]">{lesson.emoji}</span>
                  <p className="text-[12.5px] font-bold text-[#0B46E8]">한국 직장 문화·예절</p>
                </div>
                <h1 className="mt-1.5 text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{lesson.title}</h1>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968] md:text-[14px]">{lesson.intro}</p>
              </div>

              {/* 핵심 포인트 카드 */}
              <div className="mt-6 space-y-3">
                {lesson.points.map((p, i) => (
                  <Card key={i} className="flex gap-3 md:!p-5">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#0B46E8] text-[12.5px] font-black text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14.5px] font-bold text-[#191F28]">{p.title}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-[#4E5968]">{p.body}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 완료 체크 */}
              {done ? (
                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-[14px] font-bold text-emerald-700">
                    ✓ 학습 완료
                  </div>
                  <Link
                    href="/career-launch/dashboard"
                    className="flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
                  >
                    대시보드로 →
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={complete}
                  className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#0B46E8] py-3.5 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  다 읽었어요 · 학습 완료
                </button>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
