import { useState, useEffect, useRef } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const prevLengthRef = useRef(items.length);

  // Reset to page 1 whenever the filtered set changes size
  useEffect(() => {
    if (items.length !== prevLengthRef.current) {
      setPage(1);
      prevLengthRef.current = items.length;
    }
  }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    page: safePage,
    setPage,
    totalPages,
    paged,
    totalItems: items.length,
    pageSize,
  };
}
