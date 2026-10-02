// JSON-LD 삽입 — 객체 하나당 <script> 하나로 넣는다(배열 루트를 못 읽는 소비자가 있다).
// 서버 컴포넌트에서 쓰는 것을 전제로 한다(크롤러가 첫 HTML 에서 봐야 한다).
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
    </>
  );
}
