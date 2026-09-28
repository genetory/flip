// 단어 단위 diff — AI 다듬기 전/후 비교에 쓴다. 외부 의존 없이 LCS 로 계산한다.
//
// 문자 단위는 한국어에서 조사만 바뀌어도 글자가 잘게 쪼개져 읽기 어렵고, 줄 단위는
// 자소서처럼 한 문단이 한 줄인 텍스트에서 "전부 바뀜"으로만 나온다. 그래서 공백을
// 유지한 단어 단위로 자른다.
export type DiffPart = { type: "same" | "add" | "del"; text: string };

// 공백을 버리지 않고 토큰으로 남긴다 — 복원 시 원문 그대로 이어붙일 수 있어야 한다.
function tokenize(s: string): string[] {
  return s.split(/(\s+)/).filter((x) => x !== "");
}

// LCS 표는 O(n*m) 이라 아주 긴 입력에서 비용이 커진다. 자소서 2000자 ≈ 500토큰 수준이면
// 충분히 싸지만, 상한을 넘으면 비교를 포기하고 전체 교체로 표시한다(화면이 멈추는 것보다 낫다).
const MAX_TOKENS = 1200;

export function diffWords(before: string, after: string): DiffPart[] {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length === 0 && b.length === 0) return [];
  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
    const parts: DiffPart[] = [];
    if (before) parts.push({ type: "del", text: before });
    if (after) parts.push({ type: "add", text: after });
    return parts;
  }

  // dp[i][j] = a[i..] 와 b[j..] 의 LCS 길이
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // 같은 종류가 연달아 나오면 한 조각으로 합쳐 렌더링 노드 수를 줄인다.
  const out: DiffPart[] = [];
  const push = (type: DiffPart["type"], text: string) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text;
    else out.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push("del", a[i]);
      i++;
    } else {
      push("add", b[j]);
      j++;
    }
  }
  while (i < a.length) push("del", a[i++]);
  while (j < b.length) push("add", b[j++]);
  return out;
}

// 변경 규모 요약 — "얼마나 바뀌었는지" 한 줄로 보여줄 때 쓴다.
export function diffStats(parts: DiffPart[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const p of parts) {
    if (p.type === "add") added += p.text.trim().length;
    else if (p.type === "del") removed += p.text.trim().length;
  }
  return { added, removed };
}
