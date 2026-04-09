"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export const PAGE_SIZE_OPTIONS = [20, 50, 100];

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  className?: string;
}

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalItems?: number;
  className?: string;
}

/** Standalone rows-per-page selector — place above the table. */
export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
  totalItems,
  className = "",
}: PageSizeSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm text-gray-500 whitespace-nowrap">Show</label>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
        aria-label="Rows per page"
      >
        {PAGE_SIZE_OPTIONS.map((s) => (
          <option key={s} value={s}>{s} / page</option>
        ))}
      </select>
      {totalItems !== undefined && (
        <span className="text-sm text-gray-400">of {totalItems}</span>
      )}
    </div>
  );
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = "",
}: PaginationProps) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  const [jumpValue, setJumpValue] = useState(String(page));
  useEffect(() => { setJumpValue(String(page)); }, [page]);

  function handleJump(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages && n !== page) onPageChange(n);
    else setJumpValue(String(page));
  }

  // Build page numbers with ellipsis
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 ${className}`}>
      {/* Left: count */}
      <p className="text-sm text-gray-500 order-2 sm:order-1">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{" "}
        <span className="font-medium text-gray-700">{totalItems}</span>
      </p>

      {/* Right: page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 order-1 sm:order-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="w-8 text-center text-gray-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === page ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Jump to page */}
          {totalPages > 5 && (
            <form onSubmit={handleJump} className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
              <label className="text-xs text-gray-400 whitespace-nowrap">Go to</label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpValue}
                onChange={(e) => setJumpValue(e.target.value)}
                onBlur={handleJump}
                className="w-12 text-sm text-center border border-gray-200 rounded-lg px-1 py-1 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                aria-label="Go to page"
              />
            </form>
          )}
        </div>
      )}
    </div>
  );
}
