// resume-maker 의 '현재 이력서' — 편집·공고 맞춤·모의 면접 세 도구가 공유하는 활성
// 이력서 id 를 localStorage 에 기억한다. 이력서 화면(/resume-maker/[id]/...)에 들어가면
// 그 id 가 활성으로 저장되고, GNB 도구는 이 id 로 바로 이동한다.
const KEY = "resume_maker_active_id";

export function getActiveResumeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setActiveResumeId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* 무시 */
  }
}
