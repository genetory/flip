// Talent 데이터 접근 레이어(service/repository).
// 지금은 mock 구현만 있지만, 화면은 이 인터페이스에만 의존하므로
// 실제 API가 준비되면 ApiTalentRepository 로 교체하면 된다.
import type { Experience, ExperienceType, Job, TalentPersonaId, TalentSnapshot } from "./types";
import { personaSnapshots } from "./mock/personas";
import { mockJobs, findMockJob } from "./mock/jobs";

export interface TalentRepository {
  getSnapshot(personaId: TalentPersonaId): Promise<TalentSnapshot>;
  listJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | null>;
  toggleSaveJob(id: string): Promise<boolean>;
  // mock: 실제 저장 없이 구성된 Experience 를 돌려준다.
  draftExperience(input: { type: ExperienceType; title: string; answers?: Experience["answers"] }): Promise<Experience>;
}

// 네트워크 지연을 흉내내 로딩 상태를 실제로 확인할 수 있게 한다.
function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// 경험 유형별 mock 핵심 역할/역량(실제 AI 정리 전 임시).
const defaultRoleByType: Record<ExperienceType, string> = {
  "school-project": "과제 수행",
  "team-project": "팀 협업 및 역할 분담",
  intern: "실무 지원",
  "part-time": "고객 응대 및 운영",
  club: "동아리 활동 운영",
  activity: "대외활동 참여",
  contest: "공모전 프로젝트",
  volunteer: "봉사 활동",
  "personal-project": "개인 프로젝트 기획·제작",
  freelance: "프리랜서 업무",
  content: "콘텐츠 기획·운영",
  startup: "서비스 운영",
  etc: "활동 수행"
};

const skillsByType: Record<ExperienceType, string[]> = {
  "school-project": ["문제 정의", "자료 조사", "협업"],
  "team-project": ["협업", "일정 관리", "커뮤니케이션"],
  intern: ["실무 이해", "문서 작성", "책임감"],
  "part-time": ["고객 커뮤니케이션", "문제 해결", "업무 효율화"],
  club: ["기획", "실행력", "팀워크"],
  activity: ["적극성", "네트워킹", "커뮤니케이션"],
  contest: ["기획", "문제 해결", "완성도"],
  volunteer: ["공감", "책임감", "협업"],
  "personal-project": ["자기주도", "기획", "실행력"],
  freelance: ["자기주도", "책임감", "고객 응대"],
  content: ["콘텐츠 기획", "데이터 분석", "꾸준함"],
  startup: ["주도성", "실행력", "문제 해결"],
  etc: ["성실함", "문제 해결", "커뮤니케이션"]
};

class MockTalentRepository implements TalentRepository {
  private savedJobIds = new Set<string>();

  async getSnapshot(personaId: TalentPersonaId): Promise<TalentSnapshot> {
    const snapshot = personaSnapshots[personaId];
    if (!snapshot) throw new Error(`알 수 없는 상태: ${personaId}`);
    return delay(snapshot);
  }

  async listJobs(): Promise<Job[]> {
    return delay(mockJobs.map((j) => ({ ...j, saved: this.savedJobIds.has(j.id) })));
  }

  async getJob(id: string): Promise<Job | null> {
    const job = findMockJob(id);
    return delay(job ? { ...job, saved: this.savedJobIds.has(job.id) } : null);
  }

  async toggleSaveJob(id: string): Promise<boolean> {
    if (this.savedJobIds.has(id)) this.savedJobIds.delete(id);
    else this.savedJobIds.add(id);
    return delay(this.savedJobIds.has(id), 120);
  }

  async draftExperience(input: { type: ExperienceType; title: string; answers?: Experience["answers"] }): Promise<Experience> {
    // 실제 저장/AI 정리는 미구현. 입력을 바탕으로 이력서 문장·핵심 역할·역량을 mock 으로 구성.
    const a = input.answers ?? {};
    const keyRole = a.role?.trim() || defaultRoleByType[input.type];
    const skills = skillsByType[input.type] ?? ["문제 해결", "성실함", "커뮤니케이션"];
    const action = a.did?.trim() || a.solution?.trim();
    const result = a.result?.trim();
    const summary =
      action && result
        ? `${action} ${result}`
        : action
          ? `${action}을(를) 담당했습니다.`
          : result
            ? `${keyRole}을(를) 맡아 ${result}`
            : `${keyRole}을(를) 맡아 성실히 수행했습니다.`;
    return delay(
      {
        id: `exp-draft-${input.title.length}-${input.type}`,
        type: input.type,
        title: input.title,
        answers: input.answers,
        keyRole,
        skills,
        summary,
        createdAt: "2026-07-30"
      },
      600
    );
  }
}

let singleton: TalentRepository | null = null;

export function getTalentRepository(): TalentRepository {
  if (!singleton) singleton = new MockTalentRepository();
  return singleton;
}
