// Talent 데이터 접근 레이어(service/repository).
// 지금은 mock 구현만 있지만, 화면은 이 인터페이스에만 의존하므로
// 실제 API가 준비되면 ApiTalentRepository 로 교체하면 된다.
import type { Experience, ExperienceType, Job, TalentPersonaId, TalentSnapshot } from "./types";
import type { PlatformT } from "../i18n";
import { personaSnapshots } from "./mock/personas";
import { mockJobs, findMockJob } from "./mock/jobs";

export interface TalentRepository {
  getSnapshot(personaId: TalentPersonaId, t: PlatformT): Promise<TalentSnapshot>;
  listJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | null>;
  toggleSaveJob(id: string): Promise<boolean>;
  // mock: 실제 저장 없이 구성된 Experience 를 돌려준다.
  draftExperience(input: { type: ExperienceType; title: string; answers?: Experience["answers"] }, t: PlatformT): Promise<Experience>;
}

// 네트워크 지연을 흉내내 로딩 상태를 실제로 확인할 수 있게 한다.
function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// 경험 유형별 mock 핵심 역할/역량(실제 AI 정리 전 임시). 화면에 노출되므로 t로 다국어화.
function defaultRoleByType(t: PlatformT): Record<ExperienceType, string> {
  return {
    "school-project": t("과제 수행", "Coursework", "课题执行", "Thực hiện bài tập", "課題遂行", "Pengerjaan tugas"),
    "team-project": t("팀 협업 및 역할 분담", "Team collaboration and role division", "团队协作与分工", "Hợp tác nhóm và phân chia vai trò", "チーム協業と役割分担", "Kolaborasi tim dan pembagian peran"),
    intern: t("실무 지원", "Hands-on support", "实务支持", "Hỗ trợ thực tế", "実務サポート", "Dukungan praktis"),
    "part-time": t("고객 응대 및 운영", "Customer service and operations", "客户接待与运营", "Tiếp khách và vận hành", "顧客対応と運営", "Layanan pelanggan dan operasional"),
    club: t("동아리 활동 운영", "Club activity management", "社团活动运营", "Điều hành hoạt động câu lạc bộ", "サークル活動運営", "Pengelolaan kegiatan klub"),
    activity: t("대외활동 참여", "External activity participation", "对外活动参与", "Tham gia hoạt động ngoại khóa", "対外活動参加", "Partisipasi kegiatan eksternal"),
    contest: t("공모전 프로젝트", "Competition project", "竞赛项目", "Dự án cuộc thi", "コンテストプロジェクト", "Proyek kompetisi"),
    volunteer: t("봉사 활동", "Volunteer work", "志愿活动", "Hoạt động tình nguyện", "ボランティア活動", "Kegiatan sukarela"),
    "personal-project": t("개인 프로젝트 기획·제작", "Personal project planning and production", "个人项目策划·制作", "Lên kế hoạch và thực hiện dự án cá nhân", "個人プロジェクト企画・制作", "Perencanaan dan pembuatan proyek pribadi"),
    freelance: t("프리랜서 업무", "Freelance work", "自由职业工作", "Công việc tự do", "フリーランス業務", "Pekerjaan lepas"),
    content: t("콘텐츠 기획·운영", "Content planning and operation", "内容策划·运营", "Lên kế hoạch và vận hành nội dung", "コンテンツ企画・運営", "Perencanaan dan pengelolaan konten"),
    startup: t("서비스 운영", "Service operation", "服务运营", "Vận hành dịch vụ", "サービス運営", "Operasional layanan"),
    etc: t("활동 수행", "Activity execution", "活动执行", "Thực hiện hoạt động", "活動遂行", "Pelaksanaan kegiatan")
  };
}

