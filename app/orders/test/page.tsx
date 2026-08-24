export default function TestSharePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const title = searchParams.title as string | undefined;
  const text = searchParams.text as string | undefined;
  const url = searchParams.url as string | undefined;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>공유받은 데이터 확인</h2>
      <p><b>title:</b> {title || '(없음)'}</p>
      <p><b>text:</b></p>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: 10 }}>
        {text || '(없음)'}
      </pre>
      <p><b>url:</b> {url || '(없음)'}</p>
    </div>
  );
}