export default function PaymentManagementPage() {
  return (
    <section className="ops-content-section">
      <header>
        <h1>결제 / 정산</h1>
        <p>결제·정산 시스템은 후속 단계에서 PG 연동과 함께 도입될 예정입니다.</p>
      </header>

      <article className="ops-card">
        <h2 className="ops-section-title">현재 상태</h2>
        <p className="ops-card-subtle" style={{ margin: 0 }}>
          PG 연동(Toss/PayPal 등)과 정산 데이터 모델이 아직 도입되지 않아 결제 내역을 조회할 수 없어요.
          정산 자동화 단계에서 활성화될 예정입니다.
        </p>
        <div className="ops-tag-row" style={{ marginTop: 12 }}>
          <span className="ops-pill ops-pill-amber">PG 연동 대기</span>
          <span className="ops-pill ops-pill-gray">정산 모델 미구현</span>
        </div>
      </article>

      <article className="ops-card">
        <h2 className="ops-section-title">예정된 기능</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: "#374151", fontSize: 13, lineHeight: 1.8 }}>
          <li>파트너 결제 내역 조회 (구독/광고/프리미엄 포지션)</li>
          <li>학생/소속 학교에 대한 인센티브 지급 관리</li>
          <li>환불 / 분쟁 케이스 처리</li>
          <li>월별 정산 청구서 자동 생성</li>
          <li>세금계산서 발행 연동</li>
        </ul>
      </article>
    </section>
  );
}
