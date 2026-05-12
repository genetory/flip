type SectionViewProps = {
  title: string;
  description: string;
};

export function SectionView({ title, description }: SectionViewProps) {
  return (
    <section className="ops-content-section">
      <header>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <div className="ops-content-grid">
        <article>
          <h2>요약</h2>
          <p>이 화면에서 핵심 데이터와 상태를 빠르게 확인할 수 있도록 구성합니다.</p>
        </article>
        <article>
          <h2>작업 영역</h2>
          <p>필터, 검색, 상세 액션을 배치할 테이블/카드 영역입니다.</p>
        </article>
      </div>
    </section>
  );
}
