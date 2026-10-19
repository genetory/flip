// 커리어런치에서 연 이력서·자소서 에디터인가 — 그때만 에디터 AI 를 포인트 없이(수강 중인 학생, 서버가 최종 판단).
// 결과물의 [에디터로 편집]은 에디터를 ?from=launch 로 연다. 그 탭(sessionStorage)에서 에디터 화면에 있는 동안만
// API 요청에 X-Aply-Context: career-launch 를 붙이고, 탤런트 쪽 다른 화면으로 나가면 표시를 지운다
// (탤런트 메뉴로 다시 연 에디터는 평소대로 차감 — 사용자 결정 '커리어런치에서 열었을 때만').
const KEY = "aply:launch-editor";
export const LAUNCH_EDITOR_PARAM = "from=launch";
const EDITOR_PATH = /^\/(v2\/(resume|cover)|talent\/career\/(resume|cover)\/(editor|preview))(\/|$)/;

/** 지금 요청에 붙일 컨텍스트 헤더 — 없으면 빈 객체. authedJsonFetch 가 매 요청마다 부른다. */
export function launchEditorHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const { pathname, search } = window.location;
    const onEditor = EDITOR_PATH.test(pathname);
    if (onEditor && new URLSearchParams(search).get("from") === "launch") window.sessionStorage.setItem(KEY, "1");
    else if (!onEditor && !pathname.startsWith("/career-launch")) window.sessionStorage.removeItem(KEY);
    return onEditor && window.sessionStorage.getItem(KEY) === "1" ? { "X-Aply-Context": "career-launch" } : {};
  } catch {
    return {};
  }
}

/** 커리어런치에서 연 에디터인가(화면 표시용 — 돌아가기 버튼 등). */
export function isLaunchEditor(): boolean {
  return "X-Aply-Context" in launchEditorHeaders();
}

export const LAUNCH_RESUME_EDITOR = `/talent/career/resume/editor?${LAUNCH_EDITOR_PARAM}`;
export const LAUNCH_COVER_EDITOR = `/talent/career/cover/editor?${LAUNCH_EDITOR_PARAM}`;
