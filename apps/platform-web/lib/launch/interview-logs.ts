// 저장된 카드형 면접 기록(공고별/기본)의 재도전 채점 함수를 골라준다.
import { scorePostingAnswer, type PostingScore } from "./posting-interview";
import { scoreBasicAnswer } from "./basic-interview";
import type { PostingInterviewLog } from "./progress-client";

export function logRescore(log: PostingInterviewLog): ((question: string, answer: string) => Promise<PostingScore>) | undefined {
  if (log.source === "basic" && log.focus) return (q: string, a: string) => scoreBasicAnswer(log.focus!, q, a);
  if (log.posting) return (q: string, a: string) => scorePostingAnswer(log.posting!, q, a);
  return undefined;
}
