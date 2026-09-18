// 커리어런치 코칭 대화 eval 타입. 골든 케이스는 '대화 도중 한 턴'을 나타낸다:
// 이미 조립된 system/user(프로덕션 핸들러와 동일한 조립을 career-prompts 재구성으로) + 판정용 맥락.
export type CareerGoldenCase = {
  id: string;
  feature: string; // schemaName / ctx.feature (예: "job_chat")
  note?: string;
  // 프로덕션 careerChatComplete 에 들어가는 것과 동일한 최종 system/user 문자열.
  system: string;
  user: string;
  // 코치 judge 에 주는 사람이 읽을 맥락([코치 지시서 요약]+[학생 프로필]+[이전 대화]+[학생 최근 메시지]).
  judgeContext: string;
  schema: Record<string, unknown>;
  schemaName: string;
  strict?: boolean;
  // 모델 JSON 응답에서 코치의 답변(reply)을 뽑는다.
  extractReply: (json: Record<string, unknown>) => string;
};

export type CoachCaseResult = {
  id: string;
  feature: string;
  reply: string;
  error?: string;
  judgeOveralls: number[]; // --repeat 표본들
  judge?: import("./judge").CoachJudgeScore; // 마지막 표본
  ms: number;
};
