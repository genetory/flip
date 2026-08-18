// 자기소개서 어시스턴트 호출부 — /api/cover-assist(LLM). 실패 시 원본/빈값 폴백.
export async function coverAssist(
  mode: "refine" | "draft",
  input: { question: string; answer: string; name?: string; resumeText?: string }
): Promise<string> {
  try {
    const res = await fetch("/api/cover-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ...input })
    });
    if (res.ok) {
      const d = (await res.json()) as { answer?: string };
      if (d.answer && d.answer.trim()) return d.answer.trim();
    }
  } catch {
    /* 폴백 */
  }
  // 폴백: refine 이면 원본 유지, draft 면 안내.
  return mode === "refine" ? input.answer : "";
}

// 대화로 메모를 선택 문항의 새 항목 텍스트로 다듬어 반환.
export async function coverChat(input: { note: string; question: string; name?: string; resumeText?: string }): Promise<string> {
  try {
    const res = await fetch("/api/cover-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "chat", ...input })
    });
    if (res.ok) {
      const d = (await res.json()) as { text?: string };
      if (d.text && d.text.trim()) return d.text.trim();
    }
  } catch {
    /* 폴백 */
  }
  // 폴백: 메모 원문.
  return input.note.trim();
}
