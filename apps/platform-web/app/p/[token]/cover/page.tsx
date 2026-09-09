import { SharedDocumentView } from "../../../../components/pages/SharedDocumentView";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedDocumentView token={token} type="cover" />;
}
