"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ViewMode } from "./ModeToggle";

const PAGE_SIZE = 12;

interface MoviePaginationProps {
  total: number;
  page: number;
  onChange: (page: number) => void;
  mode: ViewMode;
}

export function getMoviePageSize(): number {
  return PAGE_SIZE;
}

function visiblePages(current: number, total: number, windowSize = 5): number[] {
  if (total <= windowSize) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let start = Math.max(1, current - Math.floor(windowSize / 2));
  const end = Math.min(total, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function MoviePagination({ total, page, onChange, mode }: MoviePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;

  const isTrash = mode === "trash";
  const accent = isTrash
    ? "text-laser border-laser/40 bg-laser/8 hover:bg-laser/12 font-bold"
    : "text-gold border-gold/40 bg-gold/8 hover:bg-gold/12 font-bold";
  const muted = "text-panel-muted border-panel-border bg-surface hover:text-panel-ink";
  const pages = visiblePages(page, totalPages);

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="Movie list pagination"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={`font-ui inline-flex items-center gap-1 border px-3 py-2 text-xs disabled:opacity-30 ${page <= 1 ? muted : accent}`}
      >
        <ChevronLeft className="h-4 w-4" />
        이전
      </button>

      {pages[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => onChange(1)}
            className={`font-ui min-w-[2.5rem] border px-3 py-2 text-xs ${muted}`}
          >
            1
          </button>
          {pages[0] > 2 && <span className="font-ui px-1 text-xs text-panel-muted">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`font-ui min-w-[2.5rem] border px-3 py-2 text-xs ${
            p === page ? accent : `${muted} hover:border-panel-border`
          }`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="font-ui px-1 text-xs text-panel-muted">…</span>
          )}
          <button
            type="button"
            onClick={() => onChange(totalPages)}
            className={`font-ui min-w-[2.5rem] border px-3 py-2 text-xs ${muted}`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={`font-ui inline-flex items-center gap-1 border px-3 py-2 text-xs disabled:opacity-30 ${page >= totalPages ? muted : accent}`}
      >
        다음
        <ChevronRight className="h-4 w-4" />
      </button>

      <span className="font-ui w-full text-center text-xs text-silver sm:w-auto sm:ml-2">
        {total}편 · {page}/{totalPages}페이지
      </span>
    </nav>
  );
}
