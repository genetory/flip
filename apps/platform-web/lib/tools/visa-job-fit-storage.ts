// 로그인 전 입력·결과를 안전하게 이어받기.
//
// 규칙: URL query 에 민감한 내용을 넣지 않는다 → sessionStorage 에만 둔다(공유·로그에 안 남음).
// 저장하는 것은 사용자가 고른 고정 키뿐이다(자유 입력·이름·연락처 없음).
// 가입·로그인 후 같은 탭으로 돌아오면 복원되고, 한 번 쓰면 지운다.
import type { VisaJobFitInput } from "./visa-job-fit";

const KEY = "aply_visa_job_fit_v1";

export function saveFitInput(input: VisaJobFitInput): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ input, at: Date.now() }));
  } catch {
    /* 저장 실패는 조용히 무시 — 기능이 막히지 않게 */
  }
}

/** 저장된 입력. 없거나 깨졌으면 null. 24시간이 지나면 버린다. */
export function loadFitInput(): VisaJobFitInput | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { input?: VisaJobFitInput; at?: number };
    if (!parsed?.input || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > 24 * 60 * 60 * 1000) {
      clearFitInput();
      return null;
    }
    return parsed.input;
  } catch {
    return null;
  }
}

export function clearFitInput(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
