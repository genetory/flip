import { useCallback, useState } from "react";
import { getPublicPositionsPage, type PublicPositionListItem } from "./member-profile-client";
import { getBrowserLocale } from "./auth-messages";

const PAGE_SIZE = 5;
const FETCH_LIMIT = 100; // API 상한. 한 번에 받아 클라이언트에서 5개씩 나눈다.

// 공고 맞춤·모의 면접의 Aply 포지션 선택에서 공유하는 페이저.
// 검색 결과를 한 번에 받아 클라이언트에서 5개씩 나눠 1,2,3…N 번호 페이지를 제공한다.
export function usePositionPager(onError: (msg: string) => void) {
  const [all, setAll] = useState<PublicPositionListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const search = useCallback(
    async (q?: string) => {
      const term = (q ?? query).trim();
      setLoading(true);
      try {
        const res = await getPublicPositionsPage({ search: term || undefined, limit: FETCH_LIMIT, locale: getBrowserLocale() });
        setAll(res.items);
        setPage(1);
      } catch (err) {
        onError(err instanceof Error ? err.message : "");
        setAll([]);
        setPage(1);
      } finally {
        setLoading(false);
      }
    },
    [onError, query]
  );

  const totalPages = all && all.length > 0 ? Math.ceil(all.length / PAGE_SIZE) : 1;
  const safePage = Math.min(page, totalPages);
  const positions = all ? all.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) : null;

  return {
    positions, // 현재 페이지(최대 5개)
    loading,
    query,
    setQuery,
    page: safePage,
    totalPages,
    setPage,
    search
  };
}
