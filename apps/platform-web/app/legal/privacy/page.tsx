import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

export const metadata = {
  title: "개인정보처리방침 | Aply",
  description: "Aply 개인정보처리방침"
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          시행일: 2026년 5월 11일
        </p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <h2 className="text-lg font-semibold">1. 수집하는 개인정보 항목</h2>
            <p className="mt-2 text-muted-foreground">
              Aply는 회원가입, 서비스 이용, 채용 매칭 과정에서 다음과 같은 정보를 수집합니다:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>필수: 이메일, 비밀번호(해시 저장), 이름, 역할(학생/파트너/운영자)</li>
              <li>학생 선택: 국적, 소속, 생년월일, 성별, 희망 직무, 전화번호, 비자 정보, 거주지, 경력·학력·어학 정보, 자기소개</li>
              <li>파트너 선택: 회사명, 사업자등록증, 4대보험 가입자 명부, 회사 주소, 웹사이트</li>
              <li>자동 수집: 접속 IP, 가입 채널(이메일/네이버/카카오/구글), 서비스 이용 기록</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">2. 개인정보 수집·이용 목적</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>회원 식별, 본인 확인, 부정 이용 방지</li>
              <li>학생-파트너 간 채용 매칭 서비스 제공</li>
              <li>면접 일정 조율, 과제 부여 및 검토, 프로그램 진행 관리</li>
              <li>서비스 개선, 통계 분석 (개인 식별이 불가능한 형태로)</li>
              <li>법령 및 약관 위반 행위 대응</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">3. 개인정보 보관·이용 기간</h2>
            <p className="mt-2 text-muted-foreground">
              회원 탈퇴 시 즉시 삭제하는 것을 원칙으로 합니다. 단, 관계 법령에 따라 일정 기간 보관이 필요한 정보는 다음과 같이 보관 후 파기합니다:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>접속 기록: 3개월 (통신비밀보호법)</li>
              <li>전자상거래 관련 기록: 5년 (전자상거래법) — 해당하는 경우</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">4. 개인정보 제3자 제공</h2>
            <p className="mt-2 text-muted-foreground">
              학생이 특정 파트너 회사의 포지션에 지원하는 경우, 해당 파트너 회사에 학생의 프로필 정보가 제공됩니다. 이는 매칭 서비스의 핵심 기능이며, 학생의 지원 행위로 동의됩니다.
              이외 외부 제공은 법령에 의한 경우를 제외하고 사전 동의 없이 이루어지지 않습니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">5. 이용자의 권리</h2>
            <p className="mt-2 text-muted-foreground">
              이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보 삭제를 요청할 수 있습니다.
              회원 탈퇴는 프로필 설정에서 직접 진행하거나 <a href="mailto:info@flip-ers.com" className="text-primary underline">info@flip-ers.com</a>으로 요청할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">6. 개인정보 보호책임자</h2>
            <p className="mt-2 text-muted-foreground">
              개인정보 관련 문의는 다음 연락처로 가능합니다.
              <br />
              이메일: info@flip-ers.com
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">7. 변경 사항</h2>
            <p className="mt-2 text-muted-foreground">
              본 방침이 변경될 경우 시행 7일 전 서비스 공지사항을 통해 안내합니다.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
