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
        <h1 className="text-2xl font-bold text-foreground">개인정보 처리방침</h1>
        <p className="mt-2 text-sm text-muted-foreground">공고일자: 2025년 11월 12일 · 시행일자: 2025년 11월 12일</p>

        <section className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">
            주식회사 플리퍼스(이하 &quot;회사&quot;)는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련
            법령상의 개인정보보호 규정을 준수하며, 이용자의 개인정보 보호에 최선을 다하고 있습니다.
          </p>
          <p className="text-muted-foreground">
            본 개인정보 처리방침은 회사가 제공하는 서비스(웹사이트 및 웹 애플리케이션)에 적용됩니다.
          </p>

          <div>
            <h2 className="text-lg font-semibold">제1조 (수집하는 개인정보 항목 및 수집 방법)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 회원가입, 프로그램 신청, 기업 파트너십 문의 등을 위해 아래와 같은 개인정보를 수집합니다.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">1. 학생 회원 (B2C)</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">필수 항목</strong>: 성명(여권상 영문 이름), 이메일 주소,
                비밀번호, 연락처, 현재 거주 주소, 생년월일(만 20세 이상 확인용)
              </li>
              <li>
                <strong className="font-semibold text-foreground">프로그램 신청 시</strong>: 최종 학력, 현재 비자 상태,
                한국어 능력(TOPIK) 수준, 여권 사본, 이력서/커버레터/포트폴리오, 직무 관련 스킬
              </li>
              <li>
                <strong className="font-semibold text-foreground">선택 항목</strong>: 한국 체류 및 취업 계획
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">2. 기업 회원 (B2B)</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">필수 항목</strong>: 회사명, 사업자등록번호, 담당자명,
                담당자 이메일 주소, 담당자 연락처
              </li>
              <li>
                <strong className="font-semibold text-foreground">프로그램 운영 시</strong>: 채용 희망 직무(JD)
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">3. 서비스 이용 과정에서 자동 수집되는 정보</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>IP 주소, 쿠키, 서비스 이용 기록, 기기 정보</li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">4. 수집 방법</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>홈페이지 및 웹 애플리케이션 회원가입, 프로그램 신청서 작성</li>
              <li>기업 파트너십 신청서 작성</li>
              <li>고객센터 문의 (이메일, 전화)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="mt-2 text-muted-foreground">회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">1. 학생 회원 (B2C)</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">회원 관리</strong>: 본인 식별, 가입 의사 확인, 불량 회원
                방지
              </li>
              <li>
                <strong className="font-semibold text-foreground">프로그램 운영</strong>: &apos;Career Bridge&apos; 등 신청
                프로그램의 선발 절차 진행, 1:1 면접 진행
              </li>
              <li>
                <strong className="font-semibold text-foreground">매칭 서비스</strong>: 수집된 정보(이력서, 프로필 등)를
                바탕으로 호스트 기업과 매칭
              </li>
              <li>
                <strong className="font-semibold text-foreground">프로세스 관리</strong>: 지원 현황, 면접 일정, 합격 여부 등
                대시보드 관리
              </li>
              <li>
                <strong className="font-semibold text-foreground">결제 및 계약</strong>: 프로그램 비용 결제, 인보이스 발행,
                계약서 작성
              </li>
              <li>
                <strong className="font-semibold text-foreground">지원 서비스</strong>: 사전 교육 오리엔테이션, 비자 발급
                지원, 수료증 및 추천서 발급
              </li>
              <li>
                <strong className="font-semibold text-foreground">고지 사항 전달</strong>: 공지사항, 약관 변경 등 중요 정보
                전달
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">2. 기업 회원 (B2B)</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">파트너십 관리</strong>: 호스트 기업 본인 식별, 파트너십
                승인 및 관리
              </li>
              <li>
                <strong className="font-semibold text-foreground">매칭 서비스</strong>: 등록된 직무(JD)와 학생 인재 풀 매칭
              </li>
              <li>
                <strong className="font-semibold text-foreground">프로세스 관리</strong>: 학생 리스트 확인, 면접 일정 조율,
                피드백 관리
              </li>
              <li>
                <strong className="font-semibold text-foreground">고지 사항 전달</strong>: 서비스 변경, 중요 공지사항 전달
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제3조 (개인정보의 제3자 제공)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 이용자의 동의가 있거나 관련 법령의 규정에 의한 경우를 제외하고는 어떠한 경우에도 본 방침에서 고지한 범위를
              넘어 이용자의 개인정보를 이용하거나 제3자에게 제공하지 않습니다.
            </p>
            <p className="mt-2 text-muted-foreground">
              단, 원활한 &apos;Career Bridge&apos; 프로그램 매칭을 위해 아래의 경우에 한하여 이용자의 동의를 받고 개인정보를
              제공합니다.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-border/60">
                    <th className="w-1/3 bg-muted/50 px-3 py-2 text-left font-medium text-foreground">제공받는 자</th>
                    <td className="px-3 py-2 text-muted-foreground">Career Bridge 호스트 기업 (파트너사)</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">제공 목적</th>
                    <td className="px-3 py-2 text-muted-foreground">직무 체험 매칭 및 면접 진행</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">제공 항목</th>
                    <td className="px-3 py-2 text-muted-foreground">
                      [학생 회원]의 성명, 학력, 비자 상태, 이력서/커버레터/포트폴리오, 직무 관련 스킬, 한국어 능력
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">보유 및 이용 기간</th>
                    <td className="px-3 py-2 text-muted-foreground">매칭 및 프로그램 종료 시까지 (또는 법령이 정한 기간)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제4조 (개인정보의 보유 및 이용 기간)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에
              대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">1. 회사 내부 방침에 의한 정보 보유</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>부적격 회원의 재가입 방지, 분쟁 해결: 회원 탈퇴 후 1년</li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">2. 관련 법령에 의한 정보 보유</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
              <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
              <li>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)</li>
              <li>로그인 기록: 3개월 (통신비밀보호법)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제5조 (이용자 및 법정대리인의 권리 및 행사 방법)</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>이용자는 언제든지 등록되어 있는 자신의 개인정보를 [마이페이지/프로필]에서 조회하거나 수정할 수 있습니다.</li>
              <li>이용자는 언제든지 회원 탈퇴를 통해 개인정보 수집 및 이용 동의를 철회할 수 있습니다.</li>
              <li>
                이용자가 개인정보의 오류에 대한 정정을 요청한 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용 또는
                제공하지 않습니다.
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제6조 (개인정보의 파기 절차 및 방법)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 원칙적으로 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우에는 지체 없이 해당 개인정보를
              파기합니다.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">파기 절차</strong>: 파기 사유가 발생한 개인정보를 선정하고,
                회사의 개인정보보호책임자의 승인을 받아 파기합니다.
              </li>
              <li>
                <strong className="font-semibold text-foreground">파기 방법</strong>: 전자적 파일 형태의 정보는 기록을
                재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이 문서에 기록된 개인정보는 분쇄기로 분쇄하거나 소각하여
                파기합니다.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제7조 (개인정보의 안전성 확보 조치)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 이용자의 개인정보를 안전하게 관리하기 위해 다음과 같은 기술적/관리적 보호 대책을 강구하고 있습니다.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">관리적 조치</strong>: 내부관리계획 수립, 개인정보 취급
                직원 최소화, 정기적 직원 교육
              </li>
              <li>
                <strong className="font-semibold text-foreground">기술적 조치</strong>: 비밀번호 암호화, 접근통제시스템 설치,
                보안 프로그램(백신) 설치
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제8조 (개인정보 보호책임자 및 민원서비스)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 이용자의 개인정보를 보호하고 관련 불만을 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고
              있습니다.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-border/60">
                    <th className="w-1/3 bg-muted/50 px-3 py-2 text-left font-medium text-foreground">이름</th>
                    <td className="px-3 py-2 text-muted-foreground">김남구</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">직책</th>
                    <td className="px-3 py-2 text-muted-foreground">CEO</td>
                  </tr>
                  <tr>
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">이메일</th>
                    <td className="px-3 py-2 text-muted-foreground">
                      <a href="mailto:qoo@flip-ers.com" className="text-primary underline">
                        qoo@flip-ers.com
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-muted-foreground">
              기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하실 수 있습니다.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                개인정보침해신고센터 (
                <a
                  href="https://privacy.kisa.or.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  privacy.kisa.or.kr
                </a>{" "}
                / 국번없이 118)
              </li>
              <li>
                대검찰청 사이버수사과 (
                <a href="https://www.spo.go.kr" target="_blank" rel="noreferrer" className="text-primary underline">
                  www.spo.go.kr
                </a>{" "}
                / 국번없이 1301)
              </li>
              <li>
                경찰청 사이버수사국 (
                <a href="https://ecrm.police.go.kr" target="_blank" rel="noreferrer" className="text-primary underline">
                  ecrm.police.go.kr
                </a>{" "}
                / 국번없이 182)
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제9조 (개인정보 처리방침의 변경)</h2>
            <p className="mt-2 text-muted-foreground">
              본 개인정보 처리방침은 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 수정이 있을 시에는 시행일의 7일 전부터
              웹사이트 공지사항을 통하여 고지할 것입니다.
            </p>
          </div>

          <div className="border-t border-border/60 pt-6 text-muted-foreground">
            <p>공고일자: 2025년 11월 12일</p>
            <p>시행일자: 2025년 11월 12일</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
