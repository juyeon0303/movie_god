"use client";

import { AlertTriangle, Scissors } from "lucide-react";
import type { CuratedMovie } from "@/lib/types";
import { MovieCard } from "./MovieCard";

interface TrashWarningProps {
  movies: CuratedMovie[];
  loading: boolean;
  onEnterHell: () => void;
}

export function TrashWarning({ movies, loading, onEnterHell }: TrashWarningProps) {
  if (loading) {
    return (
      <section className="border border-laser/20 bg-surface p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-48 rounded bg-panel-border" />
          <div className="h-3 w-72 rounded bg-panel-border/60" />
        </div>
      </section>
    );
  }

  if (movies.length === 0) return null;

  return (
    <section className="overflow-hidden border border-laser/25 bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-laser/15 bg-laser/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-laser" />
          <div>
            <h2 className="font-ui text-sm font-semibold text-laser">Trash Cut 미리보기</h2>
            <p className="font-ui mt-1 text-sm leading-relaxed text-panel-muted">
              이 OTT에 Trash Cut {movies.length}편이 있어요. 전체 목록은 Trash Cut에서 볼 수
              있어요.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEnterHell}
          className="font-ui inline-flex items-center justify-center gap-2 border border-laser px-5 py-2.5 text-xs font-semibold text-laser transition hover:bg-laser/8"
        >
          <Scissors className="h-4 w-4" />
          Trash Cut 보기
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-4 sm:p-5">
        {movies.slice(0, 4).map((movie) => (
          <MovieCard key={movie.id} movie={{ ...movie, isTrash: true }} hellMode />
        ))}
      </div>
    </section>
  );
}