function skillsByType(t: PlatformT): Record<ExperienceType, string[]> {
  return {
    "school-project": [t("문제 정의", "Problem definition", "问题定义", "Xác định vấn đề", "問題定義", "Definisi masalah"), t("자료 조사", "Research", "资料调研", "Nghiên cứu", "資料調査", "Riset"), t("협업", "Collaboration", "协作", "Hợp tác", "協業", "Kolaborasi")],
    "team-project": [t("협업", "Collaboration", "协作", "Hợp tác", "協業", "Kolaborasi"), t("일정 관리", "Schedule management", "日程管理", "Quản lý lịch trình", "スケジュール管理", "Manajemen jadwal"), t("커뮤니케이션", "Communication", "沟通", "Giao tiếp", "コミュニケーション", "Komunikasi")],
    intern: [t("실무 이해", "Practical understanding", "实务理解", "Hiểu biết thực tế", "実務理解", "Pemahaman praktis"), t("문서 작성", "Documentation", "文档撰写", "Soạn tài liệu", "文書作成", "Penulisan dokumen"), t("책임감", "Responsibility", "责任心", "Trách nhiệm", "責任感", "Tanggung jawab")],
    "part-time": [t("고객 커뮤니케이션", "Customer communication", "客户沟通", "Giao tiếp khách hàng", "顧客コミュニケーション", "Komunikasi pelanggan"), t("문제 해결", "Problem solving", "问题解决", "Giải quyết vấn đề", "問題解決", "Pemecahan masalah"), t("업무 효율화", "Work efficiency", "工作效率化", "Tối ưu công việc", "業務効率化", "Efisiensi kerja")],
    club: [t("기획", "Planning", "策划", "Lập kế hoạch", "企画", "Perencanaan"), t("실행력", "Execution", "执行力", "Khả năng thực thi", "実行力", "Eksekusi"), t("팀워크", "Teamwork", "团队合作", "Làm việc nhóm", "チームワーク", "Kerja sama tim")],
    activity: [t("적극성", "Proactiveness", "积极性", "Chủ động", "積極性", "Proaktif"), t("네트워킹", "Networking", "人脉拓展", "Kết nối", "ネットワーキング", "Networking"), t("커뮤니케이션", "Communication", "沟通", "Giao tiếp", "コミュニケーション", "Komunikasi")],
    contest: [t("기획", "Planning", "策划", "Lập kế hoạch", "企画", "Perencanaan"), t("문제 해결", "Problem solving", "问题解决", "Giải quyết vấn đề", "問題解決", "Pemecahan masalah"), t("완성도", "Quality", "完成度", "Độ hoàn thiện", "完成度", "Kualitas")],
    volunteer: [t("공감", "Empathy", "共情", "Đồng cảm", "共感", "Empati"), t("책임감", "Responsibility", "责任心", "Trách nhiệm", "責任感", "Tanggung jawab"), t("협업", "Collaboration", "协作", "Hợp tác", "協業", "Kolaborasi")],
    "personal-project": [t("자기주도", "Self-direction", "自我驱动", "Tự chủ", "自己主導", "Inisiatif"), t("기획", "Planning", "策划", "Lập kế hoạch", "企画", "Perencanaan"), t("실행력", "Execution", "执行力", "Khả năng thực thi", "実行力", "Eksekusi")],
    freelance: [t("자기주도", "Self-direction", "自我驱动", "Tự chủ", "自己主導", "Inisiatif"), t("책임감", "Responsibility", "责任心", "Trách nhiệm", "責任感", "Tanggung jawab"), t("고객 응대", "Customer service", "客户接待", "Tiếp khách", "顧客対応", "Layanan pelanggan")],
    content: [t("콘텐츠 기획", "Content planning", "内容策划", "Lên kế hoạch nội dung", "コンテンツ企画", "Perencanaan konten"), t("데이터 분석", "Data analysis", "数据分析", "Phân tích dữ liệu", "データ分析", "Analisis data"), t("꾸준함", "Consistency", "持之以恒", "Kiên trì", "継続力", "Konsistensi")],
    startup: [t("주도성", "Initiative", "主导性", "Tính chủ động", "主導性", "Inisiatif"), t("실행력", "Execution", "执行力", "Khả năng thực thi", "実行力", "Eksekusi"), t("문제 해결", "Problem solving", "问题解决", "Giải quyết vấn đề", "問題解決", "Pemecahan masalah")],
    etc: [t("성실함", "Diligence", "诚实认真", "Chăm chỉ", "誠実さ", "Ketekunan"), t("문제 해결", "Problem solving", "问题解决", "Giải quyết vấn đề", "問題解決", "Pemecahan masalah"), t("커뮤니케이션", "Communication", "沟通", "Giao tiếp", "コミュニケーション", "Komunikasi")]
  };
}

class MockTalentRepository implements TalentRepository {
  private savedJobIds = new Set<string>();

  async getSnapshot(personaId: TalentPersonaId, t: PlatformT): Promise<TalentSnapshot> {
    const snapshot = personaSnapshots(t)[personaId];
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

  async draftExperience(input: { type: ExperienceType; title: string; answers?: Experience["answers"] }, t: PlatformT): Promise<Experience> {
    // 실제 저장/AI 정리는 미구현. 입력을 바탕으로 이력서 문장·핵심 역할·역량을 mock 으로 구성.
    const a = input.answers ?? {};
    const keyRole = a.role?.trim() || defaultRoleByType(t)[input.type];
    const skills = skillsByType(t)[input.type] ?? [t("문제 해결", "Problem solving", "问题解决", "Giải quyết vấn đề", "問題解決", "Pemecahan masalah"), t("성실함", "Diligence", "诚实认真", "Chăm chỉ", "誠実さ", "Ketekunan"), t("커뮤니케이션", "Communication", "沟通", "Giao tiếp", "コミュニケーション", "Komunikasi")];
    const action = a.did?.trim() || a.solution?.trim();
    const result = a.result?.trim();
    const summary =
      action && result
        ? `${action} ${result}`
        : action
          ? t(`${action}을(를) 담당했습니다.`, `Took charge of ${action}.`, `负责了${action}。`, `Phụ trách ${action}.`, `${action}を担当しました。`, `Menangani ${action}.`)
          : result
            ? t(`${keyRole}을(를) 맡아 ${result}`, `Took on ${keyRole} and ${result}`, `担任${keyRole}，${result}`, `Đảm nhận ${keyRole} và ${result}`, `${keyRole}を担当し、${result}`, `Mengambil peran ${keyRole} dan ${result}`)
            : t(`${keyRole}을(를) 맡아 성실히 수행했습니다.`, `Took on ${keyRole} and carried it out diligently.`, `担任${keyRole}并认真完成。`, `Đảm nhận ${keyRole} và thực hiện tận tâm.`, `${keyRole}を担当し、誠実に遂行しました。`, `Mengambil peran ${keyRole} dan menjalankannya dengan tekun.`);
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
