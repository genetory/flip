"use client";

import { useEffect, useState } from "react";
import { fetchOpsPrompts, saveOpsPrompt, resetOpsPrompt, type OpsPrompt } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";

// 운영자 프롬프트 편집 — 각 스텝 대화의 시스템 프롬프트를 편집/기본값 복원.
// JSON 출력 형식 계약은 서버가 자동으로 붙이므로 여기서 신경 쓰지 않아도 된다.
export default function LaunchOpsPromptsPage() {
  const [prompts, setPrompts] = useState<OpsPrompt[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  const load = async () => {
    const items = await fetchOpsPrompts();
    setPrompts(items);
    setDrafts(Object.fromEntries(items.map((p) => [p.key, p.value])));
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await load();
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const save = async (p: OpsPrompt) => {
    setSavingKey(p.key);
    setSavedKey("");
    try {
      await saveOpsPrompt(p.key, drafts[p.key] ?? "");
      await load();
      setSavedKey(p.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setSavingKey("");
    }
  };

  const reset = async (p: OpsPrompt) => {
    setSavingKey(p.key);
    try {
      const def = await resetOpsPrompt(p.key);
      setDrafts((d) => ({ ...d, [p.key]: def }));
      await load();
      setSavedKey(p.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "복원하지 못했어요.");
    } finally {
      setSavingKey("");
    }
  };

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-5">
          <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">스텝별 대화 프롬프트</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">각 스텝 대화의 시스템 프롬프트를 편집해요. 저장 즉시 다음 대화부터 적용돼요.</p>
        </div>
        <p className="mb-4 rounded-xl bg-[#EDF1FD] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#0B46E8]">
          JSON 출력 형식은 서버가 자동으로 붙여요. 말투·규칙·질문 흐름 등 대화 내용만 편집하면 돼요.
        </p>

        {loading ? (
          <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">불러오는 중…</Card>
        ) : error ? (
          <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
        ) : (
          <div className="space-y-8">
            {Array.from(new Set(prompts.map((p) => p.week))).sort((a, b) => a - b).map((week) => (
              <div key={week}>
                <h2 className="mb-3 text-[15px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[16px]">Week {week}</h2>
                <div className="grid gap-4 xl:grid-cols-2">
                  {prompts.filter((p) => p.week === week).map((p) => {
                    const draft = drafts[p.key] ?? "";
                    const dirty = draft !== p.value;
                    return (
                      <Card key={p.key} className="!p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[14.5px] font-bold text-[#191F28]">{p.label}</p>
                            <p className="mt-0.5 text-[12px] text-[#8B95A1]">{p.step}</p>
                          </div>
                          {p.isOverridden ? <Pill tone="amber">편집됨</Pill> : <Pill tone="grey">기본값</Pill>}
                        </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDrafts((d) => ({ ...d, [p.key]: e.target.value }))}
                    rows={12}
                    className="mt-3 w-full resize-y rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-[#191F28] focus:border-[#0B46E8] focus:outline-none"
                  />
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!dirty || savingKey === p.key}
                      onClick={() => void save(p)}
                      className={`rounded-lg px-4 py-2 text-[13px] font-bold transition ${
                        dirty && savingKey !== p.key ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                      }`}
                    >
                      {savingKey === p.key ? "저장 중…" : "저장"}
                    </button>
                    {p.isOverridden ? (
                      <button
                        type="button"
                        disabled={savingKey === p.key}
                        onClick={() => void reset(p)}
                        className="rounded-lg border border-[#D7DCE3] bg-white px-4 py-2 text-[13px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
                      >
                        기본값으로 복원
                      </button>
                    ) : null}
                    {savedKey === p.key && !dirty ? <span className="text-[12.5px] font-semibold text-emerald-600">저장됨 ✓</span> : null}
                  </div>
                </Card>
              );
            })}
                </div>
              </div>
            ))}
          </div>
        )}
      </LaunchContainer>
    </main>
  );
}
