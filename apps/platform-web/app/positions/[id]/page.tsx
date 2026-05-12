 "use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PositionDetailPage } from "../../../components/pages/PositionDetailPage";
import { getPublicPositionById } from "../../../lib/member-profile-client";

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [position, setPosition] = useState<Awaited<ReturnType<typeof getPublicPositionById>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const item = await getPublicPositionById(id);
        if (ignore) return;
        setPosition(item);
      } catch (err) {
        if (ignore) return;
        setPosition(null);
        setError(err instanceof Error ? err.message : "포지션 상세 정보를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-muted-foreground">포지션 정보를 불러오는 중...</p>
      </main>
    );
  }

  if (!position) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-muted-foreground">{error ?? "포지션을 찾을 수 없습니다."}</p>
      </main>
    );
  }

  return <PositionDetailPage position={position} />;
}
